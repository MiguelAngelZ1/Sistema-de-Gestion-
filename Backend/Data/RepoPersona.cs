// Importamos una parte del proyecto que contiene los modelos de datos, como la clase "Persona"
using Backend.Models;

// Importamos una herramienta que permite trabajar con bases de datos PostgreSQL en C#
using Npgsql;

// Definimos un espacio donde se agrupa este código (una forma de organizar todo lo relacionado al "Backend")
namespace Backend.Data
{
    // Creamos una clase llamada "RepoGrado" que hereda (usa) la clase "DB_Conexion"
    // Esto le permite conectarse a la base de datos usando el método AbrirConexion()
    public class RepoPersona : DB_Conexion
    {
        // Creamos un método que devuelve una lista de grados desde la base de datos
        public List<Persona> Mostrar()
        {
            // Creamos una lista vacía donde vamos a guardar las personas
            List<Persona> personas = new List<Persona>();

            // Usamos la conexión a la base de datos (se abre automáticamente y se cierra al terminar)
            using (var connection = AbrirConexion())
            {
                // Consulta SQL que hace JOIN con las tablas de grado y arma_especialidad
                string query = @"
                    SELECT 
                        p.id_persona,
                        p.nombre,
                        p.apellido,
                        p.nro_dni AS dni, -- Usamos un alias para que coincida con el modelo
                        p.id_grado,
                        p.id_armesp,
                        g.abreviatura AS nombre_grado,
                        a.abreviatura AS nombre_armesp
                    FROM persona p
                    LEFT JOIN grado g ON p.id_grado = g.id_grado
                    LEFT JOIN armesp a ON p.id_armesp = a.id_armesp";

                using (var command = new NpgsqlCommand(query, connection))
                {
                    // Ejecutamos el comando y leemos los resultados
                    using (var reader = command.ExecuteReader())
                    {
                        // Mientras haya datos por leer...
                        while (reader.Read())
                        {
                            personas.Add(new Persona
                            {
                                Id = reader.GetInt32(reader.GetOrdinal("id_persona")),
                                Nombre = reader.IsDBNull(reader.GetOrdinal("nombre")) ? string.Empty : reader.GetString(reader.GetOrdinal("nombre")),
                                Apellido = reader.IsDBNull(reader.GetOrdinal("apellido")) ? string.Empty : reader.GetString(reader.GetOrdinal("apellido")),
                                dni = reader.IsDBNull(reader.GetOrdinal("dni")) ? string.Empty : reader.GetString(reader.GetOrdinal("dni")),
                                GradoId = reader.IsDBNull(reader.GetOrdinal("id_grado")) ? 0 : reader.GetInt32(reader.GetOrdinal("id_grado")),
                                ArmEspId = reader.IsDBNull(reader.GetOrdinal("id_armesp")) ? 0 : reader.GetInt32(reader.GetOrdinal("id_armesp")),
                                NombreGrado = reader.IsDBNull(reader.GetOrdinal("nombre_grado")) ? "-" : reader.GetString(reader.GetOrdinal("nombre_grado")),
                                NombreArmEsp = reader.IsDBNull(reader.GetOrdinal("nombre_armesp")) ? "-" : reader.GetString(reader.GetOrdinal("nombre_armesp"))
                            });
                        }
                    }
                }
            }

            // Devolvemos la lista con todos los grados encontrados
            return personas;
        }
    


// Método para insertar una nueva persona en la base de datos
        public bool Insertar(int id_grado, int id_armesp, string nombre, string apellido, string nro_dni)
        {
            // Abrimos conexión con la base de datos
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para insertar los datos sin especificar el id_persona
                using (var command = new NpgsqlCommand("INSERT INTO persona (id_grado, id_armesp, nombre, apellido, nro_dni) VALUES (@idGrado, @idArmesp, @nombre, @apellido, @nroDni); SELECT LAST_INSERT_ID();", connection))
                {
                    // Asociamos los valores a los parámetros definidos en el comando SQL
                    command.Parameters.AddWithValue("@idGrado", id_grado);
                    command.Parameters.AddWithValue("@idArmesp", id_armesp);
                    command.Parameters.AddWithValue("@nombre", nombre);
                    command.Parameters.AddWithValue("@apellido", apellido);
                    command.Parameters.AddWithValue("@nroDni", nro_dni);

                    try
                    {
                        // Ejecutamos el comando y obtenemos cuántas filas fueron afectadas
                        int rowsAffected = command.ExecuteNonQuery();

                        // Si se modificó al menos una fila, devolvemos verdadero (éxito)
                        return rowsAffected > 0;
                    }
                    catch (PostgresException ex)
                    {
                        // Si hubo un error, lo mostramos en consola y devolvemos falso
                        Console.WriteLine($"Error al modificar grado: {ex.Message}");
                        return false;
                    }
                }
            }
        }

        // Método para modificar una persona existente en la base de datos
        public bool Modificar(int idPersona, string nombre, string apellido, string dni, int? gradoId, int? armEspId)
        {
            // Abrimos conexión
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para actualizar el registro
                string query = @"
                    UPDATE persona 
                    SET 
                        nombre = @nombre, 
                        apellido = @apellido, 
                        nro_dni = @dni,
                        id_grado = @gradoId,
                        id_armesp = @armEspId
                    WHERE id_persona = @idPersona";

                using (var command = new NpgsqlCommand(query, connection))
                {
                    // Asociamos los valores a los parámetros
                    command.Parameters.AddWithValue("@idPersona", idPersona);
                    command.Parameters.AddWithValue("@nombre", nombre ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@apellido", apellido ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@dni", dni ?? (object)DBNull.Value);
                    
                    // Manejar gradoId (0 se convierte a NULL)
                    if (gradoId.HasValue && gradoId.Value > 0)
                        command.Parameters.AddWithValue("@gradoId", gradoId.Value);
                    else
                        command.Parameters.AddWithValue("@gradoId", DBNull.Value);
                        
                    // Manejar armEspId (0 se convierte a NULL)
                    if (armEspId.HasValue && armEspId.Value > 0)
                        command.Parameters.AddWithValue("@armEspId", armEspId.Value);
                    else
                        command.Parameters.AddWithValue("@armEspId", DBNull.Value);

                    try
                    {
                        // Ejecutamos el comando y vemos cuántas filas se modificaron
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                    catch (PostgresException ex)
                    {
                        // Si hay error, lo mostramos y devolvemos falso
                        Console.WriteLine($"=== Error de PostgreSQL al modificar persona ===");
                        Console.WriteLine($"Mensaje: {ex.Message}");
                        Console.WriteLine($"Código de error: {ex.SqlState}");
                        Console.WriteLine($"Origen: {ex.Source}");
                        Console.WriteLine($"Consulta SQL: {command.CommandText}");
                        Console.WriteLine("Parámetros:");
                        foreach (NpgsqlParameter p in command.Parameters)
                        {
                            Console.WriteLine($"  {p.ParameterName} = {p.Value} (Tipo: {p.DbType}, Tamaño: {p.Size})");
                        }
                        Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                        return false;
                    }
                }
            }
        }

        // Método para eliminar un grado de la base de datos
        public bool Eliminar(int idPersona)
        {
            // Abrimos conexión
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para eliminar un grado según su id
                using (var command = new NpgsqlCommand("DELETE FROM persona WHERE id_persona = @idPersona", connection))
                {
                    // Asociamos el parámetro con el valor recibido
                    command.Parameters.AddWithValue("@idPersona", idPersona);

                    try
                    {
                        // Ejecutamos el comando y verificamos cuántas filas se eliminaron
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                    catch (PostgresException ex)
                    {
                        // Si hay error, lo mostramos y devolvemos falso
                        Console.WriteLine($"Error al eliminar grado: {ex.Message}");
                        return false;
                    }
                }
            }
        }
        
        // Método para obtener la conexión a la base de datos
        public NpgsqlConnection ObtenerConexion()
        {
            var connection = AbrirConexion();
            // Aseguramos que la conexión esté abierta
            if (connection.State != System.Data.ConnectionState.Open)
            {
                connection.Open();
            }
            return connection;
        }

        // Método para verificar si existe un grado por su ID
        public bool ExisteGrado(int idGrado)
        {
            using (var connection = AbrirConexion())
            {
                string query = "SELECT COUNT(*) FROM grado WHERE id_grado = @idGrado";
                
                using (var command = new NpgsqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@idGrado", idGrado);
                    int count = Convert.ToInt32(command.ExecuteScalar());
                    return count > 0;
                }
            }
        }

        // Método para verificar si existe un arma/especialidad por su ID
        public bool ExisteArmEsp(int idArmEsp)
        {
            using (var connection = AbrirConexion())
            {
                string query = "SELECT COUNT(*) FROM armesp WHERE id_armesp = @idArmEsp";
                
                using (var command = new NpgsqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@idArmEsp", idArmEsp);
                    int count = Convert.ToInt32(command.ExecuteScalar());
                    return count > 0;
                }
            }
        }
    }
}
