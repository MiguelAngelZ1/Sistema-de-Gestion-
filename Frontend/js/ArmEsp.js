// URL base de la API - Usar configuración centralizada
const apiUrl = CONFIG.API_BASE_URL + "/ArmEsp";

// Variables globales
let armEspData = [];
let armEspModal = null;
let confirmarEliminarModal = null;
let armEspAEliminar = null;

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

  static exito(mensaje) {
    this.mostrar("success", "Éxito", mensaje);
  }

  static advertencia(mensaje) {
    this.mostrar("warning", "Advertencia", mensaje);
  }
}

// Clase para manejar las operaciones de la API
class ArmEspService {
  static async obtenerTodos() {
    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error en la respuesta:", errorText);
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Verificar si los datos son un array
      if (!Array.isArray(data)) {
        throw new Error("Formato de datos inválido: se esperaba un array");
      }

      return data;
    } catch (error) {
      console.error("Error en obtenerTodos:", error);
      Notificacion.error(
        "No se pudieron cargar los datos. Ver consola para más detalles."
      );
      return [];
    }
  }

  static async guardar(armEsp) {
    try {
      const metodo = "POST";
      const url = apiUrl;

      // Mapear los nombres de propiedades a lo que espera el backend (en minúsculas)
      const datosAEnviar = {
        abreviatura: armEsp.abreviatura || "",
        armesp_completo: armEsp.armesp_completo || "",
        tipo: armEsp.tipo || "",
      };

      // Si hay un ID, incluirlo como id_armesp
      if (armEsp.id) {
        datosAEnviar.id_armesp = parseInt(armEsp.id);
      }

      // Validar datos requeridos
      if (
        !datosAEnviar.abreviatura ||
        !datosAEnviar.armesp_completo ||
        !datosAEnviar.tipo
      ) {
        const errorMsg =
          "Faltan datos requeridos: " +
          (!datosAEnviar.abreviatura ? "Abreviatura, " : "") +
          (!datosAEnviar.armesp_completo ? "Nombre Completo, " : "") +
          (!datosAEnviar.tipo ? "Tipo" : "");
        console.error(errorMsg, armEsp);
        throw new Error(errorMsg);
      }

      // Validar que el tipo sea 'Arma' o 'Especialidad'
      if (
        datosAEnviar.tipo !== "Arma" &&
        datosAEnviar.tipo !== "Especialidad"
      ) {
        const errorMsg = 'El tipo debe ser "Arma" o "Especialidad"';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const response = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(datosAEnviar),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: await response.text() };
        }

        console.error("Error en la respuesta del servidor:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        const errorMsg =
          errorData.message ||
          (errorData.errors
            ? JSON.stringify(errorData.errors)
            : `Error ${response.status}: ${response.statusText}`);
        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      console.error("Error en guardar (ArmEspService):", error);
      throw error;
    }
  }

  static async eliminar(id) {
    try {
      console.log(
        `Enviando solicitud para eliminar arma/especialidad con ID: ${id}`
      );
      const response = await fetch(`${apiUrl}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("Respuesta del servidor:", {
        status: response.status,
        statusText: response.statusText,
      });

      // Intentar parsear la respuesta como JSON, pero manejar el caso en que la respuesta esté vacía
      let responseData;
      const responseText = await response.text();

      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        console.warn("La respuesta no es un JSON válido, se usará texto plano");
        responseData = { message: responseText };
      }

      if (!response.ok) {
        console.error("Error en la respuesta:", responseData);
        const errorMessage =
          responseData.message ||
          responseData.error ||
          `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log("Eliminación exitosa:", responseData);
      return responseData;
    } catch (error) {
      console.error("Error en eliminar (ArmEspService):", error);
      throw error; // Relanzar el error para que lo maneje el llamador
    }
  }
}

// Clase para manejar la interfaz de usuario
class ArmEspUI {
  static inicializar() {
    try {
      console.log("Inicializando ArmEspUI...");

      // Inicializar solo el modal de agregar/editar
      armEspModal = new bootstrap.Modal(
        document.getElementById("agregarArmEspModal")
      );

      // Configurar eventos
      this.configurarEventos();

      // Cargar datos iniciales
      this.cargarDatos()
        .then(() => {
          console.log("Datos cargados correctamente");
        })
        .catch((error) => {
          console.error("Error al cargar datos:", error);
          Notificacion.error("Error al cargar los datos iniciales");
        });
    } catch (error) {
      console.error("Error al inicializar ArmEspUI:", error);
      Notificacion.error("Error al cargar la interfaz");
    }
  }

  static async cargarDatos() {
    try {
      console.log("Cargando datos de armas y especialidades...");
      const data = await ArmEspService.obtenerTodos();
      console.log("Datos recibidos:", data);
      armEspData = Array.isArray(data) ? data : [];
      console.log("Total de registros:", armEspData.length);
      this.actualizarTablas();
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Notificacion.error(
        "Error al cargar los datos. Ver consola para más detalles."
      );
    }
  }

  static actualizarTablas() {
    const tbodyArmEsp = document.getElementById("cuerpoTablaArmEsp");
    const emptyState = document.getElementById("empty-state");

    // Mostrar estado de carga
    tbodyArmEsp.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2 mb-0 text-muted">Cargando datos...</p>
                </td>
            </tr>
        `;

    // Si no hay datos, mostrar estado vacío
    if (armEspData.length === 0) {
      tbodyArmEsp.innerHTML = "";
      if (emptyState) {
        emptyState.classList.remove("d-none");
      }
      return;
    }

    // Ocultar estado vacío si está visible
    if (emptyState) {
      emptyState.classList.add("d-none");
    }

    // Limpiar la tabla
    tbodyArmEsp.innerHTML = "";

    // Ordenar los datos por tipo y luego por nombre
    const datosOrdenados = [...armEspData].sort((a, b) => {
      if (a.tipo < b.tipo) return -1;
      if (a.tipo > b.tipo) return 1;
      return a.armesp_completo.localeCompare(b.armesp_completo);
    });

    // Agregar filas a la tabla
    datosOrdenados.forEach((armEsp) => {
      const tr = this.crearFilaTabla(armEsp);
      tbodyArmEsp.appendChild(tr);
    });

    // Agregar eventos a los botones
    this.agregarEventosBotones();
  }

  static crearFilaTabla(armEsp) {
    // Asegurarse de que los campos tengan valores por defecto
    const id = armEsp.id_armesp || armEsp.id || "";
    const descripcion = armEsp.descripcion || armEsp.abreviatura || "";
    const nombreCompleto =
      armEsp.armEspCompleto || armEsp.armesp_completo || "";

    // Obtener el tipo, manejando diferentes casos
    let tipo = armEsp.tipo || armEsp.Tipo || "Arma";

    // Si el tipo es null o undefined, usar 'Arma' como valor por defecto
    if (tipo === null || tipo === undefined || tipo === "") {
      console.warn(
        `El registro con ID ${id} no tiene tipo definido. Se usará 'Arma' por defecto.`,
        armEsp
      );
      tipo = "Arma";
    }

    // Asegurarse de que el tipo sea 'Arma' o 'Especialidad'
    if (tipo !== "Arma" && tipo !== "Especialidad") {
      console.warn(
        `Tipo no válido: "${tipo}" para el registro con ID ${id}. Se usará 'Arma' por defecto.`,
        armEsp
      );
      tipo = "Arma";
    }

    // Crear la fila de la tabla
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", id);

    // Crear celdas
    const tdAbreviatura = document.createElement("td");
    tdAbreviatura.textContent = descripcion || "-";

    const tdNombreCompleto = document.createElement("td");
    tdNombreCompleto.textContent = nombreCompleto || "-";

    const tdTipo = document.createElement("td");
    tdTipo.textContent = tipo;

    const tdAcciones = document.createElement("td");
    tdAcciones.className = "text-center";

    // Crear contenedor de acciones
    const divAcciones = document.createElement("div");
    divAcciones.className = "d-flex justify-content-center";

    // Botón Eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.type = "button";
    btnEliminar.className = "btn btn-outline-danger btn-action";
    btnEliminar.title = "Eliminar";
    btnEliminar.setAttribute("data-id", id);
    btnEliminar.innerHTML = '<i class="bi bi-trash"></i>';
    btnEliminar.onclick = (e) => this.confirmarEliminacion(e);

    // Agregar botón al contenedor de acciones
    divAcciones.appendChild(btnEliminar);
    tdAcciones.appendChild(divAcciones);

    // Agregar celdas a la fila
    tr.appendChild(tdAbreviatura);
    tr.appendChild(tdNombreCompleto);
    tr.appendChild(tdTipo);
    tr.appendChild(tdAcciones);

    return tr;
  }

  static agregarEventosBotones() {
    // Agregar eventos a los botones de la tabla
    document.querySelectorAll(".btn-eliminar").forEach((btn) => {
      btn.addEventListener("click", (e) => this.confirmarEliminacion(e));
    });
  }

  static obtenerDatosFormulario() {
    try {
      console.log("=== Iniciando obtención de datos del formulario ===");

      // Obtener el formulario
      const form = document.getElementById("formArmEsp");
      if (!form) {
        console.error("No se encontró el formulario");
        Notificacion.error("Error: No se pudo encontrar el formulario");
        throw new Error("Error en el formulario: no se encontró el formulario");
      }

      // Obtener los elementos del formulario con los IDs correctos
      const tipoSelect = document.getElementById("tipo");
      const nombreInput = document.getElementById("nombre");
      const descripcionInput = document.getElementById("descripcion");

      console.log("Elementos del formulario encontrados:", {
        tipoSelect: !!tipoSelect,
        nombreInput: !!nombreInput,
        descripcionInput: !!descripcionInput,
      });

      // Validar que los elementos existan
      if (!tipoSelect || !nombreInput || !descripcionInput) {
        console.error("Elementos del formulario no encontrados");
        Notificacion.error("Error: Configuración del formulario incorrecta");
        throw new Error("Error en la configuración del formulario");
      }

      // Obtener los valores de los campos
      const tipoValue = tipoSelect.value || "";
      const abreviatura = nombreInput.value ? nombreInput.value.trim() : "";
      const nombreCompleto = descripcionInput.value
        ? descripcionInput.value.trim()
        : "";

      const errores = [];

      // Validar tipo (solo si es requerido)
      if (!tipoValue) {
        console.warn("No se ha seleccionado un tipo");
        errores.push("Debe seleccionar un tipo (Arma o Especialidad)");
        tipoSelect.classList.add("is-invalid");
      } else {
        tipoSelect.classList.remove("is-invalid");
      }

      // Validar abreviatura (mínimo 1 carácter, máximo 20)
      if (!abreviatura) {
        console.warn("La abreviatura está vacía");
        errores.push("La abreviatura es obligatoria");
        nombreInput.classList.add("is-invalid");
      } else if (abreviatura.length > 20) {
        console.warn("La abreviatura excede la longitud máxima");
        errores.push("La abreviatura no puede tener más de 20 caracteres");
        nombreInput.classList.add("is-invalid");
      } else {
        nombreInput.classList.remove("is-invalid");
      }

      // Validar nombre completo (mínimo 2 caracteres, máximo 100)
      if (!nombreCompleto) {
        console.warn("El nombre completo está vacío");
        errores.push("El nombre completo es obligatorio");
        descripcionInput.classList.add("is-invalid");
      } else if (nombreCompleto.length < 2) {
        console.warn("El nombre completo es demasiado corto");
        errores.push("El nombre completo debe tener al menos 2 caracteres");
        descripcionInput.classList.add("is-invalid");
      } else if (nombreCompleto.length > 100) {
        console.warn("El nombre completo excede la longitud máxima");
        errores.push("El nombre completo no puede tener más de 100 caracteres");
        descripcionInput.classList.add("is-invalid");
      } else {
        descripcionInput.classList.remove("is-invalid");
      }

      // Si hay errores, mostrarlos y lanzar excepción
      if (errores.length > 0) {
        console.error("Errores de validación:", errores);
        Notificacion.advertencia(errores.join("\n"));
        throw new Error("Validación de formulario fallida");
      }

      // Mapear los datos al formato esperado por la API
      const datos = {
        abreviatura: abreviatura,
        armesp_completo: nombreCompleto,
        tipo: tipoValue,
      };

      console.log("Datos mapeados para la API:", datos);
      return datos;
    } catch (error) {
      console.error("Error en obtenerDatosFormulario:", error);
      throw error; // Relanzar el error para manejarlo en el método que lo llamó
    } finally {
      console.log("=== Finalizando obtención de datos del formulario ===");
    }
  }

  static confirmarEliminacion(event) {
    const id = event.currentTarget.dataset.id;
    armEspAEliminar = id;
    // Llamar directamente a la función eliminar que ya tiene la lógica de confirmación
    this.eliminar();
  }

  static async eliminar() {
    if (!armEspAEliminar || isNaN(parseInt(armEspAEliminar))) {
      console.error("ID de elemento a eliminar no válido:", armEspAEliminar);

      // Mostrar notificación de error
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
      });

      await Toast.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo identificar el registro a eliminar",
      });

      return;
    }

    const id = parseInt(armEspAEliminar);

    try {
      console.log(`Iniciando proceso de eliminación para ID: ${id}`);

      // Mostrar diálogo de confirmación
      const confirmacion = await Swal.fire({
        title: "¿Está seguro que desea eliminar este registro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
      });

      if (!confirmacion.isConfirmed) {
        console.log("Eliminación cancelada por el usuario");
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

      try {
        // Llamar al servicio para eliminar el registro
        await ArmEspService.eliminar(id);

        // Cerrar el diálogo de carga
        await loadingSwal.close();

        // Cerrar el modal de confirmación si existe
        if (confirmarEliminarModal) {
          confirmarEliminarModal.hide();
          this.limpiarFondoModal();
        }

        // Actualizar la lista de datos
        await this.cargarDatos();

        // Mostrar notificación de éxito
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
          },
        });

        await Toast.fire({
          icon: "success",
          title: "¡Eliminado!",
          text: "El registro ha sido eliminado correctamente",
        });
      } catch (error) {
        console.error("Error al eliminar el registro:", error);

        // Cerrar el diálogo de carga si hay un error
        if (loadingSwal.isVisible()) {
          loadingSwal.close();
        }

        // Mostrar notificación de error
        await Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.message ||
            "Ocurrió un error al intentar eliminar el registro",
          confirmButtonText: "Entendido",
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("Error en el proceso de eliminación:", error);

      // Mostrar notificación de error
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ocurrió un error inesperado al intentar eliminar el registro",
        confirmButtonText: "Entendido",
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
    } finally {
      // Resetear el ID del elemento a eliminar
      armEspAEliminar = null;
    }
  }

  static async guardar() {
    try {
      const formData = this.obtenerDatosFormulario();

      // Validar que se haya seleccionado un tipo
      if (!formData.tipo) {
        Notificacion.advertencia(
          "Por favor seleccione un tipo (Arma o Especialidad)"
        );
        return false;
      }

      // Validar que la abreviatura no esté vacía
      if (!formData.abreviatura || formData.abreviatura.trim() === "") {
        Notificacion.advertencia("La abreviatura es obligatoria");
        return false;
      }

      // Validar que el nombre completo no esté vacío
      if (!formData.armesp_completo || formData.armesp_completo.trim() === "") {
        Notificacion.advertencia("El nombre completo es obligatorio");
        return false;
      }

      // Validar longitud de la abreviatura
      if (formData.abreviatura.trim().length > 20) {
        Notificacion.advertencia(
          "La abreviatura no puede tener más de 20 caracteres"
        );
        return false;
      }

      // Validar longitud del nombre completo
      if (formData.armesp_completo.trim().length > 100) {
        Notificacion.advertencia(
          "El nombre completo no puede tener más de 100 caracteres"
        );
        return false;
      }

      // Si llegamos aquí, los datos son válidos
      console.log("Datos válidos, procediendo a guardar...", formData);

      // Mostrar indicador de carga
      const btnGuardar = document.getElementById("btnGuardar");
      const originalText = btnGuardar.innerHTML;
      btnGuardar.disabled = true;
      btnGuardar.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

      try {
        // Guardar los datos
        const resultado = await ArmEspService.guardar(formData);

        // Mostrar mensaje de éxito
        Notificacion.exito("Los datos se guardaron correctamente");

        // Cerrar el modal de manera forzada
        const modalElement = document.getElementById("agregarArmEspModal");
        if (modalElement) {
          // Ocultar el modal
          const modal = bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.hide();
          } else {
            // Si no hay instancia, crear una y ocultarla
            const newModal = new bootstrap.Modal(modalElement);
            newModal.hide();
          }

          // Eliminar manualmente el backdrop (fondo oscuro)
          const backdrops = document.getElementsByClassName("modal-backdrop");
          for (let backdrop of backdrops) {
            backdrop.remove();
          }

          // Restaurar el scroll del body
          document.body.style.overflow = "auto";
          document.body.style.paddingRight = "0";

          // Eliminar la clase 'modal-open' del body
          document.body.classList.remove("modal-open");
        }

        // Resetear el formulario
        const form = document.getElementById("formArmEsp");
        if (form) {
          form.reset();
        }

        // Recargar los datos
        await this.cargarDatos();

        return true;
      } catch (error) {
        console.error("Error al guardar:", error);

        // Mostrar mensaje de error
        const mensaje =
          error.message ||
          "Error al guardar los datos. Por favor, intente nuevamente.";
        Notificacion.error(mensaje);

        return false;
      } finally {
        // Restaurar el botón
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.innerHTML = originalText;
        }
      }
    } catch (error) {
      console.error("Error en el proceso de guardado:", error);

      // Mostrar mensaje de error
      const mensaje =
        error.message ||
        "Error en el proceso de guardado. Por favor, intente nuevamente.";
      Notificacion.error(mensaje);

      return false;
    }
  }

  static configurarEventos() {
    try {
      // Evento para el botón de guardar en el modal
      const btnGuardar = document.getElementById("btnGuardar");
      if (btnGuardar) {
        btnGuardar.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.guardar();
        });
      } else {
        console.error("No se encontró el botón de guardar");
      }

      // Eliminado: La confirmación de eliminación ahora se maneja directamente con SweetAlert
      // No es necesario configurar eventos para el botón de confirmar eliminación

      // Evento para el botón de agregar nuevo
      const btnAgregar = document.querySelector(
        '[data-bs-target="#agregarArmEspModal"]'
      );
      if (btnAgregar) {
        btnAgregar.addEventListener("click", (e) => {
          e.preventDefault();
          // Mostrar el modal de manera directa
          const modalElement = document.getElementById("agregarArmEspModal");
          if (modalElement) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();

            // Limpiar el formulario
            const form = document.getElementById("formArmEsp");
            if (form) {
              form.reset();
              // Remover clases de validación
              form.classList.remove("was-validated");
            }

            // Enfocar el primer campo
            const primerCampo = modalElement.querySelector("input, select");
            if (primerCampo) {
              setTimeout(() => {
                primerCampo.focus();
              }, 500);
            }
          }
        });
      } else {
        console.error("No se encontró el botón de agregar");
      }

      // Configurar validación del formulario
      const form = document.getElementById("formArmEsp");
      if (form) {
        form.addEventListener(
          "submit",
          (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (form.checkValidity()) {
              this.guardar();
            }

            form.classList.add("was-validated");
          },
          false
        );
      }
    } catch (error) {
      console.error("Error al configurar eventos:", error);
    }
  }

  // Función para limpiar el fondo oscuro del modal
  static limpiarFondoModal() {
    // Eliminar manualmente el backdrop (fondo oscuro)
    const backdrops = document.getElementsByClassName("modal-backdrop");
    while (backdrops.length > 0) {
      backdrops[0].parentNode.removeChild(backdrops[0]);
    }

    // Restaurar el scroll del body
    document.body.style.overflow = "auto";
    document.body.style.paddingRight = "0";

    // Eliminar la clase 'modal-open' del body
    document.body.classList.remove("modal-open");
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  ArmEspUI.inicializar();
});
