from app.ai_service import classify_ticket
import json

try:
    result = classify_ticket("Tester", "No puedo acceder a mi cuenta, dice contraseña incorrecta")
    print("Resultado de la clasificación:")
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error durante la prueba: {e}")
