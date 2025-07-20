# Sistema de Control y Gestión - Despliegue en Render

## Pasos para desplegar en Render:

### 1. Base de datos
1. Ve a [Render Dashboard](https://dashboard.render.com)
2. Crea una nueva base de datos MySQL:
   - Nombre: `sistema-control-gestion-db`
   - Database Name: `db_app_cps`
   - User: `admin`
   - Plan: Free (o el que prefieras)

### 2. Backend (API)
1. En Render Dashboard, crea un nuevo "Web Service"
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Build Command**: (vacío, usa Docker)
   - **Start Command**: (vacío, usa Docker)
   - **Environment**: `Production`
   - **Dockerfile Path**: `./Backend/Dockerfile`
   - **Docker Context**: `./Backend`

### 3. Variables de entorno
Configura estas variables en el servicio web de Render:
- `ASPNETCORE_ENVIRONMENT`: `Production`
- `DATABASE_URL`: Conectar a la base de datos creada en el paso 1

### 4. Notas importantes
- El puerto se configurará automáticamente mediante la variable `PORT` de Render
- Las migraciones de base de datos se ejecutarán automáticamente al iniciar la aplicación
- La aplicación estará disponible en la URL que proporcione Render

## Estructura de archivos para despliegue:
```
Backend/
├── Dockerfile              # Configuración de contenedor
├── .dockerignore           # Archivos a ignorar en Docker
├── appsettings.Production.json  # Configuración de producción
└── init.sql                # Script de inicialización de DB
```

## Comandos útiles para desarrollo local:
```bash
# Construir imagen Docker localmente
docker build -t backend-app ./Backend

# Ejecutar contenedor localmente
docker run -p 8080:8080 backend-app
```
