using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using System;
using System.Collections.Generic;
using Npgsql;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArmEspController : ControllerBase
    {
        private readonly RepoArmEsp _repository = new RepoArmEsp();

        // GET: api/ArmEsp
        [HttpGet]
        public ActionResult<IEnumerable<ArmEsp>> Get()
        {
            try
            {
                var armEsp = _repository.Mostrar();
                return Ok(armEsp);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en el controlador de ArmEsp: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Error interno del servidor al obtener las armas/especialidades");
            }
        }

        // DELETE: api/ArmEsp/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                Console.WriteLine($"Solicitud para eliminar arma/especialidad con ID: {id}");
                
                // Validar que el ID sea válido
                if (id <= 0)
                {
                    Console.WriteLine($"Error: ID inválido: {id}");
                    return BadRequest(new { 
                        success = false,
                        message = "El ID proporcionado no es válido" 
                    });
                }

                // Usar la conexión configurada correctamente
                var dbConnection = new DB_Conexion();
                var connectionString = dbConnection.GetConnectionString();
                
                // Primero verificamos si existen personas asociadas a esta arma/especialidad
                using (var connection = new NpgsqlConnection(connectionString))
                {
                    connection.Open();
                    using (var cmd = new NpgsqlCommand("SELECT COUNT(*) FROM persona WHERE id_armesp = @id", connection))
                    {
                        cmd.Parameters.AddWithValue("@id", id);
                        var result = cmd.ExecuteScalar();
                        var count = result != null ? Convert.ToInt64(result) : 0L;
                        
                        if (count > 0)
                        {
                            // Si hay personas asociadas, no permitir la eliminación
                            return BadRequest(new { 
                                success = false, 
                                message = $"No se puede eliminar el arma/especialidad porque hay {count} persona(s) asociada(s). Primero debe reasignar o eliminar el personal asociado." 
                            });
                        }
                    }
                }

                // Si no hay personas asociadas, proceder con la eliminación
                bool eliminado = _repository.Eliminar(id);
                
                if (eliminado)
                {
                    Console.WriteLine($"Arma/Especialidad con ID {id} eliminada correctamente");
                    return Ok(new { 
                        success = true,
                        message = "Arma/Especialidad eliminada correctamente" 
                    });
                }
                else
                {
                    Console.WriteLine($"No se encontró el arma/especialidad con ID: {id}");
                    return NotFound(new { 
                        success = false,
                        message = "No se encontró el arma/especialidad especificada" 
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al eliminar arma/especialidad con ID {id}: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                
                return StatusCode(500, new { 
                    success = false,
                    message = "Error interno del servidor al eliminar el arma/especialidad",
                    error = ex.Message
                });
            }
        }

        // Endpoint HTTP POST para agregar un nuevo arma/especialidad
        [HttpPost]
        public ActionResult<ArmEsp> Post([FromBody] ArmEsp nuevoArmEsp)
        {
            try
            {
                Console.WriteLine("=== Datos recibidos en el controlador ===");
                Console.WriteLine($"Tipo de objeto: {nuevoArmEsp?.GetType().Name}");
                if (nuevoArmEsp != null)
                {
                    Console.WriteLine($"Id: {nuevoArmEsp.Id}");
                    Console.WriteLine($"Abreviatura: {nuevoArmEsp.Abreviatura}");
                    Console.WriteLine($"ArmEspCompleto: {nuevoArmEsp.ArmEspCompleto}");
                    Console.WriteLine($"Tipo: {nuevoArmEsp.Tipo}");
                }
                else
                {
                    Console.WriteLine("El objeto recibido es nulo");
                }

                // Validar que el objeto no sea nulo
                if (nuevoArmEsp == null)
                {
                    Console.WriteLine("Error: El objeto recibido es nulo");
                    return BadRequest(new { message = "Los datos del arma/especialidad no pueden estar vacíos" });
                }

                // Validar que los campos requeridos no estén vacíos
                if (string.IsNullOrEmpty(nuevoArmEsp.Abreviatura) || 
                    string.IsNullOrEmpty(nuevoArmEsp.ArmEspCompleto) || 
                    string.IsNullOrEmpty(nuevoArmEsp.Tipo))
                {
                    Console.WriteLine("Error: Faltan campos requeridos");
                    Console.WriteLine($"Abreviatura nula/vacía: {string.IsNullOrEmpty(nuevoArmEsp.Abreviatura)}");
                    Console.WriteLine($"ArmEspCompleto nulo/vacío: {string.IsNullOrEmpty(nuevoArmEsp.ArmEspCompleto)}");
                    Console.WriteLine($"Tipo nulo/vacío: {string.IsNullOrEmpty(nuevoArmEsp.Tipo)}");
                    
                    return BadRequest(new { 
                        message = "Todos los campos son obligatorios",
                        errors = new {
                            Abreviatura = string.IsNullOrEmpty(nuevoArmEsp.Abreviatura) ? "Requerido" : null,
                            ArmEspCompleto = string.IsNullOrEmpty(nuevoArmEsp.ArmEspCompleto) ? "Requerido" : null,
                            Tipo = string.IsNullOrEmpty(nuevoArmEsp.Tipo) ? "Requerido" : null
                        }
                    });
                }

                // Validar que el tipo sea 'Arma' o 'Especialidad'
                if (nuevoArmEsp.Tipo != "Arma" && nuevoArmEsp.Tipo != "Especialidad")
                {
                    Console.WriteLine($"Error: Tipo no válido: {nuevoArmEsp.Tipo}");
                    return BadRequest(new { message = "El tipo debe ser 'Arma' o 'Especialidad'" });
                }

                Console.WriteLine("Datos validados correctamente, intentando insertar...");

                // Intenta insertar el nuevo arma/especialidad
                int nuevoId = _repository.InsertarRetornarId(
                    nuevoArmEsp.Abreviatura, 
                    nuevoArmEsp.ArmEspCompleto, 
                    nuevoArmEsp.Tipo
                );

                if (nuevoId > 0)
                {
                    Console.WriteLine($"Registro insertado correctamente con ID: {nuevoId}");
                    // Buscar y devolver el registro recién insertado
                    var registroInsertado = _repository.ObtenerPorId(nuevoId);
                    if (registroInsertado != null)
                    {
                        return CreatedAtAction(nameof(Get), new { id = nuevoId }, registroInsertado);
                    }
                    
                    // Si no se puede obtener el registro completo, devolver al menos el ID
                    return Ok(new { id = nuevoId, message = "Arma/Especialidad insertada correctamente" });
                }
                
                Console.WriteLine("Error: No se pudo insertar el registro (nuevoId <= 0)");
                return StatusCode(500, new { message = "No se pudo insertar el registro" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al insertar arma/especialidad: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { 
                    message = "Error interno del servidor al insertar el arma/especialidad",
                    error = ex.Message
                });
            }
        }
    }
}