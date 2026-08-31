from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from models import Project, ProgressUpdate
from services.analytics_service import get_portfolio_overview

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(department: Optional[str] = Query(None), db: Session = Depends(get_db)):
    return get_portfolio_overview(db, department)

@router.get("/project/{project_id}")
def get_project_analytics(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return {"error": "Project not found"}

    updates = db.query(ProgressUpdate).filter(ProgressUpdate.project_id == project_id).order_by(ProgressUpdate.month.asc()).all()

    progress_timeline = []
    for u in updates:
        progress_timeline.append({
            "month": u.month,
            "planned_physical": u.planned_physical_progress,
            "actual_physical": u.actual_physical_progress,
            "physical_variance": round(u.planned_physical_progress - u.actual_physical_progress, 1),
            "planned_financial": u.planned_financial_progress,
            "actual_financial": u.actual_financial_progress,
            "expenditure": u.expenditure
        })

    return {
        "project_id": project.project_id,
        "name": project.name,
        "approved_budget": project.approved_budget,
        "expenditure": project.expenditure,
        "cost_variance": round(project.expenditure - project.approved_budget, 2),
        "timeline": progress_timeline
    }
