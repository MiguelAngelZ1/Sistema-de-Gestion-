using Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar CORS para permitir solicitudes desde cualquier origen.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});


// 2. Registrar servicios y repositorios existentes en el proyecto.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddSingleton<DB_Conexion>();

// Se registran los repositorios encontrados en la carpeta /Data.
builder.Services.AddScoped<RepoEquipo>();
builder.Services.AddScoped<RepoPersona>();
builder.Services.AddScoped<RepoArmEsp>();
builder.Services.AddScoped<RepoGrado>();
builder.Services.AddScoped<RepoInventario>();
builder.Services.AddScoped<RepoUnidadEquipo>();

var app = builder.Build();

// 3. Aplicar migraciones usando la clase MigrationHelper.
try
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        MigrationHelper.ApplyMigrations(connectionString);
        Console.WriteLine("Migraciones de base de datos aplicadas con éxito.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error durante la migración de la base de datos: {ex.Message}");
}

// 4. Configurar el pipeline de la aplicación.
app.UseCors("AllowAll");

// app.UseHttpsRedirection(); // Comentado para simplificar el desarrollo local.

app.UseAuthorization();

app.MapControllers();

// Configurar puerto para producción (Render usa la variable PORT)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");
