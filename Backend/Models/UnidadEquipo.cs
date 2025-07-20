namespace Backend.Models
{
    /// <summary>
    /// Representa una unidad física individual de un tipo de equipo.
    /// </summary>
    public class UnidadEquipo
    {
        public int Id { get; set; }
        public int EquipoId { get; set; } // FK al modelo de equipo (NNE)
        public string NroSerie { get; set; } = string.Empty;
        public int EstadoId { get; set; } // FK a EstadoEquipo
        public int? PersonaId { get; set; } // FK a la persona asignada

        // Propiedades de navegación
        public Equipo? Equipo { get; set; }
        public EstadoEquipo? Estado { get; set; }
        public Persona? Persona { get; set; }
    }
}
