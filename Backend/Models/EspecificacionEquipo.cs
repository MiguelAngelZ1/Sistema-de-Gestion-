namespace Backend.Models
{
    /// <summary>
    /// Almacena una característica técnica específica (clave-valor) para un tipo de equipo.
    /// </summary>
    public class EspecificacionEquipo
    {
        public int Id { get; set; }
        public int EquipoId { get; set; } // FK al modelo de equipo (NNE)
        public string Clave { get; set; } = string.Empty;
        public string Valor { get; set; } = string.Empty;

        // Propiedad de navegación
        public Equipo? Equipo { get; set; }
    }
}
