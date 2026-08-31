import datetime
from sqlalchemy.orm import Session
from models import Project, Alert, Milestone
from utils.calculations import calculate_physical_variance, calculate_cost_variance

def generate_alerts_for_project(project: Project, db: Session) -> list:
    """
    Evaluates project data and auto-generates structured smart alerts.
    Prevents duplicate alerts of the same type on the same date.
    """
    today_str = datetime.date.today().isoformat()
    generated_alerts = []

    progress_var = calculate_physical_variance(project.planned_physical_progress, project.physical_progress)
    cost_overrun = calculate_cost_variance(project.approved_budget, project.expenditure)

    # 1. Progress Delay Alert
    if progress_var >= 10.0:
        msg = f"Project '{project.name}' is {progress_var} percentage points behind planned progress."
        severity = "HIGH" if progress_var < 20 else "CRITICAL"
        _add_alert_if_not_exists(db, project.id, "Progress Delay", severity, msg, today_str, generated_alerts)
    elif progress_var >= 5.0:
        msg = f"Project '{project.name}' shows a minor progress lag of {progress_var} percentage points."
        _add_alert_if_not_exists(db, project.id, "Progress Delay", "MEDIUM", msg, today_str, generated_alerts)

    # 2. Cost Overrun Alert
    if cost_overrun > 0:
        pct = round((cost_overrun / project.approved_budget) * 100, 1) if project.approved_budget > 0 else 0
        msg = f"Project '{project.name}' has exceeded approved budget by ₹{cost_overrun} Cr ({pct}% overrun)."
        severity = "CRITICAL" if pct > 10 else "HIGH"
        _add_alert_if_not_exists(db, project.id, "Cost Overrun", severity, msg, today_str, generated_alerts)

    # 3. Missed Milestones Alert
    delayed_milestones = db.query(Milestone).filter(
        Milestone.project_id == project.id,
        Milestone.status == "Delayed"
    ).all()
    if delayed_milestones:
        count = len(delayed_milestones)
        msg = f"Project '{project.name}' has {count} delayed milestone(s)."
        _add_alert_if_not_exists(db, project.id, "Missed Milestone", "MEDIUM", msg, today_str, generated_alerts)

    # 4. Critical Risk Alert
    if project.risk_score >= 80:
        msg = f"CRITICAL RISK WARNING: Risk score for '{project.name}' reached {project.risk_score}/100."
        _add_alert_if_not_exists(db, project.id, "High Risk", "CRITICAL", msg, today_str, generated_alerts)
    elif project.risk_score >= 60:
        msg = f"High Risk Alert: Risk score for '{project.name}' reached {project.risk_score}/100."
        _add_alert_if_not_exists(db, project.id, "High Risk", "HIGH", msg, today_str, generated_alerts)

    db.commit()
    return generated_alerts

def _add_alert_if_not_exists(db: Session, project_id: int, alert_type: str, severity: str, message: str, date_str: str, out_list: list):
    existing = db.query(Alert).filter(
        Alert.project_id == project_id,
        Alert.alert_type == alert_type,
        Alert.date == date_str,
        Alert.message == message
    ).first()

    if not existing:
        alert = Alert(
            project_id=project_id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            date=date_str,
            is_read=False
        )
        db.add(alert)
        out_list.append(alert)
