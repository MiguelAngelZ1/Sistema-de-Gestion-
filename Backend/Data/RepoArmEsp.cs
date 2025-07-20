// Importamos una parte del proyecto que contiene los modelos de datos, como la clase "ArmEsp"
using Backend.Models;

// Importamos una herramienta que permite trabajar con bases de datos PostgreSQL en C#
using Npgsql;

// Definimos un espacio donde se agrupa este código (una forma de organizar todo lo relacionado al "Backend")
namespace Backend.Data
{
    // Creamos una clase llamada "RepoArmEsp" que hereda (usa) la clase "DB_Conexion"
    // Esto le permite conectarse a la base de datos usando el método AbrirConexion()
    public class RepoArmEsp : DB_Conexion
    {
        // Creamos un método que devuelve una lista de grados desde la base de datos
        public List<ArmEsp> Mostrar()
        {
            // Creamos una lista vacía donde vamos a guardar los grados que traemos desde la base de datos
            List<ArmEsp> ArmEsp = new List<ArmEsp>();

            // Usamos la conexión a la base de datos (se abre automáticamente y se cierra al terminar)
            using (var connection = AbrirConexion())
            {
                // Creamos un comando SQL para seleccionar los datos de la tabla "armesp"
                using (var command = new NpgsqlCommand("SELECT id_armesp, abreviatura, armesp_completo, tipo FROM armesp", connection))
                {
                    // Ejecutamos el comando y leemos los resultados
                    using (var reader = command.ExecuteReader())
                    {
                        // Mientras haya datos por leer...
                        while (reader.Read())
                        {
                            // Creamos un nuevo objeto de tipo ArmEsp con los datos obtenidos
                            ArmEsp.Add(new ArmEsp
                            {
                                Id = reader.GetInt32(reader.GetOrdinal("id_armesp")),
                                Abreviatura = reader.GetString(reader.GetOrdinal("abreviatura")),
                                ArmEspCompleto = reader.GetString(reader.GetOrdinal("armesp_completo")),
                                Tipo = reader.GetString(reader.GetOrdinal("tipo"))
                            });
                        }
                    }
                }
            }

            // Devolvemos la lista con todos las ArmEsp encontradas
            return ArmEsp;
        }

        // Método para insertar un nuevo arma/especialidad en la base de datos (versión antigua, mantener para compatibilidad)
        public bool Insertars(int id_armesp, string abreviatura, string armesp_completo, string tipo = "Arma")
        {
            try
            {
                var nuevoId = InsertarRetornarId(abreviatura, armesp_completo, tipo);
                return nuevoId > 0;
            }
            catch
            {
                return false;
            }
        }

        // Método para insertar un nuevo arma/especialidad y retornar el ID generado
        public int InsertarRetornarId(string abreviatura, string armesp_completo, string tipo = "Arma")
        {
            // Validar parámetros
            if (string.IsNullOrEmpty(abreviatura) || string.IsNullOrEmpty(armesp_completo) || string.IsNullOrEmpty(tipo))
            {
                throw new ArgumentException("Todos los campos son obligatorios");
            }

            // Validar que el tipo sea válido
            if (tipo != "Arma" && tipo != "Especialidad")
            {
                throw new ArgumentException("El tipo debe ser 'Arma' o 'Especialidad'");
            }

            // Abrimos conexión con la base de datos
            using (var connection = AbrirConexion())
            {
                // Usamos una transacción para asegurar la integridad de los datos
                using (var transaction = connection.BeginTransaction())
                {
                    try
                    {
                        int nuevoId = 0;
                        
                        // Creamos el comando SQL para insertar los datos
                        // Incluimos SELECT LAST_INSERT_ID() para obtener el ID generado
                        string sql = @"
                            INSERT INTO armesp (abreviatura, armesp_completo, tipo) 
                            VALUES (@abreviatura, @armesp_completo, @tipo);
                            SELECT LAST_INSERT_ID();";

                        using (var command = new NpgsqlCommand(sql, connection, transaction))
                        {
                            // Asociamos los valores a los parámetros
                            command.Parameters.AddWithValue("@abreviatura", abreviatura.Trim());
                            command.Parameters.AddWithValue("@armesp_completo", armesp_completo.Trim());
                            command.Parameters.AddWithValue("@tipo", tipo.Trim());

                            // Ejecutamos el comando y obtenemos el ID generado
                            var result = command.ExecuteScalar();
                            if (result != null && result != DBNull.Value)
                            {
                                nuevoId = Convert.ToInt32(result);
                            }
                        }

                        // Si se insertó correctamente, confirmamos la transacción
                        if (nuevoId > 0)
                        {
                            transaction.Commit();
                            return nuevoId;
                        }
                        
                        // Si llegamos aquí, hubo un error
                        transaction.Rollback();
                        return 0;
                    }
                    catch (PostgresException ex)
                    {
                        // Si hubo un error, hacemos rollback y relanzamos la excepción
                        transaction.Rollback();
                        Console.WriteLine($"Error al insertar arma/especialidad: {ex.Message}");
                        Console.WriteLine(ex.StackTrace);
                        throw;
                    }
                }
            }
        }

        // Método para modificar un arma/especialidad existente en la base de datos
        public bool Modificar(int id_armesp, string abreviatura, string armesp_completo, string tipo = "Arma")
        {
            // Abrimos conexión
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para actualizar el registro que tenga el id indicado
                using (var command = new NpgsqlCommand("UPDATE armesp SET abreviatura = @abreviatura, armesp_completo = @armesp_completo, tipo = @tipo WHERE id_armesp = @idarmesp", connection))
                {
                    // Asociamos los valores a los parámetros
                    command.Parameters.AddWithValue("@idarmesp", id_armesp);
                    command.Parameters.AddWithValue("@abreviatura", abreviatura);
                    command.Parameters.AddWithValue("@armesp_completo", armesp_completo);

                    try
                    {
                        // Ejecutamos el comando y vemos cuántas filas se modificaron
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                    catch (PostgresException ex)
                    {
                        // Si hay error, lo mostramos y devolvemos falso
                        Console.WriteLine($"Error al modificar armesp: {ex.Message}");
                        return false;
                    }
                }
            }
        }

        // Método para eliminar un arma/especialidad de la base de datos
        public bool Eliminar(int id_armesp)
        {
            // Abrimos conexión
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para eliminar el registro con el id indicado
                using (var command = new NpgsqlCommand("DELETE FROM armesp WHERE id_armesp = @idarmesp", connection))
                {
                    // Asociamos el valor del id al parámetro
                    command.Parameters.AddWithValue("@idarmesp", id_armesp);

                    try
                    {
                        // Ejecutamos el comando y obtenemos cuántas filas fueron afectadas
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                    catch (PostgresException ex)
                    {
                        // Si hubo un error, lo mostramos en consola y devolvemos falso
                        Console.WriteLine($"Error al eliminar armesp: {ex.Message}");
                        return false;
                    }
                }
            }
        }

        // Método para obtener el último ID insertado
        public int ObtenerUltimoId()
        {
            using (var connection = AbrirConexion())
            {
                using (var command = new NpgsqlCommand("SELECT LAST_INSERT_ID()", connection))
                {
                    var result = command.ExecuteScalar();
                    if (result != null && result != DBNull.Value)
                    {
                        return Convert.ToInt32(result);
                    }
                    return 0;
                }
            }
        }

        // Método para obtener un arma/especialidad por su ID
        public ArmEsp ObtenerPorId(int id)
        {
            using (var connection = AbrirConexion())
            {
                using (var command = new NpgsqlCommand("SELECT id_armesp, abreviatura, armesp_completo, tipo FROM armesp WHERE id_armesp = @id", connection))
                {
                    command.Parameters.AddWithValue("@id", id);
                    
                    using (var reader = command.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            return new ArmEsp
                            {
                                Id = reader.GetInt32(reader.GetOrdinal("id_armesp")),
                                Abreviatura = reader.GetString(reader.GetOrdinal("abreviatura")),
                                ArmEspCompleto = reader.GetString(reader.GetOrdinal("armesp_completo")),
                                Tipo = reader.GetString(reader.GetOrdinal("tipo"))
                            };
                        }
                    }
                }
            }
            return null!;
        }
    }
}
