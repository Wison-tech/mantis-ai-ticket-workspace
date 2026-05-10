from typing import Optional, TYPE_CHECKING
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .ticket import Ticket

class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    text: str
    author: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_internal: bool = Field(default=False)
    
    ticket_id: int = Field(foreign_key="ticket.id")
    ticket: "Ticket" = Relationship(back_populates="comments")
