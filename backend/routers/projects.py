from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database.connection import get_db
from models import Project
from schemas.schemas import ProjectCreate, ProjectUpdate, ProjectResponse
from services.risk_service import evaluate_project_risk
from services.alert_service import generate_alerts_for_project

router = APIRouter(prefix="/api/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
def get_projects(
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    department: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Project)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Project.name.ilike(search_pattern)) |
            (Project.project_id.ilike(search_pattern)) |
            (Project.location.ilike(search_pattern))
        )

    if status_filter and status_filter != "All":
        query = query.filter(Project.status == status_filter)

    if department and department != "All":
        query = query.filter(Project.department == department)

    if risk_level and risk_level != "All":
        query = query.filter(Project.risk_level == risk_level)

    return query.order_by(Project.id.desc()).all()

@router.get("/map")
def get_projects_map(db: Session = Depends(get_db)):
    """Returns project markers and coordinates for Leaflet maps."""
    projects = db.query(Project).all()
    map_data = []
    for p in projects:
        map_data.append({
            "id": p.id,
            "project_id": p.project_id,
            "name": p.name,
            "department": p.department,
            "location": p.location,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "approved_budget": p.approved_budget,
            "expenditure": p.expenditure,
            "physical_progress": p.physical_progress,
            "planned_physical_progress": p.planned_physical_progress,
            "status": p.status,
            "risk_score": p.risk_score,
            "risk_level": p.risk_level
        })
    return map_data

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db)):
    existing = db.query(Project).filter(Project.project_id == project_in.project_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Project with ID '{project_in.project_id}' already exists")

    project = Project(**project_in.dict())
    db.add(project)
    db.commit()
    db.refresh(project)

    # Initial Risk and Alert calculation
    evaluate_project_risk(project, db)
    generate_alerts_for_project(project, db)
    db.refresh(project)

    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, project_in: ProjectUpdate, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()

    # Recalculate risk and alerts
    evaluate_project_risk(project, db)
    generate_alerts_for_project(project, db)
    db.refresh(project)

    return project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return {"detail": f"Project '{project.name}' deleted successfully"}
