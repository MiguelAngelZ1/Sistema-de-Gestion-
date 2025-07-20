// Script de conversión masiva de MySQL a PostgreSQL
// Este archivo contiene todos los patrones de reemplazo necesarios

using Npgsql;
using System;
using System.Collections.Generic;

namespace Backend.Utils
{
    public static class PostgreSQLConverter
    {
        public static readonly Dictionary<string, string> ConversionPatterns = new Dictionary<string, string>
        {
            // Imports
            { "using MySql.Data.MySqlClient;", "using Npgsql;" },
            
            // Conexiones
            { "MySqlConnection", "NpgsqlConnection" },
            { "MySqlCommand", "NpgsqlCommand" },
            { "MySqlException", "PostgresException" },
            
            // Métodos de acceso a datos con índices numéricos
            { "reader.GetInt32(\"", "reader.GetInt32(\"" },
            { "reader.GetString(\"", "reader.GetString(\"" },
            { "reader.GetDateTime(\"", "reader.GetDateTime(\"" },
            { "reader.GetBoolean(\"", "reader.GetBoolean(\"" },
            
            // Comentarios
            { "MySQL", "PostgreSQL" },
            { "bases de datos MySQL", "bases de datos PostgreSQL" }
        };
    }
}
