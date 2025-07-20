using System;

namespace Backend.Models
{
    public class Inventario
    {
        public int id { get; set; }
        public string ine { get; set; } = string.Empty;
        public string nne { get; set; } = string.Empty;
        public int cantidad { get; set; }
    }
}
