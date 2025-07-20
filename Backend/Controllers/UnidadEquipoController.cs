using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/unidadesequipo")]
    [ApiController]
    public class UnidadEquipoController : ControllerBase
    {
        private readonly RepoUnidadEquipo _repository;

        public UnidadEquipoController(RepoUnidadEquipo repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UnidadEquipo>>> GetAll()
        {
            var unidades = await _repository.ObtenerUnidadesEquipo();
            return Ok(unidades);
        }
        // Métodos POST, PUT, DELETE pueden agregarse aquí según necesidad
    }
}
