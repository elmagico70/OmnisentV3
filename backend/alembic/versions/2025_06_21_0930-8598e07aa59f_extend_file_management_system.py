"""Extend file management system

Revision ID: [auto_generated]
Revises: 2db3885436b8
Create Date: [auto_generated]

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '[auto_generated]'  # Alembic lo generará automáticamente
down_revision = '2db3885436b8'  # Tu migración anterior
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Extend existing file management system"""
    
    # ============================================
    # ACTUALIZAR TABLA FILES EXISTENTE
    # ============================================
    
    # Agregar nuevas columnas a la tabla files existente
    with op.batch_alter_table('files', schema=None) as batch_op:
        # Cambiar tipo de columna size de String a Integer
        batch_op.alter_column('size', type_=sa.Integer(), nullable=False)
        
        # Cambiar starred y protected de String a Boolean
        batch_op.alter_column('starred', type_=sa.Boolean(), nullable=False)
        batch_op.alter_column('protected', type_=sa.Boolean(), nullable=False)
        
        # Agregar nuevas columnas
        batch_op.add_column(sa.Column('storage_path', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('parent_id', sa.String(36), nullable=True))  # UUID como string para SQLite
        batch_op.add_column(sa.Column('mime_type', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('description', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('tags', sa.Text(), nullable=True))
        batch_op.add_column(sa.Column('visibility', sa.String(20), nullable=False, server_default='private'))
        batch_op.add_column(sa.Column('owner_id', sa.String(36), nullable=False, server_default='1'))  # Temporal
        batch_op.add_column(sa.Column('accessed_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')))
        batch_op.add_column(sa.Column('version', sa.Integer(), nullable=False, server_default='1'))
        batch_op.add_column(sa.Column('checksum', sa.String(64), nullable=True))
        
        # Agregar índices
        batch_op.create_index('ix_files_starred', ['starred'])
        batch_op.create_index('ix_files_protected', ['protected'])
        batch_op.create_index('ix_files_visibility', ['visibility'])
        batch_op.create_index('ix_files_owner_id', ['owner_id'])
        batch_op.create_index('ix_files_created_at', ['created_at'])
        batch_op.create_index('ix_files_parent_id', ['parent_id'])
    
    # ============================================
    # CREAR NUEVAS TABLAS
    # ============================================
    
    # Tabla de permisos de archivos
    op.create_table(
        'file_permissions',
        sa.Column('id', sa.String(36), primary_key=True),  # UUID como string
        sa.Column('file_id', sa.String(36), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), nullable=False, index=True),
        sa.Column('can_read', sa.Boolean(), nullable=False, default=True),
        sa.Column('can_write', sa.Boolean(), nullable=False, default=False),
        sa.Column('can_delete', sa.Boolean(), nullable=False, default=False),
        sa.Column('can_share', sa.Boolean(), nullable=False, default=False),
        sa.Column('can_manage', sa.Boolean(), nullable=False, default=False),
        sa.Column('granted_by', sa.String(36), nullable=False),
        sa.Column('granted_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
    )
    
    # Índices para file_permissions
    op.create_index('ix_file_permissions_file_user', 'file_permissions', ['file_id', 'user_id'], unique=True)
    op.create_index('ix_file_permissions_user', 'file_permissions', ['user_id'])
    
    # Tabla de compartición de archivos
    op.create_table(
        'file_shares',
        sa.Column('id', sa.String(36), primary_key=True, index=True),
        sa.Column('file_id', sa.String(36), nullable=False, index=True),
        sa.Column('token', sa.String(64), nullable=False, unique=True, index=True),
        sa.Column('password', sa.String(255), nullable=True),
        sa.Column('max_downloads', sa.Integer(), nullable=True),
        sa.Column('download_count', sa.Integer(), nullable=False, default=0),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('last_accessed', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('allow_upload', sa.Boolean(), nullable=False, default=False),
    )
    
    # Tabla de versiones de archivos
    op.create_table(
        'file_versions',
        sa.Column('id', sa.String(36), primary_key=True, index=True),
        sa.Column('file_id', sa.String(36), nullable=False, index=True),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('checksum', sa.String(64), nullable=False),
        sa.Column('storage_path', sa.Text(), nullable=False),
        sa.Column('created_by', sa.String(36), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
    )
    
    # Índice único para versiones
    op.create_index('ix_file_versions_file_version', 'file_versions', ['file_id', 'version_number'], unique=True)
    
    # Tabla de actividad de archivos
    op.create_table(
        'file_activities',
        sa.Column('id', sa.String(36), primary_key=True, index=True),
        sa.Column('file_id', sa.String(36), nullable=False, index=True),
        sa.Column('user_id', sa.String(36), nullable=True, index=True),
        sa.Column('activity_type', sa.String(50), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, index=True),
    )
    
    # ============================================
    # MIGRAR DATOS EXISTENTES
    # ============================================
    
    # Actualizar archivos existentes con valores por defecto
    connection = op.get_bind()
    
    # Convertir starred y protected de string a boolean
    connection.execute(sa.text("""
        UPDATE files 
        SET starred = CASE WHEN starred = 'true' THEN 1 ELSE 0 END,
            protected = CASE WHEN protected = 'true' THEN 1 ELSE 0 END
    """))
    
    # Convertir size de string a integer (asumir 0 si no es numérico)
    connection.execute(sa.text("""
        UPDATE files 
        SET size = CASE 
            WHEN size GLOB '[0-9]*' THEN CAST(size AS INTEGER)
            ELSE 0 
        END
    """))


def downgrade() -> None:
    """Downgrade schema back to basic file system"""
    
    # Eliminar nuevas tablas
    op.drop_table('file_activities')
    op.drop_table('file_versions')
    op.drop_table('file_shares')
    op.drop_table('file_permissions')
    
    # Revertir cambios en tabla files
    with op.batch_alter_table('files', schema=None) as batch_op:
        # Eliminar índices nuevos
        batch_op.drop_index('ix_files_parent_id')
        batch_op.drop_index('ix_files_created_at')
        batch_op.drop_index('ix_files_owner_id')
        batch_op.drop_index('ix_files_visibility')
        batch_op.drop_index('ix_files_protected')
        batch_op.drop_index('ix_files_starred')
        
        # Eliminar columnas nuevas
        batch_op.drop_column('checksum')
        batch_op.drop_column('version')
        batch_op.drop_column('accessed_at')
        batch_op.drop_column('owner_id')
        batch_op.drop_column('visibility')
        batch_op.drop_column('tags')
        batch_op.drop_column('description')
        batch_op.drop_column('mime_type')
        batch_op.drop_column('parent_id')
        batch_op.drop_column('storage_path')
        
        # Revertir tipos de columnas
        batch_op.alter_column('protected', type_=sa.String(10), nullable=False)
        batch_op.alter_column('starred', type_=sa.String(10), nullable=False)
        batch_op.alter_column('size', type_=sa.String(20), nullable=False)