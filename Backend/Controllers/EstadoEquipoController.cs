using Microsoft.AspNetCore.Mvc;
using Backend.Data;
using Backend.Models;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Cors;

namespace Backend.Controllers
{
    [Route("api/estadoequipo")]
    [ApiController]
    [EnableCors("AllowAll")]
    public class EstadoEquipoController : ControllerBase
    {
        private readonly RepoEquipo _repoEquipo;

        public EstadoEquipoController(RepoEquipo repoEquipo)
        {
            _repoEquipo = repoEquipo;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<EstadoEquipo>>> GetEstadosEquipo()
        {
            var estados = await _repoEquipo.ObtenerEstadosEquipo();
            return Ok(estados);
        }
    }
}
