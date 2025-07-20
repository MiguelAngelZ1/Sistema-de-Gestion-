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
                -- Crear tabla grado si no existe
                CREATE TABLE IF NOT EXISTS grado (
                    id_grado SERIAL PRIMARY KEY,
                    abreviatura VARCHAR(50) NOT NULL,
                    gradocompleto VARCHAR(100) NOT NULL
                );

                -- Crear tabla armesp si no existe
                CREATE TABLE IF NOT EXISTS armesp (
                    id_armesp SERIAL PRIMARY KEY,
                    abreviatura VARCHAR(50) NOT NULL,
                    armesp_completo VARCHAR(100) NOT NULL,
                    tipo VARCHAR(50) NOT NULL
                );

                -- Crear tabla persona si no existe
                CREATE TABLE IF NOT EXISTS persona (
                    id_persona SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    apellido VARCHAR(100) NOT NULL,
                    dni VARCHAR(20) NOT NULL UNIQUE,
                    id_grado INTEGER REFERENCES grado(id_grado),
                    id_armesp INTEGER REFERENCES armesp(id_armesp)
                );

                -- Crear tabla tipos_equipo si no existe
                CREATE TABLE IF NOT EXISTS tipos_equipo (
                    id_tipo SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    descripcion TEXT
                );

                -- Crear tabla estado_equipo si no existe
                CREATE TABLE IF NOT EXISTS estado_equipo (
                    id_estado SERIAL PRIMARY KEY,
                    nombre VARCHAR(50) NOT NULL,
                    descripcion TEXT
                );

                -- Crear tabla unidades_equipo si no existe
                CREATE TABLE IF NOT EXISTS unidades_equipo (
                    id_unidad SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    descripcion TEXT
                );

                -- Crear tabla equipos si no existe
                CREATE TABLE IF NOT EXISTS equipos (
                    id_equipo SERIAL PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    modelo VARCHAR(100),
                    numero_serie VARCHAR(100) UNIQUE,
                    fecha_adquisicion DATE,
                    id_tipo INTEGER REFERENCES tipos_equipo(id_tipo),
                    id_estado INTEGER REFERENCES estado_equipo(id_estado),
                    id_unidad INTEGER REFERENCES unidades_equipo(id_unidad),
                    observaciones TEXT
                );

                -- Crear tabla inventario si no existe
                CREATE TABLE IF NOT EXISTS inventario (
                    id SERIAL PRIMARY KEY,
                    ine VARCHAR(100) NOT NULL,
                    nne VARCHAR(100) NOT NULL,
                    cantidad INTEGER NOT NULL DEFAULT 0
                );

                -- Insertar datos básicos si las tablas están vacías
                INSERT INTO grado (abreviatura, gradocompleto) 
                SELECT 'GRL', 'General' 
                WHERE NOT EXISTS (SELECT 1 FROM grado WHERE abreviatura = 'GRL');

                INSERT INTO grado (abreviatura, gradocompleto) 
                SELECT 'COL', 'Coronel' 
                WHERE NOT EXISTS (SELECT 1 FROM grado WHERE abreviatura = 'COL');

                INSERT INTO armesp (abreviatura, armesp_completo, tipo) 
                SELECT 'INF', 'Infantería', 'Combate' 
                WHERE NOT EXISTS (SELECT 1 FROM armesp WHERE abreviatura = 'INF');

                INSERT INTO armesp (abreviatura, armesp_completo, tipo) 
                SELECT 'ART', 'Artillería', 'Combate' 
                WHERE NOT EXISTS (SELECT 1 FROM armesp WHERE abreviatura = 'ART');

                INSERT INTO tipos_equipo (nombre, descripcion) 
                SELECT 'Armamento', 'Equipos de armamento y defensa' 
                WHERE NOT EXISTS (SELECT 1 FROM tipos_equipo WHERE nombre = 'Armamento');

                INSERT INTO estado_equipo (nombre, descripcion) 
                SELECT 'Operativo', 'En condiciones de funcionamiento' 
                WHERE NOT EXISTS (SELECT 1 FROM estado_equipo WHERE nombre = 'Operativo');

                INSERT INTO unidades_equipo (nombre, descripcion) 
                SELECT 'Base Principal', 'Unidad base principal' 
                WHERE NOT EXISTS (SELECT 1 FROM unidades_equipo WHERE nombre = 'Base Principal');
            ";

            using (var cmd = new NpgsqlCommand(createTablesScript, connection))
            {
                Console.WriteLine("Creando tablas y datos básicos...");
                cmd.ExecuteNonQuery();
                Console.WriteLine("Tablas y datos básicos creados exitosamente.");
            }
        }
    }
}
