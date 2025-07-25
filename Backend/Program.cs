using Backend.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configurar CORS para permitir solicitudes desde el frontend.
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://sistema-control-frontend.onrender.com",
            "http://localhost:3000",
            "http://127.0.0.1:5500",
            "http://localhost:5500"
        )
        .AllowAnyMethod()
        .AllowAnyHeader()
        .AllowCredentials();
    });

    // Política más permisiva para desarrollo
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
    // Usar la misma lógica que DB_Conexion para obtener la cadena de conexión
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    string connectionString;
    
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        Console.WriteLine("Usando DATABASE_URL para migraciones...");
        connectionString = ConvertPostgreSQLUrlForMigrations(databaseUrl);
    }
    else
    {
        connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? "";
    }
    
    if (!string.IsNullOrEmpty(connectionString))
    {
        MigrationHelper.ApplyMigrations(connectionString);
        Console.WriteLine("Migraciones de base de datos aplicadas con éxito.");
    }
    else
    {
        Console.WriteLine("No se pudo obtener la cadena de conexión para migraciones.");
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Error durante la migración de la base de datos: {ex.Message}");
}

// 4. Configurar el pipeline de la aplicación.
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"IsDevelopment: {app.Environment.IsDevelopment()}");

// Middleware para logging de requests
app.Use(async (context, next) =>
{
    Console.WriteLine($"[{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}] Request: {context.Request.Method} {context.Request.Path}");
    Console.WriteLine($"Origin: {context.Request.Headers.Origin}");
    Console.WriteLine($"User-Agent: {context.Request.Headers.UserAgent}");
    
    await next();
    
    Console.WriteLine($"Response: {context.Response.StatusCode}");
});

// Usar política específica en producción, AllowAll en desarrollo
// TEMPORAL: Usar AllowAll en ambos entornos para debugging de CORS
var isDevelopment = app.Environment.IsDevelopment();
Console.WriteLine("TEMPORAL: Usando política CORS: AllowAll para debugging");
app.UseCors("AllowAll");

// app.UseHttpsRedirection(); // Comentado para simplificar el desarrollo local.

app.UseAuthorization();

// Health check endpoint
app.MapGet("/health", () => new { 
    status = "healthy", 
    timestamp = DateTime.UtcNow,
    environment = builder.Environment.EnvironmentName
});

app.MapControllers();

// Configurar puerto para producción (Render usa la variable PORT)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");

// Helper function para convertir URL PostgreSQL
static string ConvertPostgreSQLUrlForMigrations(string databaseUrl)
{
    try
    {
        var uri = new Uri(databaseUrl);
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.LocalPath.TrimStart('/');
        var userInfo = uri.UserInfo.Split(':');
        var username = userInfo[0];
        var password = userInfo.Length > 1 ? userInfo[1] : "";

        return $"Host={host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true;";
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error convirtiendo URL PostgreSQL en migraciones: {ex.Message}");
        throw;
    }
}
