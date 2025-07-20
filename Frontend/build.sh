#!/bin/bash

# Script de construcción para el frontend en Render

echo "🚀 Iniciando proceso de build del frontend..."

# Crear directorio de build si no existe
mkdir -p build

# Copiar todos los archivos del frontend al directorio build
echo "📁 Copiando archivos..."
cp -r Areas build/
cp -r assets build/
cp -r css build/
cp -r js build/
cp -r libs build/
cp styles.css build/

# Crear archivo index.html principal que redirija a Areas/Home/index.html
echo "🏠 Creando página de inicio principal..."
cat > build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Control y Gestión</title>
    <script>
        // Redirigir automáticamente a la página de inicio
        window.location.href = '/Areas/Home/index.html';
    </script>
</head>
<body>
    <div style="text-align: center; margin-top: 50px;">
        <h1>Cargando Sistema de Control y Gestión...</h1>
        <p>Si no es redirigido automáticamente, <a href="/Areas/Home/index.html">haga clic aquí</a></p>
    </div>
</body>
</html>
EOF

# Crear archivo _redirects para manejar rutas SPA
echo "🔀 Configurando redirects..."
cat > build/_redirects << 'EOF'
# Redirects for Sistema de Control y Gestión

# Página principal
/ /Areas/Home/index.html 200

# Rutas específicas
/home /Areas/Home/index.html 200
/grado /Areas/Grado/index.html 200
/personal /Areas/Personal/index.html 200
/equipos /Areas/Equipos/index.html 200
/armesp /Areas/ArmEsp/index.html 200

# Fallback para cualquier ruta no encontrada
/* /Areas/Home/index.html 200
EOF

echo "✅ Build completado exitosamente!"
echo "📦 Los archivos están listos en el directorio 'build'"
