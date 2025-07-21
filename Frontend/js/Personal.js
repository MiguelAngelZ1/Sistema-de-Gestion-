// Usar configuración centralizada de APIs
const apiUrl = CONFIG.API_BASE_URL + "/Personal";
const apiGrados = CONFIG.API_BASE_URL + "/Grado";
const apiArmEsp = CONFIG.API_BASE_URL + "/ArmEsp";

// Variables globales
let grados = [];
let armesp = [];
let modoEdicion = false;
let datosOriginales = null;
let listaPersonalActual = []; // Array para almacenar la lista actual de personal para validaciones

// Función para formatear nombre (primera letra mayúscula, resto minúsculas)
function formatearNombre(texto) {
  if (!texto) return "";
  return texto
    .toLowerCase()
    .split(" ")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ")
    .trim();
}

// Función para formatear apellido (todo mayúsculas)
function formatearApellido(texto) {
  if (!texto) return "";
  return texto.toUpperCase().trim();
}

// Función para limpiar y formatear DNI (solo números)
function formatearDNI(dni) {
  if (!dni) return "";
  return dni.toString().replace(/\D/g, "");
}

// Función para validar el formulario antes de guardar
function validarFormulario(persona) {
  const errores = [];

  // Validar nombre
  if (!persona.Nombre || persona.Nombre.trim() === "") {
    errores.push("El nombre es obligatorio");
  } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]+$/.test(persona.Nombre)) {
    errores.push("El nombre solo puede contener letras y espacios");
  }

  // Validar apellido
  if (!persona.Apellido || persona.Apellido.trim() === "") {
    errores.push("El apellido es obligatorio");
  } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]+$/.test(persona.Apellido)) {
    errores.push("El apellido solo puede contener letras y espacios");
  }

  // Validar DNI
  if (!persona.dni || persona.dni.trim() === "") {
    errores.push("El DNI es obligatorio");
  } else if (!/^\d{7,8}$/.test(persona.dni)) {
    errores.push("El DNI debe tener 7 u 8 dígitos");
  } else {
    // Validar DNI duplicado
    const dniExiste = validarDniDuplicado(
      persona.dni,
      persona.id || persona.id_persona
    );
    if (dniExiste) {
      errores.push("Ya existe una persona registrada con este DNI");
    }
  }

  // Validar Grado
  if (!persona.GradoId || isNaN(persona.GradoId)) {
    errores.push("Debe seleccionar un grado");
  }

  // Validar Arma/Especialidad
  if (!persona.ArmEspId || isNaN(persona.ArmEspId)) {
    errores.push("Debe seleccionar un arma/especialidad");
  }

  return errores;
}

// Función para validar si el DNI ya existe en el sistema
function validarDniDuplicado(dni, personaIdActual = null) {
  if (!listaPersonalActual || listaPersonalActual.length === 0) {
    return false; // Si no hay lista cargada, no hay duplicados
  }

  // Buscar si existe alguien con el mismo DNI
  const personaConMismoDni = listaPersonalActual.find((persona) => {
    const personaId = persona.id_persona || persona.id;
    // Comparar DNI y excluir la persona actual si está editando
    return persona.dni === dni && personaId !== personaIdActual;
  });

  return personaConMismoDni !== undefined;
}

// Función para formatear el nombre del grado
function formatearGrado(gradoId) {
  // Esta función debería ser reemplazada por una llamada a la API que obtenga el nombre del grado
  // Por ahora, devolvemos el ID como string
  return `Grado ${gradoId}`;
}

// Función para formatear el arma/especialidad
function formatearArmEsp(armEspId) {
  // Esta función debería ser reemplazada por una llamada a la API que obtenga el nombre del arma/especialidad
  // Por ahora, devolvemos el ID como string
  return `Arma/Esp ${armEspId}`;
}

// Cargar los datos al iniciar la página
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Cargar datos en paralelo
    await Promise.all([cargarGrados(), cargarArmEsp(), cargarPersonal()]);

    // Configurar eventos del modal
    configurarEventosModal();

    // Configurar eventos del modal de agregar persona
    configurarModalAgregarPersona();
  } catch (error) {
    console.error("Error al cargar los datos iniciales:", error);
    mostrarNotificacion(
      "error",
      "Error",
      "No se pudieron cargar los datos iniciales"
    );
  }
});

// Configurar el modal de agregar persona
function configurarModalAgregarPersona() {
  const modal = document.getElementById("agregarPersonaModal");
  if (!modal) return;

  // Función para cargar los grados en el select
  const cargarGradosEnSelect = () => {
    const selectGrado = modal.querySelector("#nuevoGrado");
    if (selectGrado && window.grados && Array.isArray(window.grados)) {
      // Limpiar opciones existentes excepto la primera
      selectGrado.innerHTML = '<option value="">Seleccione un grado</option>';

      if (window.grados.length === 0) {
        // No hay grados disponibles - mostrar mensaje de advertencia
        selectGrado.innerHTML = '<option value="" disabled>⚠️ No hay grados disponibles</option>';
        return false; // Indica que no hay datos
      }

      // Ordenar grados por ID
      const gradosOrdenados = [...window.grados].sort((a, b) => a.id - b.id);

      // Agregar opciones al select
      gradosOrdenados.forEach((grado) => {
        const option = document.createElement("option");
        option.value = grado.id;
        const textoMostrar = grado.descripcion
          ? `${grado.descripcion} - ${grado.gradoCompleto}`
          : grado.gradoCompleto || `Grado ${grado.id}`;
        option.textContent = textoMostrar;
        selectGrado.appendChild(option);
      });
      return true; // Indica que hay datos disponibles
    }
    return false;
  };

  // Función para cargar las armas/especialidades en el select
  const cargarArmasEnSelect = () => {
    const selectArmEsp = modal.querySelector("#nuevoArmEsp");
    if (selectArmEsp && window.armEsp && Array.isArray(window.armEsp)) {
      // Limpiar opciones existentes
      selectArmEsp.innerHTML = '<option value="">Seleccione un arma/especialidad</option>';

      if (window.armEsp.length === 0) {
        // No hay armas/especialidades disponibles
        selectArmEsp.innerHTML = '<option value="" disabled>⚠️ No hay armas/especialidades disponibles</option>';
        return false; // Indica que no hay datos
      }

      // Ordenar por ID
      const armEspOrdenadas = [...window.armEsp].sort(
        (a, b) => parseInt(a.id_armesp) - parseInt(b.id_armesp)
      );

      // Agregar opciones al select
      armEspOrdenadas.forEach((arma) => {
        const option = document.createElement("option");
        option.value = arma.id_armesp; // Usar id_armesp en lugar de id

        // Usar los nombres de propiedades correctos
        const textoMostrar = arma.arma_especialidad || arma.nombre || `Arma/Esp ${arma.id_armesp}`;
        option.textContent = textoMostrar;
        selectArmEsp.appendChild(option);
      });
      return true; // Indica que hay datos disponibles
    }
    return false;
  };

  // Función para mostrar alerta de dependencias faltantes
  const mostrarAlertaDependencias = (gradosDisponibles, armasDisponibles) => {
    const faltantes = [];
    if (!gradosDisponibles) faltantes.push('Grados');
    if (!armasDisponibles) faltantes.push('Armas/Especialidades');

    if (faltantes.length > 0) {
      Swal.fire({
        title: '⚠️ Datos Requeridos Faltantes',
        html: `
          <div class="text-start">
            <p class="mb-3"><strong>Para agregar personal, primero debe registrar:</strong></p>
            <ul class="list-unstyled mb-4">
              ${faltantes.map(item => `
                <li class="mb-2">
                  <i class="bi bi-arrow-right-circle text-warning me-2"></i>
                  <strong>${item}</strong>
                </li>
              `).join('')}
            </ul>
            <div class="alert alert-info">
              <i class="bi bi-info-circle me-2"></i>
              <small>Navegue a las secciones correspondientes del sistema para registrar estos datos.</small>
            </div>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ir a Grados',
        cancelButtonText: 'Ir a Armas/Especialidades',
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d',
      }).then((result) => {
        if (result.isConfirmed && !gradosDisponibles) {
          window.location.href = '../Grado/index.html';
        } else if (result.isDismissed && !armasDisponibles) {
          window.location.href = '../ArmEsp/index.html';
        }
      });
      return true; // Se mostró la alerta
    }
    return false; // No se mostró alerta
  };

  // Evento cuando se muestra el modal
  modal.addEventListener("shown.bs.modal", () => {
    console.log("Modal de agregar persona abierto, cargando datos...");
    
    // Verificar y cargar datos
    const gradosDisponibles = cargarGradosEnSelect();
    const armasDisponibles = cargarArmasEnSelect();
    
    // Si faltan dependencias, mostrar alerta y cerrar modal
    if (mostrarAlertaDependencias(gradosDisponibles, armasDisponibles)) {
      // Ocultar el modal después de un pequeño retraso
      setTimeout(() => {
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
      }, 500);
    }
  });

  // Aplicar formato al perder el foco en el modal de agregar
  const nombreInput = document.getElementById("nuevoNombre");
  const apellidoInput = document.getElementById("nuevoApellido");
  const nombreEditarInput = document.getElementById("nombre");
  const apellidoEditarInput = document.getElementById("apellido");

  // Configurar eventos para el modal de agregar
  if (nombreInput) {
    nombreInput.addEventListener("blur", (e) => {
      e.target.value = formatearNombre(e.target.value);
    });
  }

  if (apellidoInput) {
    apellidoInput.addEventListener("blur", (e) => {
      e.target.value = formatearApellido(e.target.value);
    });
  }

  // Configurar eventos para el modal de editar
  if (nombreEditarInput) {
    nombreEditarInput.addEventListener("blur", (e) => {
      e.target.value = formatearNombre(e.target.value);
    });
  }

  if (apellidoEditarInput) {
    apellidoEditarInput.addEventListener("blur", (e) => {
      e.target.value = formatearApellido(e.target.value);
    });
  }

  // Cargar los datos cuando se muestre el modal (solo para modal de agregar) - CÓDIGO ORIGINAL PRESERVADO
  // NOTA: Este evento se mantiene para compatibilidad, pero la validación principal está en el evento shown.bs.modal
  modal.addEventListener("show.bs.modal", (e) => {
    // Solo ejecutar para el modal de agregar persona, no para el modal de detalles
    const modalTarget = e.target;
    if (modalTarget.id === "agregarPersonaModal") {
      // Limpiar y resetear los campos del formulario
      const form = modal.querySelector("#formNuevaPersona");
      if (form) {
        form.reset();
      }
    }
  });

  // Manejar el envío del formulario
  const form = modal.querySelector("#formNuevaPersona");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      // Obtener y formatear los valores
      const nombre = formatearNombre(formData.get("nombre"));
      const apellido = formatearApellido(formData.get("apellido"));
      const dni = formatearDNI(formData.get("dni"));
      const gradoId = parseInt(formData.get("gradoId"));
      const armEspId = parseInt(formData.get("armEspId"));

      // Buscar el grado y arma/especialidad seleccionados
      const gradoSeleccionado = window.grados.find((g) => g.id === gradoId);
      const armEspSeleccionada = window.armEsp.find(
        (a) => a.id_armesp === armEspId
      );

      if (!gradoSeleccionado || !armEspSeleccionada) {
        mostrarNotificacion(
          "error",
          "Error",
          "No se encontró el grado o arma/especialidad seleccionado"
        );
        return;
      }

      const persona = {
        Nombre: nombre,
        Apellido: apellido,
        dni: dni, // Cambiar a minúsculas para que coincida con el backend
        GradoId: gradoId,
        NombreGrado: gradoSeleccionado.descripcion || "",
        NombreGradoCompleto: gradoSeleccionado.gradoCompleto || "",
        ArmEspId: armEspId,
        NombreArmEsp: armEspSeleccionada.abreviatura || "",
        NombreArmEspCompleto: armEspSeleccionada.armesp_completo || "",
      };

      // Validar los datos
      const errores = validarFormulario(persona);
      if (errores.length > 0) {
        mostrarNotificacion("error", "Error de validación", errores.join("\n"));
        return;
      }

      try {
        // Mostrar indicador de carga
        const btnGuardar = form.querySelector('button[type="submit"]');
        const textoOriginal = btnGuardar.innerHTML;
        btnGuardar.disabled = true;
        btnGuardar.innerHTML =
          '<i class="bi bi-hourglass-split me-1"></i> Guardando...';

        // Llamar a la API para guardar
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(persona),
        });

        if (!response.ok) {
          let errorMessage = "Error al guardar el personal";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.title || errorMessage;
          } catch (parseError) {
            // Si no se puede parsear la respuesta JSON, usar el texto de respuesta
            const errorText = await response.text();
            errorMessage =
              errorText || `Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Mostrar mensaje de éxito
        mostrarNotificacion(
          "success",
          "Éxito",
          "Personal guardado correctamente"
        );

        // Cerrar el modal y actualizar la tabla
        const modalInstance = bootstrap.Modal.getInstance(modal);
        if (modalInstance) modalInstance.hide();

        // Limpiar el formulario
        form.reset();

        // Actualizar la tabla
        await cargarPersonal();
      } catch (error) {
        console.error("Error al guardar el personal:", error);
        mostrarNotificacion(
          "error",
          "Error",
          error.message || "No se pudo guardar el personal"
        );

        // Restaurar el botón en caso de error
        const btnGuardar = form.querySelector('button[type="submit"]');
        if (btnGuardar) {
          btnGuardar.disabled = false;
          btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i> Guardar';
        }
      }
    });
  }

  // Limpiar el formulario cuando se cierre el modal
  modal.addEventListener("hidden.bs.modal", () => {
    if (form) form.reset();
  });
}

// Función para formatear el texto (primera letra mayúscula)
function formatearTexto(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Función para mostrar notificaciones
function mostrarNotificacion(icono, titulo, mensaje) {
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

// Cargar lista de grados desde la API
async function cargarGrados() {
  try {
    const response = await fetch(apiGrados);
    if (!response.ok) {
      throw new Error(`Error al cargar grados: ${response.status}`);
    }
    const data = await response.json();
    console.log("Datos de grados recibidos:", data);

    // Almacenar los grados para uso posterior
    window.grados = data;

    // Actualizar el select de grados
    const selectGrado = document.getElementById("grado");
    if (selectGrado) {
      // Limpiar opciones existentes excepto la primera
      selectGrado.innerHTML = '<option value="">Seleccionar Grado</option>';

      // Ordenar grados por ID para mostrarlos en orden jerárquico
      const gradosOrdenados = [...data].sort((a, b) => a.id - b.id);

      // Agregar opciones al select
      gradosOrdenados.forEach((grado) => {
        const option = document.createElement("option");
        option.value = grado.id; // Usar id en lugar de id_grado
        // Mostrar abreviatura y nombre completo: "ABREV - Nombre Completo"
        const textoMostrar = grado.descripcion
          ? `${grado.descripcion} - ${grado.gradoCompleto}`
          : grado.gradoCompleto;
        option.textContent = textoMostrar;
        option.dataset.abreviatura = grado.descripcion || ""; // Guardar abreviatura para referencia
        selectGrado.appendChild(option);
      });
    }

    return data;
  } catch (error) {
    console.error("Error al cargar los grados:", error);
    mostrarNotificacion("error", "Error", "No se pudieron cargar los grados");
    throw error;
  }
}

// Cargar lista de armas/especialidades desde la API
async function cargarArmEsp() {
  try {
    console.log("Cargando armas/especialidades...");
    const response = await fetch(apiArmEsp);
    if (!response.ok) {
      throw new Error(
        `Error al cargar armas/especialidades: ${response.status}`
      );
    }
    const data = await response.json();
    console.log("Datos de armas/especialidades recibidos:", data);

    // Almacenar las armas/especialidades para uso posterior
    window.armEsp = data;

    // Actualizar el select de armas/especialidades
    const selectArmEsp = document.getElementById("armesp");
    if (selectArmEsp) {
      // Limpiar opciones existentes excepto la primera
      selectArmEsp.innerHTML =
        '<option value="">Seleccionar Arma/Especialidad</option>';

      // Ordenar armas/especialidades por ID
      const armEspOrdenadas = [...data].sort(
        (a, b) => a.id_armesp - b.id_armesp
      );

      // Agregar opciones al select
      armEspOrdenadas.forEach((armEsp) => {
        const option = document.createElement("option");
        option.value = armEsp.id_armesp;

        // Usar la abreviatura y la descripción completa
        // El backend devuelve: id, descripcion (que es la abreviatura) y armEspCompleto
        const abreviatura = armEsp.abreviatura || "";
        const nombreCompleto = armEsp.armesp_completo || "";

        // Mostrar: "Abreviatura - Nombre Completo" o solo "Nombre Completo" si no hay abreviatura
        const textoMostrar = abreviatura
          ? `${abreviatura.trim()} - ${nombreCompleto.trim()}`.trim()
          : nombreCompleto;

        option.textContent = textoMostrar;

        // Guardar la abreviatura en un data attribute para referencia
        if (abreviatura) {
          option.dataset.abreviatura = abreviatura;
        }

        selectArmEsp.appendChild(option);
      });

      console.log("Select de arma/especialidad actualizado");
    }

    return data;
  } catch (error) {
    console.error("Error al cargar las armas/especialidades:", error);
    mostrarNotificacion(
      "error",
      "Error",
      "No se pudieron cargar las armas/especialidades"
    );
    throw error;
  }
}

// Configurar eventos del formulario del modal
function configurarEventosModal() {
  const form = document.getElementById("formPersonal");
  const modal = new bootstrap.Modal(document.getElementById("personalModal"));
  const btnCancelarEdicion = document.getElementById("btnCancelarEdicion");
  let datosOriginales = null;

  // Configurar botón de cancelar edición
  if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener("click", () => {
      // Cerrar el modal directamente sin restaurar datos
      const modalInstance = bootstrap.Modal.getInstance(
        document.getElementById("personalModal")
      );
      if (modalInstance) {
        modalInstance.hide();
      } else {
        // Si no hay instancia, usar la API de Bootstrap
        const modalElement = document.getElementById("personalModal");
        const bsModal = new bootstrap.Modal(modalElement);
        bsModal.hide();
      }

      // Limpiar el formulario
      if (form) {
        form.reset();
        form.classList.remove("was-validated");
      }
    });
  }

  const selectGrado = document.getElementById("grado");
  const selectArmEsp = document.getElementById("armesp");

  // Actualizar campos de texto completo al seleccionar una opción
  // Los selects ya muestran el texto completo directamente, no se necesita actualizar elementos adicionales

  // Manejar envío del formulario
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add("was-validated");
        return;
      }

      // Obtener referencia al botón guardar
      const btnGuardar = document.getElementById("btnGuardar");
      const originalText = btnGuardar.innerHTML;

      try {
        // Mostrar estado de carga
        btnGuardar.disabled = true;

        // Obtener los valores del formulario
        const formData = new FormData(form);
        const id = formData.get("id") ? parseInt(formData.get("id")) : 0;
        const gradoId = formData.get("gradoId")
          ? parseInt(formData.get("gradoId"))
          : null;
        const armEspId = formData.get("armEspId")
          ? parseInt(formData.get("armEspId"))
          : null;

        console.log(
          "Valores del formulario - ID:",
          id,
          "gradoId:",
          gradoId,
          "armEspId:",
          armEspId
        );
        console.log("Valor raw del campo ID:", formData.get("id"));
        console.log(
          "Valor del campo personaId:",
          document.getElementById("personaId").value
        );

        const personaData = {
          id: id,
          nombre: formData.get("nombre"),
          apellido: formData.get("apellido"),
          dni: formData.get("dni"),
          gradoId: gradoId,
          armEspId: armEspId,
        };

        console.log("Enviando datos:", personaData);

        let response;

        if (id > 0) {
          // Actualizar existente
          response = await fetch(`${apiUrl}/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(personaData),
          });
        } else {
          // Crear nuevo
          response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(personaData),
          });
        }

        if (!response.ok) {
          let errorMessage = "Error al guardar los datos";
          try {
            const errorData = await response.json();
            console.error("Error del servidor:", errorData);
            errorMessage = errorData.message || errorMessage;
            if (errorData.errors) {
              errorMessage += " " + Object.values(errorData.errors).join(" ");
            }
          } catch (e) {
            console.error("Error al procesar la respuesta de error:", e);
            errorMessage = `Error ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        // Mostrar notificación de éxito
        mostrarNotificacion(
          "success",
          "¡Éxito!",
          "Los datos se guardaron correctamente"
        );

        // Cerrar el modal
        const modalElement = document.getElementById("personalModal");
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
        } else {
          const bsModal = new bootstrap.Modal(modalElement);
          bsModal.hide();
        }

        // Limpiar y actualizar la tabla
        form.reset();
        form.classList.remove("was-validated");
        await cargarPersonal();
      } catch (error) {
        console.error("Error al guardar:", error);
        mostrarNotificacion(
          "error",
          "Error",
          error.message || "Ocurrió un error al guardar los datos"
        );
      } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = originalText;
      }
    });
  }
}

// Función para eliminar una persona
async function eliminarPersona(id, row) {
  console.log("Intentando eliminar persona con ID:", id);
  console.log("Elemento row recibido:", row);
  console.log(
    "Tipo de row:",
    typeof row,
    "NodeType:",
    row ? row.nodeType : "undefined"
  );

  // Si no se proporcionó la fila, intentar encontrarla
  if (!row && id) {
    row = document.querySelector(`tr[data-id="${id}"]`);
    console.log("Row encontrado mediante selector:", row);
  }

  try {
    // Mostrar diálogo de confirmación
    const result = await Swal.fire({
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

    // Si el usuario confirma la eliminación
    if (result.isConfirmed) {
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
        // Realizar la petición DELETE al backend
        const response = await fetch(`${apiUrl}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // Cerrar el diálogo de carga
        await loadingSwal.close();

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Error al eliminar el registro");
        }

        // Recargar la tabla para reflejar los cambios
        console.log("Recargando tabla después de eliminación exitosa...");
        await cargarPersonal();

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
    }
  } catch (error) {
    console.error("Error en el proceso de eliminación:", error);
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Ocurrió un error inesperado al intentar eliminar el registro",
      confirmButtonText: "Entendido",
      timer: 3000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  }
}

// Función para cargar la lista de personal
async function cargarPersonal() {
  const tableBody = document.getElementById("personal-table");
  if (!tableBody) return;

  try {
    // Mostrar indicador de carga
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-2 mb-0">Cargando personal...</p>
                </td>
            </tr>`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Error al cargar el personal");
    }

    const data = await response.json();
    console.log("Datos recibidos de la API:", JSON.stringify(data, null, 2));

    // Almacenar los datos en la variable global para validaciones
    listaPersonalActual = data;

    // Verificar la estructura de la primera persona (si existe)
    if (data.length > 0) {
      console.log("Estructura de la primera persona:", {
        id_persona: data[0].id_persona,
        id: data[0].id,
        nombre: data[0].nombre,
        apellido: data[0].apellido,
        dni: data[0].dni,
        gradoId: data[0].gradoId,
        nombreGrado: data[0].nombreGrado,
        nombreGradoCompleto: data[0].nombreGradoCompleto,
        armEspId: data[0].armEspId,
        nombreArmEsp: data[0].nombreArmEsp,
        nombreArmEspCompleto: data[0].nombreArmEspCompleto,
      });
    }

    // Limpiar la tabla
    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                        No hay personal registrado
                    </td>
                </tr>`;
      return;
    }

    // Llenar la tabla con los datos
    data.forEach((persona) => {
      const row = document.createElement("tr");
      row.className = "align-middle";

      // Usar id_persona que es lo que devuelve el API
      const personaId = persona.id_persona || persona.id;

      // Almacenar datos en atributos para fácil acceso
      row.dataset.id = personaId;
      row.dataset.nombre = persona.nombre || "";
      row.dataset.apellido = persona.apellido || "";
      row.dataset.dni = persona.dni || "";
      row.dataset.gradoId = persona.gradoId || "";
      row.dataset.armEspId = persona.armEspId || "";

      // Mostrar solo la abreviatura en la tabla
      const textoArmEsp = persona.nombreArmEsp || "Sin asignar";

      // Formatear nombre (primera letra mayúscula, resto minúsculas)
      const nombreFormateado = formatearNombre(persona.nombre || "");

      // Formatear apellido (todo mayúsculas)
      const apellidoFormateado = formatearApellido(persona.apellido || "");

      row.innerHTML = `
                <td>${persona.nombreGrado || "Sin asignar"}</td>
                <td>${apellidoFormateado || "-"}</td>
                <td>${nombreFormateado || "-"}</td>
                <td>${textoArmEsp}</td>
                <td class="text-center">
                    <div class="d-flex gap-2 justify-content-center">
                        <button class="btn btn-sm btn-outline-primary btn-action me-1" 
                                onclick="mostrarDetallesPersona(${JSON.stringify(
                                  persona
                                ).replace(/"/g, "&quot;")})" 
                                title="Ver detalles">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning btn-action btn-editar" 
                                data-id="${personaId}"
                                data-nombre="${persona.nombre || ""}"
                                data-apellido="${persona.apellido || ""}"
                                data-dni="${persona.dni || ""}"
                                data-grado-id="${persona.gradoId || ""}"
                                data-arm-esp-id="${persona.armEspId || ""}"
                                title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-action" 
                                onclick="eliminarPersona(${personaId}, this.closest('tr'))" 
                                data-id="${personaId}" 
                                title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>`;

      console.log("Botón generado para persona:", {
        id_persona: persona.id_persona,
        id: persona.id,
        personaId: personaId,
        gradoId: persona.gradoId,
        armEspId: persona.armEspId,
      });

      tableBody.appendChild(row);
    });

    // Configurar eventos de los botones
    configurarEventosTabla();
  } catch (error) {
    console.error("Error en cargarPersonal:", error);
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4 text-danger">
                    <i class="bi bi-exclamation-triangle-fill d-block fs-1 mb-2"></i>
                    <p class="mb-0">Error al cargar el personal. Por favor, intente nuevamente.</p>
                    <button class="btn btn-outline-danger mt-3" onclick="cargarPersonal()">
                        <i class="bi bi-arrow-clockwise me-1"></i> Reintentar
                    </button>
                </td>
            </tr>`;
  }
}

// Configurar eventos de la tabla
function configurarEventosTabla() {
  // Evento para ver detalles
  document.querySelectorAll(".btn-ver-detalles").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const row = e.target.closest("tr");
      const persona = {
        id: parseInt(row.dataset.id),
        nombre: row.dataset.nombre,
        apellido: row.dataset.apellido,
        dni: row.dataset.dni,
        gradoId: parseInt(row.dataset.gradoId) || null,
        armEspId: parseInt(row.dataset.armEspId) || null,
      };
      mostrarDetallesPersona(persona);
    });
  });

  // Evento para eliminar
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(e.target.closest("button").dataset.id);
      eliminarPersona(id, e.target.closest("tr"));
    });
  });
}

// Función para mostrar los detalles de una persona en el modal
async function mostrarDetallesPersona(persona) {
  try {
    console.log("Mostrando detalles de la persona:", persona);

    // Obtener referencia al modal
    const modalElement = document.getElementById("personalModal");
    const modal = new bootstrap.Modal(modalElement);

    // Marcar que estamos en modo detalle para evitar interferencias
    modalElement.dataset.modoDetalle = "true";

    // Asegurar que la sección de detalles esté visible y la de formulario oculta
    document.getElementById("seccionDetalles").style.display = "block";
    document.getElementById("seccionFormulario").style.display = "none";
    document.getElementById("modalTitulo").textContent =
      "Detalles del Personal";

    // Ocultar botones de edición en modo detalles
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelarEdicion");
    if (btnGuardar) btnGuardar.style.display = "none";
    if (btnCancelar) btnCancelar.style.display = "none";

    // Función para asignar los valores de forma robusta
    const asignarValores = () => {
      console.log("=== ASIGNANDO VALORES AL MODAL ===");

      // Actualizar información personal
      const detalleNombre = document.getElementById("detalleNombre");
      const detalleApellido = document.getElementById("detalleApellido");
      const detalleDni = document.getElementById("detalleDni");

      if (detalleNombre) {
        detalleNombre.textContent = formatearTexto(persona.nombre) || "-";
        console.log("Nombre asignado:", detalleNombre.textContent);
      }
      if (detalleApellido) {
        detalleApellido.textContent = formatearTexto(persona.apellido) || "-";
        console.log("Apellido asignado:", detalleApellido.textContent);
      }
      if (detalleDni) {
        detalleDni.textContent = persona.dni || "-";
        console.log("DNI asignado:", detalleDni.textContent);
      }

      // Mostrar grado con abreviatura y nombre completo
      console.log("DEBUG - Valores de grado:", {
        nombreGrado: persona.nombreGrado,
        nombreGradoCompleto: persona.nombreGradoCompleto,
        tipoNombreGrado: typeof persona.nombreGrado,
        tipoNombreGradoCompleto: typeof persona.nombreGradoCompleto,
      });

      let gradoCompleto = "Sin asignar";
      if (persona.nombreGrado) {
        // Buscar el grado completo en la lista de grados cargados
        const gradoEncontrado = window.grados
          ? window.grados.find(
              (g) =>
                g.descripcion === persona.nombreGrado ||
                g.id === persona.gradoId
            )
          : null;

        if (
          gradoEncontrado &&
          gradoEncontrado.gradoCompleto &&
          gradoEncontrado.gradoCompleto.trim() !== ""
        ) {
          // Formato: "CB - Cabo"
          gradoCompleto = `${persona.nombreGrado} - ${gradoEncontrado.gradoCompleto}`;
        } else if (
          persona.nombreGradoCompleto &&
          persona.nombreGradoCompleto.trim() !== ""
        ) {
          // Usar el nombre completo que viene del backend
          gradoCompleto = `${persona.nombreGrado} - ${persona.nombreGradoCompleto}`;
        } else {
          // Solo abreviatura si no hay nombre completo
          gradoCompleto = persona.nombreGrado;
        }

        console.log("Grado encontrado en lista:", gradoEncontrado);
      }
      console.log("Grado calculado:", gradoCompleto);

      const elementoGrado = document.getElementById("detalleGrado");
      console.log("Elemento grado existe:", !!elementoGrado);
      if (elementoGrado) {
        // Limpiar cualquier contenido previo
        elementoGrado.innerHTML = "";
        elementoGrado.textContent = gradoCompleto;
        // Forzar la actualización visual con diferentes métodos
        elementoGrado.style.display = "none";
        elementoGrado.offsetHeight; // Trigger reflow
        elementoGrado.style.display = "block";

        // Verificar que se asignó correctamente
        setTimeout(() => {
          console.log("Grado después de 50ms:", elementoGrado.textContent);
        }, 50);
      }

      // Mostrar arma/especialidad con abreviatura y nombre completo
      console.log("DEBUG - Valores de arma/esp:", {
        nombreArmEsp: persona.nombreArmEsp,
        nombreArmEspCompleto: persona.nombreArmEspCompleto,
        tipoNombreArmEsp: typeof persona.nombreArmEsp,
        tipoNombreArmEspCompleto: typeof persona.nombreArmEspCompleto,
      });

      let armEspCompleto = "Sin asignar";
      if (persona.nombreArmEsp) {
        // Buscar el arma/especialidad completo en la lista cargada
        const armEspEncontrado = window.armEsp
          ? window.armEsp.find(
              (a) =>
                a.abreviatura === persona.nombreArmEsp ||
                a.id_armesp === persona.armEspId
            )
          : null;

        if (
          armEspEncontrado &&
          armEspEncontrado.armesp_completo &&
          armEspEncontrado.armesp_completo.trim() !== ""
        ) {
          // Formato: "Mec Info - Mecánico de Información"
          armEspCompleto = `${persona.nombreArmEsp} - ${armEspEncontrado.armesp_completo}`;
        } else if (
          persona.nombreArmEspCompleto &&
          persona.nombreArmEspCompleto.trim() !== ""
        ) {
          // Usar el nombre completo que viene del backend
          armEspCompleto = `${persona.nombreArmEsp} - ${persona.nombreArmEspCompleto}`;
        } else {
          // Solo abreviatura si no hay nombre completo
          armEspCompleto = persona.nombreArmEsp;
        }

        console.log("ArmEsp encontrado en lista:", armEspEncontrado);
      }
      console.log("ArmEsp calculado:", armEspCompleto);

      const elementoArmEsp = document.getElementById("detalleArmEsp");
      console.log("Elemento armEsp existe:", !!elementoArmEsp);
      if (elementoArmEsp) {
        // Limpiar cualquier contenido previo
        elementoArmEsp.innerHTML = "";
        elementoArmEsp.textContent = armEspCompleto;
        // Forzar la actualización visual con diferentes métodos
        elementoArmEsp.style.display = "none";
        elementoArmEsp.offsetHeight; // Trigger reflow
        elementoArmEsp.style.display = "block";

        // Verificar que se asignó correctamente
        setTimeout(() => {
          console.log("ArmEsp después de 50ms:", elementoArmEsp.textContent);
        }, 50);
      }

      console.log("=== FIN ASIGNACIÓN ===");
    };

    // Asignar valores antes de mostrar el modal
    asignarValores();

    // Configurar el botón de editar
    const btnEditar = document.getElementById("btnEditarDesdeModal");
    if (btnEditar) {
      btnEditar.href = `editar.html?id=${persona.id || persona.id_persona}`;

      if (!persona.id && !persona.id_persona) {
        btnEditar.classList.add("disabled");
        btnEditar.setAttribute("aria-disabled", "true");
      } else {
        btnEditar.classList.remove("disabled");
        btnEditar.removeAttribute("aria-disabled");
      }
    }

    // Event listener único para este modal específico
    const handleModalShown = () => {
      console.log("Modal completamente mostrado, re-asignando valores");
      asignarValores();

      // Agregar MutationObserver para detectar cambios no deseados
      const elementoGrado = document.getElementById("detalleGrado");
      const elementoArmEsp = document.getElementById("detalleArmEsp");

      if (elementoGrado) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === "childList" ||
              mutation.type === "characterData"
            ) {
              console.warn(
                "Cambio detectado en detalleGrado:",
                elementoGrado.textContent
              );
              // Re-asignar el valor correcto si fue cambiado
              if (
                elementoGrado.textContent === "Sin asignar" &&
                persona.nombreGrado
              ) {
                let gradoCompleto = persona.nombreGrado;
                if (
                  persona.nombreGradoCompleto &&
                  persona.nombreGradoCompleto.trim() !== ""
                ) {
                  gradoCompleto = `${persona.nombreGrado} - ${persona.nombreGradoCompleto}`;
                }
                elementoGrado.textContent = gradoCompleto;
                console.log("Valor de grado restaurado:", gradoCompleto);
              }
            }
          });
        });
        observer.observe(elementoGrado, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        // Desconectar observer al cerrar modal
        modalElement.addEventListener(
          "hidden.bs.modal",
          () => observer.disconnect(),
          { once: true }
        );
      }

      if (elementoArmEsp) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === "childList" ||
              mutation.type === "characterData"
            ) {
              console.warn(
                "Cambio detectado en detalleArmEsp:",
                elementoArmEsp.textContent
              );
              // Re-asignar el valor correcto si fue cambiado
              if (
                elementoArmEsp.textContent === "Sin asignar" &&
                persona.nombreArmEsp
              ) {
                let armEspCompleto = persona.nombreArmEsp;
                if (
                  persona.nombreArmEspCompleto &&
                  persona.nombreArmEspCompleto.trim() !== ""
                ) {
                  armEspCompleto = `${persona.nombreArmEsp} - ${persona.nombreArmEspCompleto}`;
                }
                elementoArmEsp.textContent = armEspCompleto;
                console.log("Valor de armEsp restaurado:", armEspCompleto);
              }
            }
          });
        });
        observer.observe(elementoArmEsp, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        // Desconectar observer al cerrar modal
        modalElement.addEventListener(
          "hidden.bs.modal",
          () => observer.disconnect(),
          { once: true }
        );
      }

      // Remover el listener después de usarlo
      modalElement.removeEventListener("shown.bs.modal", handleModalShown);
    };

    modalElement.addEventListener("shown.bs.modal", handleModalShown);

    // Mostrar el modal
    modal.show();

    // Cleanup al cerrar el modal
    modalElement.addEventListener(
      "hidden.bs.modal",
      () => {
        modalElement.dataset.modoDetalle = "false";
      },
      { once: true }
    );
  } catch (error) {
    console.error("Error al mostrar los detalles de la persona:", error);
    mostrarNotificacion(
      "error",
      "Error",
      "No se pudieron cargar los detalles del personal"
    );
  }
}

// Función para mostrar los datos en el modal
function mostrarDatosEnModal(persona, editar = false) {
  console.log("Datos de la persona en mostrarDatosEnModal:", persona);
  const modal = new bootstrap.Modal(document.getElementById("personalModal"));
  const form = document.getElementById("formPersonal");
  const titulo = document.getElementById("modalTitulo");

  // Función para cargar los datos completos de la persona
  const cargarDatosCompletos = async (personaId) => {
    try {
      // Validar que el ID existe y es válido
      if (!personaId) {
        console.error("ID de persona no válido:", personaId);
        return null;
      }
      const response = await fetch(`${apiUrl}/${personaId}`);
      if (!response.ok) throw new Error("Error al cargar los datos completos");
      return await response.json();
    } catch (error) {
      console.error("Error al cargar datos completos:", error);
      return persona; // Devolver los datos originales si hay error
    }
  };

  // Cargar los datos completos de la persona
  (async () => {
    try {
      // Si no tenemos los datos completos y tenemos un ID válido, los cargamos
      const personaId = persona.id_persona || persona.id;
      if (
        (!persona.nombreGradoCompleto || !persona.nombreArmEspCompleto) &&
        personaId
      ) {
        const datosCompletos = await cargarDatosCompletos(personaId);
        if (datosCompletos) {
          // Actualizar los datos de la persona con la información completa
          persona = { ...persona, ...datosCompletos };
          console.log("Datos completos cargados:", persona);
        } else {
          console.warn(
            "No se pudieron cargar los datos completos para la persona:",
            personaId
          );
        }
      }

      // Guardar datos originales para posible cancelación
      if (editar) {
        datosOriginales = { ...persona };
        titulo.textContent = "Editar Personal";
      } else {
        datosOriginales = null;
        titulo.textContent = "Detalles del Personal";

        // Mostrar datos en modo solo lectura
        document.getElementById("detalleNombre").textContent =
          persona.nombre || "-";
        document.getElementById("detalleApellido").textContent =
          persona.apellido || "-";
        document.getElementById("detalleDni").textContent = persona.dni || "-";

        // Mostrar grado con abreviatura y nombre completo
        const gradoCompleto = persona.nombreGradoCompleto
          ? `${persona.nombreGrado || ""} ${
              persona.nombreGradoCompleto
                ? `- ${persona.nombreGradoCompleto}`
                : ""
            }`.trim()
          : "Sin asignar";
        document.getElementById("detalleGrado").textContent =
          gradoCompleto || "Sin asignar";

        // Mostrar arma/especialidad con abreviatura y nombre completo
        const armEspCompleto = persona.nombreArmEspCompleto
          ? `${persona.nombreArmEsp || ""} ${
              persona.nombreArmEspCompleto
                ? `- ${persona.nombreArmEspCompleto}`
                : ""
            }`.trim()
          : "Sin asignar";
        document.getElementById("detalleArmEsp").textContent =
          armEspCompleto || "Sin asignar";
      }

      // Llenar el formulario con los datos para edición
      if (persona) {
        // Normalizar el ID - usar id_persona si existe, sino usar id
        const personaId = persona.id_persona || persona.id;
        document.getElementById("personaId").value = personaId || "";
        console.log("=== ASIGNANDO ID AL CAMPO ===");
        console.log("Persona id_persona:", persona.id_persona);
        console.log("Persona id:", persona.id);
        console.log("ID normalizado:", personaId);
        console.log(
          "Valor asignado al campo:",
          document.getElementById("personaId").value
        );
        // Aplicar formato a los valores al cargar en el formulario de edición
        document.getElementById("nombre").value = formatearNombre(
          persona.nombre || ""
        );
        document.getElementById("apellido").value = formatearApellido(
          persona.apellido || ""
        );
        document.getElementById("dni").value = persona.dni || "";

        // Cargar grados en el select
        const cargarGradosEnSelect = async () => {
          try {
            const response = await fetch(apiGrados);
            if (!response.ok) throw new Error("Error al cargar grados");
            const grados = await response.json();

            const selectGrado = document.getElementById("grado");
            selectGrado.innerHTML =
              '<option value="">Seleccionar Grado</option>';

            grados.forEach((grado) => {
              const option = document.createElement("option");
              option.value = grado.id_grado;
              option.textContent = grado.gradocompleto; // Mostrar solo el nombre completo
              option.dataset.abreviatura = grado.abreviatura;
              selectGrado.appendChild(option);
            });

            return grados;
          } catch (error) {
            console.error("Error al cargar grados:", error);
            return [];
          }
        };

        // Cargar armas/especialidades en el select
        const cargarArmEspEnSelect = async () => {
          try {
            const response = await fetch(apiArmEsp);
            if (!response.ok)
              throw new Error("Error al cargar armas/especialidades");
            const armEsp = await response.json();

            const selectArmEsp = document.getElementById("armesp");
            selectArmEsp.innerHTML =
              '<option value="">Seleccionar Arma/Especialidad</option>';

            armEsp.forEach((arm) => {
              const option = document.createElement("option");
              option.value = arm.id_armesp;
              option.textContent = arm.armesp_completo; // Mostrar solo el nombre completo
              option.dataset.abreviatura = arm.abreviatura;
              selectArmEsp.appendChild(option);
            });

            return armEsp;
          } catch (error) {
            console.error("Error al cargar armas/especialidades:", error);
            return [];
          }
        };

        // Cargar grados y armas/especialidades si estamos en modo edición
        if (editar) {
          try {
            // Cargar grados y armas/especialidades en paralelo
            await Promise.all([cargarGrados(), cargarArmEsp()]);

            // Establecer los valores seleccionados
            const selectGrado = document.getElementById("grado");
            if (selectGrado) {
              // Esperar un momento para asegurar que el select se haya renderizado
              setTimeout(() => {
                // Asegurarse de que el valor se establezca correctamente
                // Convertir a string para asegurar la coincidencia con los valores de las opciones
                const gradoIdStr = (persona.gradoId || "").toString();
                selectGrado.value = gradoIdStr;

                console.log(
                  "Estableciendo gradoId:",
                  gradoIdStr,
                  "en select. Valor actual:",
                  selectGrado.value
                );

                // Verificar si el valor se estableció correctamente
                if (selectGrado.value !== gradoIdStr) {
                  console.warn(
                    "No se pudo establecer el valor del select. Opciones disponibles:",
                    Array.from(selectGrado.options).map((opt) => ({
                      value: opt.value,
                      text: opt.text,
                    }))
                  );
                }

                // Disparar evento change para asegurar que los eventos se activen
                const event = new Event("change", { bubbles: true });
                selectGrado.dispatchEvent(event);
              }, 100);
            }

            const selectArmEsp = document.getElementById("armesp");
            if (selectArmEsp && persona.armEspId) {
              selectArmEsp.value = persona.armEspId;
            }
          } catch (error) {
            console.error("Error al cargar los datos para edición:", error);
            mostrarNotificacion(
              "error",
              "Error",
              "No se pudieron cargar los datos necesarios para la edición"
            );
          }
        }

        // Mostrar/ocultar secciones según el modo
        document.getElementById("seccionDetalles").style.display = editar
          ? "none"
          : "block";
        document.getElementById("seccionFormulario").style.display = editar
          ? "block"
          : "none";

        // Habilitar/deshabilitar campos según el modo
        const inputs = form.querySelectorAll("input, select");
        inputs.forEach((input) => {
          input.disabled = !editar && input.id !== "personaId";
          input.readOnly = !editar && input.id !== "personaId";
        });

        // Controlar visibilidad de botones según el modo
        const btnGuardar = document.getElementById("btnGuardar");
        const btnCancelar = document.getElementById("btnCancelarEdicion");

        if (btnGuardar) {
          btnGuardar.style.display = editar ? "inline-block" : "none";
          btnGuardar.disabled = !editar;
          btnGuardar.innerHTML =
            '<i class="bi bi-save me-1"></i> Guardar Cambios';
        }

        if (btnCancelar) {
          btnCancelar.style.display = editar ? "inline-block" : "none";
        }
      }

      // Mostrar el modal
      modal.show();
    } catch (error) {
      console.error("Error al cargar los datos completos:", error);
      mostrarNotificacion(
        "error",
        "Error",
        "No se pudieron cargar los datos completos del personal"
      );
    }
  })();

  // Mostrar el modal
  modal.show();
}

// Hacer las funciones accesibles globalmente
window.eliminarPersona = eliminarPersona;
window.mostrarDetallesPersona = mostrarDetallesPersona;

// Configurar botón de editar en la tabla
document.addEventListener("click", (e) => {
  const btnEditar = e.target.closest(".btn-editar");
  if (btnEditar) {
    e.preventDefault();
    console.log("=== BOTON EDITAR CLICKEADO ===");
    console.log("btnEditar element:", btnEditar);
    console.log("btnEditar.dataset:", btnEditar.dataset);

    // Construir el objeto persona a partir de los datos del botón
    const persona = {
      id: parseInt(btnEditar.dataset.id) || null,
      id_persona: parseInt(btnEditar.dataset.id) || null, // Agregar también id_persona para compatibilidad
      nombre: btnEditar.dataset.nombre,
      apellido: btnEditar.dataset.apellido,
      dni: btnEditar.dataset.dni,
      gradoId: parseInt(btnEditar.dataset.gradoId) || null,
      armEspId: parseInt(btnEditar.dataset.armEspId) || null,
    };

    console.log("Dataset completo:", btnEditar.dataset);
    console.log("gradoId desde dataset:", btnEditar.dataset.gradoId);
    console.log("armEspId desde dataset:", btnEditar.dataset.armEspId);

    // Intentar acceder de forma alternativa si los primeros fallan
    if (!btnEditar.dataset.gradoId) {
      console.log(
        "Intentando acceso alternativo para gradoId:",
        btnEditar.getAttribute("data-grado-id")
      );
      persona.gradoId =
        parseInt(btnEditar.getAttribute("data-grado-id")) || null;
    }

    if (!btnEditar.dataset.armEspId) {
      console.log(
        "Intentando acceso alternativo para armEspId:",
        btnEditar.getAttribute("data-arm-esp-id")
      );
      persona.armEspId =
        parseInt(btnEditar.getAttribute("data-arm-esp-id")) || null;
    }

    console.log("Persona construida desde dataset:", persona);

    const personaId = persona.id || persona.id_persona;
    if (personaId && !isNaN(personaId)) {
      mostrarDatosEnModal(persona, true);
    } else {
      console.error("ID de persona no válido:", personaId);
    }
  }
});
