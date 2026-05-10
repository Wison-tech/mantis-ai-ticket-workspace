import requests
import time

API_URL = "http://localhost:8000/tickets/"

# Casos de prueba variados para estresar la clasificación de la IA
seed_data = [
    {
        "customer_name": "Elon Tusk",
        "request_text": "Mi pago de la suscripción mensual se procesó dos veces. Necesito el reembolso de los 20 USD extra cuanto antes."
    },
    {
        "customer_name": "Sarah Connor",
        "request_text": "No puedo entrar a mi cuenta de administrador. Me dice que el token ha expirado pero no me llega el correo de reset."
    },
    {
        "customer_name": "John Wick",
        "request_text": "Quisiera saber si tienen planes para empresas de más de 500 empleados y si ofrecen descuentos por volumen."
    },
    {
        "customer_name": "Tony Stank",
        "request_text": "La aplicación se cierra sola cada vez que intento exportar el reporte en PDF en mi iPad Pro."
    },
    {
        "customer_name": "Bruce Vayne",
        "request_text": "Excelente servicio, solo quería felicitarlos por la nueva actualización de la interfaz nocturna."
    }
]

print("🚀 Iniciando inyección de datos con IA...")

for data in seed_data:
    try:
        print(f"Enviando ticket de: {data['customer_name']}...")
        response = requests.post(API_URL, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Éxito: {result['category']} | Prioridad: {result['priority']}")
        else:
            print(f"❌ Error: {response.status_code}")
        time.sleep(1) # Pequeña pausa para no saturar
    except Exception as e:
        print(f"❌ Error de conexión: {e}")

print("\n✨ Proceso terminado. Revisa tu Dashboard en http://localhost:5173")
