using System;

namespace Backend.Models
{
    public class Persona
    {
        [System.Text.Json.Serialization.JsonPropertyName("id_persona")]
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Domicilio { get; set; }
        public string Apellido { get; set; } = string.Empty;
        public string dni { get; set; } = string.Empty;
        public int GradoId { get; set; }
        public string? GradoNombre { get; set; }
        public string NombreGrado { get; set; } = string.Empty; // Abreviatura del grado
        public string NombreGradoCompleto { get; set; } = string.Empty; // Nombre completo del grado
        public int ArmEspId { get; set; }
        public string? ArmaEspNombre { get; set; }
        public string NombreArmEsp { get; set; } = string.Empty; // Abreviatura del arma/especialidad
        public string NombreArmEspCompleto { get; set; } = string.Empty; // Nombre completo del arma/especialidad
    }
}