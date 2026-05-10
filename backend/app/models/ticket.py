from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .comment import Comment
    from .user import User

class TicketBase(SQLModel):
    customer_name: str
    customer_email: Optional[str] = None
    subject: Optional[str] = None
    request_text: str
    attachment_url: Optional[str] = None
    status: str = Field(default="Open")
    category: Optional[str] = None
    priority: Optional[str] = None
    summary: Optional[str] = None
    owner: Optional[str] = None
    assigned_by_ia: bool = Field(default=False)

class Ticket(TicketBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = Field(default=None)
    
    # Relaciones
    comments: List["Comment"] = Relationship(back_populates="ticket", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    
    # Opcional: Relacion real con usuario si se desea
    owner_id: Optional[int] = Field(default=None, foreign_key="user.id")
    assigned_to: Optional["User"] = Relationship(back_populates="assigned_tickets")

class CommentCreate(SQLModel):
    text: str
    is_internal: bool = False

class CommentRead(SQLModel):
    id: Optional[int] = None
    text: str
    author: str
    created_at: Optional[datetime] = None
    ticket_id: int

class TicketWithComments(TicketBase):
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    comments: List[CommentRead] = []

