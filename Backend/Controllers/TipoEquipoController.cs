using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/tipoequipo")]
    [ApiController]
    public class TipoEquipoController : ControllerBase
    {
        private readonly RepoEquipo _repository;

        public TipoEquipoController(RepoEquipo repository)
        {
            _repository = repository;
        }

        // GET: api/tipoequipo
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipoEquipo>>> GetTiposEquipo()
        {
            var tiposEquipo = await _repository.ObtenerTiposEquipo();
            return Ok(tiposEquipo);
        }
    }
}
