from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from ..db.session import get_session
from ..models import Department, User
from ..core.security import get_current_admin, get_current_support

router = APIRouter()

@router.get("/", response_model=List[Department])
def list_departments(session: Session = Depends(get_session), current_user: User = Depends(get_current_support)):
    return session.exec(select(Department)).all()

@router.post("/", response_model=Department)
def create_department(department: Department, session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    existing = session.exec(select(Department).where(Department.name == department.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    session.add(department)
    session.commit()
    session.refresh(department)
    return department

@router.delete("/{department_id}")
def delete_department(department_id: int, session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    dept = session.get(Department, department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    session.delete(dept)
    session.commit()
    return {"detail": "Department deleted"}
