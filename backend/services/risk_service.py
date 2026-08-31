import json
import datetime
from sqlalchemy.orm import Session
from models import Project, Milestone, RiskAnalysis
from utils.calculations import calculate_physical_variance, calculate_cost_variance, determine_risk_level, determine_project_status

def evaluate_project_risk(project: Project, db: Session) -> dict:
    """
    Explainable Risk Engine
    Evaluates:
    - Physical progress variance (Weight: 35%)
    - Cost overrun ratio (Weight: 30%)
    - Missed milestones count (Weight: 20%)
    - Schedule urgency & timeline pressure (Weight: 15%)
    """
    # 1. Progress Variance Score (0-100)
    progress_var = calculate_physical_variance(project.planned_physical_progress, project.physical_progress)
    progress_score = min(100.0, max(0.0, progress_var * 4.0)) # 15% variance -> 60 score

    # 2. Cost Overrun Score (0-100)
    cost_overrun = calculate_cost_variance(project.approved_budget, project.expenditure)
    if project.approved_budget > 0 and cost_overrun > 0:
        cost_overrun_pct = (cost_overrun / project.approved_budget) * 100
        cost_score = min(100.0, max(0.0, cost_overrun_pct * 10.0)) # 5% overrun -> 50 score
    else:
        cost_overrun_pct = 0.0
        cost_score = 0.0

    # 3. Missed Milestones Score (0-100)
    milestones = db.query(Milestone).filter(Milestone.project_id == project.id).all()
    today_str = datetime.date.today().isoformat()
    missed_count = 0
    total_milestones = len(milestones)
    
    for m in milestones:
        if m.status in ["Delayed", "Not Started"] and m.due_date < today_str:
            missed_count += 1
            if m.status != "Delayed":
                m.status = "Delayed"
    
    milestone_score = min(100.0, missed_count * 30.0)

    # 4. Schedule Pressure Score (0-100)
    try:
        start_d = datetime.date.fromisoformat(project.start_date)
        end_d = datetime.date.fromisoformat(project.expected_completion_date)
        today_d = datetime.date.today()
        
        total_days = max(1, (end_d - start_d).days)
        elapsed_days = max(0, (today_d - start_d).days)
        time_elapsed_pct = min(100.0, (elapsed_days / total_days) * 100)
        
        # Pressure: If 80% time elapsed but only 50% completed
        lag = max(0.0, time_elapsed_pct - project.physical_progress)
        schedule_score = min(100.0, lag * 2.0)
    except Exception:
        time_elapsed_pct = 50.0
        schedule_score = 0.0

    # Calculate Weighted Composite Score
    composite_score = round(
        (0.35 * progress_score) +
        (0.30 * cost_score) +
        (0.20 * milestone_score) +
        (0.15 * schedule_score),
        1
    )
    composite_score = min(100.0, max(0.0, composite_score))

    risk_level = determine_risk_level(composite_score)
    new_status = determine_project_status(progress_var, cost_overrun, composite_score)

    # Update project entity directly
    project.risk_score = composite_score
    project.risk_level = risk_level
    project.status = new_status

    # Predict delay days using simple heuristic (or ML wrapper)
    predicted_delay_days = int(max(0, progress_var * 6 + missed_count * 15 + (cost_overrun_pct * 3)))

    factors = {
        "progress_variance_pts": progress_var,
        "progress_score": round(progress_score, 1),
        "cost_overrun_cr": round(max(0, cost_overrun), 2),
        "cost_overrun_pct": round(cost_overrun_pct, 1),
        "cost_score": round(cost_score, 1),
        "missed_milestones": missed_count,
        "total_milestones": total_milestones,
        "milestone_score": round(milestone_score, 1),
        "time_elapsed_pct": round(time_elapsed_pct, 1),
        "schedule_score": round(schedule_score, 1),
        "explanation": f"Risk score is {composite_score} ({risk_level}). Progress lag: {progress_var} pts. Cost overrun: ₹{max(0, cost_overrun)} Cr. Missed milestones: {missed_count}."
    }

    # Store/update RiskAnalysis record
    risk_rec = db.query(RiskAnalysis).filter(RiskAnalysis.project_id == project.id).first()
    if not risk_rec:
        risk_rec = RiskAnalysis(
            project_id=project.id,
            score=composite_score,
            level=risk_level,
            progress_variance=progress_var,
            cost_variance=cost_overrun,
            missed_milestones=missed_count,
            predicted_delay_days=predicted_delay_days,
            risk_factors_json=json.dumps(factors)
        )
        db.add(risk_rec)
    else:
        risk_rec.score = composite_score
        risk_rec.level = risk_level
        risk_rec.progress_variance = progress_var
        risk_rec.cost_variance = cost_overrun
        risk_rec.missed_milestones = missed_count
        risk_rec.predicted_delay_days = predicted_delay_days
        risk_rec.risk_factors_json = json.dumps(factors)
        risk_rec.calculated_at = datetime.datetime.utcnow()

    db.commit()

    return {
        "score": composite_score,
        "level": risk_level,
        "status": new_status,
        "predicted_delay_days": predicted_delay_days,
        "factors": factors
    }
