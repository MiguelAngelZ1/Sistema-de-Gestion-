using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;

namespace Backend.Controllers
{
    // Esta es una clase controladora de API para manejar operaciones relacionadas con "Inventario"
    [Route("api/[controller]")]  // Establece la ruta base para los endpoints como "api/inventario"
    [ApiController]              // Indica que esta clase es un controlador de API con comportamientos predeterminados
    public class InventarioController : ControllerBase
    {
        // Instancia del repositorio para operaciones con Inventario
        private readonly RepoInventario _repository;
        private readonly ILogger<InventarioController> _logger;

        public InventarioController(RepoInventario repository, ILogger<InventarioController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet] //Obtener todos los registros
        public ActionResult<IEnumerable<Inventario>> Get()
        {
            var resultado = _repository.ObtenerTodos();
            _logger.LogInformation("Respuesta del repositorio: {0}", System.Text.Json.JsonSerializer.Serialize(resultado));
            return Ok(resultado);
        }

       // Endpoint HTTP DELETE para eliminar un inventario por su ID
        [HttpDelete("{id}")] //Eliminar
        public ActionResult Delete(int id)
        {
            // Llama al método Eliminar del repositorio
            _repository.Eliminar(id);
            // Retorna una respuesta HTTP 200 (OK) con mensaje de confirmación
            return Ok("Inventario eliminado correctamente.");
        }

        // Endpoint HTTP POST para agregar un nuevo inventario
        [HttpPost] //Agregar
        public ActionResult Post([FromBody] Inventario nuevoInventario)
        {
            // Intenta insertar el nuevo inventario usando los datos del cuerpo de la solicitud
            bool resultado = _repository.Insertar(nuevoInventario.id, nuevoInventario.ine, nuevoInventario.nne, nuevoInventario.cantidad);

            if (resultado)
            {
                // Si la inserción fue exitosa, retorna HTTP 200 (OK)
                return Ok("Inventario insertado.");
            }
            else
            {
                // Si hubo error, retorna HTTP 400 (Bad Request)
                return BadRequest("Error al insertar el inventario");
            }
        }

        // Endpoint HTTP PUT para modificar un inventario existente
        [HttpPut("{id}")] //Modificar
        public ActionResult Put(int id, [FromBody] Inventario inventario)
        {
            // Intenta modificar el inventario con los datos proporcionados
            bool resultado = _repository.Modificar(inventario.id, inventario.ine, inventario.nne, inventario.cantidad);
            
            if (resultado)
            {
                // Si la modificación fue exitosa, retorna HTTP 200 (OK)
                return Ok("Inventario modificado");
            }
            else
            {
                // Si hubo error, retorna HTTP 400 (Bad Request)
                return BadRequest("Error al modificar el inventario");
            }
        }
    }
}