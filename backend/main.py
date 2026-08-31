import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import engine, Base, SessionLocal
from database.seed import seed_database
from models import User

from routers import (
    auth,
    projects,
    progress,
    milestones,
    analytics,
    risk,
    alerts,
    reports,
    settings
)

app = FastAPI(
    title="SIH 2026 Integrated Project Monitoring Platform API",
    description="Smart Automation Web-based Infrastructure Monitoring System — Team Titans",
    version="1.0.0"
)

# Enable CORS for local React development (Vite port 5173 / default localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(progress.router)
app.include_router(milestones.router)
app.include_router(analytics.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(reports.router)
app.include_router(settings.router)

@app.on_event("startup")
def startup_event():
    # Ensure database schema is created and seeded
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        if user_count == 0:
            print("Database empty. Auto-seeding prototype sample data...")
            seed_database()
        else:
            print(f"Database ready with {user_count} registered demo users.")
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "platform": "SIH 2026 Project Monitoring Platform",
        "team": "Titans",
        "problem_statement": "26103"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
