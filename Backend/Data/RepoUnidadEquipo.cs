using Backend.Models;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using System.Data;
using Dapper;
using System.Threading.Tasks;

namespace Backend.Data
{
    public class RepoUnidadEquipo : DB_Conexion
    {
        public RepoUnidadEquipo(IConfiguration configuration) : base(configuration) {}

        public async Task<IEnumerable<UnidadEquipo>> ObtenerUnidadesEquipo()
        {
            using (var connection = AbrirConexion())
            {
                var query = @"SELECT 
    id AS Id,
    id_equipo AS EquipoId,
    nro_serie AS NroSerie,
    id_estado AS EstadoId,
    id_persona AS PersonaId
FROM unidades_equipo";
                return await connection.QueryAsync<UnidadEquipo>(query);
            }
        }
        // Aquí puedes agregar métodos para crear, editar, eliminar unidades si lo necesitas
    }
}
