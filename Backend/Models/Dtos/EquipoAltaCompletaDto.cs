using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Dtos
{
    public class EquipoAltaCompletaDto
    {
        public string? Ine { get; set; }
        public string? Nne { get; set; }
        public string? NI { get; set; }
        
        [Required(ErrorMessage = "El tipo de equipo es requerido")]
        public string TipoEquipoId { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "La marca es requerida")]
        public string Marca { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "El modelo es requerido")]
        public string Modelo { get; set; } = string.Empty;
        
        [Required(ErrorMessage = "La ubicación es requerida")]
        public string Ubicacion { get; set; } = string.Empty;
        
        public string? Observaciones { get; set; }
        public List<EspecificacionDto> Especificaciones { get; set; } = new List<EspecificacionDto>();
        public PrimeraUnidadDto? PrimeraUnidad { get; set; }
    }
}