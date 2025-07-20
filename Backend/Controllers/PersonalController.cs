using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Backend.Models;
using Backend.Data;
using MySql.Data.MySqlClient;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Nodes;
using Newtonsoft.Json;

namespace Backend.Controllers
{
    // Esta es una clase controladora de API para manejar operaciones relacionadas con "Personal"
    [Route("api/[controller]")]  // Establece la ruta base para los endpoints como "api/personal"
    [ApiController]              // Indica que esta clase es un controlador de API con comportamientos predeterminados
    public class PersonalController : ControllerBase // Hereda de ControllerBase (base para controladores API)
    {
        // Instancia del repositorio para operaciones con Personal
        private readonly RepoPersona _repository = new RepoPersona();

        // Endpoint HTTP GET para obtener todos los personal
        [HttpGet] //Mostrar
        public ActionResult<IEnumerable<Persona>> Get()
        {
            try
            {
                var personal = _repository.Mostrar();
                Console.WriteLine($"Se encontraron {personal.Count} registros de personal");
                if (personal.Count > 0)
                {
                    Console.WriteLine("Primer registro:");
                    Console.WriteLine($"- Id: {personal[0].Id}");
                    Console.WriteLine($"- Nombre: {personal[0].Nombre}");
                    Console.WriteLine($"- Apellido: {personal[0].Apellido}");
                    Console.WriteLine($"- GradoId: {personal[0].GradoId}");
                    Console.WriteLine($"- NombreGrado: {personal[0].NombreGrado}");
                    Console.WriteLine($"- ArmEspId: {personal[0].ArmEspId}");
                    Console.WriteLine($"- NombreArmEsp: {personal[0].NombreArmEsp}");
                }
                return Ok(personal);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en el controlador: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Error interno del servidor al obtener el personal");
            }
        }

        // Endpoint HTTP GET para obtener un personal por su ID
        [HttpGet("{id}")] // Obtener por ID
        public ActionResult<Persona> Get(int id)
        {
            try
            {
                // Obtener la lista completa de personal
                var personal = _repository.Mostrar();
                // Buscar la persona por ID
                var persona = personal.FirstOrDefault(p => p.Id == id);
                
                if (persona == null)
                {
                    return NotFound($"No se encontró la persona con ID {id}");
                }
                
                // Asegurarse de que los nombres de las propiedades coincidan con lo que espera el frontend
                var resultado = new 
                {
                    id = persona.Id,
                    nombre = persona.Nombre,
                    apellido = persona.Apellido,
                    dni = persona.dni,
                    gradoId = persona.GradoId,
                    nombreGrado = persona.NombreGrado,
                    nombreGradoCompleto = persona.NombreGradoCompleto,
                    armEspId = persona.ArmEspId,
                    nombreArmEsp = persona.NombreArmEsp,
                    nombreArmEspCompleto = persona.NombreArmEspCompleto
                };
                
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al obtener la persona con ID {id}: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, "Error interno del servidor al obtener los datos de la persona");
            }
        }
        
        // Endpoint HTTP DELETE para eliminar un personal por su ID
        [HttpDelete("{id}")] //Eliminar
        public ActionResult Delete(int id)
        {
            try
            {
                Console.WriteLine($"=== INICIANDO ELIMINACIÓN DE PERSONA ID: {id} ===");
                
                // Primero verificar si la persona existe
                var personal = _repository.Mostrar();
                var persona = personal.FirstOrDefault(p => p.Id == id);
                
                if (persona == null)
                {
                    Console.WriteLine($"No se encontró la persona con ID: {id}");
                    return NotFound(new { success = false, message = "No se encontró la persona con el ID especificado." });
                }

                Console.WriteLine($"Persona encontrada: {persona.Nombre} {persona.Apellido}");

                // Usar el método del repositorio que ya funciona correctamente
                bool resultado = _repository.Eliminar(id);
                
                if (resultado)
                {
                    Console.WriteLine($"=== PERSONA ELIMINADA EXITOSAMENTE ===");
                    return Ok(new { success = true, message = "Personal eliminado correctamente" });
                }
                else
                {
                    Console.WriteLine($"=== ERROR: No se pudo eliminar la persona ===");
                    return StatusCode(500, new { success = false, message = "Error interno al intentar eliminar el personal" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== ERROR EN ELIMINACIÓN ===");
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = $"Error al eliminar el personal: {ex.Message}" });
            }
        }

        // Endpoint HTTP POST para agregar un nuevo personal
        [HttpPost] //Agregar
        public ActionResult Post([FromBody] Persona nuevoPersonal)
        {
            try
            {
                // Validar que los datos requeridos estén presentes
                if (nuevoPersonal == null || 
                    string.IsNullOrEmpty(nuevoPersonal.Nombre) || 
                    string.IsNullOrEmpty(nuevoPersonal.Apellido) ||
                    string.IsNullOrEmpty(nuevoPersonal.dni) ||
                    nuevoPersonal.GradoId <= 0 ||
                    nuevoPersonal.ArmEspId <= 0)
                {
                    return BadRequest("Todos los campos son obligatorios");
                }

                // Intenta insertar el nuevo personal (sin el ID)
                bool resultado = _repository.Insertar(
                    nuevoPersonal.GradoId, 
                    nuevoPersonal.ArmEspId, 
                    nuevoPersonal.Nombre, 
                    nuevoPersonal.Apellido, 
                    nuevoPersonal.dni);

                if (resultado)
                {
                    // Si la inserción fue exitosa, retorna HTTP 201 (Created)
                    return StatusCode(201, new { message = "Personal insertado correctamente" });
                }
                else
                {
                    // Si hubo error, retorna HTTP 400 (Bad Request)
                    return BadRequest("Error al insertar el personal");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error al insertar personal: {ex.Message}");
                return StatusCode(500, new { message = "Error interno del servidor al insertar el personal" });
            }
        }

        // Clase para el modelo de datos del formulario
        public class PersonaUpdateModel
        {
            [JsonPropertyName("id")]
            public int Id { get; set; }
            [JsonPropertyName("nombre")]
            public string Nombre { get; set; } = string.Empty;
            [JsonPropertyName("apellido")]
            public string Apellido { get; set; } = string.Empty;
            [JsonPropertyName("dni")]
            public string Dni { get; set; } = string.Empty;
            [JsonPropertyName("gradoId")]
            public int? GradoId { get; set; }
            [JsonPropertyName("armEspId")]
            public int? ArmEspId { get; set; }
        }

        // Endpoint HTTP PUT para modificar un personal existente
        [HttpPut("{id}")] //Modificar
        public ActionResult Put(int id, [FromBody] PersonaUpdateModel personaData)
        {
            try
            {
                Console.WriteLine($"=== Inicio de actualización de persona ID: {id} ===");
                
                // Verificar si personalData es nulo
                if (personaData == null)
                {
                    Console.WriteLine("Error: El cuerpo de la solicitud está vacío o es inválido");
                    return BadRequest(new { success = false, message = "El cuerpo de la solicitud no puede estar vacío" });
                }

                Console.WriteLine($"Datos recibidos: Id={personaData.Id}, Nombre={personaData.Nombre}, " +
                               $"Apellido={personaData.Apellido}, DNI={personaData.Dni}, " +
                               $"GradoId={personaData.GradoId}, ArmEspId={personaData.ArmEspId}");

                // Validar que el ID de la ruta coincida con el ID en el cuerpo
                if (id != personaData.Id)
                {
                    Console.WriteLine($"Error: ID de ruta ({id}) no coincide con ID en el cuerpo ({personaData.Id})");
                    return BadRequest(new { 
                        success = false, 
                        message = "El ID de la ruta no coincide con el ID en el cuerpo de la solicitud" 
                    });
                }

                // Validar datos requeridos
                if (string.IsNullOrEmpty(personaData.Nombre) || 
                    string.IsNullOrEmpty(personaData.Apellido) || 
                    string.IsNullOrEmpty(personaData.Dni))
                {
                    var missingFields = new List<string>();
                    if (string.IsNullOrEmpty(personaData.Nombre)) missingFields.Add("nombre");
                    if (string.IsNullOrEmpty(personaData.Apellido)) missingFields.Add("apellido");
                    if (string.IsNullOrEmpty(personaData.Dni)) missingFields.Add("dni");
                    
                    var errorMessage = $"Faltan campos requeridos: {string.Join(", ", missingFields)}";
                    Console.WriteLine(errorMessage);
                    
                    return BadRequest(new { 
                        success = false, 
                        message = errorMessage,
                        errors = missingFields.ToDictionary(f => f, f => $"El campo {f} es requerido")
                    });
                }

                // Validar que los IDs de Grado y ArmEsp existen si se proporcionaron
                if (personaData.GradoId.HasValue && personaData.GradoId > 0 && !_repository.ExisteGrado(personaData.GradoId.Value))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = $"El Grado con ID {personaData.GradoId} no existe" 
                    });
                }

                if (personaData.ArmEspId.HasValue && personaData.ArmEspId > 0 && !_repository.ExisteArmEsp(personaData.ArmEspId.Value))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = $"El Arma/Especialidad con ID {personaData.ArmEspId} no existe" 
                    });
                }

                // Intenta modificar el personal con los datos proporcionados
                bool resultado = _repository.Modificar(
                    id, 
                    personaData.Nombre, 
                    personaData.Apellido, 
                    personaData.Dni,
                    personaData.GradoId,
                    personaData.ArmEspId
                );

                if (resultado)
                {
                    Console.WriteLine("=== Personal modificado exitosamente ===");
                    return Ok(new { 
                        success = true, 
                        message = "Personal modificado correctamente" 
                    });
                }
                else
                {
                    Console.WriteLine("=== Error al modificar el personal ===");
                    return StatusCode(500, new { 
                        success = false, 
                        message = "Error interno al intentar modificar el personal" 
                    });
                }
            }
            catch (Newtonsoft.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Error al deserializar los datos JSON: {jsonEx.Message}");
                Console.WriteLine(jsonEx.StackTrace);
                return BadRequest(new { 
                    success = false, 
                    message = "Error en el formato de los datos",
                    details = jsonEx.Message 
                });
            }
            catch (MySqlException mySqlEx)
            {
                Console.WriteLine($"Error de base de datos al modificar personal: {mySqlEx.Message}");
                Console.WriteLine(mySqlEx.StackTrace);
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error de base de datos al modificar el personal",
                    errorCode = mySqlEx.Number,
                    details = mySqlEx.Message 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inesperado al modificar personal: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { 
                    success = false, 
                    message = "Error interno del servidor al modificar el personal",
                    details = ex.Message,
                    stackTrace = ex.StackTrace 
                });
            }
        }
    }
}