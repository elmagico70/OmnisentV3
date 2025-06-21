#!/usr/bin/env python3
"""
Script de configuración inicial para Omnisent Backend
Ejecutar después de instalar dependencias y configurar PostgreSQL
"""

import os
import sys
import subprocess
from pathlib import Path

def run_command(command: str, description: str):
    """Ejecuta un comando y maneja errores"""
    print(f"🔧 {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Completado")
        if result.stdout:
            print(f"   Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Error")
        print(f"   Error: {e.stderr.strip()}")
        return False

def check_postgresql():
    """Verifica que PostgreSQL esté disponible"""
    print("🔍 Verificando PostgreSQL...")
    try:
        import psycopg2
        print("✅ psycopg2 instalado")
        return True
    except ImportError:
        print("❌ psycopg2 no está instalado. Instalar con: pip install psycopg2-binary")
        return False

def create_database():
    """Crea la base de datos si no existe"""
    print("🗄️ Configurando base de datos...")
    
    # Comando para crear base de datos (requiere que PostgreSQL esté corriendo)
    create_db_cmd = '''
    psql -U postgres -c "CREATE DATABASE omnisent_db;" 2>/dev/null || echo "Base de datos ya existe"
    '''
    
    if run_command(create_db_cmd, "Creando base de datos omnisent_db"):
        print("✅ Base de datos configurada")
    else:
        print("⚠️ Asegúrate de que PostgreSQL esté corriendo y que el usuario 'postgres' exista")
        print("   Comando manual: createdb -U postgres omnisent_db")

def setup_alembic():
    """Inicializa Alembic y crea migración inicial"""
    
    # Verificar si ya está inicializado
    if Path("alembic/versions").exists():
        print("✅ Alembic ya está inicializado")
    else:
        if run_command("alembic init alembic", "Inicializando Alembic"):
            print("✅ Alembic inicializado")
        else:
            print("❌ Error inicializando Alembic")
            return False
    
    # Crear migración inicial
    if run_command("alembic revision --autogenerate -m 'Initial migration'", "Creando migración inicial"):
        print("✅ Migración inicial creada")
    else:
        print("⚠️ Error creando migración inicial")
        return False
    
    # Aplicar migraciones
    if run_command("alembic upgrade head", "Aplicando migraciones"):
        print("✅ Migraciones aplicadas")
        return True
    else:
        print("❌ Error aplicando migraciones")
        return False

def create_env_file():
    """Crea archivo .env si no existe"""
    env_path = Path(".env")
    
    if env_path.exists():
        print("✅ Archivo .env ya existe")
        return
    
    env_content = """# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/omnisent_db
DATABASE_URL_TEST=postgresql://postgres:password@localhost:5432/omnisent_test

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-please
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# App
APP_NAME=Omnisent
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development

# CORS
ALLOWED_ORIGINS=["http://localhost:5173"]
"""
    
    try:
        with open(env_path, "w") as f:
            f.write(env_content)
        print("✅ Archivo .env creado")
        print("⚠️ IMPORTANTE: Cambia las contraseñas en .env antes de producción")
    except Exception as e:
        print(f"❌ Error creando .env: {e}")

def main():
    """Función principal de configuración"""
    print("🚀 Configuración inicial de Omnisent Backend")
    print("=" * 50)
    
    # Verificar dependencias
    if not check_postgresql():
        return
    
    # Crear archivo .env
    create_env_file()
    
    # Configurar base de datos
    create_database()
    
    # Configurar Alembic
    setup_alembic()
    
    print("\n" + "=" * 50)
    print("🎉 Configuración completada!")
    print("\n📋 Próximos pasos:")
    print("1. Revisar y ajustar configuraciones en .env")
    print("2. Ejecutar: uvicorn app.main:app --reload")
    print("3. Visitar: http://localhost:8000/docs")
    print("\n🔧 Comandos útiles:")
    print("- Crear migración: alembic revision --autogenerate -m 'descripción'")
    print("- Aplicar migraciones: alembic upgrade head")
    print("- Revertir migración: alembic downgrade -1")

if __name__ == "__main__":
    main()