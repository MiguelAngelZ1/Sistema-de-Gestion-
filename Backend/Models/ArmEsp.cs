using System;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class ArmEsp
    {
        [JsonPropertyName("id_armesp")]
        public int Id { get; set; }
        
        [JsonPropertyName("abreviatura")]
        public string Abreviatura { get; set; } = string.Empty;
        
        [JsonPropertyName("armesp_completo")]
        public string ArmEspCompleto { get; set; } = string.Empty;
        
        [JsonPropertyName("tipo")]
        public string Tipo { get; set; } = string.Empty;
    }
}