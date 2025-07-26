// Importar configuración de la API
// const apiUrl = "http://localhost:5069/api/grado";
const apiUrl = CONFIG.API_BASE_URL + "/Grado";

// Clase para manejar las notificaciones
class Notificacion {
  static mostrar(icono, titulo, mensaje) {
    Swal.fire({
      icon: icono,
      title: titulo,
      text: mensaje,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
  }

  static error(mensaje) {
    this.mostrar("error", "Error", mensaje);
  }

  static success(mensaje) {
    this.mostrar("success", "Éxito", mensaje);
  }

  static warning(mensaje) {
    this.mostrar("warning", "Advertencia", mensaje);
  }
}

// Cargar los grados al iniciar la página
document.addEventListener("DOMContentLoaded", () => {
  cargarGrados();
});

// Función para eliminar un grado
async function Eliminar(idGrado, button) {
  console.log(`[Eliminar] Intentando eliminar grado con ID: ${idGrado}`);

  try {
    // Mostrar diálogo de confirmación
    const confirmacion = await Swal.fire({
      title: "¿Está seguro que desea eliminar este grado?",
      html: `<p>Esta acción no se puede deshacer.</p>
             <p><strong>Nota:</strong> Si hay personal asociado a este grado, no se podrá eliminar hasta que reasigne o elimine dicho personal.</p>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirmacion.isConfirmed) {
      console.log(
        `[Eliminar] Usuario canceló la eliminación del grado ${idGrado}`
      );
      return;
    }

    // Mostrar indicador de carga
    const loadingSwal = Swal.fire({
      title: "Eliminando...",
      text: "Por favor espere",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Realizar la petición DELETE al backend
    console.log(`[Eliminar] Enviando petición DELETE a: ${apiUrl}/${idGrado}`);
    const response = await fetch(`${apiUrl}/${idGrado}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log(
      `[Eliminar] Respuesta del servidor: ${response.status} - ${response.statusText}`
    );

    // Cerrar el diálogo de carga
    await loadingSwal.close();

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log(`[Eliminar] Error del servidor:`, errorData);

      // Si el error es por personas asociadas, mostrar un mensaje más específico
      if (
        response.status === 400 &&
        errorData.message &&
        errorData.message.includes("persona(s) asociada(s)")
      ) {
        await Swal.fire({
          icon: "warning",
          title: "No se puede eliminar",
          html: `<p>${errorData.message}</p><p><strong>Sugerencia:</strong> Vaya al módulo de Personal y reasigne o elimine las personas que tienen este grado antes de eliminarlo.</p>`,
          confirmButtonText: "Entendido",
          confirmButtonColor: "#007bff",
        });
        return;
      }

      throw new Error(errorData.message || "Error al eliminar el grado");
    }

    // Recargar la tabla
    console.log(
      `[Eliminar] Grado ${idGrado} eliminado exitosamente, recargando tabla...`
    );
    await cargarGrados();

    // Mostrar notificación de éxito
    Notificacion.success("Los datos se guardaron correctamente");
  } catch (error) {
    console.error(`[Eliminar] Error al eliminar el grado ${idGrado}:`, error);
    Notificacion.error(
      error.message || "Ocurrió un error al intentar eliminar el grado"
    );
  }
}

// Función para guardar un nuevo grado
async function guardarGrado(abreviatura, descripcion) {
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        Descripcion: abreviatura, // Mapea a la columna 'abreviatura'
        GradoCompleto: descripcion, // Mapea a la columna 'gradocompleto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al guardar el grado");
    }

    // Cerrar el modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("agregarGradoModal")
    );
    modal.hide();

    // Mostrar mensaje de éxito
    Notificacion.success("Los datos se guardaron correctamente");

    // Recargar la tabla
    await cargarGrados();

    // Limpiar el formulario
    document.getElementById("formAgregarGrado").reset();

    return await response.json();
  } catch (error) {
    console.error("Error al guardar el grado:", error);
    Notificacion.error(error.message || "Ocurrió un error al guardar el grado");
    throw error;
  }
}

// Función para crear una fila de la tabla de grados
function crearFilaGrado(grado) {
  // Obtener los valores de las propiedades
  const id = grado.id_grado || grado.id || "";
  const abreviatura = grado.descripcion || "";

  // Intentar obtener el nombre completo del grado de diferentes propiedades posibles
  const nombreCompleto =
    grado.gradocompleto ||
    grado.gradoCompleto ||
    grado.nombre_completo ||
    grado.nombreCompleto ||
    "";

  console.log(
    `[crearFilaGrado] Creando fila para grado ID: ${id}, Abreviatura: ${abreviatura}`
  );

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
  const tbody = document.getElementById("grado-table");
  const emptyState = document.getElementById("empty-state");

  if (tbody.children.length === 0) {
    emptyState.classList.remove("d-none");
  } else {
    emptyState.classList.add("d-none");
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
  document.getElementById("empty-state").classList.add("d-none");

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar los grados");
      }
      return response.json();
    })
    .then((data) => {
      tableBody.innerHTML = "";

      if (data && data.length > 0) {
        data.forEach((grado) => {
          tableBody.innerHTML += crearFilaGrado(grado);
        });
      } else {
        // No hay datos, se mostrará el estado vacío
      }

      actualizarEstadoVacio();
    })
    .catch((error) => {
      console.error("Error:", error);
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
