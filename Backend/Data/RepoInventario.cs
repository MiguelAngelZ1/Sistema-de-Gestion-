// Importamos una parte del proyecto que contiene los modelos de datos, como la clase "Persona"
using Backend.Models;

// Importamos una herramienta que permite trabajar con bases de datos MySQL en C#
using MySql.Data.MySqlClient;

// Definimos un espacio donde se agrupa este código (una forma de organizar todo lo relacionado al "Backend")
namespace Backend.Data
{
    // Creamos una clase llamada "RepoInventario" que hereda (usa) la clase "DB_Conexion"
    // Esto le permite conectarse a la base de datos usando el método AbrirConexion()
    public class RepoInventario : DB_Conexion
    {
        // Creamos un método que devuelve una lista de inventarios desde la base de datos
        public List<Inventario> ObtenerTodos()
        {
            // Creamos una lista vacía donde vamos a guardar los inventarios que traemos desde la base de datos
            List<Inventario> inventarios = new List<Inventario>();

            // Usamos la conexión a la base de datos (se abre automáticamente y se cierra al terminar)
            using (var connection = AbrirConexion())
            {
                // Creamos un comando SQL para seleccionar los datos de la tabla "inventario"
                using (var command = new MySqlCommand("SELECT id, ine, nne, cantidad FROM inventario", connection))
                {
                    // Ejecutamos el comando y leemos los resultados
                    using (var reader = command.ExecuteReader())
                    {
                        // Mientras haya datos por leer...
                        while (reader.Read())
                        {
                            // Creamos un nuevo objeto de tipo Inventario con los datos obtenidos
                            inventarios.Add(new Inventario
                            {
                                id = reader.GetInt32("id"),
                                ine = reader.GetString("ine"),
                                nne = reader.GetString("nne"),
                                cantidad = reader.GetInt32("cantidad")
                            });
                        }
                    }
                }
            }

            // Devolvemos la lista con todos los inventarios encontrados
            return inventarios;
        }

        // Metodo para insertar un nuevo inventario en la base de datos
        public bool Insertar(int id, string ine, string nne, int cantidad)
        {
            // Abrimos conexión con la base de datos
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para insertar los datos
                using (var command = new MySqlCommand("INSERT INTO inventario (id, ine, nne, cantidad) VALUES (@id, @ine, @nne, @cantidad)", connection))
                {
                    // Asociamos los valores a los parámetros definidos en el comando SQL
                    command.Parameters.AddWithValue("@id", id);
                    command.Parameters.AddWithValue("@ine", ine);
                    command.Parameters.AddWithValue("@nne", nne);
                    command.Parameters.AddWithValue("@cantidad", cantidad);

                    try
                    {
                        // Ejecutamos el comando y obtenemos cuántas filas fueron afectadas
                        int rowsAffected = command.ExecuteNonQuery();

                        // Si se insertó correctamente, retornamos true
                        return rowsAffected > 0;
                    }
                    catch (Exception ex)
                    {
                        // Si hubo error, imprimimos el error y retornamos false
                        Console.WriteLine($"Error al insertar el inventario: {ex.Message}");
                        return false;
                    }
                }
            }
        }

        // Metodo para modificar un inventario existente en la base de datos
        public bool Modificar(int id, string ine, string nne, int cantidad)
        {
            // Abrimos conexión
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para actualizar el registro que tenga el id indicado
                using (var command = new MySqlCommand("UPDATE inventario SET ine = @ine, nne = @nne, cantidad = @cantidad WHERE id = @id", connection))
                {
                    // Asociamos los valores a los parámetros
                    command.Parameters.AddWithValue("@id", id);
                    command.Parameters.AddWithValue("@ine", ine);
                    command.Parameters.AddWithValue("@nne", nne);
                    command.Parameters.AddWithValue("@cantidad", cantidad);

                    try
                    {
                        // Ejecutamos el comando y vemos cuántas filas se modificaron
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                    catch (MySqlException ex)
                    {
                        // Si hay error, lo mostramos y devolvemos falso
                        Console.WriteLine($"Error al modificar inventario: {ex.Message}");
                        return false;
                    }
                }
            }
        }

        // Metodo para eliminar un inventario de la base de datos
        public bool Eliminar(int id)
        {
            // Abrimos conexión
            using (var connection = AbrirConexion())
            {
                // Creamos el comando SQL para eliminar un inventario según su id
                using (var command = new MySqlCommand("DELETE FROM inventario WHERE id = @id", connection))
                {
                    // Asociamos el parámetro con el valor recibido
                    command.Parameters.AddWithValue("@id", id);

                    try
                    {
                        // Ejecutamos el comando y verificamos cuántas filas se eliminaron
                        int rowsAffected = command.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                    catch (MySqlException ex)
                    {
                        // Si hay error, lo mostramos y devolvemos falso
                        Console.WriteLine($"Error al eliminar inventario: {ex.Message}");
                        return false;
                    }
                }
            }
        }
    }
}