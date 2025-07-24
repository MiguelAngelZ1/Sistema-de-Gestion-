-- Migración para agregar columna NI (Número de Identificación) a la tabla equipos
-- Fecha: 2025-01-25
-- Descripción: Agrega una nueva columna 'ni' como identificador único para equipos

-- Agregar la columna NI como VARCHAR con índice único
ALTER TABLE equipos 
ADD COLUMN ni VARCHAR(50) NULL 
AFTER nne;

-- Crear índice único para la columna NI
CREATE UNIQUE INDEX idx_equipos_ni ON equipos(ni);

-- Opcional: Agregar comentario a la columna
ALTER TABLE equipos 
MODIFY COLUMN ni VARCHAR(50) NULL 
COMMENT 'Número de Identificación único del equipo';

-- Verificar la estructura actualizada
DESCRIBE equipos;
