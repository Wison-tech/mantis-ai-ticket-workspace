from typing import Optional
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    username: str
    action: str
    ticket_id: Optional[int] = Field(default=None, foreign_key="ticket.id")
    details: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
