from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from ..db.session import get_session
from ..services.ai_service import classify_ticket
from ..core.security import get_current_user, get_current_admin
from ..models import Ticket, Comment, TicketBase, TicketWithComments, CommentRead, CommentCreate, User, AuditLog

router = APIRouter()

@router.get("/", response_model=List[Ticket])
def list_tickets(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    query = select(Ticket)
    if current_user.role == "soporte" and current_user.department != "All":
        query = query.where(Ticket.category == current_user.department)
    elif current_user.role == "empleado":
        query = query.where(Ticket.customer_name == current_user.full_name)
    return session.exec(query).all()

@router.get("/{ticket_id}", response_model=TicketWithComments)
def get_ticket(ticket_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    ticket = session.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Filtrar comentarios internos si el usuario es empleado
    all_comments = ticket.comments
    if current_user.role == "empleado":
        ticket.comments = [c for c in all_comments if not c.is_internal]
    
    return ticket

@router.get("/{ticket_id}/audit", response_model=List[AuditLog])
def get_ticket_audit(ticket_id: int, session: Session = Depends(get_session), admin_user: User = Depends(get_current_admin)):
    return session.exec(select(AuditLog).where(AuditLog.ticket_id == ticket_id).order_by(AuditLog.created_at.desc())).all()

@router.post("/", response_model=Ticket)
def create_ticket(
    ticket_data: TicketBase, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Crea un nuevo ticket. Integra inteligencia artificial para clasificar categoria, 
    prioridad y generar un resumen automatico antes de la persistencia.
    """
    # REGLA: Forzar que el ticket quede a nombre del creador si es empleado o soporte
    if current_user.role in ["empleado", "soporte"]:
        ticket_data.customer_name = current_user.full_name

    # Analisis de IA
    admins = session.exec(select(User).where(User.role == "soporte")).all()
    admin_names = [f"{a.full_name} ({a.department})" for a in admins]
    ai_analysis = classify_ticket(ticket_data.request_text, admin_names)
    
    new_ticket = Ticket(
        customer_name=ticket_data.customer_name,
        customer_email=ticket_data.customer_email,
        subject=ticket_data.subject,
        request_text=ticket_data.request_text,
        attachment_url=ticket_data.attachment_url,
        category=ai_analysis.get("category"),
        priority=ai_analysis.get("priority"),
        summary=ai_analysis.get("summary"),
        owner=ai_analysis.get("owner"),
        assigned_by_ia=True if ai_analysis.get("owner") else False,
        status="Open"
    )
    session.add(new_ticket)
    session.commit()
    session.refresh(new_ticket)
    
    return new_ticket

@router.patch("/{ticket_id}", response_model=Ticket)
def update_ticket(
    ticket_id: int, 
    update_data: dict, 
    session: Session = Depends(get_session), 
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza campos de un ticket. Implementa logica de negocio para:
    - Registro de tiempo de resolucion.
    - Sincronizacion de area/categoria basada en el departamento del nuevo dueño.
    - Registro de auditoria forense.
    """
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # REGLA DE NEGOCIO: Solo admin/soporte puede cambiar el STATUS u OWNER
    for restricted_field in ["status", "owner"]:
        if restricted_field in update_data and update_data[restricted_field] != getattr(db_ticket, restricted_field):
            if current_user.role not in ["soporte", "admin"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Only administrators can change ticket {restricted_field}"
                )
            if restricted_field == "status" and update_data[restricted_field] == "Resolved":
                from datetime import datetime, timezone
                db_ticket.resolved_at = datetime.now(timezone.utc)
            
            # NUEVO: Sincronizar Categoría con el Departamento del nuevo Propietario
            if restricted_field == "owner":
                new_owner = update_data["owner"]
                if "(" in new_owner and ")" in new_owner:
                    # Extraer lo que hay dentro de los paréntesis: "Jose (Finanzas)" -> "Finanzas"
                    new_dept = new_owner.split("(")[-1].split(")")[0]
                    db_ticket.category = new_dept
            
    # REGLA DE NEGOCIO: Solo empleado puede cambiar el texto
    if "request_text" in update_data and update_data["request_text"] != db_ticket.request_text:
        if current_user.role != "empleado":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the ticket creator can edit its content"
            )
            
        admins = session.exec(select(User).where(User.role == "soporte")).all()
        admin_names = [f"{a.full_name} ({a.department})" for a in admins]
        ai_analysis = classify_ticket(update_data["request_text"], admin_names)
        update_data["category"] = ai_analysis.get("category", db_ticket.category)
        update_data["priority"] = ai_analysis.get("priority", db_ticket.priority)
        update_data["summary"] = ai_analysis.get("summary", db_ticket.summary)
        if ai_analysis.get("owner"):
            update_data["owner"] = ai_analysis.get("owner")
            update_data["assigned_by_ia"] = True

    # Si se cambia el owner manualmente, quitar el flag de IA
    if "owner" in update_data and current_user.role in ["soporte", "admin"]:
         # Solo si el cambio es diferente al actual y no viene de la lógica de re-clasificación anterior
         if update_data["owner"] != db_ticket.owner:
             update_data["assigned_by_ia"] = False
            
    for key, value in update_data.items():
        old_val = getattr(db_ticket, key)
        if old_val != value:
            # Registrar en auditoría si es un cambio relevante
            if key in ["status", "owner", "priority", "category"]:
                log = AuditLog(
                    user_id=current_user.id,
                    username=current_user.full_name,
                    action=f"Changed {key}",
                    ticket_id=ticket_id,
                    details=f"From '{old_val}' to '{value}'"
                )
                session.add(log)
            setattr(db_ticket, key, value)
        
    session.add(db_ticket)
    session.commit()
    session.refresh(db_ticket)
    return db_ticket

@router.post("/{ticket_id}/comments/", response_model=CommentRead)
def add_comment(ticket_id: int, comment: CommentCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # REGLA DE NEGOCIO: Empleados no pueden comentar
    if current_user.role == "empleado":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Employees are not allowed to add comments"
        )
        
    db_ticket = session.get(Ticket, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    new_comment = Comment(
        text=comment.text,
        author=current_user.full_name,
        ticket_id=ticket_id,
        is_internal=getattr(comment, 'is_internal', False)
    )
    session.add(new_comment)
    
    # Registrar en auditoría
    log = AuditLog(
        user_id=current_user.id,
        username=current_user.full_name,
        action="Added comment",
        ticket_id=ticket_id,
        details="Internal note" if new_comment.is_internal else "Public comment"
    )
    session.add(log)
    
    session.commit()
    session.refresh(new_comment)
    
    session.refresh(new_comment)
    return new_comment

@router.delete("/{ticket_id}/comments/{comment_id}", status_code=204)
def delete_comment(ticket_id: int, comment_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    comment = session.get(Comment, comment_id)
    if not comment or comment.ticket_id != ticket_id:
        raise HTTPException(status_code=404, detail="Comment not found")
    # Solo el autor puede borrar su propio comentario
    if comment.author != current_user.full_name:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own comments")
    session.delete(comment)
    session.commit()
