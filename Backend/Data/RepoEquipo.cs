using Backend.Models;
using Npgsql;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Backend.Models.Dtos;
using System.Linq;

namespace Backend.Data
{
    // DTO para el resumen de inventario


    public class RepoEquipo : DB_Conexion
    {
        public RepoEquipo(IConfiguration configuration) : base(configuration)
        {
        }

        /// <summary>
        /// Obtiene una lista de todos los modelos de equipos, contando cuántas unidades hay de cada uno y cuántas están en servicio.
        /// </summary>
        public async Task<IEnumerable<Equipo>> ObtenerEquiposAgrupados()
        {
            using (var connection = AbrirConexion())
            {
                // La consulta principal obtiene los datos de los modelos de equipo.
                var query = @"SELECT 
                                e.id, e.nne, e.ine AS Ine, e.ni AS NI, e.id_tipo_equipo as TipoEquipoId, te.nombre as TipoNombre, e.marca, e.modelo, e.ubicacion, e.observaciones, COUNT(u.id) as CantidadUnidades
                            FROM equipos e
                            LEFT JOIN tipos_equipo te ON e.id_tipo_equipo = te.id
                            LEFT JOIN unidades_equipo u ON e.id = u.id_equipo
                            GROUP BY e.id, e.nne, e.ine, e.ni, e.id_tipo_equipo, te.nombre, e.marca, e.modelo, e.ubicacion, e.observaciones
                            ORDER BY e.id DESC";

                var equipos = await connection.QueryAsync<Equipo>(query);

                // Por cada modelo, obtenemos sus unidades para contar los estados.
                foreach (var equipo in equipos)
                {
                    var unidadesQuery = @"SELECT u.*, u.nro_serie as NroSerie, e.id as Id, e.nombre as Nombre, p.id_persona as PersonaId, p.nombre as Nombre, p.apellido as Apellido, g.abreviatura as NombreGrado, a.abreviatura as NombreArmEsp
                                      FROM unidades_equipo u
                                      JOIN estado_equipo e ON u.id_estado = e.id
                                      LEFT JOIN persona p ON u.id_persona = p.id_persona
                                      LEFT JOIN grado g ON p.id_grado = g.id_grado
                                      LEFT JOIN armesp a ON p.id_armesp = a.id_armesp
                                      WHERE u.id_equipo = @EquipoId";
                    equipo.Unidades = (await connection.QueryAsync<UnidadEquipo, EstadoEquipo, Persona, UnidadEquipo>(
                        unidadesQuery,
                        (unidad, estado, persona) => {
                            unidad.Estado = estado;
                            unidad.Persona = persona;
                            return unidad;
                        },
                        new { EquipoId = equipo.Id },
                        splitOn: "Id,PersonaId"
                    )).ToList();
                }
                
                return equipos;
            }
        }

        /// <summary>
        /// Obtiene toda la información detallada de un modelo de equipo, incluyendo sus unidades y especificaciones.
        /// </summary>
        public async Task<Equipo> ObtenerEquipoDetalladoPorNNE(string nne)
        {
            using (var connection = AbrirConexion())
            {
                // 1. Obtener el equipo principal (modelo)
                var equipoQuery = @"SELECT e.id, e.nne, e.ine AS Ine, e.ni AS NI, e.id_tipo_equipo AS TipoEquipoId, te.nombre AS TipoNombre, e.marca, e.modelo, e.ubicacion, e.observaciones 
                                   FROM equipos e 
                                   JOIN tipos_equipo te ON e.id_tipo_equipo = te.id 
                                   WHERE e.nne = @NNE LIMIT 1";
                var equipo = await connection.QuerySingleOrDefaultAsync<Equipo>(equipoQuery, new { NNE = nne });

                if (equipo == null) return null!;

                // 2. Obtener las unidades asociadas
                var unidadesQuery = @"
                    SELECT 
                        u.id, u.id_equipo as EquipoId, u.nro_serie as NroSerie, u.id_estado as EstadoId, u.id_persona as PersonaId,
                        e.id as EstadoId_Estado, e.nombre as Nombre,
                        p.id_persona as PersonaId_Persona, p.nombre as Nombre, p.apellido as Apellido,
                        g.abreviatura as NombreGrado, a.abreviatura as NombreArmEsp
                    FROM unidades_equipo u
                    JOIN estado_equipo e ON u.id_estado = e.id
                    LEFT JOIN persona p ON u.id_persona = p.id_persona
                    LEFT JOIN grado g ON p.id_grado = g.id_grado
                    LEFT JOIN armesp a ON p.id_armesp = a.id_armesp
                    WHERE u.id_equipo = @EquipoId";
                equipo.Unidades = (await connection.QueryAsync<UnidadEquipo, EstadoEquipo, Persona, UnidadEquipo>(
                    unidadesQuery,
                    (unidad, estado, persona) => {
                        Console.WriteLine($"[DEBUG] Mapeo unidad - EstadoId: {unidad.EstadoId}, Estado.Id: {estado?.Id}, Estado.Nombre: {estado?.Nombre}");
                        Console.WriteLine($"[DEBUG] Mapeo unidad - PersonaId: {unidad.PersonaId}, Persona.Id: {persona?.Id}, Persona.Nombre: {persona?.Nombre}");
                        unidad.Estado = estado;
                        unidad.Persona = persona;
                        return unidad;
                    },
                    new { EquipoId = equipo.Id },
                    splitOn: "EstadoId_Estado,PersonaId_Persona"
                )).ToList();

                // 3. Obtener las especificaciones asociadas
                var especificacionesQuery = "SELECT * FROM especificaciones_equipo WHERE id_equipo = @EquipoId";
                equipo.Especificaciones = (await connection.QueryAsync<EspecificacionEquipo>(especificacionesQuery, new { EquipoId = equipo.Id })).ToList();

                return equipo;
            }
        }

        /// <summary>
        /// Obtiene una lista de todos los tipos de equipo.
        /// </summary>
        public async Task<IEnumerable<TipoEquipo>> ObtenerTiposEquipo()
        {
            using (var connection = AbrirConexion())
            {
                // Asumiendo que la tabla se llamará 'tipos_equipo'
                var query = "SELECT id, nombre FROM tipos_equipo ORDER BY nombre";
                return await connection.QueryAsync<TipoEquipo>(query);
            }
        }

        /// <summary>
        /// Obtiene una lista de todos los estados de equipo.
        /// </summary>
        public async Task<IEnumerable<EstadoEquipo>> ObtenerEstadosEquipo()
        {
            using (var connection = AbrirConexion())
            {
                var query = "SELECT id, nombre FROM estado_equipo ORDER BY id";
                return await connection.QueryAsync<EstadoEquipo>(query);
            }
        }

        /// <summary>
        /// Realiza un alta completa: crea un modelo, sus especificaciones y su primera unidad en una sola transacción.
        /// </summary>
        public async Task<Equipo> CrearEquipoCompleto(EquipoAltaCompletaDto data)
        {
            using (var connection = AbrirConexion())
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    Console.WriteLine($"[LOG] Iniciando CrearEquipoCompleto con NI: {data.NI}");
                    
                    // Log de todos los datos recibidos
                    Console.WriteLine($"[LOG] === DATOS RECIBIDOS ===");
                    Console.WriteLine($"[LOG] Ine: '{data.Ine}'");
                    Console.WriteLine($"[LOG] Nne: '{data.Nne}'");
                    Console.WriteLine($"[LOG] NI: '{data.NI}'");
                    Console.WriteLine($"[LOG] TipoEquipoId: '{data.TipoEquipoId}' (tipo: {data.TipoEquipoId?.GetType().Name})");
                    Console.WriteLine($"[LOG] Marca: '{data.Marca}'");
                    Console.WriteLine($"[LOG] Modelo: '{data.Modelo}'");
                    Console.WriteLine($"[LOG] Ubicacion: '{data.Ubicacion}'");
                    Console.WriteLine($"[LOG] Observaciones: '{data.Observaciones}'");
                    Console.WriteLine($"[LOG] PrimeraUnidad: {(data.PrimeraUnidad != null ? "SI" : "NO")}");
                    if (data.PrimeraUnidad != null)
                    {
                        Console.WriteLine($"[LOG] PrimeraUnidad.NumeroSerie: '{data.PrimeraUnidad.NumeroSerie}'");
                        Console.WriteLine($"[LOG] PrimeraUnidad.EstadoId: {data.PrimeraUnidad.EstadoId}");
                        Console.WriteLine($"[LOG] PrimeraUnidad.IdPersona: {data.PrimeraUnidad.IdPersona}");
                    }
                    Console.WriteLine($"[LOG] Especificaciones: {data.Especificaciones?.Count ?? 0} elementos");
                    Console.WriteLine($"[LOG] ========================");
                    
                    // Validaciones básicas
                    if (string.IsNullOrWhiteSpace(data.TipoEquipoId))
                    {
                        throw new ArgumentException("El tipo de equipo es obligatorio");
                    }
                    
                    // Validar que al menos uno de los identificadores esté presente
                    bool tieneNNE = !string.IsNullOrWhiteSpace(data.Nne);
                    bool tieneNI = !string.IsNullOrWhiteSpace(data.NI);
                    bool tieneNumeroSerie = data.PrimeraUnidad != null && !string.IsNullOrWhiteSpace(data.PrimeraUnidad.NumeroSerie);
                    
                    if (!tieneNNE && !tieneNI && !tieneNumeroSerie)
                    {
                        throw new ArgumentException("Debe proporcionar al menos uno de los siguientes identificadores: NNE, NI o Número de Serie");
                    }

                    // 1. Insertar el equipo (modelo) y obtener su ID
                    var equipoQuery = @"
                        INSERT INTO equipos (INE, NNE, NI, id_tipo_equipo, marca, modelo, ubicacion, observaciones) 
                        VALUES (@Ine, @Nne, @NI, @TipoEquipoId, @Marca, @Modelo, @Ubicacion, @Observaciones) 
                        RETURNING id;";
                        
                    Console.WriteLine($"[LOG] Insertando equipo con datos: INE={data.Ine}, NNE={data.Nne}, TipoEquipo={data.TipoEquipoId}");
                    var equipoId = await connection.ExecuteScalarAsync<int>(equipoQuery, data, transaction);
                    Console.WriteLine($"[LOG] Equipo insertado con ID: {equipoId}");

                    // 2. Insertar las especificaciones
                    if (data.Especificaciones != null && data.Especificaciones.Any())
                    {
                        Console.WriteLine($"[LOG] Insertando {data.Especificaciones.Count()} especificaciones");
                        foreach (var spec in data.Especificaciones)
                        {
                            var specQuery = "INSERT INTO especificaciones_equipo (id_equipo, clave, valor) VALUES (@EquipoId, @Clave, @Valor);";
                            await connection.ExecuteAsync(specQuery, new { EquipoId = equipoId, spec.Clave, spec.Valor }, transaction);
                            Console.WriteLine($"[LOG] Especificación insertada: {spec.Clave} = {spec.Valor}");
                        }
                    }

                    // 3. Insertar la primera unidad
                    if (data.PrimeraUnidad != null)
                    {
                        Console.WriteLine($"[LOG] Insertando primera unidad: Serie={data.PrimeraUnidad.NumeroSerie}, Estado={data.PrimeraUnidad.EstadoId}, Persona={data.PrimeraUnidad.IdPersona}");
                        var unidadQuery = @"INSERT INTO unidades_equipo (id_equipo, nro_serie, id_estado, id_persona) 
                                          VALUES (@EquipoId, @NumeroSerie, @EstadoId, @IdPersona);";
                        await connection.ExecuteAsync(unidadQuery, new
                        {
                            EquipoId = equipoId,
                            NumeroSerie = data.PrimeraUnidad.NumeroSerie,
                            EstadoId = data.PrimeraUnidad.EstadoId,
                            IdPersona = (data.PrimeraUnidad.IdPersona.HasValue && data.PrimeraUnidad.IdPersona.Value > 0) ? data.PrimeraUnidad.IdPersona.Value : (object)DBNull.Value
                        }, transaction);
                        Console.WriteLine("[LOG] Primera unidad insertada exitosamente");
                    }

                    transaction.Commit();
                    Console.WriteLine("[LOG] Transacción confirmada");

                    // 4. Devolver el objeto completo recién creado usando el identificador disponible
                    Console.WriteLine($"[LOG] Obteniendo equipo detallado recién creado");
                    
                    // Intentar obtener por NNE primero (si está disponible)
                    if (!string.IsNullOrWhiteSpace(data.Nne))
                    {
                        Console.WriteLine($"[LOG] Obteniendo por NNE: {data.Nne}");
                        return await ObtenerEquipoDetalladoPorNNE(data.Nne);
                    }
                    
                    // Si no hay NNE, intentar por NI
                    if (!string.IsNullOrWhiteSpace(data.NI))
                    {
                        Console.WriteLine($"[LOG] Obteniendo por NI: {data.NI}");
                        var equipoPorNI = await ObtenerEquipoPorNI(data.NI);
                        if (equipoPorNI != null) return equipoPorNI;
                    }
                    
                    // Si no hay NNE ni NI, intentar por número de serie
                    if (data.PrimeraUnidad != null && !string.IsNullOrWhiteSpace(data.PrimeraUnidad.NumeroSerie))
                    {
                        Console.WriteLine($"[LOG] Obteniendo por Número de Serie: {data.PrimeraUnidad.NumeroSerie}");
                        return await ObtenerEquipoPorNroSerie(data.PrimeraUnidad.NumeroSerie);
                    }
                    
                    // Como último recurso, obtener por ID (aunque esto no debería pasar)
                    Console.WriteLine($"[LOG] Obteniendo por ID como último recurso: {equipoId}");
                    return await ObtenerEquipoDetalladoPorNNE($"{equipoId}"); // Esto puede fallar, pero es mejor que null
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR] Error en CrearEquipoCompleto: {ex.Message}");
                    Console.WriteLine($"[ERROR] StackTrace: {ex.StackTrace}");
                    transaction.Rollback();
                    throw;
                }
            }
        }

        /// <summary>
        /// Inserta una nueva unidad para un equipo existente.
        /// </summary>
        public async Task<bool> InsertarUnidad(UnidadEquipo unidad)
        {
            // Log para depuración
            Console.WriteLine("[LOG] InsertarUnidad - Datos recibidos:");
            Console.WriteLine($"  EquipoId: {unidad.EquipoId}");
            Console.WriteLine($"  NroSerie: {unidad.NroSerie}");
            Console.WriteLine($"  EstadoId: {unidad.EstadoId}");
            Console.WriteLine($"  PersonaId: {(unidad.PersonaId.HasValue ? unidad.PersonaId.Value.ToString() : "null")}");

            using (var connection = AbrirConexion())
            {
                var query = "INSERT INTO unidades_equipo (id_equipo, nro_serie, id_estado, id_persona) VALUES (@EquipoId, @Nro_serie, @Id_estado, @Id_persona);";
                var result = await connection.ExecuteAsync(query, unidad);
                return result > 0;
            }
        }

        /// <summary>
        /// Elimina un modelo de equipo y todas sus unidades y especificaciones asociadas.
        /// </summary>
        public async Task<bool> EliminarEquipoPorNNE(string nne)
        {
            using (var connection = AbrirConexion())
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Obtener el ID del equipo
                    var equipoId = await connection.ExecuteScalarAsync<int?>("SELECT id FROM equipos WHERE nne = @NNE", new { NNE = nne }, transaction);

                    if (equipoId.HasValue)
                    {
                        // Eliminar especificaciones y unidades
                        await connection.ExecuteAsync("DELETE FROM especificaciones_equipo WHERE id_equipo = @EquipoId", new { EquipoId = equipoId.Value }, transaction);
                        await connection.ExecuteAsync("DELETE FROM unidades_equipo WHERE id_equipo = @EquipoId", new { EquipoId = equipoId.Value }, transaction);
                        
                        // Eliminar el equipo principal
                        await connection.ExecuteAsync("DELETE FROM equipos WHERE id = @EquipoId", new { EquipoId = equipoId.Value }, transaction);
                    }

                    transaction.Commit();
                    return true;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }
        /// <summary>
        /// Obtiene toda la información detallada de un equipo por número de serie de la primera unidad.
        /// </summary>
public async Task<Equipo> ObtenerEquipoPorNroSerie(string nroSerie)
{
    using (var connection = AbrirConexion())
    {
        // 1. Obtener la unidad y el equipo principal relacionado
        var unidadEquipoQuery = @"SELECT u.id_equipo FROM unidades_equipo u WHERE u.nro_serie = @NroSerie LIMIT 1";
        var equipoId = await connection.ExecuteScalarAsync<int?>(unidadEquipoQuery, new { NroSerie = nroSerie });
        if (!equipoId.HasValue) return null!;

        // 2. Obtener el equipo principal (modelo)
        var equipoQuery = @"SELECT e.id, e.nne, e.ine AS Ine, e.ni AS NI, e.id_tipo_equipo AS TipoEquipoId, te.nombre AS TipoNombre, e.marca, e.modelo, e.ubicacion, e.observaciones 
                            FROM equipos e 
                            JOIN tipos_equipo te ON e.id_tipo_equipo = te.id 
                            WHERE e.id = @EquipoId LIMIT 1";
        var equipo = await connection.QuerySingleOrDefaultAsync<Equipo>(equipoQuery, new { EquipoId = equipoId.Value });
        if (equipo == null) return null!;

        // 3. Obtener las unidades asociadas (con estado y persona)
        var unidadesQuery = @"
            SELECT 
                u.id, u.id_equipo as EquipoId, u.nro_serie as NroSerie, u.id_estado as EstadoId, u.id_persona as PersonaId,
                e.id as EstadoId_Estado, e.nombre as Nombre,
                p.id_persona as PersonaId_Persona, p.nombre as Nombre, p.apellido as Apellido,
                g.abreviatura as NombreGrado, a.abreviatura as NombreArmEsp
            FROM unidades_equipo u
            JOIN estado_equipo e ON u.id_estado = e.id
            LEFT JOIN persona p ON u.id_persona = p.id_persona
            LEFT JOIN grado g ON p.id_grado = g.id_grado
            LEFT JOIN armesp a ON p.id_armesp = a.id_armesp
            WHERE u.id_equipo = @EquipoId";
        equipo.Unidades = (await connection.QueryAsync<UnidadEquipo, EstadoEquipo, Persona, UnidadEquipo>(
            unidadesQuery,
            (unidad, estado, persona) => {
                Console.WriteLine($"[DEBUG-NroSerie] Mapeo unidad - EstadoId: {unidad.EstadoId}, Estado.Id: {estado?.Id}, Estado.Nombre: {estado?.Nombre}");
                Console.WriteLine($"[DEBUG-NroSerie] Mapeo unidad - PersonaId: {unidad.PersonaId}, Persona.Id: {persona?.Id}, Persona.Nombre: {persona?.Nombre}");
                unidad.Estado = estado;
                unidad.Persona = persona;
                return unidad;
            },
            new { EquipoId = equipoId.Value },
            splitOn: "EstadoId_Estado,PersonaId_Persona"
        )).ToList();

        // 4. Obtener las especificaciones asociadas
        var especificacionesQuery = "SELECT * FROM especificaciones_equipo WHERE id_equipo = @EquipoId";
        equipo.Especificaciones = (await connection.QueryAsync<EspecificacionEquipo>(especificacionesQuery, new { EquipoId = equipoId.Value })).ToList();

        return equipo;

    }
}

        /// <summary>
        /// Crea un equipo (modelo) y su primera unidad por nroSerie.
        /// </summary>
        public async Task<Equipo> CrearEquipoPorNroSerie(Equipo data)
        {
            using (var connection = AbrirConexion())
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // 1. Insertar el equipo (modelo) y obtener su ID
                    var equipoQuery = @"
                        INSERT INTO equipos (ine, nne, ni, id_tipo_equipo, marca, modelo, ubicacion, observaciones) 
                        VALUES (@Ine, @Nne, @NI, @TipoEquipoId, @Marca, @Modelo, @Ubicacion, @Observaciones) 
                        RETURNING id;";
                    var equipoId = await connection.ExecuteScalarAsync<int>(equipoQuery, data, transaction);

                    // 2. Insertar especificaciones
                    if (data.Especificaciones != null && data.Especificaciones.Count > 0)
                    {
                        foreach (var espec in data.Especificaciones)
                        {
                            await connection.ExecuteAsync(@"INSERT INTO especificaciones_equipo (id_equipo, clave, valor) VALUES (@EquipoId, @Clave, @Valor)",
                                new { EquipoId = equipoId, Clave = espec.Clave, Valor = espec.Valor }, transaction);
                        }
                    }

                    // 3. Insertar la primera unidad (usando nroSerie)
                    if (data.Unidades != null && data.Unidades.Count > 0)
                    {
                        var unidad = data.Unidades.First();
                        var unidadQuery = @"INSERT INTO unidades_equipo (id_equipo, nro_serie, id_estado, id_persona) VALUES (@EquipoId, @NroSerie, @EstadoId, @PersonaId);";
                        await connection.ExecuteAsync(unidadQuery, new {
                            EquipoId = equipoId,
                            NroSerie = unidad.NroSerie,
                            EstadoId = unidad.EstadoId,
                            PersonaId = (unidad.PersonaId.HasValue && unidad.PersonaId.Value > 0) ? unidad.PersonaId.Value : (object)DBNull.Value
                        }, transaction);
                    }

                    transaction.Commit();

                    // Devolver el equipo creado
                    return await ObtenerEquipoPorNroSerie(data.Unidades?.First()?.NroSerie ?? "");
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }

        /// <summary>
        /// Actualiza un equipo por número de serie.
        /// </summary>
        public async Task<bool> ActualizarEquipoPorNroSerie(string nroSerie, EquipoAltaCompletaDto data)
        {
            Console.WriteLine($"[LOG-Repo] ActualizarEquipoPorNroSerie llamado con nroSerie parámetro: '{nroSerie}', data.PrimeraUnidad?.NumeroSerie (nuevo): '{data.PrimeraUnidad?.NumeroSerie}'");
            using (var connection = AbrirConexion())
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Buscar el equipoId por nroSerie
                    var equipoId = await connection.ExecuteScalarAsync<int?>(
                        "SELECT id_equipo FROM unidades_equipo WHERE nro_serie = @NroSerie LIMIT 1", 
                        new { NroSerie = nroSerie }, transaction);
                    
                    if (!equipoId.HasValue) return false;

                    // Actualizar el equipo principal
                    var updateQuery = @"
                        UPDATE equipos SET 
                            ine = @Ine, 
                            nne = @Nne, 
                            ni = @NI,
                            id_tipo_equipo = @TipoEquipoId, 
                            marca = @Marca, 
                            modelo = @Modelo, 
                            ubicacion = @Ubicacion, 
                            observaciones = @Observaciones 
                        WHERE id = @Id";
                    
                    Console.WriteLine($"[LOG-Repo] Ejecutando UPDATE equipos para equipoId={equipoId.Value}");
                    var rowsAffected = await connection.ExecuteAsync(updateQuery, new {
                        Id = equipoId.Value,
                        Ine = data.Ine,
                        Nne = data.Nne,
                        NI = data.NI,
                        TipoEquipoId = data.TipoEquipoId,
                        Marca = data.Marca,
                        Modelo = data.Modelo,
                        Ubicacion = data.Ubicacion,
                        Observaciones = data.Observaciones
                    }, transaction);
                    Console.WriteLine($"[LOG-Repo] Filas afectadas en equipos: {rowsAffected}");

                    // Actualizar la unidad física si se proporciona un nuevo número de serie
                    if (data.PrimeraUnidad != null && !string.IsNullOrEmpty(data.PrimeraUnidad.NumeroSerie) && data.PrimeraUnidad.NumeroSerie != nroSerie)
                    {
                        Console.WriteLine($"[LOG-Repo] Ejecutando UPDATE unidades_equipo SET nro_serie = '{data.PrimeraUnidad.NumeroSerie}' WHERE nro_serie = '{nroSerie}'");
                        var rowsUnidad = await connection.ExecuteAsync(
                            "UPDATE unidades_equipo SET nro_serie = @NuevoNroSerie WHERE nro_serie = @NroSerieOriginal",
                            new { NuevoNroSerie = data.PrimeraUnidad.NumeroSerie, NroSerieOriginal = nroSerie }, transaction);
                        Console.WriteLine($"[LOG-Repo] Filas afectadas en unidades_equipo (nroSerie): {rowsUnidad}");
                    }

                    // Actualizar especificaciones si existen
                    Console.WriteLine($"[LOG-Repo-Especificaciones] data.Especificaciones != null: {data.Especificaciones != null}");
                    if (data.Especificaciones != null)
                    {
                        Console.WriteLine($"[LOG-Repo-Especificaciones] Cantidad de especificaciones: {data.Especificaciones.Count}");
                        foreach (var espec in data.Especificaciones)
                        {
                            Console.WriteLine($"[LOG-Repo-Especificaciones] - Clave: '{espec.Clave}', Valor: '{espec.Valor}'");
                        }
                    }
                    
                    if (data.Especificaciones != null && data.Especificaciones.Count > 0)
                    {
                        // Eliminar especificaciones existentes
                        var deletedRows = await connection.ExecuteAsync(
                            "DELETE FROM especificaciones_equipo WHERE id_equipo = @EquipoId", 
                            new { EquipoId = equipoId.Value }, transaction);
                        Console.WriteLine($"[LOG-Repo-Especificaciones] Especificaciones eliminadas: {deletedRows}");
                        
                        // Insertar nuevas especificaciones
                        foreach (var espec in data.Especificaciones)
                        {
                            var insertedRows = await connection.ExecuteAsync(
                                "INSERT INTO especificaciones_equipo (id_equipo, clave, valor) VALUES (@EquipoId, @Clave, @Valor)",
                                new { EquipoId = equipoId.Value, Clave = espec.Clave, Valor = espec.Valor }, transaction);
                            Console.WriteLine($"[LOG-Repo-Especificaciones] Especificación insertada: '{espec.Clave}' = '{espec.Valor}' (filas: {insertedRows})");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[LOG-Repo-Especificaciones] No hay especificaciones para actualizar");
                    }

                    // ACTUALIZAR RESPONSABLE Y ESTADO DE LA UNIDAD FÍSICA
                    if (data.PrimeraUnidad != null)
                    {
                        Console.WriteLine($"[LOG-Repo] PrimeraUnidad datos recibidos:");
                        Console.WriteLine($"[LOG-Repo] - EstadoId: {data.PrimeraUnidad.EstadoId}");
                        Console.WriteLine($"[LOG-Repo] - IdPersona: {data.PrimeraUnidad.IdPersona}");
                        Console.WriteLine($"[LOG-Repo] - IdPersona.HasValue: {data.PrimeraUnidad.IdPersona.HasValue}");
                        if (data.PrimeraUnidad.IdPersona.HasValue)
                            Console.WriteLine($"[LOG-Repo] - IdPersona.Value: {data.PrimeraUnidad.IdPersona.Value}");
                        Console.WriteLine($"[LOG-Repo] - NumeroSerie: {data.PrimeraUnidad.NumeroSerie}");
                        
                        var personaIdFinal = (data.PrimeraUnidad.IdPersona.HasValue && data.PrimeraUnidad.IdPersona.Value > 0) ? data.PrimeraUnidad.IdPersona.Value : (object)DBNull.Value;
                        Console.WriteLine($"[LOG-Repo] - PersonaId final para BD: {personaIdFinal}");
                        
                        var updateUnidad = @"
                            UPDATE unidades_equipo 
                            SET id_estado = @EstadoId, 
                                id_persona = @PersonaId 
                            WHERE nro_serie = @NroSerie";
                        var rowsUnidadUpdate = await connection.ExecuteAsync(updateUnidad, new {
                            EstadoId = data.PrimeraUnidad.EstadoId,
                            PersonaId = personaIdFinal,
                            NroSerie = data.PrimeraUnidad.NumeroSerie ?? nroSerie
                        }, transaction);
                        Console.WriteLine($"[LOG-Repo] Filas afectadas en unidades_equipo (responsable/estado): {rowsUnidadUpdate}");
                    }

                    transaction.Commit();
                    return rowsAffected > 0;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }

        /// <summary>
        /// Actualiza un equipo por NNE.
        /// </summary>
        public async Task<bool> ActualizarEquipoPorNNE(string nne, EquipoAltaCompletaDto data)
        {
            Console.WriteLine($"[LOG-Repo] ActualizarEquipoPorNNE llamado con nne: '{nne}'");
            using (var connection = AbrirConexion())
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Buscar el equipoId por NNE
                    var equipoId = await connection.ExecuteScalarAsync<int?>(
                        "SELECT id FROM equipos WHERE nne = @Nne LIMIT 1", 
                        new { Nne = nne }, transaction);
                    
                    if (!equipoId.HasValue) return false;

                    // Actualizar el equipo principal
                    var updateQuery = @"
                        UPDATE equipos SET 
                            ine = @Ine, 
                            nne = @Nne, 
                            ni = @NI,
                            id_tipo_equipo = @TipoEquipoId, 
                            marca = @Marca, 
                            modelo = @Modelo, 
                            ubicacion = @Ubicacion, 
                            observaciones = @Observaciones 
                        WHERE id = @Id";
                    
                    Console.WriteLine($"[LOG-Repo] Ejecutando UPDATE equipos para equipoId={equipoId.Value}");
                    var rowsAffected = await connection.ExecuteAsync(updateQuery, new {
                        Id = equipoId.Value,
                        Ine = data.Ine,
                        Nne = data.Nne,
                        NI = data.NI,
                        TipoEquipoId = data.TipoEquipoId,
                        Marca = data.Marca,
                        Modelo = data.Modelo,
                        Ubicacion = data.Ubicacion,
                        Observaciones = data.Observaciones
                    }, transaction);
                    Console.WriteLine($"[LOG-Repo] Filas afectadas en equipos: {rowsAffected}");

                    // Actualizar especificaciones si existen
                    Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] data.Especificaciones != null: {data.Especificaciones != null}");
                    if (data.Especificaciones != null)
                    {
                        Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] Cantidad de especificaciones: {data.Especificaciones.Count}");
                        foreach (var espec in data.Especificaciones)
                        {
                            Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] - Clave: '{espec.Clave}', Valor: '{espec.Valor}'");
                        }
                    }
                    
                    if (data.Especificaciones != null && data.Especificaciones.Count > 0)
                    {
                        // Eliminar especificaciones existentes
                        var deletedRows = await connection.ExecuteAsync(
                            "DELETE FROM especificaciones_equipo WHERE id_equipo = @EquipoId", 
                            new { EquipoId = equipoId.Value }, transaction);
                        Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] Especificaciones eliminadas: {deletedRows}");
                        
                        // Insertar nuevas especificaciones
                        foreach (var espec in data.Especificaciones)
                        {
                            Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] Insertando: Clave='{espec.Clave}', Valor='{espec.Valor}', EquipoId={equipoId.Value}");
                            var insertedRows = await connection.ExecuteAsync(
                                "INSERT INTO especificaciones_equipo (id_equipo, clave, valor) VALUES (@EquipoId, @Clave, @Valor)",
                                new { EquipoId = equipoId.Value, Clave = espec.Clave, Valor = espec.Valor }, transaction);
                            Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] Especificación insertada: '{espec.Clave}' = '{espec.Valor}' (filas: {insertedRows})");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[LOG-Repo-NNE-Especificaciones] No hay especificaciones para actualizar o la lista está vacía");
                    }

                    // ACTUALIZAR RESPONSABLE Y ESTADO DE LA PRIMERA UNIDAD DEL EQUIPO
                    if (data.PrimeraUnidad != null)
                    {
                        Console.WriteLine($"[LOG-Repo-NNE] PrimeraUnidad datos recibidos:");
                        Console.WriteLine($"[LOG-Repo-NNE] - EstadoId: {data.PrimeraUnidad.EstadoId}");
                        Console.WriteLine($"[LOG-Repo-NNE] - IdPersona: {data.PrimeraUnidad.IdPersona}");
                        Console.WriteLine($"[LOG-Repo-NNE] - NumeroSerie: {data.PrimeraUnidad.NumeroSerie}");
                        
                        var personaIdFinal = (data.PrimeraUnidad.IdPersona.HasValue && data.PrimeraUnidad.IdPersona.Value > 0) ? data.PrimeraUnidad.IdPersona.Value : (object)DBNull.Value;
                        Console.WriteLine($"[LOG-Repo-NNE] - PersonaId final para BD: {personaIdFinal}");
                        
                        // Actualizar la primera unidad del equipo
                        var updateUnidad = @"
                            UPDATE unidades_equipo 
                            SET id_estado = @EstadoId, 
                                id_persona = @PersonaId 
                            WHERE id IN (
                                SELECT id FROM unidades_equipo 
                                WHERE id_equipo = @EquipoId 
                                ORDER BY id 
                                LIMIT 1
                            )";
                        var rowsUnidadUpdate = await connection.ExecuteAsync(updateUnidad, new {
                            EstadoId = data.PrimeraUnidad.EstadoId,
                            PersonaId = personaIdFinal,
                            EquipoId = equipoId.Value
                        }, transaction);
                        Console.WriteLine($"[LOG-Repo-NNE] Filas afectadas en unidades_equipo (responsable/estado): {rowsUnidadUpdate}");
                    }

                    transaction.Commit();
                    return rowsAffected > 0;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }

        /// <summary>
        /// Elimina un equipo por número de serie.
        /// </summary>
        public async Task<bool> EliminarEquipoPorNroSerie(string nroSerie)
        {
            using (var connection = AbrirConexion())
            using (var transaction = connection.BeginTransaction())
            {
                try
                {
                    // Buscar el equipoId por nroSerie
                    var equipoId = await connection.ExecuteScalarAsync<int?>(
                        "SELECT id_equipo FROM unidades_equipo WHERE nro_serie = @NroSerie LIMIT 1", 
                        new { NroSerie = nroSerie }, transaction);
                    
                    if (!equipoId.HasValue) return false;

                    // Eliminar especificaciones del equipo
                    await connection.ExecuteAsync(
                        "DELETE FROM especificaciones_equipo WHERE id_equipo = @EquipoId", 
                        new { EquipoId = equipoId.Value }, transaction);
                    
                    // Eliminar la unidad específica
                    await connection.ExecuteAsync(
                        "DELETE FROM unidades_equipo WHERE nro_serie = @NroSerie", 
                        new { NroSerie = nroSerie }, transaction);
                    
                    // Verificar si quedan otras unidades del mismo equipo
                    var otrasUnidades = await connection.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM unidades_equipo WHERE id_equipo = @EquipoId", 
                        new { EquipoId = equipoId.Value }, transaction);
                    
                    // Si no quedan otras unidades, eliminar el modelo de equipo
                    if (otrasUnidades == 0)
                    {
                        await connection.ExecuteAsync(
                            "DELETE FROM equipos WHERE id = @EquipoId", 
                            new { EquipoId = equipoId.Value }, transaction);
                    }

                    transaction.Commit();
                    return true;
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
        }

        /// <summary>
        /// Obtiene el resumen de inventario para un NNE específico.
        /// E/S = En Servicio, F/S = Fuera de Servicio, otros estados = Fuera de Servicio con motivo específico
        /// </summary>
        public async Task<ResumenInventarioDto?> ObtenerResumenInventarioPorNNE(string nne)
        {
            using (var connection = AbrirConexion())
            {
                try
                {
                    Console.WriteLine($"[DEBUG-Inventario] Iniciando consulta para NNE: {nne}");
                    
                    // Verificar que el NNE existe
                    var equipoExiste = await connection.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM equipos WHERE nne = @Nne",
                        new { Nne = nne });
                    
                    Console.WriteLine($"[DEBUG-Inventario] Equipos encontrados con NNE {nne}: {equipoExiste}");
                    
                    if (equipoExiste == 0)
                    {
                        Console.WriteLine($"[DEBUG-Inventario] No se encontró equipo con NNE: {nne}");
                        return null;
                    }

                    // Obtener todas las unidades con sus estados para este NNE
                    var query = @"
                        SELECT 
                            CAST(COUNT(*) AS INTEGER) as total,
                            e.nombre as estadonombre
                        FROM unidades_equipo u
                        INNER JOIN equipos eq ON u.id_equipo = eq.id
                        INNER JOIN estado_equipo e ON u.id_estado = e.id
                        WHERE eq.nne = @Nne
                        GROUP BY u.id_estado, e.nombre";

                    Console.WriteLine($"[DEBUG-Inventario] Ejecutando query de estadísticas");
                    var estadisticas = await connection.QueryAsync<dynamic>(query, new { Nne = nne });
                    Console.WriteLine($"[DEBUG-Inventario] Estadísticas obtenidas: {estadisticas?.Count() ?? 0} registros");
                    
                    var resumen = new ResumenInventarioDto();
                    var detalleFueraServicio = new List<DetalleFueraDeServicioDto>();

                    if (estadisticas == null)
                    {
                        Console.WriteLine($"[ERROR-Inventario] estadisticas es null");
                        return resumen; // Devolver resumen vacío pero válido
                    }

                    foreach (var stat in estadisticas)
                    {
                        try
                        {
                            Console.WriteLine($"[DEBUG-Inventario] Procesando stat: {stat}");
                            
                            if (stat == null)
                            {
                                Console.WriteLine($"[WARNING-Inventario] stat es null, saltando");
                                continue;
                            }
                            
                            // Verificar que estadonombre no sea null
                            if (stat.estadonombre == null)
                            {
                                Console.WriteLine($"[WARNING-Inventario] estadonombre es null, saltando");
                                continue;
                            }
                            
                            var estadoNombre = (string)stat.estadonombre;
                            
                            // Con CAST(COUNT(*) AS INTEGER) deberíamos recibir siempre un int
                            var cantidad = Convert.ToInt32(stat.total);
                            
                            Console.WriteLine($"[DEBUG-Inventario] Estado: '{estadoNombre}', Cantidad: {cantidad}");
                            
                            // Aplicar la lógica de clasificación según el requerimiento
                            // Estados reales: E/S, F/S, BAJA, MANT, CAMBIO ELON, EXT
                            if (estadoNombre.StartsWith("E/S"))
                            {
                                // Solo "E/S (En Servicio)" se considera "En Servicio"
                                resumen.EnServicio += cantidad;
                            }
                            else if (estadoNombre.StartsWith("F/S"))
                            {
                                // "F/S (Fuera de Servicio)" se muestra como "Fuera de Servicio" sin motivo específico
                                resumen.FueraDeServicio += cantidad;
                                detalleFueraServicio.Add(new DetalleFueraDeServicioDto
                                {
                                    Estado = "F/S (Fuera de Servicio)",
                                    Cantidad = cantidad
                                });
                            }
                            else
                            {
                                // Cualquier otro estado (BAJA, MANT, CAMBIO ELON, EXT, etc.) 
                                // se considera "Fuera de Servicio" pero se muestra el motivo real
                                resumen.FueraDeServicio += cantidad;
                                detalleFueraServicio.Add(new DetalleFueraDeServicioDto
                                {
                                    Estado = estadoNombre,
                                    Cantidad = cantidad
                                });
                            }
                            
                            resumen.Total += cantidad;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[ERROR-Inventario] Error procesando estadística: {ex.Message}");
                            // Continuar con la siguiente estadística
                        }
                    }

                    resumen.DetalleFueraDeServicio = detalleFueraServicio;
                    
                    Console.WriteLine($"[DEBUG-Inventario] NNE: {nne}");
                    Console.WriteLine($"[DEBUG-Inventario] Total: {resumen.Total}");
                    Console.WriteLine($"[DEBUG-Inventario] En Servicio: {resumen.EnServicio}");
                    Console.WriteLine($"[DEBUG-Inventario] Fuera de Servicio: {resumen.FueraDeServicio}");
                    Console.WriteLine($"[DEBUG-Inventario] Detalles: {string.Join(", ", detalleFueraServicio.Select(d => $"{d.Estado}:{d.Cantidad}"))}");

                    return resumen;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR-Inventario] Error al obtener resumen para NNE {nne}: {ex.Message}");
                    throw;
                }
            }
        }

        /// <summary>
        /// Obtiene un equipo detallado por su NI (Número de Identificación).
        /// </summary>
        public async Task<Equipo?> ObtenerEquipoPorNI(string ni)
        {
            using (var connection = new NpgsqlConnection(GetConnectionString()))
            {
                await connection.OpenAsync();
                
                var equipoQuery = @"SELECT e.id, e.nne, e.ine AS Ine, e.ni AS NI, e.id_tipo_equipo AS TipoEquipoId, te.nombre AS TipoNombre, e.marca, e.modelo, e.ubicacion, e.observaciones 
                                   FROM equipos e 
                                   JOIN tipos_equipo te ON e.id_tipo_equipo = te.id 
                                   WHERE e.ni = @NI LIMIT 1";
                var equipo = await connection.QuerySingleOrDefaultAsync<Equipo>(equipoQuery, new { NI = ni });
                if (equipo == null) return null;

                // Obtener las unidades asociadas
                var unidadesQuery = @"
                    SELECT 
                        u.id, u.id_equipo as EquipoId, u.nro_serie as NroSerie, u.id_estado as EstadoId, u.id_persona as PersonaId,
                        e.id as Id, e.nombre as Nombre,
                        p.id_persona as PersonaId, p.nombre as Nombre, p.apellido as Apellido, 
                        g.abreviatura as NombreGrado, a.abreviatura as NombreArmEsp
                    FROM unidades_equipo u
                    LEFT JOIN estado_equipo e ON u.id_estado = e.id
                    LEFT JOIN persona p ON u.id_persona = p.id_persona
                    LEFT JOIN grado g ON p.id_grado = g.id_grado
                    LEFT JOIN armesp a ON p.id_armesp = a.id_armesp
                    WHERE u.id_equipo = @EquipoId";

                equipo.Unidades = (await connection.QueryAsync<UnidadEquipo, EstadoEquipo, Persona, UnidadEquipo>(
                    unidadesQuery,
                    (unidad, estado, persona) => {
                        unidad.Estado = estado;
                        unidad.Persona = persona;
                        return unidad;
                    },
                    new { EquipoId = equipo.Id },
                    splitOn: "Id,PersonaId"
                )).ToList();

                // Obtener especificaciones
                var especificacionesQuery = "SELECT clave, valor FROM especificaciones_equipo WHERE id_equipo = @EquipoId";
                var especificaciones = await connection.QueryAsync<EspecificacionEquipo>(especificacionesQuery, new { EquipoId = equipo.Id });
                equipo.Especificaciones = especificaciones.ToList();

                return equipo;
            }
        }

        /// <summary>
        /// Actualiza un equipo por su NI (Número de Identificación).
        /// </summary>
        public async Task<bool> ActualizarEquipoPorNI(string ni, EquipoAltaCompletaDto data)
        {
            using (var connection = new NpgsqlConnection(GetConnectionString()))
            {
                await connection.OpenAsync();
                using (var transaction = await connection.BeginTransactionAsync())
                {
                    try
                    {
                        // Buscar el equipoId por NI
                        var equipoId = await connection.ExecuteScalarAsync<int?>(
                            "SELECT id FROM equipos WHERE ni = @NI LIMIT 1", 
                            new { NI = ni }, transaction);
                        
                        if (!equipoId.HasValue) return false;

                        // Actualizar el equipo principal
                        var updateQuery = @"
                            UPDATE equipos SET 
                                ine = @Ine, 
                                nne = @Nne, 
                                ni = @NI,
                                id_tipo_equipo = @TipoEquipoId, 
                                marca = @Marca, 
                                modelo = @Modelo, 
                                ubicacion = @Ubicacion, 
                                observaciones = @Observaciones 
                            WHERE id = @Id";
                        
                        Console.WriteLine($"[LOG-Repo] Ejecutando UPDATE equipos para equipoId={equipoId.Value}");
                        var rowsAffected = await connection.ExecuteAsync(updateQuery, new {
                            Id = equipoId.Value,
                            Ine = data.Ine,
                            Nne = data.Nne,
                            NI = data.NI,
                            TipoEquipoId = data.TipoEquipoId,
                            Marca = data.Marca,
                            Modelo = data.Modelo,
                            Ubicacion = data.Ubicacion,
                            Observaciones = data.Observaciones
                        }, transaction);
                        Console.WriteLine($"[LOG-Repo] Filas afectadas en equipos: {rowsAffected}");

                        // Eliminar especificaciones existentes
                        await connection.ExecuteAsync("DELETE FROM especificaciones_equipo WHERE id_equipo = @EquipoId", new { EquipoId = equipoId.Value }, transaction);

                        // Insertar nuevas especificaciones
                        if (data.Especificaciones != null && data.Especificaciones.Any())
                        {
                            var insertedRows = await connection.ExecuteAsync(
                                "INSERT INTO especificaciones_equipo (id_equipo, clave, valor) VALUES (@EquipoId, @Clave, @Valor)",
                                data.Especificaciones.Select(e => new { EquipoId = equipoId.Value, e.Clave, e.Valor }), transaction);
                            Console.WriteLine($"[LOG-Repo] Especificaciones insertadas: {insertedRows}");
                        }

                        // Actualizar la primera unidad si se proporciona
                        if (data.PrimeraUnidad != null)
                        {
                            var updateUnidad = @"
                                UPDATE unidades_equipo SET 
                                    nro_serie = @NumeroSerie, 
                                    id_estado = @EstadoId, 
                                    id_persona = @IdPersona 
                                WHERE id_equipo = @EquipoId AND id = (
                                    SELECT id FROM unidades_equipo WHERE id_equipo = @EquipoId LIMIT 1
                                )";
                                
                            var rowsUnidadUpdate = await connection.ExecuteAsync(updateUnidad, new {
                                EquipoId = equipoId.Value,
                                NumeroSerie = data.PrimeraUnidad.NumeroSerie,
                                EstadoId = data.PrimeraUnidad.EstadoId,
                                IdPersona = data.PrimeraUnidad.IdPersona
                            }, transaction);
                            Console.WriteLine($"[LOG-Repo] Unidades actualizadas: {rowsUnidadUpdate}");
                        }

                        await transaction.CommitAsync();
                        return true;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        Console.WriteLine($"[ERROR-Repo] Error actualizando equipo por NI: {ex.Message}");
                        throw;
                    }
                }
            }
        }

        /// <summary>
        /// Elimina un equipo por su NI (Número de Identificación).
        /// </summary>
        public async Task<bool> EliminarEquipoPorNI(string ni)
        {
            using (var connection = new NpgsqlConnection(GetConnectionString()))
            {
                await connection.OpenAsync();
                using (var transaction = await connection.BeginTransactionAsync())
                {
                    try
                    {
                        // Buscar el equipoId por NI
                        var equipoId = await connection.ExecuteScalarAsync<int?>(
                            "SELECT id FROM equipos WHERE ni = @NI LIMIT 1", 
                            new { NI = ni }, transaction);
                        
                        if (!equipoId.HasValue) return false;

                        // Eliminar unidades asociadas
                        await connection.ExecuteAsync("DELETE FROM unidades_equipo WHERE id_equipo = @EquipoId", new { EquipoId = equipoId.Value }, transaction);

                        // Eliminar especificaciones asociadas
                        await connection.ExecuteAsync("DELETE FROM especificaciones_equipo WHERE id_equipo = @EquipoId", new { EquipoId = equipoId.Value }, transaction);

                        // Eliminar el equipo
                        var equipoRows = await connection.ExecuteAsync("DELETE FROM equipos WHERE id = @EquipoId", new { EquipoId = equipoId.Value }, transaction);

                        await transaction.CommitAsync();
                        return equipoRows > 0;
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        Console.WriteLine($"[ERROR-Repo] Error eliminando equipo por NI: {ex.Message}");
                        throw;
                    }
                }
            }
        }

        /// <summary>
        /// Obtiene el resumen de inventario por NI (Número de Identificación).
        /// </summary>
        public async Task<ResumenInventarioDto?> ObtenerResumenInventarioPorNI(string ni)
        {
            using (var connection = new NpgsqlConnection(GetConnectionString()))
            {
                try
                {
                    await connection.OpenAsync();
                    
                    // Verificar que el equipo existe
                    var equipoExiste = await connection.ExecuteScalarAsync<int>(
                        "SELECT COUNT(*) FROM equipos WHERE ni = @NI",
                        new { NI = ni });
                    
                    if (equipoExiste == 0)
                    {
                        Console.WriteLine($"[DEBUG-Inventario] No se encontró equipo con NI: {ni}");
                        return null;
                    }

                    // Obtener todas las unidades con sus estados para este NI
                    var query = @"
                        SELECT 
                            CAST(COUNT(*) AS INTEGER) as total,
                            e.nombre as estadonombre
                        FROM unidades_equipo u
                        INNER JOIN equipos eq ON u.id_equipo = eq.id
                        INNER JOIN estado_equipo e ON u.id_estado = e.id
                        WHERE eq.ni = @NI
                        GROUP BY u.id_estado, e.nombre";

                    Console.WriteLine($"[DEBUG-Inventario] Ejecutando query de estadísticas por NI");
                    var estadisticas = await connection.QueryAsync<dynamic>(query, new { NI = ni });
                    Console.WriteLine($"[DEBUG-Inventario] Estadísticas obtenidas: {estadisticas?.Count() ?? 0} registros");
                    
                    var resumen = new ResumenInventarioDto();
                    var detalleFueraServicio = new List<DetalleFueraDeServicioDto>();

                    if (estadisticas == null)
                    {
                        Console.WriteLine($"[ERROR-Inventario] estadisticas es null");
                        return resumen; // Devolver resumen vacío pero válido
                    }

                    foreach (var stat in estadisticas)
                    {
                        try
                        {
                            string estadoNombre = stat.estadonombre?.ToString() ?? "N/A";
                            int cantidad = Convert.ToInt32(stat.total);
                            
                            resumen.Total += cantidad;
                            
                            if (estadoNombre.Contains("E/S") || estadoNombre.Contains("En Servicio"))
                            {
                                resumen.EnServicio += cantidad;
                            }
                            else
                            {
                                resumen.FueraDeServicio += cantidad;
                                detalleFueraServicio.Add(new DetalleFueraDeServicioDto
                                {
                                    Estado = estadoNombre,
                                    Cantidad = cantidad
                                });
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[ERROR-Inventario] Error procesando estadística: {ex.Message}");
                            // Continuar con la siguiente estadística
                        }
                    }

                    resumen.DetalleFueraDeServicio = detalleFueraServicio;
                    
                    Console.WriteLine($"[DEBUG-Inventario] NI: {ni}");
                    Console.WriteLine($"[DEBUG-Inventario] Total: {resumen.Total}");
                    Console.WriteLine($"[DEBUG-Inventario] En Servicio: {resumen.EnServicio}");
                    Console.WriteLine($"[DEBUG-Inventario] Fuera de Servicio: {resumen.FueraDeServicio}");
                    Console.WriteLine($"[DEBUG-Inventario] Detalles: {string.Join(", ", detalleFueraServicio.Select(d => $"{d.Estado}:{d.Cantidad}"))}");

                    return resumen;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[ERROR-Inventario] Error al obtener resumen para NI {ni}: {ex.Message}");
                    throw;
                }
            }
        }
    }
}
