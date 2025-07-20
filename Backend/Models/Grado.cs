using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("grado")] // Especifica el nombre de la tabla en la base de datos
    public class Grado
    {
        [Column("id_grado")] // Mapea a la columna id_grado
        public int Id { get; set; }

        [Required(ErrorMessage = "La abreviatura es requerida")]
        [StringLength(10, ErrorMessage = "La abreviatura no puede exceder los 10 caracteres")]
        [Column("abreviatura")] // Mapea a la columna abreviatura
        public string Descripcion { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre completo del grado es requerido")]
        [StringLength(100, ErrorMessage = "El nombre del grado no puede exceder los 100 caracteres")]
        [Column("gradocompleto")] // Mapea a la columna gradocompleto
        public string GradoCompleto { get; set; } = string.Empty;
    }
}