// Importar configuración de la API
// const apiUrl = "http://localhost:5069/api/grado";
const apiUrl = CONFIG.API_BASE_URL + "/Grado";

// Cargar los grados al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
    cargarGrados();
});

// Función para eliminar un grado
async function Eliminar(idGrado, button) {
    
    try {
        // Mostrar diálogo de confirmación
        const confirmacion = await Swal.fire({
            title: '¿Está seguro que desea eliminar este grado?',
            text: 'Esta acción no se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });

        if (!confirmacion.isConfirmed) {
            return;
        }

        // Mostrar indicador de carga
        const loadingSwal = Swal.fire({
            title: 'Eliminando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Realizar la petición DELETE al backend
        const response = await fetch(`${apiUrl}/${idGrado}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        // Cerrar el diálogo de carga
        await loadingSwal.close();

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al eliminar el grado');
        }

        // Recargar la tabla
        await cargarGrados();

        // Mostrar notificación de éxito
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });

        await Toast.fire({
            icon: 'success',
            title: '¡Eliminado!',
            text: 'El grado ha sido eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar el grado:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Ocurrió un error al intentar eliminar el grado',
            confirmButtonText: 'Entendido',
            timer: 3000,
            timerProgressBar: true,
            showConfirmButton: false
        });
    }
}

// Función para mostrar notificaciones
function mostrarNotificacion(icono, titulo, mensaje) {
    return Swal.fire({
        icon: icono,
        title: titulo,
        text: mensaje,
        showConfirmButton: true
    });
}

// Función para guardar un nuevo grado
async function guardarGrado(abreviatura, descripcion) {
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                Descripcion: abreviatura,  // Mapea a la columna 'abreviatura'
                GradoCompleto: descripcion // Mapea a la columna 'gradocompleto'
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el grado');
        }

        // Cerrar el modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('agregarGradoModal'));
        modal.hide();

        // Mostrar mensaje de éxito
        await mostrarNotificacion('success', '¡Éxito!', 'Grado guardado correctamente');

        // Recargar la tabla
        await cargarGrados();
        
        // Limpiar el formulario
        document.getElementById('formAgregarGrado').reset();
        
        return await response.json();
    } catch (error) {
        console.error('Error al guardar el grado:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Ocurrió un error al guardar el grado',
            confirmButtonColor: '#dc3545'
        });
        throw error;
    }
}

// Función para crear una fila de la tabla de grados
function crearFilaGrado(grado) {
    
    // Obtener los valores de las propiedades
    const id = grado.id_grado || grado.id || '';
    const abreviatura = grado.descripcion || '';
    
    // Intentar obtener el nombre completo del grado de diferentes propiedades posibles
    const nombreCompleto = grado.gradocompleto || grado.gradoCompleto || 
                          grado.nombre_completo || grado.nombreCompleto || 
                          '';
    
    return `
        <tr data-id="${id}">
            <td class="text-nowrap" data-label="Abreviatura">
                <span class="fw-medium">${abreviatura}</span>
            </td>
            <td data-label="Descripción">${nombreCompleto}</td>
            <td class="text-end">
                <div class="d-flex justify-content-end gap-2">
                    <button type="button" 
                            class="btn btn-outline-danger btn-action"
                            onclick="Eliminar(${id}, this)" 
                            data-id="${id}" 
                            title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Función para actualizar el estado vacío de la tabla
function actualizarEstadoVacio() {
    const tbody = document.getElementById('grado-table');
    const emptyState = document.getElementById('empty-state');
    
    if (tbody.children.length === 0) {
        emptyState.classList.remove('d-none');
    } else {
        emptyState.classList.add('d-none');
    }
}

// Función para cargar los grados
function cargarGrados() {
    const tableBody = document.getElementById("grado-table");
    
    // Mostrar estado de carga
    tableBody.innerHTML = `
        <tr>
            <td colspan="3" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2 mb-0 text-muted">Cargando grados...</p>
            </td>
        </tr>`;
    
    // Ocultar estado vacío durante la carga
    document.getElementById('empty-state').classList.add('d-none');
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los grados');
            }
            return response.json();
        })
        .then(data => {
            tableBody.innerHTML = '';
            
            if (data && data.length > 0) {
                data.forEach(grado => {
                    tableBody.innerHTML += crearFilaGrado(grado);
                });
            } else {
                // No hay datos, se mostrará el estado vacío
            }
            
            actualizarEstadoVacio();
        })
        .catch(error => {
            console.error('Error:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error al cargar los grados. Intente nuevamente.
                    </td>
                </tr>`;
            actualizarEstadoVacio();
        });
}
