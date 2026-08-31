from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.connection import get_db
from models import Alert, Project
from schemas.schemas import AlertResponse

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = None,
    alert_type: Optional[str] = None,
    is_read: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Alert, Project.name.label("project_name")).join(Project, Alert.project_id == Project.id)

    if severity and severity != "All":
        query = query.filter(Alert.severity == severity)

    if alert_type and alert_type != "All":
        query = query.filter(Alert.alert_type == alert_type)

    if is_read is not None:
        query = query.filter(Alert.is_read == is_read)

    results = query.order_by(Alert.id.desc()).all()

    alert_list = []
    for alert_obj, proj_name in results:
        alert_dict = {
            "id": alert_obj.id,
            "project_id": alert_obj.project_id,
            "project_name": proj_name,
            "alert_type": alert_obj.alert_type,
            "severity": alert_obj.severity,
            "message": alert_obj.message,
            "date": alert_obj.date,
            "is_read": alert_obj.is_read
        }
        alert_list.append(alert_dict)

    return alert_list

@router.put("/{alert_id}/read")
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_read = True
    db.commit()
    return {"status": "success", "message": f"Alert {alert_id} marked as read"}

@router.put("/read-all")
def mark_all_alerts_as_read(db: Session = Depends(get_db)):
    db.query(Alert).update({Alert.is_read: True})
    db.commit()
    return {"status": "success", "message": "All alerts marked as read"}
