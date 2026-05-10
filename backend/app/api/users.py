from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..db.session import get_session
from ..models.user import User, UserCreate
from ..core.security import get_password_hash, get_current_admin, get_current_support

router = APIRouter()

@router.get("/", response_model=List[User])
def list_users(session: Session = Depends(get_session), admin_user: User = Depends(get_current_support)):
    return session.exec(select(User)).all()

@router.post("/", response_model=User)
def create_user(user_in: UserCreate, session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    existing_user = session.exec(select(User).where(User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_email = session.exec(select(User).where(User.email == user_in.email)).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    new_user = User(
        username=user_in.username,
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=user_in.role,
        department=user_in.department
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user

@router.patch("/{user_id}", response_model=User)
def update_user(user_id: int, update_data: dict, session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if "password" in update_data:
        db_user.hashed_password = get_password_hash(update_data["password"])
        
    if "full_name" in update_data:
        db_user.full_name = update_data["full_name"]
        
    if "role" in update_data:
        db_user.role = update_data["role"]
        
    if "department" in update_data:
        db_user.department = update_data["department"]
        
    if "is_active" in update_data and update_data["is_active"] == False:
        # Si es el usuario admin, verificar que existan otros admins activos
        if db_user.username == "admin":
            other_active_admins = session.exec(select(User).where(User.role == "admin", User.is_active == True, User.id != db_user.id)).all()
            if not other_active_admins:
                raise HTTPException(status_code=400, detail="Cannot disable the last active administrator")
        db_user.is_active = False
    elif "is_active" in update_data:
        db_user.is_active = update_data["is_active"]
        
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Protección de seguridad para el último admin
    if user.role == "admin":
        other_active_admins = session.exec(select(User).where(User.role == "admin", User.is_active == True, User.id != user.id)).all()
        if not other_active_admins:
            raise HTTPException(status_code=400, detail="Cannot delete the last active administrator")
            
    session.delete(user)
    session.commit()
    return {"detail": "User deleted"}
