using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using Backend.Models.Dtos;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Cors;
using System.Threading.Tasks;
using System;
using System.Linq;

namespace Backend.Controllers
{
    [Route("api/equipos")]
    [ApiController]
    [EnableCors("AllowAll")]
    public class EquipoController : ControllerBase
    {
        private readonly RepoEquipo _repository;

        public EquipoController(RepoEquipo repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Obtiene una lista de todos los modelos de equipo.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetEquipos()
        {
            try
            {
                Console.WriteLine("[LOG] GetEquipos - Iniciando...");
                var equipos = await _repository.ObtenerEquiposAgrupados();
                Console.WriteLine($"[LOG] GetEquipos - Equipos obtenidos: {equipos.Count()}");
                
                // Log detallado de cada equipo
                foreach (var equipo in equipos)
                {
                    Console.WriteLine($"[LOG] Equipo ID {equipo.Id} - NNE: {equipo.NNE} - Unidades: {equipo.Unidades?.Count ?? 0}");
                    if (equipo.Unidades != null)
                    {
                        foreach (var unidad in equipo.Unidades)
                        {
                            Console.WriteLine($"[LOG]   - Unidad ID {unidad.Id} - Serie: {unidad.NroSerie} - Estado: {unidad.Estado?.Nombre}");
                        }
                    }
                }
                
                return Ok(equipos);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetEquipos: {ex.Message}");
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtiene el detalle de un equipo por número de serie.
        /// </summary>
        [HttpGet("nroSerie/{nroSerie}")]
        public async Task<IActionResult> GetEquipoPorNroSerie(string nroSerie)
        {
            try
            {
                var equipo = await _repository.ObtenerEquipoPorNroSerie(nroSerie);
                if (equipo == null)
                    return NotFound();

                return Ok(equipo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }



        /// <summary>
        /// Obtiene el resumen de inventario para un NNE, agrupando motivos fuera de servicio.
        /// </summary>
        [HttpGet("nne/{nne}/inventarioresumen")]
        public async Task<IActionResult> GetInventarioResumen(string nne)
        {
            try
            {
                var resumen = await _repository.ObtenerResumenInventarioPorNNE(nne);
                if (resumen == null)
                {
                    return NotFound("No se encontró un modelo de equipo con el NNE proporcionado.");
                }
                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtiene la información detallada de un modelo de equipo por su NNE, incluyendo unidades y especificaciones.
        /// </summary>
        [HttpGet("nne/{nne}")]
        public async Task<IActionResult> GetEquipoDetallado(string nne)
        {
            try
            {
                Console.WriteLine($"[DEBUG] Valor recibido en NNE: '{nne}'");
                var equipo = await _repository.ObtenerEquipoDetalladoPorNNE(nne);
                if (equipo == null)
                {
                    Console.WriteLine($"[DEBUG] No se encontró equipo con NNE: '{nne}'");
                    return NotFound("No se encontró un modelo de equipo con el NNE proporcionado.");
                }
                return Ok(equipo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DEBUG] Error interno: {ex.Message}");
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Realiza un alta completa: crea un nuevo modelo de equipo, sus especificaciones y su primera unidad física.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateEquipoCompleto([FromBody] EquipoAltaCompletaDto data)
        {
            Console.WriteLine("[LOG] CreateEquipoCompleto - Iniciando...");
            
            try
            {
                // Log del JSON recibido
                if (data != null)
                {
                    var json = System.Text.Json.JsonSerializer.Serialize(data, new System.Text.Json.JsonSerializerOptions 
                    { 
                        WriteIndented = true,
                        Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
                    });
                    Console.WriteLine($"[LOG] JSON recibido: {json}");
                }
                else
                {
                    Console.WriteLine("[LOG] Data es NULL!");
                    return BadRequest(new { error = "Los datos del equipo son requeridos." });
                }

                // Verificar ModelState primero
                if (!ModelState.IsValid)
                {
                    Console.WriteLine("[LOG] ModelState no es válido:");
                    var modelErrors = new Dictionary<string, List<string>>();
                    foreach (var error in ModelState)
                    {
                        var errorMessages = error.Value.Errors.Select(e => e.ErrorMessage).ToList();
                        modelErrors[error.Key] = errorMessages;
                        Console.WriteLine($"[LOG] Campo: {error.Key}, Errores: {string.Join(", ", errorMessages)}");
                    }
                    return BadRequest(new { 
                        error = "Errores de validación en los datos", 
                        errors = modelErrors,
                        message = "Los datos enviados no cumplen con los requisitos de validación."
                    });
                }

                // Log detallado de validaciones custom
                bool tieneNNE = !string.IsNullOrWhiteSpace(data.Nne);
                bool tieneNI = !string.IsNullOrWhiteSpace(data.NI);
                bool tieneNumeroSerie = data.PrimeraUnidad != null && !string.IsNullOrWhiteSpace(data.PrimeraUnidad.NumeroSerie);
                
                Console.WriteLine($"[LOG] Validaciones custom: tieneNNE={tieneNNE}, tieneNI={tieneNI}, tieneNumeroSerie={tieneNumeroSerie}");
                Console.WriteLine($"[LOG] NNE='{data.Nne}', NI='{data.NI}', PrimeraUnidad={(data.PrimeraUnidad != null ? "presente" : "null")}");
                if (data.PrimeraUnidad != null)
                {
                    Console.WriteLine($"[LOG] PrimeraUnidad.NumeroSerie='{data.PrimeraUnidad.NumeroSerie}'");
                }
                
                if (!tieneNNE && !tieneNI && !tieneNumeroSerie)
                {
                    Console.WriteLine("[LOG] BAD REQUEST - debe tener al menos uno de los identificadores");
                    return BadRequest(new { 
                        error = "Identificador requerido",
                        message = "Debe proporcionar al menos uno de los siguientes identificadores: NNE, NI o Número de Serie.",
                        details = new {
                            nne = data.Nne,
                            ni = data.NI,
                            numeroSerie = data.PrimeraUnidad?.NumeroSerie
                        }
                    });
                }

                Console.WriteLine("[LOG] Validaciones pasadas, llamando al repositorio...");
                var nuevoEquipo = await _repository.CrearEquipoCompleto(data);
                
                if (nuevoEquipo == null)
                {
                    Console.WriteLine("[LOG] Error: el repositorio devolvió null");
                    return StatusCode(500, new { 
                        error = "Error en la creación", 
                        message = "No se pudo crear el equipo. La operación en el repositorio falló." 
                    });
                }
                
                Console.WriteLine($"[LOG] Equipo creado exitosamente con ID: {nuevoEquipo.Id}");
                
                // Usar cualquier identificador disponible para la respuesta
                object routeValues;
                if (!string.IsNullOrWhiteSpace(nuevoEquipo.NNE))
                {
                    routeValues = new { nne = nuevoEquipo.NNE };
                }
                else if (!string.IsNullOrWhiteSpace(nuevoEquipo.NI))
                {
                    // Si no tenemos GetEquipoPorNI endpoint, usamos un approach más simple
                    return Ok(nuevoEquipo);
                }
                else
                {
                    // Como último recurso, solo devolver el objeto
                    return Ok(nuevoEquipo);
                }
                
                return CreatedAtAction(nameof(GetEquipoDetallado), routeValues, nuevoEquipo);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] Excepción en CreateEquipoCompleto: " + ex.ToString());
                return StatusCode(500, new { 
                    error = "Error interno del servidor",
                    message = ex.Message,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Añade una nueva unidad física a un modelo de equipo existente.
        /// </summary>
        [HttpPost("unidades")]
        public async Task<IActionResult> CreateUnidad([FromBody] UnidadEquipo nuevaUnidad)
        {
            Console.WriteLine("[LOG] CreateUnidad - Iniciando...");
            
            if (nuevaUnidad == null)
            {
                Console.WriteLine("[LOG] CreateUnidad - nuevaUnidad es null");
                return BadRequest("Los datos de la unidad son requeridos.");
            }

            Console.WriteLine($"[LOG] CreateUnidad - EquipoId: {nuevaUnidad.EquipoId}, NroSerie: {nuevaUnidad.NroSerie}, EstadoId: {nuevaUnidad.EstadoId}");

            if (nuevaUnidad.EquipoId <= 0)
            {
                Console.WriteLine("[LOG] CreateUnidad - EquipoId inválido");
                return BadRequest("El ID del equipo debe ser un valor positivo.");
            }

            try
            {
                var success = await _repository.InsertarUnidad(nuevaUnidad);
                Console.WriteLine($"[LOG] CreateUnidad - Resultado: {success}");
                
                if (success)
                {
                    return Ok(new { message = "Unidad creada exitosamente" });
                }
                return BadRequest("No se pudo crear la unidad.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] CreateUnidad: {ex.Message}");
                Console.WriteLine($"[ERROR] CreateUnidad Stack: {ex.StackTrace}");
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }














        /// <summary>
        /// Actualiza un equipo por su NNE.
        /// </summary>
        [HttpPut("nne/{nne}")]
        public async Task<IActionResult> ActualizarEquipoPorNNE(string nne, [FromBody] EquipoAltaCompletaDto data)
        {
            try
            {
                Console.WriteLine($"[LOG] ActualizarEquipoPorNNE - nne: {nne}");
                Console.WriteLine($"[LOG] ActualizarEquipoPorNNE - data: {System.Text.Json.JsonSerializer.Serialize(data)}");
                
                var actualizado = await _repository.ActualizarEquipoPorNNE(nne, data);
                if (!actualizado)
                {
                    return NotFound("No se encontró el equipo para actualizar.");
                }
                return Ok(new { message = "Equipo actualizado correctamente." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] ActualizarEquipoPorNNE: {ex.Message}");
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }


































        /// <summary>
        /// Actualiza un modelo de equipo por su número de serie.
        /// </summary>
        [HttpPut("nroSerie/{nroSerie}")]
        public async Task<IActionResult> ActualizarEquipoPorNumeroSerie(string nroSerie, [FromBody] EquipoAltaCompletaDto data)
        {
            try
            {
                Console.WriteLine($"[LOG] ActualizarEquipoPorNumeroSerie - nroSerie: {nroSerie}");
                Console.WriteLine($"[LOG] ActualizarEquipoPorNumeroSerie - data: {System.Text.Json.JsonSerializer.Serialize(data)}");
                
                var actualizado = await _repository.ActualizarEquipoPorNroSerie(nroSerie, data);
                if (!actualizado)
                {
                    return NotFound("No se encontró el modelo de equipo para actualizar.");
                }
                return Ok(new { message = "Equipo actualizado correctamente." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] ActualizarEquipoPorNumeroSerie: {ex.Message}");
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }


        /// <summary>
        /// Elimina un modelo de equipo y todas sus unidades y especificaciones por su NNE.
        /// </summary>
        [HttpDelete("nne/{nne}")]
        public async Task<IActionResult> DeleteEquipo(string nne)
        {
            try
            {
                var success = await _repository.EliminarEquipoPorNNE(nne);
                if (success)
                {
                    return Ok(new { message = "Modelo de equipo y todas sus unidades han sido eliminados." });
                }
                return NotFound("No se encontró el modelo de equipo para eliminar.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtiene el detalle de un equipo por su NI (Número de Identificación).
        /// </summary>
        [HttpGet("ni/{ni}")]
        public async Task<IActionResult> GetEquipoPorNI(string ni)
        {
            try
            {
                var equipo = await _repository.ObtenerEquipoPorNI(ni);
                if (equipo == null)
                {
                    return NotFound("No se encontró el equipo con el NI especificado.");
                }
                return Ok(equipo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Obtiene el resumen de inventario por NI (Número de Identificación).
        /// </summary>
        [HttpGet("ni/{ni}/inventarioresumen")]
        public async Task<IActionResult> GetInventarioResumenPorNI(string ni)
        {
            try
            {
                var resumen = await _repository.ObtenerResumenInventarioPorNI(ni);
                if (resumen == null)
                {
                    return NotFound("No se encontró el equipo con el NI especificado.");
                }
                return Ok(resumen);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Actualiza un modelo de equipo por su NI (Número de Identificación).
        /// </summary>
        [HttpPut("ni/{ni}")]
        public async Task<IActionResult> ActualizarEquipoPorNI(string ni, [FromBody] EquipoAltaCompletaDto data)
        {
            try
            {
                Console.WriteLine($"[LOG] ActualizarEquipoPorNI - ni: {ni}");
                Console.WriteLine($"[LOG] ActualizarEquipoPorNI - data: {System.Text.Json.JsonSerializer.Serialize(data)}");
                
                var actualizado = await _repository.ActualizarEquipoPorNI(ni, data);
                if (!actualizado)
                {
                    return NotFound("No se encontró el equipo para actualizar.");
                }
                return Ok(new { message = "Equipo actualizado correctamente." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] ActualizarEquipoPorNI: {ex.Message}");
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

        /// <summary>
        /// Elimina un modelo de equipo y todas sus unidades y especificaciones por su NI.
        /// </summary>
        [HttpDelete("ni/{ni}")]
        public async Task<IActionResult> DeleteEquipoPorNI(string ni)
        {
            try
            {
                var success = await _repository.EliminarEquipoPorNI(ni);
                if (success)
                {
                    return Ok(new { message = "Modelo de equipo y todas sus unidades han sido eliminados." });
                }
                return NotFound("No se encontró el modelo de equipo para eliminar.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error interno del servidor: {ex.Message}");
            }
        }

    }
}