using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using Backend.Models.Dtos;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Cors;
using System.Threading.Tasks;
using System;

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
                var equipos = await _repository.ObtenerEquiposAgrupados();
                return Ok(equipos);
            }
            catch (Exception ex)
            {
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
            Console.WriteLine("[LOG] CreateEquipoCompleto - JSON recibido:");
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(data);
                Console.WriteLine(json);

                if (data == null || string.IsNullOrWhiteSpace(data.Nne) || data.PrimeraUnidad == null || string.IsNullOrWhiteSpace(data.PrimeraUnidad.NumeroSerie))
                {
                    Console.WriteLine("[LOG] BAD REQUEST por datos nulos/incompletos");
                    return BadRequest("Los datos para el alta completa del equipo son inválidos o están incompletos.");
                }

                var nuevoEquipo = await _repository.CrearEquipoCompleto(data);
                if (nuevoEquipo == null)
                {
                    Console.WriteLine("[LOG] Error al crear el equipo en la base de datos.");
                    return StatusCode(500, "No se pudo crear el equipo. La operación en el repositorio falló.");
                }
                return CreatedAtAction(nameof(GetEquipoDetallado), new { nne = nuevoEquipo.NNE }, nuevoEquipo);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] Excepción en CreateEquipoCompleto: " + ex.ToString());
                return StatusCode(500, "Error interno en el servidor: " + ex.Message);
            }
        }

        /// <summary>
        /// Añade una nueva unidad física a un modelo de equipo existente.
        /// </summary>
        [HttpPost("unidades")]
        public async Task<IActionResult> CreateUnidad([FromBody] UnidadEquipo nuevaUnidad)
        {
            if (nuevaUnidad == null || nuevaUnidad.EquipoId <= 0)
            {
                return BadRequest("Datos de unidad inválidos.");
            }

            try
            {
                var success = await _repository.InsertarUnidad(nuevaUnidad);
                if (success)
                {
                    return Ok(new { message = "Unidad creada exitosamente" });
                }
                return BadRequest("No se pudo crear la unidad.");
            }
            catch (Exception ex)
            {
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

    }
}