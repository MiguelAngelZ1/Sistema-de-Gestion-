namespace Backend.Models
{
    public class EquipoAgrupado
    {
        public string Ine { get; set; } = string.Empty;
        public string NNE { get; set; } = string.Empty;
        public string NombreEquipo { get; set; } = string.Empty;
        public string NroSerie { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public bool EnServicio { get; set; }
    }
}
