import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from models import Project, Milestone, RiskAnalysis
from services.risk_service import evaluate_project_risk
from ml.risk_predictor import predictor

router = APIRouter(prefix="/api/risk", tags=["Risk Analysis & ML Prediction"])

@router.get("/project/{project_id}")
def get_project_risk(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    risk_eval = evaluate_project_risk(project, db)

    # ML Predictor output
    milestone_count = db.query(Milestone).filter(Milestone.project_id == project.id, Milestone.status == "Delayed").count()
    ml_prediction = predictor.predict_delay(
        planned_p=project.planned_physical_progress,
        actual_p=project.physical_progress,
        budget=project.approved_budget,
        expenditure=project.expenditure,
        missed_m=milestone_count,
        time_elapsed=60.0
    )

    return {
        "project_id": project.id,
        "project_code": project.project_id,
        "name": project.name,
        "explainable_risk": risk_eval,
        "ml_prediction": ml_prediction
    }

@router.post("/project/{project_id}/predict")
def predict_project_risk(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestone_count = db.query(Milestone).filter(Milestone.project_id == project.id, Milestone.status == "Delayed").count()
    ml_output = predictor.predict_delay(
        planned_p=project.planned_physical_progress,
        actual_p=project.physical_progress,
        budget=project.approved_budget,
        expenditure=project.expenditure,
        missed_m=milestone_count,
        time_elapsed=65.0
    )

    return {
        "status": "success",
        "project_name": project.name,
        "prediction": ml_output
    }

@router.get("/portfolio")
def get_portfolio_risk_rankings(db: Session = Depends(get_db)):
    """Returns projects sorted by highest risk score first."""
    projects = db.query(Project).order_by(Project.risk_score.desc()).all()
    rankings = []
    for p in projects:
        rankings.append({
            "id": p.id,
            "project_id": p.project_id,
            "name": p.name,
            "department": p.department,
            "status": p.status,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level,
            "physical_variance": round(p.planned_physical_progress - p.physical_progress, 1),
            "cost_overrun": round(p.expenditure - p.approved_budget, 2)
        })
    return rankings
