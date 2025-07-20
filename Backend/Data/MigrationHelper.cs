using Npgsql;
using System;

namespace Backend.Data
{
    public static class MigrationHelper
    {
        public static void ApplyMigrations(string connectionString)
        {
            using (var connection = new NpgsqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    Console.WriteLine("Conexión a la base de datos exitosa.");

                    // Crear todas las tablas necesarias
                    CreateTables(connection);

                    // Verificar si la columna 'en_servicio' ya existe en equipos
                    var checkColumnQuery = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'public' AND TABLE_NAME = 'equipos' AND COLUMN_NAME = 'en_servicio';";
                    using (var checkCmd = new NpgsqlCommand(checkColumnQuery, connection))
                    {
                        var columnExists = Convert.ToInt64(checkCmd.ExecuteScalar()) > 0;
                        if (!columnExists)
                        {
                            // Añadir la columna 'en_servicio' si no existe
                            Console.WriteLine("Agregando columna 'en_servicio' a la tabla equipos...");
                            var alterTableQuery = "ALTER TABLE equipos ADD COLUMN en_servicio BOOLEAN NOT NULL DEFAULT TRUE;";
                            using (var alterCmd = new NpgsqlCommand(alterTableQuery, connection))
                            {
                                alterCmd.ExecuteNonQuery();
                                Console.WriteLine("Migración completada: La columna 'en_servicio' ha sido añadida a la tabla 'equipos'.");
                            }
                        }
                    }

                    Console.WriteLine("Todas las migraciones completadas exitosamente.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Ocurrió un error durante la migración de la base de datos: {ex.Message}");
                    Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                }
            }
        }

        private static void CreateTables(NpgsqlConnection connection)
        {
            var createTablesScript = @"
                -- Crear tabla grado
                CREATE TABLE IF NOT EXISTS grado (
                    id_grado SERIAL PRIMARY KEY,
                    abreviatura VARCHAR(50),
                    gradocompleto VARCHAR(100)
                );

                -- Crear tabla armesp (con enum convertido a CHECK constraint)
                CREATE TABLE IF NOT EXISTS armesp (
                    id_armesp SERIAL PRIMARY KEY,
                    abreviatura VARCHAR(50) NOT NULL,
                    armesp_completo VARCHAR(100) NOT NULL,
                    tipo VARCHAR(20) NOT NULL DEFAULT 'Arma' CHECK (tipo IN ('Arma', 'Especialidad'))
                );

                -- Crear tabla persona (con nro_dni en lugar de dni)
                CREATE TABLE IF NOT EXISTS persona (
                    id_persona SERIAL PRIMARY KEY,
                    id_grado INTEGER REFERENCES grado(id_grado),
                    id_armesp INTEGER REFERENCES armesp(id_armesp),
                    nombre VARCHAR(100),
                    apellido VARCHAR(100),
                    nro_dni VARCHAR(20) UNIQUE
                );

                -- Crear tabla tipos_equipo (CHAR(1) como VARCHAR(1))
                CREATE TABLE IF NOT EXISTS tipos_equipo (
                    id VARCHAR(1) PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL UNIQUE
                );

                -- Crear tabla estado_equipo
                CREATE TABLE IF NOT EXISTS estado_equipo (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL UNIQUE
                );

                -- Crear tabla equipos (estructura original)
                CREATE TABLE IF NOT EXISTS equipos (
                    id SERIAL PRIMARY KEY,
                    nne VARCHAR(50) NOT NULL,
                    id_tipo_equipo VARCHAR(1) NOT NULL REFERENCES tipos_equipo(id),
                    marca VARCHAR(100),
                    modelo VARCHAR(100),
                    ubicacion VARCHAR(255),
                    observaciones TEXT,
                    ine VARCHAR(100),
                    en_servicio BOOLEAN NOT NULL DEFAULT true
                );

                -- Crear tabla especificaciones_equipo
                CREATE TABLE IF NOT EXISTS especificaciones_equipo (
                    id SERIAL PRIMARY KEY,
                    id_equipo INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
                    clave VARCHAR(100) NOT NULL,
                    valor VARCHAR(255) NOT NULL
                );

                -- Crear tabla unidades_equipo
                CREATE TABLE IF NOT EXISTS unidades_equipo (
                    id SERIAL PRIMARY KEY,
                    id_equipo INTEGER NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
                    nro_serie VARCHAR(100) NOT NULL UNIQUE,
                    id_estado INTEGER NOT NULL REFERENCES estado_equipo(id),
                    id_persona INTEGER REFERENCES persona(id_persona) ON DELETE SET NULL,
                    fecha_asignacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                -- Insertar tipos de equipo
                INSERT INTO tipos_equipo (id, nombre) VALUES ('A', 'ARMAMENTO') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('V', 'AUTOMOTORES') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('P', 'AVIACIÓN') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('E', 'ELECTRÓNICA Y ELECTRICIDAD') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('H', 'EQUIPOS DE TALLER, MÁQUINAS Y HERRAMIENTAS') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('I', 'INGENIEROS') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('G', 'MAT GENERALES') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('M', 'MUNICIÓN') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('O', 'OP, INSTRUMENTAL Y EQU DE LABORATORIO') ON CONFLICT (id) DO NOTHING;
                INSERT INTO tipos_equipo (id, nombre) VALUES ('Z', 'REP. DE ARS') ON CONFLICT (id) DO NOTHING;

                -- Insertar estados de equipo
                INSERT INTO estado_equipo (id, nombre) VALUES (1, 'E/S En Servicio') ON CONFLICT (id) DO NOTHING;
                INSERT INTO estado_equipo (id, nombre) VALUES (2, 'F/S Fuera de Servicio') ON CONFLICT (id) DO NOTHING;
                INSERT INTO estado_equipo (id, nombre) VALUES (3, 'MANT Mantenimiento') ON CONFLICT (id) DO NOTHING;
                INSERT INTO estado_equipo (id, nombre) VALUES (4, 'REPAR Reparación') ON CONFLICT (id) DO NOTHING;
                INSERT INTO estado_equipo (id, nombre) VALUES (5, 'BAJA') ON CONFLICT (id) DO NOTHING;
                INSERT INTO estado_equipo (id, nombre) VALUES (6, 'EXT Extraviado') ON CONFLICT (id) DO NOTHING;

                -- Resetear secuencias de SERIAL para IDs específicos
                SELECT setval('estado_equipo_id_seq', (SELECT MAX(id) FROM estado_equipo));
            ";

            using (var cmd = new NpgsqlCommand(createTablesScript, connection))
            {
                Console.WriteLine("Creando esquema completo de base de datos...");
                cmd.ExecuteNonQuery();
                Console.WriteLine("Esquema de base de datos creado exitosamente.");
            }
        }
    }
}
