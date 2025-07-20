// Usamos una librería (conjunto de herramientas) que nos permite trabajar con bases de datos PostgreSQL en C#
using Npgsql;
using Microsoft.Extensions.Configuration;
using System;

// Definimos un "espacio de nombres", una forma de organizar el código.
// Aquí se agrupa todo el código relacionado con los datos.
namespace Backend.Data
{
    // Creamos una clase (una especie de molde para crear objetos) que se llama "DB_Conexion"
    // Esta clase va a encargarse de conectarse a una base de datos.
    public class DB_Conexion
    {
        private readonly string _connectionString;

        public DB_Conexion(IConfiguration? configuration = null)
        {
            if (configuration != null)
            {
                // Priorizar variable de entorno DATABASE_URL (común en servicios de hosting)
                var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
                if (!string.IsNullOrEmpty(databaseUrl))
                {
                    Console.WriteLine($"Usando DATABASE_URL: {databaseUrl.Substring(0, Math.Min(50, databaseUrl.Length))}...");
                    _connectionString = ConvertPostgreSQLUrl(databaseUrl);
                }
                else
                {
                    Console.WriteLine("DATABASE_URL no encontrada, usando DefaultConnection");
                    _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "Host=localhost;Port=5432;Database=db_app_cps;Username=postgres;Password=;";
                }
            }
            else
            {
                // Cadena de conexión por defecto si no se proporciona configuración
                Console.WriteLine("Configuración nula, intentando usar DATABASE_URL directamente");
                var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
                if (!string.IsNullOrEmpty(databaseUrl))
                {
                    _connectionString = ConvertPostgreSQLUrl(databaseUrl);
                }
                else
                {
                    _connectionString = "Host=localhost;Port=5432;Database=db_app_cps;Username=postgres;Password=;";
                }
            }
        }

        private string ConvertPostgreSQLUrl(string databaseUrl)
        {
            try
            {
                // Analizar URL tipo: postgresql://user:password@host:port/database
                var uri = new Uri(databaseUrl);
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = uri.LocalPath.TrimStart('/');
                var userInfo = uri.UserInfo.Split(':');
                var username = userInfo[0];
                var password = userInfo.Length > 1 ? userInfo[1] : "";

                var connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
                Console.WriteLine($"Cadena convertida: Host={host};Port={port};Database={database};Username={username};Password=***;SSL Mode=Require;Trust Server Certificate=true;");
                return connectionString;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error convirtiendo URL PostgreSQL: {ex.Message}");
                Console.WriteLine($"URL original: {databaseUrl}");
                throw new ArgumentException($"Formato de URL PostgreSQL inválido: {ex.Message}", ex);
            }
        }

        public NpgsqlConnection AbrirConexion()
        {
            if (string.IsNullOrEmpty(_connectionString))
            {
                throw new InvalidOperationException("No se ha configurado la cadena de conexión");
            }

            try
            {
                Console.WriteLine("Intentando conectar a la base de datos PostgreSQL...");
                var connection = new NpgsqlConnection(_connectionString);
                connection.Open();
                Console.WriteLine("Conexión exitosa a la base de datos PostgreSQL");
                return connection;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al conectar a la base de datos: {ex.Message}");
                Console.WriteLine($"Cadena de conexión utilizada: {_connectionString.Substring(0, Math.Min(50, _connectionString.Length))}...");
                throw;
            }
        }
    }
}
