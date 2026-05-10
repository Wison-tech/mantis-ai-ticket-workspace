from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .ticket import Ticket

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    hashed_password: str
    full_name: str
    email: Optional[str] = Field(default=None, unique=True, index=True)
    is_verified: bool = Field(default=False)
    role: str = Field(default="empleado") # "admin", "soporte" o "empleado"
    department: str = Field(default="All")
    is_active: bool = Field(default=True)
    
    assigned_tickets: List["Ticket"] = Relationship(back_populates="assigned_to")

class UserCreate(SQLModel):
    username: str
    password: str
    full_name: str
    email: str
    role: str = "empleado"
    department: str = "All"
