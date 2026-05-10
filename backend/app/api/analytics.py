from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlmodel import Session, select, func
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fpdf import FPDF
from ..db.session import get_session
from ..models import Ticket, User, AuditLog
from ..core.security import get_current_admin
from ..services.ai_service import generate_report_conclusions

router = APIRouter()

@router.get("/summary")
def get_analytics_summary(session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    total_tickets = session.exec(select(func.count(Ticket.id))).one()
    status_counts = session.exec(select(Ticket.status, func.count(Ticket.id)).group_by(Ticket.status)).all()
    priority_counts = session.exec(select(Ticket.priority, func.count(Ticket.id)).group_by(Ticket.priority)).all()
    category_counts = session.exec(select(Ticket.category, func.count(Ticket.id)).group_by(Ticket.category)).all()
    
    return {
        "total": total_tickets,
        "status": {s: count for s, count in status_counts},
        "priority": {p: count for p, count in priority_counts},
        "categories": {cat: count for cat, count in category_counts}
    }

@router.get("/performance")
def get_detailed_performance(session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    # Estadísticas de Agentes de Soporte
    agents = session.exec(select(User).where(User.role == "soporte")).all()
    support_stats = []
    for agent in agents:
        agent_name = f"{agent.full_name} ({agent.department})"
        resolved_tickets = session.exec(select(Ticket).where(Ticket.owner == agent_name, Ticket.status == "Resolved")).all()
        pending_count = session.exec(select(func.count(Ticket.id)).where(Ticket.owner == agent_name, Ticket.status != "Resolved")).one()
        
        # Calcular tiempo promedio
        avg_hours = 0
        if resolved_tickets:
            total_seconds = 0
            for t in resolved_tickets:
                if t.resolved_at:
                    delta = t.resolved_at - t.created_at
                    total_seconds += delta.total_seconds()
            avg_hours = round(total_seconds / len(resolved_tickets) / 3600, 1)

        support_stats.append({
            "name": agent.full_name,
            "dept": agent.department,
            "resolved": len(resolved_tickets),
            "pending": pending_count,
            "avg_time": f"{avg_hours}h",
            "efficiency": f"{round((len(resolved_tickets) / (len(resolved_tickets) + pending_count) * 100), 1)}%" if (len(resolved_tickets) + pending_count) > 0 else "0%"
        })

    # Top Usuarios (Creadores de Tickets)
    user_counts = session.exec(
        select(Ticket.customer_name, func.count(Ticket.id))
        .group_by(Ticket.customer_name)
        .order_by(func.count(Ticket.id).desc())
        .limit(10)
    ).all()

    return {
        "support": support_stats,
        "top_users": [{"name": name, "count": count} for name, count in user_counts],
        "global_avg": round(sum([float(s["avg_time"].replace('h','')) for s in support_stats if s["resolved"] > 0]) / len([s for s in support_stats if s["resolved"] > 0]), 1) if any(s["resolved"] > 0 for s in support_stats) else 0
    }

@router.get("/audit-logs", response_model=List[AuditLog])
def get_global_audit(
    days: int = Query(7),
    user_id: Optional[int] = None,
    session: Session = Depends(get_session), 
    admin_user: User = Depends(get_current_admin)
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    query = select(AuditLog).where(AuditLog.created_at >= since)
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    return session.exec(query.order_by(AuditLog.created_at.desc())).all()

