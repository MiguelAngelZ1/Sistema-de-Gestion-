// Usamos una librería (conjunto de herramientas) que nos permite trabajar con bases de datos MySQL en C#
using MySql.Data.MySqlClient;
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
                _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "server=localhost;database=db_app_cps;user=root;password=;";
            }
            else
            {
                // Cadena de conexión por defecto si no se proporciona configuración
                _connectionString = "server=localhost;database=db_app_cps;user=root;password=;";
            }
        }

        public MySqlConnection AbrirConexion()
        {
            if (string.IsNullOrEmpty(_connectionString))
            {
                throw new InvalidOperationException("No se ha configurado la cadena de conexión");
            }

            var connection = new MySqlConnection(_connectionString);
            connection.Open();
            Console.WriteLine("Conexión exitosa a la base de datos");
            return connection;
        }
    }
}
