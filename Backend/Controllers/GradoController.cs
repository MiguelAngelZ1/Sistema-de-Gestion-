using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
// Agrega estos using al inicio del archivo
using Npgsql;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace Backend.Controllers
{
    // Esta es una clase controladora de API para manejar operaciones relacionadas con "Grados"
    [Route("api/[controller]")]  // Establece la ruta base para los endpoints como "api/grado"
    [ApiController]              // Indica que esta clase es un controlador de API con comportamientos predeterminados
    public class GradoController : ControllerBase // Hereda de ControllerBase (base para controladores API)
    {
        // Instancia del repositorio para operaciones con Grados
        private readonly RepoGrado _repository = new RepoGrado();

        // Endpoint HTTP GET para obtener todos los grados
        [HttpGet] //Mostrar
        public ActionResult<IEnumerable<Grado>> Get()
        {
            // Retorna una respuesta HTTP 200 (OK) con la lista de grados obtenida del repositorio
            return Ok(_repository.Mostrar());
        }

        // Endpoint HTTP DELETE para eliminar un grado por su ID
        [HttpDelete("{id}")]
        public ActionResult Delete(int id)
        {
            try
            {
                // Usar la conexión configurada correctamente
                var dbConnection = new DB_Conexion();
                var connectionString = dbConnection.GetConnectionString();
                
                // Primero verificamos si existen personas asociadas a este grado
                using (var connection = new NpgsqlConnection(connectionString))
                {
                    connection.Open();
                    using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM persona WHERE id_grado = @id", connection))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        var result = cmd.ExecuteScalar();
                        var count = result != null ? Convert.ToInt64(result) : 0L;
                        
                        if (count > 0)
                        {
                            // Si hay personas asociadas, no permitir la eliminación
                            return BadRequest(new { 
                                success = false, 
                                message = $"No se puede eliminar el grado porque hay {count} persona(s) asociada(s). Primero debe reasignar o eliminar el personal asociado." 
                            });
                        }
                    }
                }

                // Si no hay personas asociadas, proceder con la eliminación del grado
                _repository.Eliminar(id);
                return Ok(new { success = true, message = "Grado eliminado correctamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error al eliminar: {ex.Message}" });
            }
        }

    // Endpoint HTTP POST para agregar un nuevo grado
    [HttpPost]
public ActionResult Post([FromBody] Grado nuevoGrado)
{
    try
    {
        if (nuevoGrado == null)
        {
            return BadRequest(new { success = false, message = "Los datos del grado son requeridos" });
        }

        // Normalizar los datos
        if (string.IsNullOrWhiteSpace(nuevoGrado.Descripcion) || 
            string.IsNullOrWhiteSpace(nuevoGrado.GradoCompleto))
        {
            return BadRequest(new { 
                success = false, 
                message = "Todos los campos son obligatorios" 
            });
        }

        // Insertar el nuevo grado
        bool resultado = _repository.Insertar(
            nuevoGrado.Descripcion.Trim(), 
            nuevoGrado.GradoCompleto.Trim()
        );

        if (resultado)
        {
            return Ok(new { 
                success = true, 
                message = "Grado creado exitosamente",
                data = new {
                    id = 0,  // La base de datos lo asignará
                    abreviatura = nuevoGrado.Descripcion,
                    gradocompleto = nuevoGrado.GradoCompleto  // Corregido: estaba como "gradocomleto"
                }
            });
        }
        
        return StatusCode(500, new { 
            success = false, 
            message = "No se pudo guardar el grado" 
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new { 
            success = false, 
            message = "Error interno del servidor",
            error = ex.Message
        });
    }
}

        // Endpoint HTTP PUT para modificar un grado existente
        [HttpPut("{id}")] //Modificar
        public ActionResult Put(int id, [FromBody] Grado grado)
        {
            // Intenta modificar el grado con los datos proporcionados
            bool resultado = _repository.Modificar(grado.Id, grado.Descripcion, grado.GradoCompleto);
            
            if(resultado)
            {
                // Si la modificación fue exitosa, retorna HTTP 200 (OK)
                return Ok("Grado modificado");
            }
            else
            {
                // Si hubo error, retorna HTTP 400 (Bad Request)
                return BadRequest("Error al midificar el grado.");
            }
        }
    }
}
