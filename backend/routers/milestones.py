from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models import Project, Milestone
from schemas.schemas import MilestoneCreate, MilestoneUpdate, MilestoneResponse
from services.risk_service import evaluate_project_risk
from services.alert_service import generate_alerts_for_project

router = APIRouter(prefix="/api", tags=["Milestones"])

@router.get("/projects/{project_id}/milestones", response_model=List[MilestoneResponse])
def get_project_milestones(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return db.query(Milestone).filter(Milestone.project_id == project_id).order_by(Milestone.due_date.asc()).all()

@router.post("/projects/{project_id}/milestones", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED)
def create_milestone(project_id: int, milestone_in: MilestoneCreate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    milestone = Milestone(
        project_id=project_id,
        name=milestone_in.name,
        description=milestone_in.description,
        due_date=milestone_in.due_date,
        completion_date=milestone_in.completion_date,
        status=milestone_in.status
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    evaluate_project_risk(project, db)
    generate_alerts_for_project(project, db)

    return milestone

@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
def update_milestone(milestone_id: int, milestone_in: MilestoneUpdate, db: Session = Depends(get_db)):
    milestone = db.query(Milestone).filter(Milestone.id == milestone_id).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")

    update_data = milestone_in.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(milestone, field, val)

    db.commit()

    # Recalculate project risk
    project = db.query(Project).filter(Project.id == milestone.project_id).first()
    if project:
        evaluate_project_risk(project, db)
        generate_alerts_for_project(project, db)

    db.refresh(milestone)
    return milestone
