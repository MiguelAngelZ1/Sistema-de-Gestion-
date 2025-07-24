using System.Collections.Generic;

namespace Backend.Models.Dtos
{
    public class EquipoAltaCompletaDto
    {
        public string Ine { get; set; } = string.Empty;
        public string? Nne { get; set; } = string.Empty;
        public string NI { get; set; } = string.Empty;
        public string TipoEquipoId { get; set; } = string.Empty;
        public string Marca { get; set; } = string.Empty;
        public string Modelo { get; set; } = string.Empty;
        public string Ubicacion { get; set; } = string.Empty;
        public string Observaciones { get; set; } = string.Empty;
        public List<EspecificacionDto> Especificaciones { get; set; } = new List<EspecificacionDto>();
        public PrimeraUnidadDto? PrimeraUnidad { get; set; }
    }
}