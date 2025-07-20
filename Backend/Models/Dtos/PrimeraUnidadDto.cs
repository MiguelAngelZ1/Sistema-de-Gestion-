namespace Backend.Models.Dtos
{
    public class PrimeraUnidadDto
    {
        public string NumeroSerie { get; set; } = string.Empty;
        public int EstadoId { get; set; }
        public int? IdPersona { get; set; }
    }
}