namespace Backend.Models
{
    /// <summary>
    /// Representa un TIPO o MODELO de equipo, identificado por su NNE.
    /// Las unidades físicas individuales se gestionan en la tabla UnidadEquipo.
    /// </summary>
    public class Equipo
    {
        public int Id { get; set; }
        public string NNE { get; set; } = string.Empty;
        public string Ine { get; set; } = string.Empty; // Mapea la columna 'ine'
        public char TipoEquipoId { get; set; }
        public string? TipoNombre { get; set; } // Para mostrar en el frontend
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Ubicacion { get; set; }
        public string Observaciones { get; set; } = string.Empty;

        // Propiedades para DTO, no mapeadas a la BD directamente
        public int CantidadUnidades { get; set; }
        public string? NroSerie { get; set; } // Para recibir/enviar número de serie desde/hacia el frontend
        public int? EstadoId { get; set; } // Para recibir estado desde el frontend
        public int? PersonaId { get; set; } // Para recibir persona responsable desde el frontend

        // Propiedades de navegación a las nuevas tablas
        public ICollection<UnidadEquipo> Unidades { get; set; } = new List<UnidadEquipo>();
        public ICollection<EspecificacionEquipo> Especificaciones { get; set; } = new List<EspecificacionEquipo>();
    }
}
