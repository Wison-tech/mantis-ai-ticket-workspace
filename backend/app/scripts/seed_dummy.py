from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User
from app.models.audit_log import AuditLog
from app.core.security import get_password_hash

def seed_team_only():
    with Session(engine) as session:
        print("🧹 Limpiando personal de prueba anterior...")
        # 1. Buscar usuarios dummy
        dummy_users = session.exec(select(User).where(User.email.like("%dummy.mantis.ai"))).all()
        dummy_user_ids = [u.id for u in dummy_users]
        
        if dummy_user_ids:
            # 2. Borrar logs de auditoría asociados a esos usuarios primero (Evita FK Error)
            old_logs = session.exec(select(AuditLog).where(AuditLog.user_id.in_(dummy_user_ids))).all()
            for log in old_logs:
                session.delete(log)
            
            # 3. Borrar los usuarios
            for u in dummy_users:
                session.delete(u)
            
            session.commit()

        # 4. CREAR PLANTILLA DE PERSONAL
        print("👥 Configurando equipo de pruebas...")
        
        users_to_create = [
            {"un": "empleado_test", "fn": "Juan Empleado", "em": "empleado@dummy.mantis.ai", "ro": "empleado", "de": "Ventas", "pw": "empleado123"},
            {"un": "carlos_tech", "fn": "Carlos Soporte Técnico", "em": "carlos@dummy.mantis.ai", "ro": "soporte", "de": "Technical Support", "pw": "soporte123"},
            {"un": "ana_finance", "fn": "Ana Soporte Finanzas", "em": "ana@dummy.mantis.ai", "ro": "soporte", "de": "Finance", "pw": "soporte123"},
            {"un": "elena_legal", "fn": "Elena Soporte Legal", "em": "elena@dummy.mantis.ai", "ro": "soporte", "de": "Legal", "pw": "soporte123"}
        ]

        for u_data in users_to_create:
            new_user = User(
                username=u_data["un"],
                full_name=u_data["fn"],
                email=u_data["em"],
                hashed_password=get_password_hash(u_data["pw"]),
                role=u_data["ro"],
                department=u_data["de"],
                is_verified=True
            )
            session.add(new_user)

        session.commit()
        print("✅ Equipo configurado con éxito.")

if __name__ == "__main__":
    seed_team_only()
