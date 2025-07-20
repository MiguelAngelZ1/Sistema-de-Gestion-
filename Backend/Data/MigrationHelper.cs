using MySql.Data.MySqlClient;
using System;

namespace Backend.Data
{
    public static class MigrationHelper
    {
        public static void ApplyMigrations(string connectionString)
        {
            using (var connection = new MySqlConnection(connectionString))
            {
                try
                {
                    connection.Open();
                    Console.WriteLine("Conexión a la base de datos exitosa.");

                    // Verificar si la columna 'en_servicio' ya existe
                    var checkColumnQuery = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'db_app_cps' AND TABLE_NAME = 'equipos' AND COLUMN_NAME = 'en_servicio';";
                    using (var checkCmd = new MySqlCommand(checkColumnQuery, connection))
                    {
                        var columnExists = Convert.ToInt64(checkCmd.ExecuteScalar()) > 0;
                        if (columnExists)
                        {
                            Console.WriteLine("La columna 'en_servicio' ya existe. No se necesita migración.");
                            return;
                        }
                    }

                    // Si no existe, añadir la columna
                    Console.WriteLine("La columna 'en_servicio' no existe. Aplicando migración...");
                    var alterTableQuery = "ALTER TABLE equipos ADD COLUMN en_servicio BOOLEAN NOT NULL DEFAULT TRUE;";
                    using (var alterCmd = new MySqlCommand(alterTableQuery, connection))
                    {
                        alterCmd.ExecuteNonQuery();
                        Console.WriteLine("Migración completada: La columna 'en_servicio' ha sido añadida a la tabla 'equipos'.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Ocurrió un error durante la migración de la base de datos: {ex.Message}");
                }
            }
        }
    }
}
