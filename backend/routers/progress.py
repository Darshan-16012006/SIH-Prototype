from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models import Project, ProgressUpdate
from schemas.schemas import ProgressUpdateCreate, ProgressUpdateResponse
from services.risk_service import evaluate_project_risk
from services.alert_service import generate_alerts_for_project

router = APIRouter(prefix="/api/projects", tags=["Monthly Progress Updates"])

@router.get("/{project_id}/progress", response_model=List[ProgressUpdateResponse])
def get_project_progress_history(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return db.query(ProgressUpdate).filter(ProgressUpdate.project_id == project_id).order_by(ProgressUpdate.month.asc()).all()

@router.post("/{project_id}/progress", response_model=ProgressUpdateResponse, status_code=status.HTTP_201_CREATED)
def add_monthly_progress_update(project_id: int, progress_in: ProgressUpdateCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Save progress update
    update_rec = ProgressUpdate(
        project_id=project_id,
        month=progress_in.month,
        planned_physical_progress=progress_in.planned_physical_progress,
        actual_physical_progress=progress_in.actual_physical_progress,
        planned_financial_progress=progress_in.planned_financial_progress,
        actual_financial_progress=progress_in.actual_financial_progress,
        expenditure=progress_in.expenditure,
        milestones_completed=progress_in.milestones_completed,
        remarks=progress_in.remarks
    )
    db.add(update_rec)

    # Automatically update Project current progress & expenditure values
    project.planned_physical_progress = progress_in.planned_physical_progress
    project.physical_progress = progress_in.actual_physical_progress
    project.planned_financial_progress = progress_in.planned_financial_progress
    project.financial_progress = progress_in.actual_financial_progress
    project.expenditure = progress_in.expenditure

    db.commit()

    # Recalculate Risk & Smart Alerts
    evaluate_project_risk(project, db)
    generate_alerts_for_project(project, db)

    db.refresh(update_rec)
    return update_rec
