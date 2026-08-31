import sys
import os
import json
import datetime

# Add parent directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.connection import engine, SessionLocal, Base
from models import User, Project, ProgressUpdate, Milestone, Alert, RiskAnalysis
from services.risk_service import evaluate_project_risk
from services.alert_service import generate_alerts_for_project

def seed_database():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Seeding demo users...")
        # 1. Users
        users = [
            User(
                email="admin@demo.com",
                password_hash="admin123", # Plaintext matching requirements for prototype demo ease
                full_name="Admin Director (MoRTH)",
                role="Admin",
                department="Ministry of Road Transport & Highways"
            ),
            User(
                email="officer@demo.com",
                password_hash="officer123",
                full_name="Rajesh Sharma (Project Officer)",
                role="Officer",
                department="National Highways Authority of India"
            ),
            User(
                email="viewer@demo.com",
                password_hash="viewer123",
                full_name="Priya Patel (Auditor)",
                role="Viewer",
                department="Ministry of Finance"
            )
        ]
        for u in users:
            db.add(u)
        db.commit()

        print("Seeding projects...")
        # 2. Projects (Including the mandatory Nagpur Infrastructure Project)
        projects_data = [
            {
                "project_id": "PRJ-NGP-001",
                "name": "Nagpur Ring Road Expansion & Elevated Corridor",
                "department": "Ministry of Road Transport & Highways",
                "implementing_agency": "NHAI Nagpur Circle",
                "manager": "Dr. Amit Deshmukh",
                "category": "Transport",
                "location": "Nagpur, Maharashtra",
                "latitude": 21.1458,
                "longitude": 79.0882,
                "approved_budget": 500.0, # ₹500 Crore
                "expenditure": 530.0, # ₹530 Crore (Overrun ₹30 Cr)
                "planned_physical_progress": 70.0,
                "physical_progress": 55.0, # 15% lag
                "planned_financial_progress": 75.0,
                "financial_progress": 82.0,
                "start_date": "2024-01-15",
                "expected_completion_date": "2026-12-31",
                "status": "DELAYED",
                "description": "Construction of 4-lane outer ring road expansion with 8km elevated corridor connecting Hingna to Kamptee."
            },
            {
                "project_id": "PRJ-MM-004",
                "name": "Mumbai Metro Line 4 Extension",
                "department": "Ministry of Urban Development",
                "implementing_agency": "MMRDA",
                "manager": "Sanjay Kapoor",
                "category": "Metro Rail",
                "location": "Mumbai, Maharashtra",
                "latitude": 19.0760,
                "longitude": 72.8777,
                "approved_budget": 1250.0,
                "expenditure": 1100.0,
                "planned_physical_progress": 80.0,
                "physical_progress": 78.0,
                "planned_financial_progress": 85.0,
                "financial_progress": 83.0,
                "start_date": "2023-06-01",
                "expected_completion_date": "2026-09-30",
                "status": "ON_TRACK",
                "description": "32 km elevated metro corridor connecting Wadala to Kasarvadavali with 32 stations."
            },
            {
                "project_id": "PRJ-DEL-009",
                "name": "Delhi Smart Water Supply Infrastructure",
                "department": "Jal Shakti Ministry",
                "implementing_agency": "Delhi Jal Board",
                "manager": "Anjali Verma",
                "category": "Water Supply",
                "location": "New Delhi",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "approved_budget": 350.0,
                "expenditure": 380.0,
                "planned_physical_progress": 65.0,
                "physical_progress": 50.0,
                "planned_financial_progress": 70.0,
                "financial_progress": 78.0,
                "start_date": "2024-02-10",
                "expected_completion_date": "2026-11-15",
                "status": "DELAYED",
                "description": "24x7 automated pressurized water pipeline deployment and smart metering across East Delhi."
            },
            {
                "project_id": "PRJ-BLR-012",
                "name": "Bengaluru Suburban Railway Corridor 2",
                "department": "Ministry of Railways",
                "implementing_agency": "K-RIDE",
                "manager": "K. R. Venkatesh",
                "category": "Transport",
                "location": "Bengaluru, Karnataka",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "approved_budget": 850.0,
                "expenditure": 620.0,
                "planned_physical_progress": 60.0,
                "physical_progress": 46.0,
                "planned_financial_progress": 65.0,
                "financial_progress": 58.0,
                "start_date": "2024-03-01",
                "expected_completion_date": "2027-03-31",
                "status": "WARNING",
                "description": "25km suburban railway line connecting Baiyappanahalli to Chikkabanavara."
            },
            {
                "project_id": "PRJ-VNS-003",
                "name": "Varanasi Smart City Command Center",
                "department": "Ministry of Housing & Urban Affairs",
                "implementing_agency": "Varanasi Smart City Ltd",
                "manager": "Ramanand Mishra",
                "category": "Smart City",
                "location": "Varanasi, Uttar Pradesh",
                "latitude": 25.3176,
                "longitude": 82.9739,
                "approved_budget": 180.0,
                "expenditure": 172.0,
                "planned_physical_progress": 90.0,
                "physical_progress": 92.0,
                "planned_financial_progress": 92.0,
                "financial_progress": 93.0,
                "start_date": "2023-09-15",
                "expected_completion_date": "2026-10-31",
                "status": "ON_TRACK",
                "description": "Integrated traffic control, CCTV surveillance, and emergency response management portal."
            },
            {
                "project_id": "PRJ-AMD-007",
                "name": "Ahmedabad BRTS Corridor Phase 3",
                "department": "Ministry of Road Transport & Highways",
                "implementing_agency": "AJL",
                "manager": "Hardik Patel",
                "category": "Transport",
                "location": "Ahmedabad, Gujarat",
                "latitude": 23.0225,
                "longitude": 72.5714,
                "approved_budget": 420.0,
                "expenditure": 410.0,
                "planned_physical_progress": 75.0,
                "physical_progress": 73.0,
                "planned_financial_progress": 80.0,
                "financial_progress": 79.0,
                "start_date": "2024-01-05",
                "expected_completion_date": "2026-08-30",
                "status": "ON_TRACK",
                "description": "Bus Rapid Transit system expansion across West Ahmedabad with electric bus charging depots."
            },
            {
                "project_id": "PRJ-KOC-005",
                "name": "Kochi Water Metro Phase 2",
                "department": "Ministry of Ports, Shipping & Waterways",
                "implementing_agency": "KMRL",
                "manager": "Mathew Joseph",
                "category": "Waterways",
                "location": "Kochi, Kerala",
                "latitude": 9.9312,
                "longitude": 76.2673,
                "approved_budget": 290.0,
                "expenditure": 315.0,
                "planned_physical_progress": 55.0,
                "physical_progress": 38.0,
                "planned_financial_progress": 60.0,
                "financial_progress": 72.0,
                "start_date": "2024-04-12",
                "expected_completion_date": "2027-01-20",
                "status": "HIGH_RISK",
                "description": "Electric hybrid ferry network connecting 10 island routes with automated floating jetties."
            },
            {
                "project_id": "PRJ-GHY-002",
                "name": "Guwahati Brahmaputra Riverfront Corridor",
                "department": "Ministry of Development of North Eastern Region",
                "implementing_agency": "GMDA",
                "manager": "Dipankar Barua",
                "category": "Infrastructure",
                "location": "Guwahati, Assam",
                "latitude": 26.1445,
                "longitude": 91.7362,
                "approved_budget": 600.0,
                "expenditure": 450.0,
                "planned_physical_progress": 50.0,
                "physical_progress": 48.0,
                "planned_financial_progress": 52.0,
                "financial_progress": 50.0,
                "start_date": "2024-02-20",
                "expected_completion_date": "2027-06-30",
                "status": "ON_TRACK",
                "description": "6km flood defense embankment with riverfront promenade and eco-tourism parks."
            },
            {
                "project_id": "PRJ-HYD-011",
                "name": "Hyderabad IT Corridor Elevated Skywalk",
                "department": "Ministry of Urban Development",
                "implementing_agency": "HMDA",
                "manager": "Srinivas Rao",
                "category": "Infrastructure",
                "location": "Hyderabad, Telangana",
                "latitude": 17.3850,
                "longitude": 78.4867,
                "approved_budget": 120.0,
                "expenditure": 118.0,
                "planned_physical_progress": 95.0,
                "physical_progress": 96.0,
                "planned_financial_progress": 98.0,
                "financial_progress": 97.0,
                "start_date": "2023-11-01",
                "expected_completion_date": "2026-09-15",
                "status": "ON_TRACK",
                "description": "Multi-tier pedestrian skywalk linking HITEC city metro station to major corporate tech parks."
            },
            {
                "project_id": "PRJ-JPR-008",
                "name": "Jaipur Heritage Solar Street Lighting",
                "department": "Ministry of New and Renewable Energy",
                "implementing_agency": "REIL",
                "manager": "Vikram Singh",
                "category": "Energy",
                "location": "Jaipur, Rajasthan",
                "latitude": 26.9124,
                "longitude": 75.7873,
                "approved_budget": 210.0,
                "expenditure": 195.0,
                "planned_physical_progress": 40.0,
                "physical_progress": 32.0,
                "planned_financial_progress": 45.0,
                "financial_progress": 42.0,
                "start_date": "2024-05-10",
                "expected_completion_date": "2026-12-15",
                "status": "WARNING",
                "description": "Solar micro-grid setup and LED heritage lampposts across the Walled City of Jaipur."
            }
        ]

        project_objects = []
        for pdata in projects_data:
            proj = Project(**pdata)
            db.add(proj)
            project_objects.append(proj)
        
        db.commit()

        print("Seeding milestones...")
        # 3. Milestones (Specifically adding 2 missed milestones for Nagpur)
        milestones_data = [
            # Nagpur Milestones
            {"project_id": 1, "name": "Land Acquisition & Utility Shifting", "due_date": "2024-06-30", "completion_date": "2024-07-15", "status": "Completed"},
            {"project_id": 1, "name": "Elevated Corridor Pier Construction", "due_date": "2025-01-31", "completion_date": None, "status": "Delayed"},
            {"project_id": 1, "name": "Segment Launching & Girders", "due_date": "2025-06-30", "completion_date": None, "status": "Delayed"},
            {"project_id": 1, "name": "Bituminous Paving & Lighting", "due_date": "2026-10-31", "completion_date": None, "status": "Not Started"},

            # Mumbai Metro Milestones
            {"project_id": 2, "name": "Tunnelling & Viaduct Decking", "due_date": "2024-12-31", "completion_date": "2024-12-20", "status": "Completed"},
            {"project_id": 2, "name": "Station Structural Work", "due_date": "2025-08-31", "completion_date": None, "status": "In Progress"},

            # Delhi Water Milestones
            {"project_id": 3, "name": "Trunk Pipeline Trenching", "due_date": "2024-09-30", "completion_date": "2024-11-15", "status": "Completed"},
            {"project_id": 3, "name": "Water Pumping Station Installation", "due_date": "2025-03-31", "completion_date": None, "status": "Delayed"}
        ]

        for mdata in milestones_data:
            m = Milestone(**mdata)
            db.add(m)
        db.commit()

        print("Seeding monthly progress updates...")
        # 4. Progress Updates
        progress_data = [
            # Nagpur Monthly Progress History
            {"project_id": 1, "month": "2025-04", "planned_physical_progress": 40.0, "actual_physical_progress": 38.0, "planned_financial_progress": 45.0, "actual_financial_progress": 46.0, "expenditure": 230.0, "milestones_completed": 1, "remarks": "Piling work completed."},
            {"project_id": 1, "month": "2025-05", "planned_physical_progress": 50.0, "actual_physical_progress": 44.0, "planned_financial_progress": 55.0, "actual_financial_progress": 58.0, "expenditure": 310.0, "milestones_completed": 1, "remarks": "Delay due to steel supply bottlenecks."},
            {"project_id": 1, "month": "2025-06", "planned_physical_progress": 60.0, "actual_physical_progress": 48.0, "planned_financial_progress": 65.0, "actual_financial_progress": 70.0, "expenditure": 420.0, "milestones_completed": 1, "remarks": "Rainfall slowed pier cap launching."},
            {"project_id": 1, "month": "2025-07", "planned_physical_progress": 70.0, "actual_physical_progress": 55.0, "planned_financial_progress": 75.0, "actual_financial_progress": 82.0, "expenditure": 530.0, "milestones_completed": 1, "remarks": "Significant physical lag (15%) and budget overrun of ₹30 Cr."}
        ]

        for pupdate in progress_data:
            pu = ProgressUpdate(**pupdate)
            db.add(pu)
        db.commit()

        print("Evaluating risk and generating smart alerts...")
        # 5. Run Risk Engine & Alert Engine on all projects
        all_projs = db.query(Project).all()
        for p in all_projs:
            evaluate_project_risk(p, db)
            generate_alerts_for_project(p, db)

        print("Database successfully seeded with realistic sample data!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
