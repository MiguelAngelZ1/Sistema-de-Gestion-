namespace Backend.Models
{
    /// <summary>
    /// Representa los posibles estados de una unidad de equipo (Ej: Operativo, En Mantenimiento).
    /// </summary>
    public class EstadoEquipo
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
    }
}
