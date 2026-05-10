from fastapi import FastAPI, Depends, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil

from .core.config import settings
from .db.session import engine, create_db_and_tables, get_session
from .api import tickets, auth, users, departments, analytics
from .models import User, Department
from .core.security import get_password_hash
from sqlmodel import Session, select

app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    create_db_and_tables()
    
    # Datos por defecto
    with Session(engine) as session:
        # 1. Departamentos por defecto
        default_depts = ["Finance", "Legal", "Procurement", "Operations", "Technical Support"]
        for dept_name in default_depts:
            exists = session.exec(select(Department).where(Department.name == dept_name)).first()
            if not exists:
                session.add(Department(name=dept_name))
        
        # 2. Usuario Admin por defecto
        admin_exists = session.exec(select(User).where(User.username == "admin")).first()
        if not admin_exists:
            admin = User(
                username="admin",
                full_name="System Administrator",
                email="admin@mantis-ai.com",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                department="All"
            )
            session.add(admin)
        
        session.commit()

# Rutas
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["tickets"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(departments.router, prefix="/api/departments", tags=["departments"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

# Uploads
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/static/uploads/{file.filename}"}

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return {"message": "AI Ticket Workspace API is running modularly"}