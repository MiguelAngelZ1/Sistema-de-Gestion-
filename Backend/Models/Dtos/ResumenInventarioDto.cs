using System.Text.Json.Serialization;

namespace Backend.Models.Dtos
{
    public class ResumenInventarioDto
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }
        
        [JsonPropertyName("enServicio")]
        public int EnServicio { get; set; }
        
        [JsonPropertyName("fueraDeServicio")]
        public int FueraDeServicio { get; set; }
        
        [JsonPropertyName("detalleFueraDeServicio")]
        public List<DetalleFueraDeServicioDto> DetalleFueraDeServicio { get; set; } = new List<DetalleFueraDeServicioDto>();
    }

    public class DetalleFueraDeServicioDto
    {
        [JsonPropertyName("estado")]
        public string Estado { get; set; } = string.Empty;
        
        [JsonPropertyName("cantidad")]
        public int Cantidad { get; set; }
    }
}
