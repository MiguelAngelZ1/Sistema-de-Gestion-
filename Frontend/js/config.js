// Configuración de API URLs
const CONFIG = {
    // Para desarrollo local descomenta esta línea:
    // API_BASE_URL: "http://localhost:5069/api",
    
    // Para producción (Render) usa esta línea:
    API_BASE_URL: "https://sistema-control-gestion-backend.onrender.com/api",
    
    // Endpoints específicos
    endpoints: {
        grado: "/Grado",        // GradoController → /api/Grado
        personal: "/Personal",   // PersonalController → /api/Personal 
        armEsp: "/ArmEsp",      // ArmEspController → /api/ArmEsp
        equipos: "/equipos",    // EquipoController usa [Route("api/equipos")]
        estadoEquipo: "/estadoequipo",  // EstadoEquipoController usa [Route("api/estadoequipo")]
        tipoEquipo: "/tipoequipo"       // TipoEquipoController usa [Route("api/tipoequipo")]
    }
};

// Función helper para obtener URL completa del endpoint
function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + CONFIG.endpoints[endpoint];
}

// URLs completas para usar en los archivos
const API_URLS = {
    GRADO: getApiUrl('grado'),
    PERSONAL: getApiUrl('personal'),
    ARM_ESP: getApiUrl('armEsp'),
    EQUIPOS: getApiUrl('equipos'),
    ESTADO_EQUIPO: getApiUrl('estadoEquipo'),
    TIPO_EQUIPO: getApiUrl('tipoEquipo')
};
