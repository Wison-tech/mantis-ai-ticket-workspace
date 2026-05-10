import google.generativeai as genai
import json
import re
from typing import List
from ..core.config import settings

# Configurar Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

def classify_ticket(text: str, admins_list: list = []) -> dict:
    """
    Utiliza un modelo LLM (Gemini) para analizar el texto de una solicitud y extraer
    metadatos estructurados.
    
    Args:
        text (str): El contenido de la solicitud del cliente.
        admins_list (list): Lista de nombres de agentes disponibles para asignacion.
        
    Returns:
        dict: Un diccionario con 'category', 'priority', 'summary' y 'owner'.
    """
    admins_str = ", ".join(admins_list) if admins_list else "Ninguno"
    prompt = f"""
    Eres un asistente de triage de tickets. Analiza el siguiente texto y responde UNICAMENTE en formato JSON.
    Campos requeridos:
    - category: Una de [Technical Support, Finance, Sales, Operations, Legal, Procurement]
    - priority: Una de [High, Medium, Low]
    - summary: Un resumen ejecutivo de maximo 15 palabras.
    - owner: Elige un nombre de esta lista: [{admins_str}]. Si la lista es "Ninguno" o esta vacia, devuelve null o vacio.

    Texto del ticket: "{text}"
    """
    
    try:
        response = model.generate_content(prompt)
        # Limpiar la respuesta de posibles bloques de codigo markdown
        clean_json = re.sub(r'```json\s*|\s*```', '', response.text).strip()
        return json.loads(clean_json)
    except Exception as e:
        print(f"Error AI: {e}")
        return {
            "category": "Operations",
            "priority": "Medium",
            "summary": "Error procesando resumen por IA."
        }

def generate_report_conclusions(stats_data: dict, audit_logs: List[dict]):
    """
    Genera un analisis ejecutivo profundo basado en estadisticas agregadas y logs
    de auditoria recientes.
    
    Args:
        stats_data (dict): Metricas generales de tickets y agentes.
        audit_logs (List[dict]): Lista de eventos recientes del sistema.
        
    Returns:
        str: Un informe detallado en lenguaje natural.
    """
    # Prompt ultra-detallado para un informe extenso
    prompt = f"""
    Eres un Consultor Senior de Estrategia de Operaciones y Business Intelligence. 
    Analiza el siguiente conjunto de datos de MANTIS AI y genera un INFORME ESTRATÉGICO EXTENSO Y DETALLADO.
    
    DATOS OPERATIVOS:
    - Total de Tickets: {stats_data.get('total')}
    - Tickets Resueltos: {stats_data.get('resolved')}
    - Métricas por Agente: {stats_data.get('agents')}
    
    HISTORIAL DE AUDITORÍA (Eventos recientes):
    {json.dumps(audit_logs, indent=2)}
    
    ESTRUCTURA DEL INFORME REQUERIDA (Sé muy extenso y profesional):
    1. RESUMEN EJECUTIVO: Visión macro del estado actual de la operación.
    2. ANÁLISIS DE EFICIENCIA OPERATIVA: Evaluación del ritmo de resolución frente a la carga entrante.
    3. COMPORTAMIENTO POR DEPARTAMENTO: Identifica qué áreas están saturadas y por qué (según los logs).
    4. DETECCIÓN DE CUELLOS DE BOTELLA: Análisis de agentes específicos o procesos que retrasan el flujo.
    5. RECOMENDACIONES ESTRATÉGICAS: Sugiere 3 acciones concretas (ej: reasignación de personal, capacitación en áreas específicas, etc.).
    
    TONO: Corporativo, crítico y constructivo. Usa lenguaje de consultoría de alto nivel.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Error en generación estratégica: {str(e)}"
