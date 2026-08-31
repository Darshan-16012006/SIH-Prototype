from fastapi import APIRouter
from schemas.schemas import SystemThresholds

router = APIRouter(prefix="/api/settings", tags=["Settings"])

# Global threshold configuration in memory for prototype
SYSTEM_THRESHOLDS = SystemThresholds()

@router.get("/thresholds", response_model=SystemThresholds)
def get_thresholds():
    return SYSTEM_THRESHOLDS

@router.put("/thresholds", response_model=SystemThresholds)
def update_thresholds(new_thresholds: SystemThresholds):
    global SYSTEM_THRESHOLDS
    SYSTEM_THRESHOLDS = new_thresholds
    return SYSTEM_THRESHOLDS
