import psycopg2
from app.core.config import settings

try:
    # Probar conexión directa
    conn = psycopg2.connect(
        host="localhost",
        database="omnisent_db", 
        user="postgres",
        password="password"  # Ajusta según tu configuración
    )
    print("✅ Conexión exitosa a PostgreSQL")
    conn.close()
except Exception as e:
    print(f"❌ Error de conexión: {e}")