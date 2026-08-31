from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database.connection import get_db
from services.report_service import generate_csv_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/download")
def download_report(
    report_type: str = Query("portfolio_summary"),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    csv_content = generate_csv_report(report_type, project_id, db)
    filename = f"monitoring_report_{report_type}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/preview")
def preview_report(
    report_type: str = Query("portfolio_summary"),
    project_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    csv_content = generate_csv_report(report_type, project_id, db)
    lines = csv_content.strip().split("\n")
    headers = lines[0].split(",") if lines else []
    rows = [line.split(",") for line in lines[1:]] if len(lines) > 1 else []

    return {
        "report_type": report_type,
        "raw_csv": csv_content,
        "total_rows": len(rows)
    }
