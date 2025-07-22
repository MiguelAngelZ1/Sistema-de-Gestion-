//-----------------------------------------------------------------------------------------------------
// EQUIPOS.JS - VERSIÓN 2.7 - CAMPOS MARCA Y MODELO AGREGADOS
// CONFIGURACION E INICIALIZACION
//-----------------------------------------------------------------------------------------------------

// URL base de la API - Usar configuración centralizada
const API_URL = CONFIG.API_BASE_URL + "/equipos";
const API_URL_PERSONA = CONFIG.API_BASE_URL + "/personal";
const API_URL_ESTADOS = CONFIG.API_BASE_URL + "/estadoequipo";
const API_URL_TIPO_EQUIPO = CONFIG.API_BASE_URL + "/tipoequipo";

// Almacena una instancia del modal de Bootstrap para poder manipularlo desde el código.
let modalEquipo; // Obsoleto, pero se mantiene por si se reutiliza
let modalDetalles;
let modalInventario; // Obsoleto
let modalCrearModelo;
let modalAgregarUnidad;

// Almacena el contexto del modelo de equipo que se está viendo en el modal de detalles.
let equipoIdActual = null;
let equipoNneActual = null;

// Se ejecuta cuando el contenido del DOM ha sido completamente cargado.
// Es el punto de entrada de la aplicación.
document.addEventListener("DOMContentLoaded", () => {
  // Inicializa los modales de Bootstrap.
  // modalEquipo = new bootstrap.Modal(document.getElementById('modalEquipo')); // Modal obsoleto
  modalDetalles = new bootstrap.Modal(
    document.getElementById("modalDetallesEquipo")
  );
  window.modalDetalles = modalDetalles; // <-- Asegura que sea global y accesible
  // modalInventario = new bootstrap.Modal(document.getElementById('modalInventario')); // Modal obsoleto
  modalCrearModelo = new bootstrap.Modal(
    document.getElementById("modalCrearModelo")
  );
  modalAgregarUnidad = new bootstrap.Modal(
    document.getElementById("modalAgregarUnidad")
  );

  // Asigna los eventos a los elementos del DOM.
  asignarEventListeners();

  // Carga inicial de los datos.
  cargarEquipos();
  cargarEstadosParaModal(); // Cargar los estados para el modal de unidades.
  cargarTiposEquipo(); // Cargar los tipos para el modal de creación de modelos.
});

//-----------------------------------------------------------------------------------------------------
// FUNCION AUXILIAR PARA RECARGAR EQUIPO DESDE LA API
//-----------------------------------------------------------------------------------------------------
async function recargarEquipoActual(nne, nroSerie) {
  let url = "";
  if (nne) {
    url = `${CONFIG.API_BASE_URL}/equipos/nne/${nne}`;
  } else if (nroSerie) {
    url = `${CONFIG.API_BASE_URL}/equipos/nroSerie/${encodeURIComponent(
      nroSerie
    )}`;
  }
  if (url) {
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      window.__equipoDetallesActual = data;
      console.log("[recargarEquipoActual] Equipo actualizado:", data);
    }
  }
}
//-----------------------------------------------------------------------------------------------------
// MANEJO DE EVENTOS
//-----------------------------------------------------------------------------------------------------

/**
 * Asigna los manejadores de eventos a los elementos del DOM.
 */
let datosOriginalesEdicion = null;

function asignarEventListeners() {
  // Nuevo botón editar
  const btnEditar = document.getElementById("btn-editar");
  if (btnEditar) btnEditar.addEventListener("click", activarModoEdicion);

  // Nuevo botón guardar
  const btnGuardar = document.getElementById("btn-guardar-cambios");
  if (btnGuardar) btnGuardar.addEventListener("click", guardarCambiosDetalles);

  // Botón cancelar edición
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
  if (btnCancelarEdicion)
    btnCancelarEdicion.addEventListener("click", cancelarEdicionDetalles);

  // Botón agregar especificación técnica en modo edición
  const btnAgregarEspecificacion = document.getElementById(
    "btn-agregar-especificacion-detalle"
  );
  if (btnAgregarEspecificacion)
    btnAgregarEspecificacion.addEventListener(
      "click",
      agregarCampoEspecificacionDetalle
    );
}

const btnAbrirModalCrearModelo = document.getElementById(
  "btnAbrirModalCrearModelo"
);
if (btnAbrirModalCrearModelo)
  btnAbrirModalCrearModelo.addEventListener("click", abrirModalCrearModelo);

const formCrearModelo = document.getElementById("formCrearModelo");
if (formCrearModelo) formCrearModelo.addEventListener("submit", guardarModelo);

const btnAgregarEspecificacion = document.getElementById(
  "btn-agregar-especificacion"
);
if (btnAgregarEspecificacion)
  btnAgregarEspecificacion.addEventListener(
    "click",
    agregarCampoEspecificacion
  );

const btnAbrirModalUnidad = document.getElementById("btn-abrir-modal-unidad");
if (btnAbrirModalUnidad)
  btnAbrirModalUnidad.addEventListener("click", abrirModalAgregarUnidad);

const formAgregarUnidad = document.getElementById("formAgregarUnidad");
if (formAgregarUnidad)
  formAgregarUnidad.addEventListener("submit", guardarUnidad);

// Event listener para el botón de exportar detalles del equipo
const btnExportarDetalle = document.getElementById("btn-exportar-detalle");
if (btnExportarDetalle)
  btnExportarDetalle.addEventListener("click", exportarDetalleEquipo);

// Event listener para el botón de imprimir detalles del equipo
const btnImprimirDetalle = document.getElementById("btn-imprimir-detalle");
if (btnImprimirDetalle)
  btnImprimirDetalle.addEventListener("click", imprimirDetalleEquipo);

// Evento para abrir el modal de creación de equipo.
// document.getElementById('btnAbrirModalCrear').addEventListener('click', abrirModalCrear); // Deshabilitado temporalmente

// Evento para guardar los datos del formulario (crear o editar).
// document.getElementById('formEquipo').addEventListener('submit', guardarEquipo); // Deshabilitado temporalmente

//-----------------------------------------------------------------------------------------------------
// FUNCIONES PARA INTERACTUAR CON LA API (POST, PUT, DELETE)
//-----------------------------------------------------------------------------------------------------

/**
 * Elimina un equipo de la API por su NNE o número de serie.
 * @param {string} nne - El NNE del equipo a eliminar (opcional).
 * @param {string} nroSerie - El número de serie del equipo a eliminar (opcional).
 * @returns {Promise<boolean>} Una promesa que se resuelve a true si la eliminación fue exitosa.
 */
async function eliminarEquipo(nne, nroSerie) {
  try {
    let url;
    let identificador;

    if (nne) {
      url = `${API_URL}/nne/${nne}`;
      identificador = `NNE ${nne}`;
    } else if (nroSerie) {
      url = `${API_URL}/nroSerie/${nroSerie}`;
      identificador = `número de serie ${nroSerie}`;
    } else {
      throw new Error("Debe proporcionar NNE o número de serie");
    }

    console.log(`Eliminando equipo con ${identificador}`);
    const respuesta = await fetch(url, {
      method: "DELETE",
    });

    if (!respuesta.ok) {
      const errorText = await respuesta.text();
      throw new Error(`Error ${respuesta.status}: ${errorText}`);
    }

    console.log(`Equipo con ${identificador} eliminado exitosamente`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar el equipo:`, error);
    mostrarAlerta("No se pudo eliminar el equipo.", "error");
    return false;
  }
}

/**
 * Crea un nuevo equipo en la API.
 * @param {Object} equipo - El objeto de equipo a crear.
 * @returns {Promise<Object>} Una promesa que se resuelve con el objeto de equipo creado.
 */
async function crearModelo(equipo) {
  try {
    const respuesta = await fetch(API_URL, {
      // Llama a POST /api/equipos
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(equipo),
    });

    if (!respuesta.ok) {
      let mensajeError = `Error HTTP ${respuesta.status}: ${respuesta.statusText}`;

      try {
        // Intentar leer como JSON primero
        const errorData = await respuesta.json();
        mensajeError = errorData.message || errorData.error || mensajeError;
      } catch (jsonError) {
        // Si no es JSON válido, intentar leer como texto
        try {
          const errorText = await respuesta.text();
          if (errorText.trim()) {
            mensajeError =
              errorText.length > 200
                ? errorText.substring(0, 200) + "..."
                : errorText;
          }
        } catch (textError) {
          console.warn("No se pudo leer el cuerpo de la respuesta de error");
        }
      }

      throw new Error(mensajeError);
    }

    return await respuesta.json();
  } catch (error) {
    console.error("Error al crear el modelo de equipo:", error);
    mostrarAlerta(`No se pudo crear el modelo: ${error.message}`, "error");
    return null;
  }
}

//-----------------------------------------------------------------------------------------------------
// FUNCIONES PARA INTERACTUAR CON LA API (GET)
//-----------------------------------------------------------------------------------------------------

/**
 * Obtiene todos los equipos de un grupo por su NNE desde la API.
 * @param {string} nne - El NNE del grupo de equipos a obtener.
 * @returns {Promise<Array|null>} Una promesa que se resuelve con un array de equipos o null si no se encuentran.
 */
async function obtenerEquipoDetalladoPorNNE(nne) {
  try {
    // La URL ahora es /api/equipos/nne/{nne}
    const respuesta = await fetch(`${API_URL}/nne/${nne.trim()}`);
    if (!respuesta.ok) {
      if (respuesta.status === 404) return null;
      throw new Error(`Error de red: ${respuesta.statusText}`);
    }
    return await respuesta.json();
  } catch (error) {
    console.error(`Error CRÍTICO en fetch para NNE ${nne}:`, error);
    mostrarAlerta("No se pudo obtener el detalle del equipo.", "error");
    return null;
  }
}

/**
 * Obtiene todos los equipos de la API.
 * @returns {Promise<Array>} Una promesa que se resuelve con un array de objetos de equipo.
 */
async function obtenerEquipos() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      console.error(
        "Error del servidor:",
        response.status,
        await response.text()
      );
      return []; // Devolver array vacío en caso de error
    }
    return await response.json();
  } catch (error) {
    console.error("Error al obtener los equipos:", error);
    mostrarAlerta(
      "Error al cargar los equipos. Por favor, intente más tarde.",
      "error"
    );
    return [];
  }
}

/**
 * Obtiene toda la lista de personal desde la API.
 * @returns {Promise<Array>} Una promesa que se resuelve con un array de objetos de persona.
 */
/**
 * Obtiene la lista de estados de equipo y la carga en el select correspondiente.
 */
async function cargarEstadosParaModal() {
  const select = document.getElementById("crear-estado-equipo");
  try {
    const estados = await fetch(API_URL_ESTADOS).then((res) =>
      res.ok ? res.json() : Promise.reject(res)
    );
    select.innerHTML =
      '<option value="" selected disabled>Seleccionar un estado...</option>';
    estados.forEach((estado) => {
      const option = document.createElement("option");
      option.value = estado.id;
      option.textContent = estado.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los estados de equipo:", error);
    select.innerHTML =
      '<option value="" selected disabled>Error al cargar</option>';
  }
}

/**
 * Obtiene la lista de personal y la carga en el select de responsables.
 */
async function cargarPersonalParaModal() {
  const select = document.getElementById("unidad-responsable");
  try {
    const personal = await fetch(API_URL_PERSONA).then((res) =>
      res.ok ? res.json() : Promise.reject(res)
    );
    select.innerHTML = '<option value="">Seleccionar responsable...</option>'; // Opción para no asignar a nadie
    personal.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id_persona;
      option.textContent = `${p.nombreGrado || ""} ${p.nombreArmEsp || ""} ${
        p.nombre
      } ${p.apellido}`.trim();
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar el personal:", error);
    select.innerHTML =
      '<option value="" selected disabled>Error al cargar</option>';
  }
}

async function obtenerTodoElPersonal() {
  try {
    const respuesta = await fetch(API_URL_PERSONA);
    if (!respuesta.ok)
      throw new Error("No se pudo obtener la lista de personal");
    return await respuesta.json();
  } catch (error) {
    console.error("Error al obtener personal:", error);
    mostrarAlerta("No se pudo cargar la lista de personal.", "error");
    return [];
  }
}

//-----------------------------------------------------------------------------------------------------
// FUNCIONES DEL DOM (MANEJO DE MODALES Y FORMULARIOS)
//-----------------------------------------------------------------------------------------------------

/**
 * Abre el modal para crear un nuevo equipo, reseteando el formulario.
 */
async function abrirModalCrearModelo() {
  const form = document.getElementById("formCrearModelo");
  form.reset();
  document.getElementById("especificaciones-dinamicas-container").innerHTML =
    "";
  agregarCampoEspecificacion();

  // Cargar datos para los desplegables ANTES de mostrar el modal
  await Promise.all([cargarEstadosParaModal(), cargarPersonalParaModal()]);

  modalCrearModelo.show();
}

/**
 * Maneja el envío del formulario para crear o actualizar un equipo.
 * @param {Event} event - El objeto de evento del formulario.
 */
/**
 * Agrega un nuevo par de campos (clave-valor) para una especificación técnica.
 */
function agregarCampoEspecificacion() {
  const container = document.getElementById(
    "especificaciones-dinamicas-container"
  );
  const div = document.createElement("div");
  div.className = "row mb-2 align-items-center especificacion-fila";
  div.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control especificacion-clave" placeholder="Clave (ej. RAM)">
        </div>
        <div class="col-md-5">
            <input type="text" class="form-control especificacion-valor" placeholder="Valor (ej. 16GB)">
        </div>
        <div class="col-md-2 text-end">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.especificacion-fila').remove()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
  container.appendChild(div);
}

/**
 * Maneja el envío del formulario para crear un nuevo modelo de equipo.
 * @param {Event} event - El objeto de evento del formulario.
 */
async function guardarModelo(event) {
  event.preventDefault();

  // VALIDACIONES CRÍTICAS ANTES DE PROCESAR
  const nne = document.getElementById("crear-nne").value.trim();
  const nroSerie = document.getElementById("crear-nro-serie").value.trim();
  const marca = document.getElementById("crear-marca").value.trim();
  const modelo = document.getElementById("crear-modelo").value.trim();
  const tipoEquipoId = document.getElementById("crear-tipo-equipo").value;
  const estadoEquipoId = document.getElementById("crear-estado-equipo").value;
  const ubicacion = document.getElementById("crear-ubicacion").value.trim();

  // Validaciones obligatorias
  const errores = [];

  if (!nne) {
    errores.push("El número NNE es obligatorio para las operaciones CRUD");
  }
  if (!nroSerie) {
    errores.push("El número de serie es obligatorio para las operaciones CRUD");
  }
  if (!marca) {
    errores.push("La marca del equipo es obligatoria");
  }
  if (!modelo) {
    errores.push("El modelo del equipo es obligatorio");
  }
  if (!tipoEquipoId) {
    errores.push("Debe seleccionar un tipo de equipo válido");
  }
  if (!estadoEquipoId) {
    errores.push("Debe seleccionar un estado de equipo válido");
  }
  if (!ubicacion) {
    errores.push("La ubicación del equipo es obligatoria");
  }

  // Validación de formato NNE (ejemplo: números)
  if (nne && !/^\d+$/.test(nne)) {
    errores.push("El NNE debe contener solo números");
  }

  // Validación de longitud mínima
  if (nne && nne.length < 8) {
    errores.push("El NNE debe tener al menos 8 dígitos");
  }

  if (errores.length > 0) {
    Swal.fire({
      title: "⚠️ Campos Obligatorios",
      html: `
        <div class="text-start">
          <p class="mb-3"><strong>Los siguientes campos son obligatorios:</strong></p>
          <ul class="list-unstyled">
            ${errores
              .map(
                (error) =>
                  `<li class="mb-2"><i class="bi bi-x-circle text-danger me-2"></i>${error}</li>`
              )
              .join("")}
          </ul>
        </div>
      `,
      icon: "warning",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#007bff",
      customClass: {
        container: "swal-container-custom",
      },
    });
    return;
  }

  // 1. Recolectar Especificaciones (incluyendo marca y modelo)
  const especificaciones = [];
  // Añadir marca y modelo como las primeras especificaciones
  especificaciones.push({
    Clave: "Marca",
    Valor: marca,
  });
  especificaciones.push({
    Clave: "Modelo",
    Valor: modelo,
  });

  document.querySelectorAll(".especificacion-fila").forEach((fila) => {
    const clave = fila.querySelector(".especificacion-clave").value.trim();
    const valor = fila.querySelector(".especificacion-valor").value.trim();
    if (clave && valor) {
      especificaciones.push({ Clave: clave, Valor: valor });
    }
  });

  // 2. Recolectar datos de la Primera Unidad
  const primeraUnidad = {
    NumeroSerie: nroSerie,
    EstadoId: parseInt(estadoEquipoId, 10),
    IdPersona:
      parseInt(document.getElementById("unidad-responsable").value, 10) || null,
  };

  // 3. Recolectar datos del Modelo
  const modeloData = {
    Ine: document.getElementById("crear-ine").value.trim(),
    Nne: nne,
    TipoEquipoId: tipoEquipoId,
    Observaciones: document.getElementById("crear-observaciones").value.trim(),
    Marca: marca,
    Modelo: modelo,
    Ubicacion: ubicacion,
  };

  // 4. Construir el objeto de Alta Completa
  const altaCompletaData = {
    ...modeloData,
    Especificaciones: especificaciones,
    PrimeraUnidad: primeraUnidad,
  };

  // 5. Mostrar indicador de carga
  Swal.fire({
    title: "Creando equipo...",
    text: "Por favor espere mientras se procesa la información",
    icon: "info",
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    },
  });

  // 6. Enviar a la API
  console.log(
    "Datos que se van a enviar:",
    JSON.stringify(altaCompletaData, null, 2)
  );
  const resultado = await crearModelo(altaCompletaData);

  if (resultado) {
    modalCrearModelo.hide();
    Swal.fire({
      title: "✅ ¡Equipo Creado!",
      text: `El equipo ${nne} ha sido registrado exitosamente`,
      icon: "success",
      confirmButtonText: "Continuar",
      confirmButtonColor: "#28a745",
    });
    cargarEquipos(); // Recargar la tabla para mostrar el nuevo equipo
  } else {
    Swal.fire({
      title: "❌ Error al Crear",
      text: "No se pudo crear el equipo. Verifique los datos e intente nuevamente.",
      icon: "error",
      confirmButtonText: "Reintentar",
      confirmButtonColor: "#dc3545",
    });
  }
}

/**
 * Obtiene la lista de tipos de equipo desde la API y los carga en el select del formulario de creación.
 */
async function cargarTiposEquipo() {
  try {
    const tipos = await fetch(API_URL_TIPO_EQUIPO).then((res) =>
      res.ok ? res.json() : Promise.reject(res)
    );
    const select = document.getElementById("crear-tipo-equipo");
    select.innerHTML =
      '<option value="" selected disabled>Seleccionar una categoría...</option>';
    tipos.forEach((tipo) => {
      const option = document.createElement("option");
      option.value = tipo.id;
      option.textContent = tipo.nombre;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los tipos de equipo:", error);
    const select = document.getElementById("modelo-tipo");
    select.innerHTML =
      '<option value="" selected disabled>Error al cargar categorías</option>';
    mostrarAlerta("No se pudieron cargar las categorías de equipo.", "error");
  }
}

/**
 * Obtiene la lista de estados de equipo desde la API y los carga en el select.
 */
async function cargarEstadosEquipos() {
  try {
    const estados = await fetch(API_URL_ESTADOS).then((res) =>
      res.ok ? res.json() : Promise.reject(res)
    );
    const select = document.getElementById("unidad-estado");
    select.innerHTML = '<option value="">Seleccionar un estado...</option>'; // Opción por defecto
    estados.forEach((estado) => {
      const option = document.createElement("option");
      option.value = estado.id;
      option.textContent = estado.descripcion;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Error al cargar los estados de equipo:", error);
    mostrarAlerta("No se pudieron cargar los estados de equipo.", "error");
  }
}

/**
 * Abre el modal para agregar una nueva unidad, asegurándose de que el ID del equipo esté establecido.
 */
function abrirModalAgregarUnidad() {
  if (!equipoIdActual) {
    mostrarAlerta("No se ha seleccionado un modelo de equipo válido.", "error");
    return;
  }
  const form = document.getElementById("formAgregarUnidad");
  form.reset();
  document.getElementById("unidad-equipo-id").value = equipoIdActual;
  modalAgregarUnidad.show();
}

/**
 * Envía la solicitud para crear una nueva unidad física.
 * @param {Object} unidad - La nueva unidad a crear.
 * @returns {Promise<Object>} La respuesta de la API.
 */
async function crearUnidad(unidad) {
  try {
    const respuesta = await fetch(`${API_URL}/unidades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(unidad),
    });
    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      throw new Error(errorData.message || "Error al crear la unidad.");
    }
    return await respuesta.json();
  } catch (error) {
    console.error("Error al crear la unidad:", error);
    mostrarAlerta(`No se pudo crear la unidad: ${error.message}`, "error");
    return null;
  }
}

/**
 * Maneja el envío del formulario para agregar una nueva unidad.
 * @param {Event} event - El evento de submit del formulario.
 */
async function guardarUnidad(event) {
  event.preventDefault();

  const unidad = {
    id_equipo: document.getElementById("unidad-equipo-id").value,
    nro_serie: document.getElementById("unidad-nro-serie").value,
    id_estado: document.getElementById("unidad-estado").value,
    id_persona: document.getElementById("unidad-responsable").value || null,
  };

  if (!unidad.id_equipo || !unidad.nro_serie || !unidad.id_estado) {
    mostrarAlerta("Por favor, complete todos los campos requeridos.", "error");
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/unidades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(unidad),
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      throw new Error(errorData.message || "Error al crear la unidad.");
    }

    modalAgregarUnidad.hide();
    mostrarAlerta("Unidad agregada con éxito.", "success");
    cargarModelos(); // Recargamos la tabla principal para reflejar el cambio en el contador de unidades.
  } catch (error) {
    console.error("Error al guardar la unidad:", error);
    mostrarAlerta(`No se pudo crear la unidad: ${error.message}`, "error");
  }
}

//-----------------------------------------------------------------------------------------------------
// MANEJO DE ACCIONES DE LA TABLA (DETALLES, INVENTARIO, ELIMINACIÓN)
//-----------------------------------------------------------------------------------------------------

/**
 * Muestra el modal de inventario con el recuento de equipos por estado.
 * @param {string} nne - El NNE del grupo de equipos.
 */
async function mostrarInventario(nne) {
  // Limpiar campos
  document.getElementById("totalEquiposNNE").textContent = "...";
  document.getElementById("enServicioNNE").textContent = "...";
  document.getElementById("fueraServicioNNE").textContent = "...";
  document.getElementById(
    "nneTitle"
  ).textContent = `Inventario del NNE: ${nne}`;

  // Limpiar y ocultar sección de motivos
  const seccionMotivos = document.getElementById("seccionMotivosFueraServicio");
  const listaMotivos = document.getElementById("listaMotivosFueraServicio");
  seccionMotivos.style.display = "none";
  listaMotivos.innerHTML = "";

  try {
    const resp = await fetch(
      `${CONFIG.API_BASE_URL}/equipos/nne/${encodeURIComponent(
        nne
      )}/inventarioresumen`
    );
    console.log("[DEBUG-Inventario] Response status:", resp.status);
    if (!resp.ok)
      throw new Error("No se pudo obtener el resumen de inventario");
    const resumen = await resp.json();
    console.log("[DEBUG-Inventario] Resumen recibido:", resumen);

    // Actualizar los números principales
    document.getElementById("totalEquiposNNE").textContent = resumen.total;
    document.getElementById("enServicioNNE").textContent = resumen.enServicio;
    document.getElementById("fueraServicioNNE").textContent =
      resumen.fueraDeServicio;

    console.log("[DEBUG-Inventario] Valores asignados:", {
      total: resumen.total,
      enServicio: resumen.enServicio,
      fueraDeServicio: resumen.fueraDeServicio,
    });

    // Mostrar detalle de motivos fuera de servicio si existen
    if (
      resumen.detalleFueraDeServicio &&
      resumen.detalleFueraDeServicio.length > 0
    ) {
      // Mostrar la sección de motivos
      seccionMotivos.style.display = "block";

      // Crear la lista de motivos
      const motivosHTML = resumen.detalleFueraDeServicio
        .map(
          (motivo) => `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <span class="text-danger">
                        <i class="bi bi-dot"></i>
                        <strong>${motivo.estado}:</strong>
                    </span>
                    <span class="badge bg-danger">${motivo.cantidad}</span>
                </div>
            `
        )
        .join("");

      listaMotivos.innerHTML = motivosHTML;
    }
  } catch (error) {
    document.getElementById("totalEquiposNNE").textContent = "0";
    document.getElementById("enServicioNNE").textContent = "0";
    document.getElementById("fueraServicioNNE").textContent = "0";
    console.error("Error al obtener inventario:", error);
  }
  // Mostrar el modal
  if (typeof modalInventario === "undefined" || !modalInventario) {
    modalInventario = new bootstrap.Modal(
      document.getElementById("modalInventario")
    );
  }
  modalInventario.show();
}

/**
 * Muestra el modal con los detalles de cada unidad de un grupo de equipos.
 * @param {string} nne - El NNE del grupo de equipos.
 */

/**
 * Cambia la vista del modal de detalles a modo de edición.
 */
function activarModoEdicion() {
  // Guardar copia de los datos originales para restaurar si cancela
  datosOriginalesEdicion = {
    ine: document.getElementById("input-ine").value,
    nne: document.getElementById("input-nne").value,
    nroSerie: document.getElementById("input-nro-serie").value,
    estadoId: document.getElementById("input-estado").value,
    tipoEquipoId: document.getElementById("input-tipo").value,
    ubicacion: document.getElementById("input-ubicacion").value,
    observaciones: document.getElementById("input-observaciones").value,
    especificaciones: obtenerEspecificacionesOriginales(),
  };
  // Logs para depuración

  console.log("Activando modo edición");
  console.log("Equipo actual:", window.__equipoDetallesActual);
  // Llenar los inputs de ubicación y observaciones al entrar en modo edición
  if (window.__equipoDetallesActual) {
    const inputUbicacion = document.getElementById("input-ubicacion");
    if (inputUbicacion)
      inputUbicacion.value = window.__equipoDetallesActual.ubicacion || "";
    const inputObservaciones = document.getElementById("input-observaciones");
    if (inputObservaciones)
      inputObservaciones.value =
        window.__equipoDetallesActual.observaciones || "";
  }
  // Logs para depuración
  const inputUbicacion = document.getElementById("input-ubicacion");
  const inputObservaciones = document.getElementById("input-observaciones");
  console.log(
    "[Antes de activar edición] Ubicación input:",
    inputUbicacion ? inputUbicacion.value : "(no input)"
  );
  console.log(
    "[Antes de activar edición] Observaciones input:",
    inputObservaciones ? inputObservaciones.value : "(no input)"
  );
  const modalBody = document.querySelector("#modalDetallesEquipo .modal-body");
  modalBody
    .querySelectorAll(".campo-display")
    .forEach((el) => el.classList.add("d-none"));
  modalBody
    .querySelectorAll(".campo-edit")
    .forEach((el) => el.classList.remove("d-none"));
  document.getElementById("btn-editar").classList.add("d-none");
  document.getElementById("btn-guardar-cambios").classList.remove("d-none");
  document.getElementById("btn-cancelar-edicion").classList.remove("d-none");

  // Logs para depuración después de activar edición
  console.log(
    "[Después de activar edición] Ubicación input:",
    inputUbicacion ? inputUbicacion.value : "(no input)"
  );
  console.log(
    "[Después de activar edición] Observaciones input:",
    inputObservaciones ? inputObservaciones.value : "(no input)"
  );

  // Poblar los selects de Estado, Tipo y Responsable
  cargarSelectEstadoTipoResponsable();
  // Hacer editables las especificaciones técnicas
  habilitarEdicionEspecificaciones();
}

async function cargarSelectEstadoTipoResponsable() {
  // Obtener el equipo actual para extraer los IDs
  const equipo = window.__equipoDetallesActual;
  // Estado
  const estadoSelect = document.getElementById("input-estado");
  if (estadoSelect) {
    estadoSelect.innerHTML = "";
    const res = await fetch(API_URL_ESTADOS);
    const estados = await res.json();
    // Usar el estadoId actual del equipo (preferir unidad si existe)
    const estadoIdActual =
      equipo?.unidades?.[0]?.estadoId ?? equipo?.estadoId ?? "";
    estados.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e.id || e.estadoId || e.estado_id;
      opt.textContent = e.nombre || e.estado || e.nombre_estado;
      if (String(opt.value) === String(estadoIdActual)) opt.selected = true;
      estadoSelect.appendChild(opt);
    });
    console.log(
      "[cargarSelectEstadoTipoResponsable] EstadoId actual:",
      estadoIdActual,
      "Valor seleccionado:",
      estadoSelect.value
    );
  }
  // Tipo de equipo
  const tipoSelect = document.getElementById("input-tipo");
  if (tipoSelect) {
    tipoSelect.innerHTML = "";
    const res = await fetch(API_URL_TIPO_EQUIPO);
    const tipos = await res.json();
    // Usar el tipoId actual del equipo
    const tipoIdActual = equipo?.tipoId || equipo?.tipoEquipoId || "";
    tipos.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id || t.tipoEquipoId || t.tipo_equipo_id;
      opt.textContent = t.nombre || t.tipo || t.nombre_tipo;
      if (String(opt.value) === String(tipoIdActual)) opt.selected = true;
      tipoSelect.appendChild(opt);
    });
    console.log(
      "[cargarSelectEstadoTipoResponsable] TipoId actual:",
      tipoIdActual,
      "Valor seleccionado:",
      tipoSelect.value
    );
  }
  // Responsable
  const responsableSelect = document.getElementById("input-responsable");
  if (responsableSelect) {
    responsableSelect.innerHTML = "";

    // Agregar opción 'Sin asignar' primero
    const opcionSinAsignar = document.createElement("option");
    opcionSinAsignar.value = "";
    opcionSinAsignar.textContent = "Sin asignar";
    responsableSelect.appendChild(opcionSinAsignar);

    const res = await fetch(API_URL_PERSONA);
    const personas = await res.json();
    // Usar el personaId actual de la unidad (si existe)
    const responsableIdActual =
      equipo?.unidades?.[0]?.personaId ?? equipo?.responsableId ?? "";

    let responsableSeleccionado = false;
    personas.forEach((p) => {
      const opt = document.createElement("option");
      opt.value =
        p.id_persona ||
        p.IdPersona ||
        p.idPersona ||
        p.id ||
        p.personaId ||
        p.persona_id;
      opt.textContent = `${p.NombreGrado || p.nombreGrado || ""} ${
        p.NombreArmEsp || p.nombreArmEsp || ""
      } ${p.Nombre || p.nombre || ""} ${p.Apellido || p.apellido || ""}`
        .replace(/\s+/g, " ")
        .trim();

      console.log("[cargarSelectEstadoTipoResponsable] Persona:", p);
      console.log(
        "[cargarSelectEstadoTipoResponsable] opt.value asignado:",
        opt.value
      );
      console.log(
        "[cargarSelectEstadoTipoResponsable] opt.textContent:",
        opt.textContent
      );
      if (
        String(opt.value) === String(responsableIdActual) &&
        opt.value !== ""
      ) {
        opt.selected = true;
        responsableSeleccionado = true;
      }
      responsableSelect.appendChild(opt);
    });

    // Si no hay responsable seleccionado, seleccionar 'Sin asignar'
    if (!responsableSeleccionado) {
      opcionSinAsignar.selected = true;
    }

    console.log(
      "[cargarSelectEstadoTipoResponsable] ResponsableId actual:",
      responsableIdActual,
      "Valor seleccionado:",
      responsableSelect.value
    );
  }
}

function habilitarEdicionEspecificaciones() {
  const ul = document.getElementById("detalle-especificaciones");
  if (!ul) return;
  ul.querySelectorAll("li").forEach((li) => {
    if (!li.querySelector("input")) {
      const txt = li.textContent.split(":");
      if (txt.length >= 2) {
        const clave = txt[0].replace(/^\s*\u2022\s*/, "").trim();
        const valor = txt.slice(1).join(":").trim();
        li.innerHTML = `
          <div class="especificacion-editable">
            <input class="especificacion-clave" value="${clave}" placeholder="Clave">
            <span class="especificacion-separador">:</span>
            <input class="especificacion-valor" value="${valor}" placeholder="Valor">
            <button class="btn btn-danger btn-sm btn-eliminar-especificacion">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        `;
        li.querySelector(".btn-eliminar-especificacion").addEventListener(
          "click",
          () => li.remove()
        );
      }
    }
  });
}

function agregarCampoEspecificacionDetalle() {
  console.log(
    "[agregarCampoEspecificacionDetalle] Iniciando agregado de especificación"
  );
  const ul = document.getElementById("detalle-especificaciones");
  if (!ul) {
    console.error(
      "[agregarCampoEspecificacionDetalle] No se encontró el elemento detalle-especificaciones"
    );
    return;
  }
  console.log(
    "[agregarCampoEspecificacionDetalle] Elemento ul encontrado:",
    ul
  );

  const li = document.createElement("li");
  li.className = "list-group-item ps-0 especificacion-nueva";
  li.innerHTML = `
    <div class="especificacion-editable">
      <input class="especificacion-clave" placeholder="Clave">
      <span class="especificacion-separador">:</span>
      <input class="especificacion-valor" placeholder="Valor">
      <button class="btn btn-danger btn-sm btn-eliminar-especificacion">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;

  const btnEliminar = li.querySelector(".btn-eliminar-especificacion");
  if (btnEliminar) {
    btnEliminar.addEventListener("click", () => {
      console.log(
        "[agregarCampoEspecificacionDetalle] Eliminando especificación"
      );
      li.remove();
    });
  }

  ul.appendChild(li);
  console.log(
    "[agregarCampoEspecificacionDetalle] Especificación agregada. Total elementos:",
    ul.children.length
  );
}

/**
 * Guarda los cambios realizados en el modal de detalles.
 */
let nroSerieOriginal = null;

async function guardarCambiosDetalles() {
  const modalEl = document.getElementById("modalDetallesEquipo");
  const nne = document.getElementById("detalle-nne").textContent.trim();
  const nroSerie = document.getElementById("input-nro-serie").value.trim();
  const equipoData = {
    ine: document.getElementById("input-ine").value,
    nne: document.getElementById("input-nne").value,
    nroSerie: nroSerie,
    marca: (function () {
      const input = document.getElementById("input-marca");
      if (input && !input.classList.contains("d-none"))
        return input.value.trim();
      const el = document.getElementById("detalle-marca");
      if (el) return el.textContent.trim() === "-" ? "" : el.textContent.trim();
      return window.__equipoDetallesActual?.marca || "";
    })(),
    modelo: (function () {
      const input = document.getElementById("input-modelo");
      if (input && !input.classList.contains("d-none"))
        return input.value.trim();
      const el = document.getElementById("detalle-modelo");
      if (el) return el.textContent.trim() === "-" ? "" : el.textContent.trim();
      return window.__equipoDetallesActual?.modelo || "";
    })(),
    tipoEquipoId: String(document.getElementById("input-tipo").value),
    ubicacion: document.getElementById("input-ubicacion").value,
    observaciones: document.getElementById("input-observaciones").value,
    especificaciones: null, // Se asignará después
  };

  // Obtener especificaciones del DOM
  let especificacionesProcesadas = []; // Declarar fuera del try-catch

  console.log(
    "[guardarCambiosDetalles] LLAMANDO A obtenerEspecificacionesOriginales()"
  );
  console.log(
    "[guardarCambiosDetalles] - DOM antes de obtener especificaciones:",
    document.getElementById("detalle-especificaciones")?.innerHTML
  );

  try {
    const especificacionesBruto = obtenerEspecificacionesOriginales();
    console.log(
      "[guardarCambiosDetalles] RESULTADO de obtenerEspecificacionesOriginales():",
      especificacionesBruto
    );

    // Agregar log detallado de cada especificación antes de transformar
    console.log(
      "[guardarCambiosDetalles] DETALLES de especificaciones brutas:"
    );
    especificacionesBruto.forEach((spec, index) => {
      console.log(`[guardarCambiosDetalles] Spec ${index}:`, spec);
      console.log(
        `[guardarCambiosDetalles] Spec ${index} - clave:`,
        spec.clave
      );
      console.log(
        `[guardarCambiosDetalles] Spec ${index} - valor:`,
        spec.valor
      );
      console.log(
        `[guardarCambiosDetalles] Spec ${index} - Clave:`,
        spec.Clave
      );
      console.log(
        `[guardarCambiosDetalles] Spec ${index} - Valor:`,
        spec.Valor
      );
    });

    // Transformar las especificaciones al formato que espera el backend (solo Clave y Valor)
    especificacionesProcesadas = especificacionesBruto.map((spec) => ({
      Clave: spec.clave || spec.Clave,
      Valor: spec.valor || spec.Valor,
    }));

    console.log(
      "[guardarCambiosDetalles] Especificaciones transformadas para backend:",
      especificacionesProcesadas
    );
    console.log(
      "[guardarCambiosDetalles] - cantidad de especificaciones:",
      especificacionesProcesadas.length
    );
  } catch (error) {
    console.error(
      "[guardarCambiosDetalles] ERROR al obtener especificaciones:",
      error
    );
    console.error("[guardarCambiosDetalles] Stack trace:", error.stack);
    especificacionesProcesadas = [];
  }

  // Primera unidad con responsable y estado
  const responsableElement = document.getElementById("input-responsable");
  const responsableId = responsableElement?.value || null;
  const estadoId = document.getElementById("input-estado")?.value || null;
  const nroSerieUnidad =
    document.getElementById("input-nro-serie")?.value || null;

  console.log("[guardarCambiosDetalles] RESPONSABLE DEBUG:");
  console.log(
    "[guardarCambiosDetalles] - responsableElement:",
    responsableElement
  );
  console.log(
    "[guardarCambiosDetalles] - responsableElement.value:",
    responsableElement?.value
  );
  console.log("[guardarCambiosDetalles] - responsableId (raw):", responsableId);
  console.log(
    "[guardarCambiosDetalles] - responsableId !== null:",
    responsableId !== null
  );
  console.log(
    '[guardarCambiosDetalles] - responsableId !== "null":',
    responsableId !== "null"
  );
  console.log(
    '[guardarCambiosDetalles] - responsableId !== "":',
    responsableId !== ""
  );

  const idPersonaFinal =
    responsableId && responsableId !== "null" && responsableId !== ""
      ? parseInt(responsableId)
      : null;
  console.log("[guardarCambiosDetalles] - idPersonaFinal:", idPersonaFinal);

  equipoData.primeraUnidad = {
    numeroSerie: nroSerieUnidad,
    estadoId: estadoId ? parseInt(estadoId) : null,
    idPersona: idPersonaFinal,
  };

  console.log("[guardarCambiosDetalles] Payload equipoData:", equipoData);
  console.log(
    "[guardarCambiosDetalles] primeraUnidad:",
    equipoData.primeraUnidad
  );
  // Si no hay NNE, usar nroSerie para actualizar y refrescar
  console.log("[guardarCambiosDetalles] nne:", nne);
  console.log("[guardarCambiosDetalles] nroSerie:", nroSerie);
  console.log(
    "[guardarCambiosDetalles] window.__equipoDetallesActual:",
    window.__equipoDetallesActual
  );
  let exito = false;
  // Si se está editando el número de serie, prioriza el endpoint por nroSerie
  if (nroSerie && nroSerieOriginal) {
    console.log(
      "[guardarCambiosDetalles] Forzando uso de actualizarEquipoPorNroSerie"
    );
    console.log(
      "[guardarCambiosDetalles] nroSerieOriginal usado en URL:",
      nroSerieOriginal
    );
    exito = await actualizarEquipoPorNroSerie(nroSerieOriginal, equipoData);
  } else if (nne && nne !== "-") {
    console.log("[guardarCambiosDetalles] Usando actualizarEquipo con NNE");
    exito = await actualizarEquipo(nne, equipoData);
  } else {
    console.error(
      "[guardarCambiosDetalles] No hay identificador válido para actualizar (ni NNE ni nroSerieOriginal)"
    );
    mostrarAlerta(
      "No se pudo determinar el identificador del equipo para actualizar. Contacte al administrador.",
      "error"
    );
  }
  if (exito) {
    mostrarAlerta("Detalles actualizados con éxito.", "success");
    // Refresca los datos del modal antes de cerrar
    if (nne && nne !== "-") {
      await window.mostrarDetalles(nne);
    } else if (nroSerie) {
      await window.mostrarDetalles(null, nroSerie);
    }
    resetearModalDetalles(); // Vuelve a modo solo lectura antes de cerrar
    setTimeout(() => {
      modalDetalles.hide();
    }, 1200);
    cargarEquipos();
  } else {
    mostrarAlerta("No se pudieron guardar los cambios.", "error");
  }
}

// Nueva función para actualizar por nroSerie
async function actualizarEquipoPorNroSerie(nroSerie, equipoData) {
  try {
    console.log("[actualizarEquipoPorNroSerie] nroSerie:", nroSerie);
    console.log("[actualizarEquipoPorNroSerie] equipoData:", equipoData);
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/equipos/nroSerie/${encodeURIComponent(nroSerie)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipoData),
      }
    );
    console.log(
      "[actualizarEquipoPorNroSerie] response.status:",
      response.status
    );
    console.log("[actualizarEquipoPorNroSerie] response.ok:", response.ok);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[actualizarEquipoPorNroSerie] Error response:", errorText);
    }
    return response.ok;
  } catch (e) {
    console.error("[actualizarEquipoPorNroSerie] Exception:", e);
    return false;
  }
}

// Función para actualizar por NNE
async function actualizarEquipo(nne, equipoData) {
  try {
    console.log("[actualizarEquipo] nne:", nne);
    console.log("[actualizarEquipo] equipoData:", equipoData);
    const response = await fetch(
      `${CONFIG.API_BASE_URL}/equipos/nne/${encodeURIComponent(nne)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipoData),
      }
    );
    console.log("[actualizarEquipo] response.status:", response.status);
    console.log("[actualizarEquipo] response.ok:", response.ok);
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[actualizarEquipo] Error response:", errorText);
    }
    return response.ok;
  } catch (e) {
    console.error("[actualizarEquipo] Exception:", e);
    return false;
  }
}

// Extrae especificaciones del <ul> tanto si hay inputs como si hay solo texto
function obtenerEspecificacionesOriginales() {
  const ul = document.getElementById("detalle-especificaciones");
  if (!ul) {
    console.log(
      "[obtenerEspecificacionesOriginales] No se encontró el elemento detalle-especificaciones"
    );
    return [];
  }

  const liElements = ul.querySelectorAll("li");
  console.log(
    "[obtenerEspecificacionesOriginales] Elementos li encontrados:",
    liElements.length
  );

  const specs = [];

  liElements.forEach((li, index) => {
    console.log(
      `[obtenerEspecificacionesOriginales] Procesando li ${index}:`,
      li.innerHTML
    );

    // Buscar inputs (modo edición)
    const claveInput = li.querySelector(".especificacion-clave");
    const valorInput = li.querySelector(".especificacion-valor");

    console.log(
      `[obtenerEspecificacionesOriginales] li ${index} - claveInput:`,
      claveInput
    );
    console.log(
      `[obtenerEspecificacionesOriginales] li ${index} - valorInput:`,
      valorInput
    );

    if (claveInput && valorInput) {
      // Modo edición - obtener valores de inputs
      const clave = claveInput.value.trim();
      const valor = valorInput.value.trim();
      console.log(
        `[obtenerEspecificacionesOriginales] li ${index} - clave: '${clave}', valor: '${valor}'`
      );
      if (clave && valor) {
        specs.push({ clave, valor });
        console.log(
          `[obtenerEspecificacionesOriginales] li ${index} - AGREGADO: {clave: '${clave}', valor: '${valor}'}`
        );
      } else {
        console.log(
          `[obtenerEspecificacionesOriginales] li ${index} - RECHAZADO: valores vacíos`
        );
      }
    } else {
      // Si solo hay texto (modo solo lectura)
      const strong = li.querySelector("strong");
      console.log(
        `[obtenerEspecificacionesOriginales] li ${index} - strong encontrado:`,
        strong
      );
      if (strong) {
        const claveCompleta = strong.textContent || "";
        const clave = claveCompleta.replace(":", "").trim();
        let valor = "";
        if (strong.nextSibling) {
          valor = strong.nextSibling.textContent
            ? strong.nextSibling.textContent.trim()
            : "";
        }
        console.log(
          `[obtenerEspecificacionesOriginales] li ${index} - clave: '${clave}', valor: '${valor}'`
        );
        if (clave && valor) {
          specs.push({ clave, valor });
          console.log(
            `[obtenerEspecificacionesOriginales] li ${index} - AGREGADO: {clave: '${clave}', valor: '${valor}'}`
          );
        } else {
          console.log(
            `[obtenerEspecificacionesOriginales] li ${index} - RECHAZADO: valores vacíos`
          );
        }
      } else {
        console.log(
          `[obtenerEspecificacionesOriginales] li ${index} - no se encontró elemento strong`
        );
      }
    }
  });

  console.log(
    "[obtenerEspecificacionesOriginales] Especificaciones finales:",
    specs
  );
  return specs;
}

function resetearModalDetalles() {
  const modalBody = document.querySelector("#modalDetallesEquipo .modal-body");
  if (!modalBody) return;
  modalBody
    .querySelectorAll(".campo-display")
    .forEach((el) => el.classList.remove("d-none"));
  modalBody
    .querySelectorAll(".campo-edit")
    .forEach((el) => el.classList.add("d-none"));
  const btnEditar = document.getElementById("btn-editar");
  const btnGuardar = document.getElementById("btn-guardar-cambios");
  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
  if (btnEditar) btnEditar.classList.remove("d-none");
  if (btnGuardar) btnGuardar.classList.add("d-none");
  if (btnCancelarEdicion) btnCancelarEdicion.classList.add("d-none");
}

function cancelarEdicionDetalles() {
  if (!datosOriginalesEdicion) return;
  // Restaurar los valores originales en los inputs
  document.getElementById("input-ine").value = datosOriginalesEdicion.ine || "";
  document.getElementById("input-nne").value = datosOriginalesEdicion.nne || "";
  document.getElementById("input-nro-serie").value =
    datosOriginalesEdicion.nroSerie || "";
  document.getElementById("input-estado").value =
    datosOriginalesEdicion.estadoId || "";
  document.getElementById("input-tipo").value =
    datosOriginalesEdicion.tipoEquipoId || "";
  document.getElementById("input-ubicacion").value =
    datosOriginalesEdicion.ubicacion || "";
  document.getElementById("input-observaciones").value =
    datosOriginalesEdicion.observaciones || "";
  // Restaurar especificaciones en modo solo lectura (igual que mostrarDetalles)
  const ul = document.getElementById("detalle-especificaciones");
  if (ul) {
    ul.innerHTML = "";
    if (
      datosOriginalesEdicion.especificaciones &&
      datosOriginalesEdicion.especificaciones.length > 0
    ) {
      datosOriginalesEdicion.especificaciones.forEach((spec) => {
        const li = document.createElement("li");
        li.className = "list-group-item ps-0";
        li.innerHTML = `<i class='bi bi-dot text-primary'></i> <strong>${spec.clave}:</strong> ${spec.valor}`;
        ul.appendChild(li);
      });
    } else {
      const li = document.createElement("li");
      li.className = "list-group-item ps-0";
      li.textContent = "No hay especificaciones técnicas para este modelo.";
      ul.appendChild(li);
    }
  }
  resetearModalDetalles();
}

//-----------------------------------------------------------------------------------------------------
// MANEJO DE ACCIONES DE LA TABLA (CARGA INICIAL, ELIMINACIÓN)
//-----------------------------------------------------------------------------------------------------

/**
 * Carga los equipos desde la API, los agrupa por NNE y los muestra en la tabla principal.
 */
async function cargarEquipos() {
  try {
    // 1. Obtener todos los datos necesarios de la API
    const [equipos, unidades, estados] = await Promise.all([
      fetch(API_URL).then((res) => (res.ok ? res.json() : Promise.reject(res))),
      fetch(CONFIG.API_BASE_URL + "/unidadesequipo").then((res) =>
        res.ok ? res.json() : Promise.reject(res)
      ),
      fetch(API_URL_ESTADOS).then((res) =>
        res.ok ? res.json() : Promise.reject(res)
      ),
    ]);

    // Guardar datos globalmente para exportación
    window.equipos = equipos;
    window.unidades = unidades;
    window.estados = estados;

    const cuerpoTabla = document.getElementById("cuerpoTablaEquipos");
    const noEquipos = document.getElementById("no-equipos");
    const tablaEquipos = document.getElementById("tablaEquipos");

    // Limpiar la tabla
    cuerpoTabla.innerHTML = "";

    // Si no hay unidades, mostrar mensaje de tabla vacía
    if (!unidades || unidades.length === 0) {
      if (noEquipos && tablaEquipos) {
        // Ocultar la tabla y mostrar el mensaje
        tablaEquipos.style.display = "none";
        noEquipos.style.display = "block";
        // Restaurar el mensaje original de no equipos
        noEquipos.innerHTML = `
          <i class="bi bi-box-seam display-4 text-muted"></i>
          <h5 class="mt-3">No hay equipos registrados</h5>
          <p class="text-muted mb-0">Comienza agregando un nuevo registro</p>
        `;
      } else if (cuerpoTabla) {
        // Si no existe el elemento no-equipos, crear mensaje en la tabla
        if (tablaEquipos) {
          tablaEquipos.style.display = "table";
        }
        cuerpoTabla.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted">
              <i class="bi bi-inbox fs-1 d-block mb-2"></i>
              No hay equipos registrados
            </td>
          </tr>`;
      }
      return;
    } else {
      // Si hay datos, mostrar la tabla y ocultar el mensaje
      if (noEquipos && tablaEquipos) {
        noEquipos.style.display = "none";
        tablaEquipos.style.display = "table";
      }
    }

    // Crear mapas para acceso rápido
    const equiposMap = new Map(equipos.map((e) => [e.id, e]));
    const estadosMap = new Map(estados.map((e) => [e.id, e.nombre]));

    // Logs de depuración
    console.log("equipos:", equipos);
    console.log("equiposMap:", Array.from(equiposMap.entries()));
    console.log("unidades:", unidades);
    console.log("estados:", estados);

    // Renderizar una fila por unidad física
    unidades.forEach((unidad, idx) => {
      const equipo = equiposMap.get(unidad.equipoId) || {};
      console.log(`unidad[${idx}]:`, unidad, "-> equipo encontrado:", equipo);
      const estadoNombre = estadosMap.get(unidad.estadoId) || "";
      const fila = `
                <tr>
                    <td>${idx + 1}</td>
                    <td>${equipo.ine || ""}</td>
                    <td>${equipo.nne || ""}</td>
                    <td>${unidad.nroSerie || ""}</td>
                    <td class="fw-bold ${
                      estadoNombre.startsWith("E/S")
                        ? "text-success"
                        : estadoNombre.startsWith("F/S") ||
                          estadoNombre.startsWith("BAJA")
                        ? "text-danger"
                        : "text-warning"
                    }">${estadoNombre}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-warning me-1" title="Ver Detalles" onclick="mostrarDetalles('${
                          equipo.nne || ""
                        }', '${unidad.nroSerie || ""}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${
                          equipo.nne
                            ? `
                        <button class="btn btn-sm btn-info me-1" title="Ver Inventario" onclick="mostrarInventario('${equipo.nne}')">
                            <i class="bi bi-box-seam"></i>
                        </button>
                        <button class="btn btn-delete" title="Eliminar Modelo" onclick="confirmarEliminacion('${equipo.nne}', '')">
                            <i class="bi bi-trash"></i>
                        </button>`
                            : `
                        <button class="btn btn-sm btn-info me-1" title="Inventario no disponible" disabled>
                            <i class="bi bi-box-seam"></i>
                        </button>
                        <button class="btn btn-delete" title="Eliminar Equipo" onclick="confirmarEliminacion('', '${
                          unidad.nroSerie || ""
                        }')">
                            <i class="bi bi-trash"></i>
                        </button>`
                        }
                    </td>
                </tr>`;
      cuerpoTabla.innerHTML += fila;
    });
  } catch (error) {
    console.error("Error al cargar los equipos:", error);

    // Mostrar estado vacío en caso de error
    const cuerpoTabla = document.getElementById("cuerpoTablaEquipos");
    const noEquipos = document.getElementById("no-equipos");
    const tablaEquipos = document.getElementById("tablaEquipos");

    // Limpiar la tabla
    if (cuerpoTabla) {
      cuerpoTabla.innerHTML = "";
    }

    // Ocultar la tabla y mostrar el mensaje de no equipos
    if (tablaEquipos && noEquipos) {
      tablaEquipos.style.display = "none";
      noEquipos.style.display = "block";
      // Cambiar el mensaje para indicar que hay un error
      noEquipos.innerHTML = `
        <i class="bi bi-exclamation-triangle display-4 text-warning"></i>
        <h5 class="mt-3">Error al cargar los equipos</h5>
        <p class="text-muted mb-0">Verifique la conexión al servidor</p>
      `;
    } else if (cuerpoTabla && !noEquipos) {
      // Si no existe el elemento no-equipos, crear mensaje en la tabla
      if (tablaEquipos) {
        tablaEquipos.style.display = "table";
      }
      cuerpoTabla.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">
            <i class="bi bi-exclamation-triangle fs-1 d-block mb-2 text-warning"></i>
            <p>Error al cargar los equipos</p>
            <p class="small">Verifique la conexión al servidor</p>
          </td>
        </tr>`;
    }

    mostrarAlerta(
      "No se pudo cargar la lista de equipos. Verifique la conexión al servidor.",
      "error"
    );
  }
}

// Función para mostrar el modal de detalles del equipo (nuevo diseño, robusta y solo con los IDs existentes)
window.mostrarDetalles = async function (nne, nroSerie) {
  resetearModalDetalles();
  try {
    let response, equipo;
    if (nne && nne !== "-") {
      // 1. Obtener datos del equipo por NNE
      response = await fetch(`${CONFIG.API_BASE_URL}/equipos/nne/${nne}`);
    } else if (nroSerie) {
      // 1b. Obtener datos del equipo por nroSerie
      response = await fetch(
        `${CONFIG.API_BASE_URL}/equipos/nroSerie/${encodeURIComponent(
          nroSerie
        )}`
      );
    } else {
      throw new Error(
        "No se proporcionó NNE ni nroSerie para buscar el equipo"
      );
    }
    if (!response.ok)
      throw new Error("No se pudo obtener el detalle del equipo");
    equipo = await response.json();

    // Agregar número de serie al objeto para uso posterior
    const nroSerieOriginal =
      (equipo.unidades &&
        equipo.unidades[0] &&
        (equipo.unidades[0].nroSerie || equipo.unidades[0].nro_serie)) ||
      "";
    equipo.nroSerie = nroSerieOriginal;

    window.__equipoDetallesActual = equipo;
    console.log(
      "[window.mostrarDetalles] ===== DATOS COMPLETOS DEL EQUIPO ====="
    );
    console.log("[window.mostrarDetalles] Equipo completo:", equipo);
    console.log("[window.mostrarDetalles] equipo.unidades:", equipo.unidades);
    if (equipo.unidades && equipo.unidades[0]) {
      console.log(
        "[window.mostrarDetalles] Primera unidad:",
        equipo.unidades[0]
      );
      console.log(
        "[window.mostrarDetalles] Persona en unidad:",
        equipo.unidades[0].persona
      );
    }
    console.log(
      "[window.mostrarDetalles] equipo.especificaciones:",
      equipo.especificaciones
    );
    console.log(
      "[window.mostrarDetalles] ======================================="
    );

    // 2. Poblar campos de la columna Datos Generales
    const elIne = document.getElementById("detalle-ine");
    const inputIne = document.getElementById("input-ine");
    if (elIne) elIne.textContent = equipo.ine || "-";
    if (inputIne) inputIne.value = equipo.ine || "";

    const elNne = document.getElementById("detalle-nne");
    const inputNne = document.getElementById("input-nne");
    if (elNne) elNne.textContent = equipo.nne || "-";
    if (inputNne) inputNne.value = equipo.nne || "";

    const elNroSerie = document.getElementById("detalle-nro-serie");
    const inputNroSerie = document.getElementById("input-nro-serie");
    const nroSerieValue =
      (equipo.unidades &&
        equipo.unidades[0] &&
        (equipo.unidades[0].nroSerie || equipo.unidades[0].nro_serie)) ||
      "";
    if (elNroSerie) elNroSerie.textContent = nroSerieValue || "-";
    if (inputNroSerie) inputNroSerie.value = nroSerieValue;

    const elEstado = document.getElementById("detalle-estado");
    if (elEstado) {
      // Limpia clases previas
      elEstado.className = "";
      const estadoNombre =
        (equipo.unidades &&
          equipo.unidades[0] &&
          equipo.unidades[0].estado &&
          (equipo.unidades[0].estado.nombre ||
            equipo.unidades[0].estado_nombre)) ||
        "-";
      elEstado.textContent = estadoNombre;
      if (estadoNombre.startsWith("E/S")) {
        elEstado.classList.add("text-success", "fw-bold"); // Verde
      } else if (
        estadoNombre.startsWith("F/S") ||
        estadoNombre.startsWith("BAJA")
      ) {
        elEstado.classList.add("text-danger", "fw-bold"); // Rojo
      } else {
        elEstado.classList.add("text-warning", "fw-bold"); // Amarillo
      }
    }
    const elTipo = document.getElementById("detalle-tipo");
    if (elTipo) elTipo.textContent = equipo.tipoNombre || equipo.tipo || "-";

    // 3. Poblar campos de la columna Responsable, Ubicación y Observaciones
    const personaId =
      equipo.unidades && equipo.unidades[0] && equipo.unidades[0].personaId;
    const persona =
      equipo.unidades && equipo.unidades[0] && equipo.unidades[0].persona;
    console.log("[window.mostrarDetalles] ===== ANÁLISIS RESPONSABLE =====");
    console.log("[window.mostrarDetalles] PersonaId:", personaId);
    console.log("[window.mostrarDetalles] Objeto persona encontrado:", persona);
    let responsable = "Sin asignar";

    // Solo procesar si hay personaId y persona con datos válidos
    if (personaId && persona && (persona.nombre || persona.apellido)) {
      const grado = persona.nombreGrado || "";
      const arma = persona.nombreArmEsp || "";
      const nombre = persona.nombre || "";
      const apellido = persona.apellido || "";
      console.log("[window.mostrarDetalles] Componentes del responsable:");
      console.log("  - grado:", grado);
      console.log("  - arma:", arma);
      console.log("  - nombre:", nombre);
      console.log("  - apellido:", apellido);
      const nombreCompleto = `${grado} ${arma} ${nombre} ${apellido}`
        .replace(/\s+/g, " ")
        .trim();
      if (nombreCompleto) {
        responsable = nombreCompleto;
      }
    } else {
      console.log(
        "[window.mostrarDetalles] No hay responsable asignado (personaId es null o persona sin datos)"
      );
    }
    const elResponsable = document.getElementById("detalle-responsable");
    if (elResponsable) elResponsable.textContent = responsable;
    console.log(
      "[window.mostrarDetalles] Responsable final asignado:",
      responsable
    );
    console.log("[window.mostrarDetalles] ================================");

    const elUbicacion = document.getElementById("detalle-ubicacion");
    if (elUbicacion) elUbicacion.textContent = equipo.ubicacion || "-";
    const elObservaciones = document.getElementById("detalle-observaciones");
    if (elObservaciones)
      elObservaciones.textContent = equipo.observaciones || "-";

    // 4. Poblar Especificaciones Técnicas
    const elMarca = document.getElementById("detalle-marca");
    if (elMarca) elMarca.textContent = equipo.marca || "-";
    const elModelo = document.getElementById("detalle-modelo");
    if (elModelo) elModelo.textContent = equipo.modelo || "-";

    const ulEspecificaciones = document.getElementById(
      "detalle-especificaciones"
    );
    if (ulEspecificaciones) {
      ulEspecificaciones.innerHTML = "";
      console.log(
        "[window.mostrarDetalles] ===== ANÁLISIS ESPECIFICACIONES ====="
      );
      console.log(
        "[window.mostrarDetalles] equipo.especificaciones:",
        equipo.especificaciones
      );
      console.log(
        "[window.mostrarDetalles] Tipo de especificaciones:",
        typeof equipo.especificaciones
      );
      console.log(
        "[window.mostrarDetalles] Es array:",
        Array.isArray(equipo.especificaciones)
      );
      if (equipo.especificaciones) {
        console.log(
          "[window.mostrarDetalles] Longitud del array:",
          equipo.especificaciones.length
        );
      }
      if (equipo.especificaciones && equipo.especificaciones.length > 0) {
        console.log(
          "[window.mostrarDetalles] Procesando",
          equipo.especificaciones.length,
          "especificaciones:"
        );
        equipo.especificaciones.forEach((spec, index) => {
          console.log(`[window.mostrarDetalles] Spec ${index}:`, spec);
          const li = document.createElement("li");
          li.className = "list-group-item ps-0";
          li.innerHTML = `<i class='bi bi-dot text-primary'></i> <strong>${spec.clave}:</strong> ${spec.valor}`;
          console.log(
            `[window.mostrarDetalles] Elemento creado para spec ${index}:`,
            li
          );
          ulEspecificaciones.appendChild(li);
          console.log(
            `[window.mostrarDetalles] Elemento agregado al DOM. Total hijos ahora:`,
            ulEspecificaciones.children.length
          );
        });
        console.log(
          "[window.mostrarDetalles] Contenido final del contenedor de especificaciones:",
          ulEspecificaciones.innerHTML
        );
      } else {
        console.log(
          "[window.mostrarDetalles] No hay especificaciones o array vacío"
        );
        const li = document.createElement("li");
        li.className = "list-group-item ps-0";
        li.textContent = "No hay especificaciones técnicas para este modelo.";
        ulEspecificaciones.appendChild(li);
      }
      console.log(
        "[window.mostrarDetalles] ====================================="
      );
    } else {
      console.error(
        "[window.mostrarDetalles] No se encontró el elemento detalle-especificaciones"
      );
    }

    // 5. Mostrar el modal
    if (window.modalDetalles) {
      window.modalDetalles.show();
    } else {
      console.error("[window.mostrarDetalles] Modal no encontrado");
    }
  } catch (error) {
    Swal.fire("Error", "No se pudo cargar el detalle del equipo.", "error");
  }
};

// Función duplicada eliminada - solo usar window.mostrarDetalles

/**
 * Muestra una alerta de confirmación antes de eliminar un equipo.
 * @param {string} nne - El NNE del equipo a eliminar (opcional).
 * @param {string} nroSerie - El número de serie del equipo a eliminar (opcional).
 */
function confirmarEliminacion(nne, nroSerie) {
  const tipoEliminacion = nne ? "modelo de equipo" : "equipo";
  const identificador = nne || nroSerie;

  Swal.fire({
    title: `¿Estás seguro que deseas eliminar este ${tipoEliminacion}?`,
    text: `Se eliminarán todos los datos asociados al ${tipoEliminacion} ${identificador}.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, ¡eliminar!",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      const exito = await eliminarEquipo(nne, nroSerie);
      if (exito) {
        mostrarAlerta(
          `${
            tipoEliminacion.charAt(0).toUpperCase() + tipoEliminacion.slice(1)
          } eliminado con éxito.`,
          "success"
        );
        cargarEquipos();
      } else {
        mostrarAlerta(`No se pudo eliminar el ${tipoEliminacion}.`, "error");
      }
    }
  });
}

/**
 * Elimina un equipo por NNE o número de serie.
 * @param {string} nne - El NNE del equipo a eliminar (opcional).
 * @param {string} nroSerie - El número de serie del equipo a eliminar (opcional).
 * @returns {Promise<boolean>} - True si se eliminó correctamente, false en caso contrario.
 */
async function eliminarEquipo(nne, nroSerie) {
  try {
    let url;
    if (nne && nne.trim() !== "" && nne !== "-") {
      // Eliminar por NNE
      url = `${API_URL}/nne/${encodeURIComponent(nne)}`;
      console.log("[eliminarEquipo] Eliminando por NNE:", nne);
    } else if (nroSerie && nroSerie.trim() !== "") {
      // Eliminar por número de serie
      url = `${API_URL}/nroSerie/${encodeURIComponent(nroSerie)}`;
      console.log("[eliminarEquipo] Eliminando por número de serie:", nroSerie);
    } else {
      console.error(
        "[eliminarEquipo] No se proporcionó NNE ni número de serie válido"
      );
      return false;
    }

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      console.log("[eliminarEquipo] Equipo eliminado exitosamente");
      return true;
    } else {
      console.error(
        "[eliminarEquipo] Error al eliminar equipo:",
        response.status,
        response.statusText
      );
      return false;
    }
  } catch (error) {
    console.error("[eliminarEquipo] Error en la petición:", error);
    return false;
  }
}

/**
 * Muestra una alerta simple utilizando SweetAlert2.
 * @param {string} mensaje - El mensaje a mostrar.
 * @param {string} tipo - El tipo de alerta (e.g., 'success', 'error', 'warning').
 */
function mostrarAlerta(mensaje, tipo) {
  Swal.fire({
    title: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    text: mensaje,
    icon: tipo,
    confirmButtonText: "Aceptar",
  });
}

/**
 * Activa el modo de edición en el modal de detalles
 */
function activarModoEdicion() {
  console.log("[activarModoEdicion] Activando modo edición");

  // Ocultar elementos de solo lectura y mostrar campos de edición
  const camposLectura = document.querySelectorAll(".campo-display");
  const camposEdicion = document.querySelectorAll(".campo-edit");

  camposLectura.forEach((campo) => campo.classList.add("d-none"));
  camposEdicion.forEach((campo) => campo.classList.remove("d-none"));

  // Poblar los campos de edición con los valores actuales
  poblarCamposEdicion();
}

/**
 * Cancela el modo de edición y vuelve al modo de solo lectura
 */
function cancelarEdicion() {
  console.log("[cancelarEdicion] Cancelando edición");

  // Mostrar elementos de solo lectura y ocultar campos de edición
  const camposLectura = document.querySelectorAll(".campo-display");
  const camposEdicion = document.querySelectorAll(".campo-edit");

  camposLectura.forEach((campo) => campo.classList.remove("d-none"));
  camposEdicion.forEach((campo) => campo.classList.add("d-none"));

  // Restaurar especificaciones a solo lectura
  restaurarEspecificacionesSoloLectura();
}

/**
 * Pobla los campos de edición con los valores actuales del equipo
 */
function poblarCamposEdicion() {
  console.log("[poblarCamposEdicion] Poblando campos de edición");

  // Obtener valores actuales de los elementos de solo lectura
  const ine = document.getElementById("detalle-ine")?.textContent || "";
  const nne = document.getElementById("detalle-nne")?.textContent || "";
  const nroSerie =
    document.getElementById("detalle-nro-serie")?.textContent || "";
  const marca = document.getElementById("detalle-marca")?.textContent || "";
  const modelo = document.getElementById("detalle-modelo")?.textContent || "";
  const ubicacion =
    document.getElementById("detalle-ubicacion")?.textContent || "";
  const observaciones =
    document.getElementById("detalle-observaciones")?.textContent || "";

  // Poblar campos de edición
  const inputIne = document.getElementById("input-ine");
  if (inputIne) inputIne.value = ine === "-" ? "" : ine;

  const inputNne = document.getElementById("input-nne");
  if (inputNne) inputNne.value = nne === "-" ? "" : nne;

  const inputNroSerie = document.getElementById("input-nro-serie");
  if (inputNroSerie) inputNroSerie.value = nroSerie === "-" ? "" : nroSerie;

  const inputMarca = document.getElementById("input-marca");
  if (inputMarca) inputMarca.value = marca === "-" ? "" : marca;

  const inputModelo = document.getElementById("input-modelo");
  if (inputModelo) inputModelo.value = modelo === "-" ? "" : modelo;

  const inputUbicacion = document.getElementById("input-ubicacion");
  if (inputUbicacion) inputUbicacion.value = ubicacion === "-" ? "" : ubicacion;

  const inputObservaciones = document.getElementById("input-observaciones");
  if (inputObservaciones)
    inputObservaciones.value = observaciones === "-" ? "" : observaciones;

  // Cargar estados, tipos y responsables en los selects
  cargarSelectEstadoTipoResponsable();

  // CONVERTIR ESPECIFICACIONES A MODO EDITABLE
  convertirEspecificacionesAEditables();

  console.log("[poblarCamposEdicion] Campos de edición poblados correctamente");
  console.log(
    "[poblarCamposEdicion] Ubicación input:",
    inputUbicacion ? inputUbicacion.value : "(no input)"
  );
  console.log(
    "[poblarCamposEdicion] Observaciones input:",
    inputObservaciones ? inputObservaciones.value : "(no input)"
  );
}

/**
 * Convierte las especificaciones de solo lectura a inputs editables
 */
function convertirEspecificacionesAEditables() {
  console.log(
    "[convertirEspecificacionesAEditables] Iniciando conversión de especificaciones"
  );
  const ul = document.getElementById("detalle-especificaciones");
  if (!ul) {
    console.error(
      "[convertirEspecificacionesAEditables] No se encontró el elemento detalle-especificaciones"
    );
    return;
  }

  const liElements = ul.querySelectorAll("li");
  console.log(
    `[convertirEspecificacionesAEditables] Especificaciones encontradas: ${liElements.length}`
  );

  liElements.forEach((li, index) => {
    // Buscar si ya tiene inputs (para evitar conversión duplicada)
    const yaEsEditable = li.querySelector(".especificacion-clave");
    if (yaEsEditable) {
      console.log(
        `[convertirEspecificacionesAEditables] Li ${index} ya es editable, saltando...`
      );
      return;
    }

    // Extraer clave y valor del formato de solo lectura
    const strong = li.querySelector("strong");
    if (strong) {
      const claveCompleta = strong.textContent || "";
      const clave = claveCompleta.replace(":", "").trim();

      let valor = "";
      if (strong.nextSibling) {
        valor = strong.nextSibling.textContent
          ? strong.nextSibling.textContent.trim()
          : "";
      }

      console.log(
        `[convertirEspecificacionesAEditables] Li ${index} - Convirtiendo: clave='${clave}', valor='${valor}'`
      );

      // Reemplazar el contenido del li con inputs editables
      li.innerHTML = `
        <div class="especificacion-editable">
          <input class="especificacion-clave" placeholder="Clave" value="${clave}">
          <span class="especificacion-separador">:</span>
          <input class="especificacion-valor" placeholder="Valor" value="${valor}">
          <button class="btn btn-danger btn-sm btn-eliminar-especificacion">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;

      // Agregar evento para eliminar
      const btnEliminar = li.querySelector(".btn-eliminar-especificacion");
      if (btnEliminar) {
        btnEliminar.addEventListener("click", () => {
          console.log(
            "[convertirEspecificacionesAEditables] Eliminando especificación"
          );
          li.remove();
        });
      }
    }
  });

  console.log("[convertirEspecificacionesAEditables] Conversión completada");
}

/**
 * Restaura las especificaciones editables al modo de solo lectura
 */
function restaurarEspecificacionesSoloLectura() {
  console.log(
    "[restaurarEspecificacionesSoloLectura] Iniciando restauración de especificaciones"
  );
  const ul = document.getElementById("detalle-especificaciones");
  if (!ul) {
    console.error(
      "[restaurarEspecificacionesSoloLectura] No se encontró el elemento detalle-especificaciones"
    );
    return;
  }

  const liElements = ul.querySelectorAll("li");
  console.log(
    `[restaurarEspecificacionesSoloLectura] Especificaciones encontradas: ${liElements.length}`
  );

  liElements.forEach((li, index) => {
    // Buscar si tiene inputs (para restaurar a solo lectura)
    const claveInput = li.querySelector(".especificacion-clave");
    const valorInput = li.querySelector(".especificacion-valor");

    if (claveInput && valorInput) {
      const clave = claveInput.value.trim();
      const valor = valorInput.value.trim();

      console.log(
        `[restaurarEspecificacionesSoloLectura] Li ${index} - Restaurando: clave='${clave}', valor='${valor}'`
      );

      // Solo restaurar a solo lectura las especificaciones originales (que tienen clave y valor)
      if (clave && valor) {
        // Reemplazar el contenido del li con formato de solo lectura
        li.innerHTML = `<i class="bi bi-info-circle text-info"></i> <strong>${clave}:</strong> ${valor}`;
      } else {
        // Si no tiene clave y valor, eliminar el li (especificaciones vacías agregadas)
        console.log(
          `[restaurarEspecificacionesSoloLectura] Li ${index} - Eliminando especificación vacía`
        );
        li.remove();
      }
    }
  });

  console.log("[restaurarEspecificacionesSoloLectura] Restauración completada");
}

/**
 * Carga los tipos de equipo disponibles en el select de edición
 */
async function cargarTiposParaEdicion() {
  try {
    console.log("[cargarTiposParaEdicion] Cargando tipos de equipo...");
    const response = await fetch(`${CONFIG.API_BASE_URL}/tipoequipo`);
    if (response.ok) {
      const data = await response.json();
      const tipos = data.value || data; // Manejar tanto formato con 'value' como array directo
      console.log("[cargarTiposParaEdicion] Tipos obtenidos:", tipos);
      const selectTipo = document.getElementById("input-tipo");
      if (selectTipo) {
        selectTipo.innerHTML = '<option value="">Seleccionar tipo...</option>';
        tipos.forEach((tipo) => {
          const option = document.createElement("option");
          option.value = tipo.id;
          option.textContent = tipo.nombre;
          selectTipo.appendChild(option);
        });

        // Seleccionar el tipo actual usando el ID del equipo
        const equipoActual = window.__equipoDetallesActual;
        if (equipoActual && equipoActual.tipoId) {
          const tipoId = equipoActual.tipoId;
          console.log("[cargarTiposParaEdicion] Tipo ID actual:", tipoId);
          selectTipo.value = tipoId;
        }
      }
    } else {
      console.error(
        "[cargarTiposParaEdicion] Error en respuesta:",
        response.status
      );
    }
  } catch (error) {
    console.error("[cargarTiposParaEdicion] Error:", error);
  }
}

/**
 * Guarda los cambios realizados en el modal de edición
 */
async function guardarCambiosDetalles() {
  console.log(
    "[guardarCambiosDetalles] Iniciando guardado de cambios - VERSIÓN NUEVA " +
      Date.now()
  );

  try {
    // Obtener valores de los campos de edición
    const ine = document.getElementById("input-ine")?.value || "";
    const nne = document.getElementById("input-nne")?.value || "";
    const nroSerie = document.getElementById("input-nro-serie")?.value || "";
    const marca = document.getElementById("input-marca")?.value || "";
    const modelo = document.getElementById("input-modelo")?.value || "";
    const tipoId = document.getElementById("input-tipo")?.value || "";
    // FORZAR LECTURA DIRECTA DE LOS SELECTS JUSTO ANTES DE ARMAR EL PAYLOAD
    const estadoId = document.getElementById("input-estado")?.value || "";
    const responsableId =
      document.getElementById("input-responsable")?.value || "";
    // Logs para depuración
    console.log("[guardarCambiosDetalles] Estado seleccionado:", estadoId);
    console.log(
      "[guardarCambiosDetalles] Responsable seleccionado:",
      responsableId
    );
    const ubicacion = document.getElementById("input-ubicacion")?.value || "";
    const observaciones =
      document.getElementById("input-observaciones")?.value || "";

    // Logs de depuración
    console.log("[guardarCambiosDetalles] Elementos encontrados:");
    console.log("- input-ine:", document.getElementById("input-ine"));
    console.log("- input-nne:", document.getElementById("input-nne"));
    console.log(
      "- input-nro-serie:",
      document.getElementById("input-nro-serie")
    );
    console.log("- input-marca:", document.getElementById("input-marca"));
    console.log("- input-modelo:", document.getElementById("input-modelo"));
    console.log("- input-tipo:", document.getElementById("input-tipo"));
    console.log("- input-estado:", document.getElementById("input-estado"));
    console.log(
      "- input-responsable:",
      document.getElementById("input-responsable")
    );
    console.log(
      "- input-ubicacion:",
      document.getElementById("input-ubicacion")
    );
    console.log(
      "- input-observaciones:",
      document.getElementById("input-observaciones")
    );

    // Logs específicos para responsable y estado
    const responsableElement = document.getElementById("input-responsable");
    const estadoElement = document.getElementById("input-estado");
    console.log("[guardarCambiosDetalles] Valores de selects:");
    console.log("- responsableElement.value:", responsableElement?.value);
    console.log(
      "- responsableElement.selectedIndex:",
      responsableElement?.selectedIndex
    );
    console.log(
      "- responsableElement.options.length:",
      responsableElement?.options?.length
    );
    console.log("- estadoElement.value:", estadoElement?.value);
    console.log("- estadoElement.selectedIndex:", estadoElement?.selectedIndex);
    console.log(
      "- estadoElement.options.length:",
      estadoElement?.options?.length
    );

    console.log("[guardarCambiosDetalles] Datos a enviar:", {
      ine,
      nne,
      nroSerie,
      marca,
      modelo,
      tipoId,
      estadoId,
      responsableId,
      ubicacion,
      observaciones,
    });

    // Obtener valores originales del equipo actual para determinar endpoint
    const nneOriginal = window.__equipoDetallesActual?.nne; // NNE original del equipo
    const nroSerieOriginal = window.__equipoDetallesActual?.nroSerie; // Número de serie original

    console.log("[guardarCambiosDetalles] Valores originales del equipo:");
    console.log(
      "- nneOriginal:",
      nneOriginal,
      "(tipo:",
      typeof nneOriginal,
      ")"
    );
    console.log(
      "- nroSerieOriginal:",
      nroSerieOriginal,
      "(tipo:",
      typeof nroSerieOriginal,
      ")"
    );
    console.log(
      "- window.__equipoDetallesActual:",
      window.__equipoDetallesActual
    );

    let url, identificador;
    // Priorizar NNE original si existe y no es null/undefined/empty
    if (nneOriginal != null && nneOriginal !== "" && nneOriginal !== "-") {
      url = `${API_URL}/nne/${encodeURIComponent(nneOriginal)}`;
      identificador = nneOriginal;
      console.log(
        "[guardarCambiosDetalles] Actualizando por NNE original:",
        nneOriginal
      );
    } else if (
      nroSerieOriginal &&
      nroSerieOriginal.trim() !== "" &&
      nroSerieOriginal !== "-"
    ) {
      url = `${API_URL}/nroSerie/${encodeURIComponent(nroSerieOriginal)}`;
      identificador = nroSerieOriginal;
      console.log(
        "[guardarCambiosDetalles] Actualizando por número de serie original:",
        nroSerieOriginal
      );
    } else {
      console.error(
        "[guardarCambiosDetalles] No se puede determinar endpoint:"
      );
      console.error("- nneOriginal:", nneOriginal);
      console.error("- nroSerieOriginal:", nroSerieOriginal);
      throw new Error(
        "No se puede determinar cómo actualizar el equipo (sin NNE ni número de serie válido)"
      );
    }

    // Construir el payload
    const equipoActual = window.__equipoDetallesActual;

    // Usar el tipo seleccionado o el actual como fallback
    const idTipoEquipo = tipoId || equipoActual?.tipoEquipoId || "E"; // Default a 'E'
    console.log(
      "[guardarCambiosDetalles] Tipo equipo (tipoEquipoId):",
      idTipoEquipo,
      "(seleccionado:",
      tipoId,
      ", original:",
      equipoActual?.tipoEquipoId,
      ")"
    );

    // Obtener valores por defecto del equipo actual
    let estadoIdFinal;
    if (estadoId !== "") {
      estadoIdFinal = parseInt(estadoId);
    } else if (equipoActual?.unidades?.[0]?.estadoId) {
      estadoIdFinal = equipoActual.unidades[0].estadoId;
    } else {
      estadoIdFinal = 5; // Solo si no hay ningún dato
    }
    const responsableIdFinal =
      responsableId !== ""
        ? parseInt(responsableId)
        : equipoActual?.unidades?.[0]?.personaId ?? null;

    console.log("[guardarCambiosDetalles] Estados finales:", {
      estadoIdOriginal: estadoId,
      estadoIdFinal: estadoIdFinal,
      responsableIdOriginal: responsableId,
      responsableIdFinal: responsableIdFinal,
    });

    // Obtener las especificaciones del DOM
    let especificacionesProcesadas = [];
    try {
      const contenedorEspecificaciones = document.getElementById(
        "detalle-especificaciones"
      );
      if (contenedorEspecificaciones) {
        const especificacionesInputs =
          contenedorEspecificaciones.querySelectorAll("li");
        console.log(
          `[guardarCambiosDetalles] Elementos encontrados en especificaciones: ${especificacionesInputs.length}`
        );

        especificacionesInputs.forEach((li, index) => {
          const claveInput = li.querySelector(".especificacion-clave");
          const valorInput = li.querySelector(".especificacion-valor");

          if (claveInput && valorInput) {
            const clave = claveInput.value.trim();
            const valor = valorInput.value.trim();

            if (clave && valor) {
              especificacionesProcesadas.push({ clave, valor });
              console.log(
                `[guardarCambiosDetalles] Especificación ${index}: '${clave}' = '${valor}'`
              );
            }
          }
        });
      }
      console.log(
        `[guardarCambiosDetalles] Total especificaciones procesadas: ${especificacionesProcesadas.length}`
      );
    } catch (error) {
      console.error(
        "[guardarCambiosDetalles] Error procesando especificaciones:",
        error
      );
      especificacionesProcesadas = [];
    }

    const payload = {
      ine: ine,
      nne: nne === "" || nne === "-" ? null : nne,
      tipoEquipoId: idTipoEquipo, // Usar campo correcto sin prefijo id_
      marca: marca,
      modelo: modelo,
      ubicacion: ubicacion,
      observaciones: observaciones,
      especificaciones: especificacionesProcesadas, // Usar las especificaciones procesadas del DOM
      primeraUnidad: {
        numeroSerie: nroSerie,
        estadoId: estadoIdFinal,
        idPersona: responsableIdFinal,
      },
    };

    console.log(
      "[guardarCambiosDetalles] Payload completo:",
      JSON.stringify(payload, null, 2)
    );

    // Enviar la actualización
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log("[guardarCambiosDetalles] Actualización exitosa");
      // Mostrar alerta de éxito
      await Swal.fire({
        title: "Éxito",
        text: "Los cambios se guardaron correctamente.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Recargar equipo actualizado desde la API
      const nneActual = payload.nne || equipoActual.nne;
      const nroSerieActual =
        payload.primeraUnidad.numeroSerie || equipoActual.nroSerie;
      await recargarEquipoActual(nneActual, nroSerieActual);
      // Refrescar la tabla principal
      await cargarEquipos();
      // Cerrar el modal de edición si es necesario
      if (window.modalDetalles) window.modalDetalles.hide();
      setTimeout(async () => {
        await cargarEquipos();
        console.log("[guardarCambiosDetalles] Lista de equipos recargada");
      }, 500);
    } else {
      const errorText = await response.text();
      console.error(
        "[guardarCambiosDetalles] Error en la respuesta:",
        response.status,
        errorText
      );
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
  } catch (error) {
    console.error("[guardarCambiosDetalles] Error:", error);
    Swal.fire({
      title: "Error",
      text: `No se pudieron guardar los cambios: ${error.message}`,
      icon: "error",
      confirmButtonText: "Aceptar",
    });
  }
}

// Event listener para cargar datos al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  console.log("[DOMContentLoaded] Iniciando carga de equipos...");
  cargarEquipos();

  // Inicializar modales
  window.bootstrap = window.bootstrap || {};
  window.bootstrap.Modal = bootstrap.Modal;

  // Inicializar modal de detalles
  const modalDetallesElement = document.getElementById("modalDetallesEquipo");
  if (modalDetallesElement) {
    window.modalDetalles = new bootstrap.Modal(modalDetallesElement);
  }

  // Event listeners para los botones del modal de detalles
  const btnEditar = document.getElementById("btn-editar");
  if (btnEditar) {
    btnEditar.addEventListener("click", activarModoEdicion);
  }

  const btnGuardarCambios = document.getElementById("btn-guardar-cambios");
  if (btnGuardarCambios) {
    btnGuardarCambios.addEventListener("click", guardarCambiosDetalles);
  }

  const btnCancelarEdicion = document.getElementById("btn-cancelar-edicion");
  if (btnCancelarEdicion) {
    btnCancelarEdicion.addEventListener("click", cancelarEdicion);
  }

  // Event listener para agregar especificaciones
  const btnAgregarEspecificacion = document.getElementById(
    "btn-agregar-especificacion-detalle"
  );
  if (btnAgregarEspecificacion) {
    btnAgregarEspecificacion.addEventListener(
      "click",
      agregarCampoEspecificacionDetalle
    );
    console.log(
      "[DOMContentLoaded] Event listener agregado para btn-agregar-especificacion-detalle"
    );
  } else {
    console.error(
      "[DOMContentLoaded] No se encontró el botón btn-agregar-especificacion-detalle"
    );
  }
});

//-----------------------------------------------------------------------------------------------------
// FUNCIONALIDAD DE EXPORTACIÓN
//-----------------------------------------------------------------------------------------------------

/**
 * Exporta los equipos a un archivo PDF usando los datos ya cargados
 */
function exportarEquipos() {
  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: "Generando PDF...",
      text: "Por favor espere mientras se genera el documento",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Verificar que tenemos datos cargados
    if (!window.equipos || !window.unidades || !window.estados) {
      Swal.fire({
        title: "Sin datos",
        text: "Los datos no están disponibles. Recargue la página e intente nuevamente.",
        icon: "warning",
      });
      return;
    }

    if (window.unidades.length === 0) {
      Swal.fire({
        title: "Sin datos",
        text: "No hay equipos para exportar",
        icon: "warning",
      });
      return;
    }

    // Cargar jsPDF desde CDN si no está disponible
    if (typeof window.jsPDF === "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        generarPDFEquipos();
      };
      script.onerror = () => {
        // Si falla jsPDF, generar CSV como fallback
        Swal.fire({
          title: "Información",
          text: "Se generará un archivo CSV ya que no se pudo cargar el generador de PDF",
          icon: "info",
        });
        setTimeout(() => exportarEquiposCSV(), 1000);
      };
      document.head.appendChild(script);
    } else {
      generarPDFEquipos();
    }
  } catch (error) {
    console.error("Error al inicializar exportación:", error);
    // Fallback a CSV
    exportarEquiposCSV();
  }
}

/**
 * Genera el PDF de equipos
 */
function generarPDFEquipos() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("landscape", "mm", "a4");

    // Crear mapas para acceso rápido
    const equiposMap = new Map(window.equipos.map((e) => [e.id, e]));
    const estadosMap = new Map(window.estados.map((e) => [e.id, e.nombre]));

    // Configurar fuente y tamaño
    doc.setFont("helvetica");

    // Header del documento
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text("SISTEMA DE GESTIÓN - INVENTARIO DE EQUIPOS", 20, 20);

    const fechaActual = new Date().toLocaleDateString("es-ES");
    const horaActual = new Date().toLocaleTimeString("es-ES");

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${fechaActual} | Hora: ${horaActual}`, 20, 28);
    doc.text(`Total de equipos: ${window.unidades.length}`, 20, 34);

    // Línea separadora
    doc.setDrawColor(0, 123, 255);
    doc.setLineWidth(0.5);
    doc.line(20, 38, 277, 38);

    // Headers de la tabla
    const headers = [
      "#",
      "INE",
      "NNE",
      "Nro. Serie",
      "Marca",
      "Modelo",
      "Tipo",
      "Estado",
    ];
    const startY = 50;
    const rowHeight = 8;
    const colWidths = [12, 35, 35, 35, 25, 25, 35, 35];
    let currentX = 20;

    // Dibujar headers
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(0, 123, 255);

    headers.forEach((header, index) => {
      doc.rect(currentX, startY - 6, colWidths[index], 8, "F");
      doc.text(header, currentX + 2, startY - 1);
      currentX += colWidths[index];
    });

    // Preparar datos para la tabla
    let currentY = startY + 2;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);

    window.unidades.forEach((unidad, idx) => {
      const equipo = equiposMap.get(unidad.equipoId) || {};
      const estadoNombre = estadosMap.get(unidad.estadoId) || "Sin estado";

      // Verificar si necesitamos una nueva página
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;

        // Redibujar headers en nueva página
        currentX = 20;
        doc.setFontSize(9);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(0, 123, 255);

        headers.forEach((header, index) => {
          doc.rect(currentX, currentY - 6, colWidths[index], 8, "F");
          doc.text(header, currentX + 2, currentY - 1);
          currentX += colWidths[index];
        });

        currentY += 2;
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(8);
      }

      // Alternar color de fondo de filas
      if (idx % 2 === 0) {
        doc.setFillColor(248, 249, 250);
        currentX = 20;
        colWidths.forEach((width) => {
          doc.rect(currentX, currentY - 2, width, rowHeight, "F");
          currentX += width;
        });
      }

      // Datos de la fila
      const rowData = [
        String(idx + 1),
        (equipo.ine || "N/A").substring(0, 18),
        (equipo.nne || "N/A").substring(0, 18),
        (unidad.nroSerie || "N/A").substring(0, 18),
        (equipo.marca || "N/A").substring(0, 12),
        (equipo.modelo || "N/A").substring(0, 12),
        (equipo.tipoNombre || "N/A").substring(0, 18),
        estadoNombre.substring(0, 18),
      ];

      currentX = 20;
      rowData.forEach((data, colIndex) => {
        doc.text(data, currentX + 2, currentY + 4);
        currentX += colWidths[colIndex];
      });

      currentY += rowHeight;
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `© 2025 Sistema de Control y Gestión - Página ${i} de ${pageCount}`,
        20,
        200
      );
      doc.text(`Generado el ${fechaActual} a las ${horaActual}`, 200, 200);
    }

    // Guardar el PDF
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `equipos_${fecha}.pdf`;
    doc.save(nombreArchivo);

    Swal.fire({
      title: "¡PDF generado exitosamente!",
      text: `Se ha descargado el archivo: ${nombreArchivo}`,
      icon: "success",
      timer: 3000,
    });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    Swal.fire({
      title: "Error al generar PDF",
      text: "Se generará un archivo CSV como alternativa",
      icon: "warning",
    });
    setTimeout(() => exportarEquiposCSV(), 1000);
  }
}

/**
 * Exporta equipos en formato CSV como fallback
 */
function exportarEquiposCSV() {
  try {
    // Crear mapas para acceso rápido
    const equiposMap = new Map(window.equipos.map((e) => [e.id, e]));
    const estadosMap = new Map(window.estados.map((e) => [e.id, e.nombre]));

    // Preparar datos para exportar
    const datosParaExportar = [];

    window.unidades.forEach((unidad, idx) => {
      const equipo = equiposMap.get(unidad.equipoId) || {};
      const estadoNombre = estadosMap.get(unidad.estadoId) || "Sin estado";

      datosParaExportar.push({
        "Nro Orden": idx + 1,
        INE: equipo.ine || "N/A",
        NNE: equipo.nne || "N/A",
        "Número de Serie": unidad.nroSerie || "N/A",
        Marca: equipo.marca || "N/A",
        Modelo: equipo.modelo || "N/A",
        "Tipo de Equipo": equipo.tipoNombre || "N/A",
        Estado: estadoNombre,
        Ubicación: unidad.ubicacion || "N/A",
        "Personal Asignado": unidad.personalAsignado || "Sin asignar",
        Observaciones: unidad.observaciones || "Sin observaciones",
      });
    });

    // Crear archivo CSV
    const csvContent = generarCSV(datosParaExportar);

    // Descargar archivo
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `equipos_${fecha}.csv`;
    descargarArchivo(csvContent, nombreArchivo, "text/csv");

    Swal.fire({
      title: "¡Exportación exitosa!",
      text: `Se ha descargado el archivo CSV: ${nombreArchivo}`,
      icon: "success",
      timer: 3000,
    });
  } catch (error) {
    console.error("Error al exportar CSV:", error);
    Swal.fire({
      title: "Error",
      text: "No se pudo exportar la información. Inténtelo nuevamente.",
      icon: "error",
    });
  }
}

/**
 * Genera contenido CSV a partir de un array de objetos
 */
function generarCSV(datos) {
  if (!datos || datos.length === 0) return "";

  // Obtener headers
  const headers = Object.keys(datos[0]);

  // Función para escapar valores CSV
  const escaparCSV = (valor) => {
    if (valor === null || valor === undefined) return "";
    const str = String(valor);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Generar contenido CSV
  let csv = headers.map(escaparCSV).join(",") + "\n";

  datos.forEach((fila) => {
    const valores = headers.map((header) => escaparCSV(fila[header]));
    csv += valores.join(",") + "\n";
  });

  return csv;
}

/**
 * Descarga un archivo con el contenido especificado
 */
function descargarArchivo(contenido, nombreArchivo, tipoMime) {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = window.URL.createObjectURL(blob);

  const enlaceDescarga = document.createElement("a");
  enlaceDescarga.href = url;
  enlaceDescarga.download = nombreArchivo;
  enlaceDescarga.style.display = "none";

  document.body.appendChild(enlaceDescarga);
  enlaceDescarga.click();
  document.body.removeChild(enlaceDescarga);

  window.URL.revokeObjectURL(url);
}

/**
 * Exporta los detalles de un equipo específico a PDF
 */
function exportarDetalleEquipo() {
  try {
    // Mostrar indicador de carga
    Swal.fire({
      title: "Generando PDF...",
      text: "Por favor espere mientras se genera el documento",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    // Cargar jsPDF desde CDN si no está disponible
    if (typeof window.jsPDF === "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
      script.onload = () => {
        generarPDFDetalle();
      };
      script.onerror = () => {
        // Si falla jsPDF, generar CSV como fallback
        Swal.fire({
          title: "Información",
          text: "Se generará un archivo CSV ya que no se pudo cargar el generador de PDF",
          icon: "info",
        });
        setTimeout(() => exportarDetalleCSV(), 1000);
      };
      document.head.appendChild(script);
    } else {
      generarPDFDetalle();
    }
  } catch (error) {
    console.error("Error al inicializar exportación de detalle:", error);
    // Fallback a CSV
    exportarDetalleCSV();
  }
}

/**
 * Genera el PDF del detalle del equipo
 */
function generarPDFDetalle() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("portrait", "mm", "a4");

    // Obtener los datos actuales mostrados en el modal
    const detalle = {
      ine: document.getElementById("detalle-ine").textContent || "N/A",
      nne: document.getElementById("detalle-nne").textContent || "N/A",
      numeroSerie:
        document.getElementById("detalle-nro-serie").textContent || "N/A",
      marca: document.getElementById("detalle-marca").textContent || "N/A",
      modelo: document.getElementById("detalle-modelo").textContent || "N/A",
      tipoEquipo: document.getElementById("detalle-tipo").textContent || "N/A",
      estadoEquipo:
        document.getElementById("detalle-estado").textContent || "N/A",
      responsable:
        document.getElementById("detalle-responsable").textContent ||
        "Sin asignar",
      ubicacion:
        document.getElementById("detalle-ubicacion").textContent || "N/A",
      observaciones:
        document.getElementById("detalle-observaciones").textContent ||
        "Sin observaciones",
    };

    // Obtener especificaciones técnicas si existen
    let especificaciones = [];
    const especificacionesContainer = document.getElementById(
      "detalle-especificaciones"
    );
    if (especificacionesContainer) {
      const badges = especificacionesContainer.querySelectorAll(".badge");
      badges.forEach((badge) => {
        especificaciones.push(badge.textContent.trim());
      });
    }

    // Configurar fuente y tamaño
    doc.setFont("helvetica");

    // Header del documento
    doc.setFontSize(18);
    doc.setTextColor(0, 123, 255);
    doc.text("DETALLE COMPLETO DE EQUIPO", 20, 25);

    const fechaActual = new Date().toLocaleDateString("es-ES");
    const horaActual = new Date().toLocaleTimeString("es-ES");

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Fecha: ${fechaActual} | Hora: ${horaActual}`, 20, 32);
    doc.text("Sistema de Control y Gestión de Equipos", 20, 38);

    // Equipo ID destacado
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFillColor(248, 249, 250);
    doc.rect(20, 42, 170, 8, "F");
    doc.text(`Equipo: ${detalle.nne}`, 25, 48);

    // Línea separadora
    doc.setDrawColor(0, 123, 255);
    doc.setLineWidth(0.5);
    doc.line(20, 55, 190, 55);

    let currentY = 65;

    // Función para agregar una sección
    const agregarSeccion = (titulo, campos, emoji = "") => {
      // Header de sección
      doc.setFillColor(0, 123, 255);
      doc.rect(20, currentY - 5, 170, 8, "F");

      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${emoji} ${titulo}`, 25, currentY);

      currentY += 10;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(9);

      // Campos de la sección
      campos.forEach((campo) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }

        // Fondo alternado para campos
        doc.setFillColor(248, 249, 250);
        doc.rect(20, currentY - 2, 170, 8, "F");

        doc.setTextColor(60, 60, 60);
        doc.text(`${campo.label}:`, 25, currentY + 3);

        doc.setTextColor(20, 20, 20);
        const valor =
          campo.valor.length > 80
            ? campo.valor.substring(0, 77) + "..."
            : campo.valor;
        doc.text(valor, 70, currentY + 3);

        currentY += 10;
      });

      currentY += 5; // Espacio entre secciones
    };

    // Sección 1: Información de Identificación
    agregarSeccion(
      "Información de Identificación",
      [
        { label: "Código INE", valor: detalle.ine },
        { label: "Número NNE", valor: detalle.nne },
        { label: "Número de Serie", valor: detalle.numeroSerie },
      ],
      "📋"
    );

    // Sección 2: Especificaciones Técnicas
    agregarSeccion(
      "Especificaciones Técnicas",
      [
        { label: "Marca", valor: detalle.marca },
        { label: "Modelo", valor: detalle.modelo },
        { label: "Tipo de Equipo", valor: detalle.tipoEquipo },
        { label: "Estado Actual", valor: detalle.estadoEquipo },
      ],
      "⚙️"
    );

    // Sección 3: Asignación y Ubicación
    agregarSeccion(
      "Asignación y Ubicación",
      [
        { label: "Ubicación Física", valor: detalle.ubicacion },
        { label: "Personal Responsable", valor: detalle.responsable },
      ],
      "📍"
    );

    // Sección 4: Observaciones
    agregarSeccion(
      "Observaciones y Notas",
      [{ label: "Observaciones Generales", valor: detalle.observaciones }],
      "📝"
    );

    // Sección 5: Especificaciones Adicionales (si existen)
    if (especificaciones.length > 0) {
      agregarSeccion(
        "Especificaciones Técnicas Adicionales",
        [{ label: "Especificaciones", valor: especificaciones.join(" • ") }],
        "🔧"
      );
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("© 2025 Sistema de Control y Gestión", 20, 285);
      doc.text(`Página ${i} de ${pageCount}`, 160, 285);
      doc.text(`Generado: ${fechaActual} ${horaActual}`, 20, 290);
    }

    // Guardar el PDF
    const nne = detalle.nne.replace(/[^a-zA-Z0-9]/g, "_");
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `equipo_${nne}_${fecha}.pdf`;
    doc.save(nombreArchivo);

    Swal.fire({
      title: "¡PDF generado exitosamente!",
      text: `Se ha descargado el archivo: ${nombreArchivo}`,
      icon: "success",
      timer: 3000,
    });
  } catch (error) {
    console.error("Error al generar PDF de detalle:", error);
    Swal.fire({
      title: "Error al generar PDF",
      text: "Se generará un archivo CSV como alternativa",
      icon: "warning",
    });
    setTimeout(() => exportarDetalleCSV(), 1000);
  }
}

/**
 * Exporta el detalle del equipo en formato CSV como fallback
 */
function exportarDetalleCSV() {
  try {
    // Obtener los datos actuales mostrados en el modal
    const detalle = {
      INE: document.getElementById("detalle-ine").textContent || "N/A",
      NNE: document.getElementById("detalle-nne").textContent || "N/A",
      "Número de Serie":
        document.getElementById("detalle-nro-serie").textContent || "N/A",
      Marca: document.getElementById("detalle-marca").textContent || "N/A",
      Modelo: document.getElementById("detalle-modelo").textContent || "N/A",
      "Tipo de Equipo":
        document.getElementById("detalle-tipo").textContent || "N/A",
      Estado: document.getElementById("detalle-estado").textContent || "N/A",
      "Personal Responsable":
        document.getElementById("detalle-responsable").textContent ||
        "Sin asignar",
      Ubicación:
        document.getElementById("detalle-ubicacion").textContent || "N/A",
      Observaciones:
        document.getElementById("detalle-observaciones").textContent ||
        "Sin observaciones",
    };

    // Agregar especificaciones técnicas si existen
    const especificacionesContainer = document.getElementById(
      "detalle-especificaciones"
    );
    if (especificacionesContainer) {
      const badges = especificacionesContainer.querySelectorAll(".badge");
      let especificaciones = [];
      badges.forEach((badge) => {
        especificaciones.push(badge.textContent.trim());
      });
      detalle["Especificaciones Técnicas"] =
        especificaciones.length > 0
          ? especificaciones.join("; ")
          : "Sin especificaciones";
    }

    // Crear archivo CSV con los detalles
    const csvContent = generarCSV([detalle]);

    // Generar nombre del archivo con NNE y fecha
    const nne = detalle.NNE.replace(/[^a-zA-Z0-9]/g, "_");
    const fecha = new Date().toISOString().split("T")[0];
    const nombreArchivo = `equipo_${nne}_${fecha}.csv`;

    // Descargar archivo
    descargarArchivo(csvContent, nombreArchivo, "text/csv");

    Swal.fire({
      title: "¡Exportación exitosa!",
      text: `Se ha descargado el archivo CSV: ${nombreArchivo}`,
      icon: "success",
      timer: 3000,
    });
  } catch (error) {
    console.error("Error al exportar detalle del equipo:", error);
    Swal.fire({
      title: "Error",
      text: "No se pudo exportar la información del equipo. Inténtelo nuevamente.",
      icon: "error",
    });
  }
}

/**
 * Imprime la tabla principal de equipos con diseño adaptativo optimizado
 */
function imprimirTablaEquipos() {
  try {
    if (!window.equipos || window.equipos.length === 0) {
      Swal.fire({
        title: "No hay datos",
        text: "No hay equipos para imprimir. Cargue los datos primero.",
        icon: "warning",
      });
      return;
    }

    // Crear ventana de impresión con parámetros más específicos
    const ventanaImpresion = window.open(
      "",
      "_blank",
      "width=1200,height=800,scrollbars=yes,resizable=yes"
    );

    if (!ventanaImpresion) {
      Swal.fire({
        title: "Error de Impresión",
        text: "No se pudo abrir la ventana de impresión. Verifique que su navegador permita ventanas emergentes.",
        icon: "error",
      });
      return;
    }

    const fechaActual = new Date().toLocaleDateString("es-ES");
    const horaActual = new Date().toLocaleTimeString("es-ES");

    // HTML para impresión optimizada para diferentes tamaños de papel
    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Inventario de Equipos - ${fechaActual}</title>
        <style>
          /* Reset y configuración base */
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.3;
            color: #333;
            background: white;
            padding: 0;
          }
          
          /* Configuración para diferentes tamaños de papel */
          @page {
            margin: 1cm;
            size: auto;
          }
          
          /* Adaptación específica para papel A4 (21cm x 29.7cm) */
          @media print and (width: 21cm) and (height: 29.7cm) {
            body { font-size: 9px; }
            .container { max-width: 19cm; }
            th, td { padding: 3px; }
          }
          
          /* Adaptación específica para papel Carta/Letter (8.5in x 11in) */
          @media print and (width: 8.5in) and (height: 11in) {
            body { font-size: 10px; }
            .container { max-width: 7.5in; }
            th, td { padding: 3px; }
          }
          
          /* Adaptación específica para papel Legal (8.5in x 14in) */
          @media print and (width: 8.5in) and (height: 14in) {
            body { font-size: 10px; }
            .container { max-width: 7.5in; }
            th, td { padding: 4px; }
          }
          
          /* Adaptación para papel más pequeño */
          @media print and (max-width: 18cm) {
            body { font-size: 8px; }
            .header h1 { font-size: 14px; }
            th, td { padding: 2px; }
          }
          
          .container {
            width: 100%;
            margin: 0 auto;
            padding: 0;
          }
          
          /* Header */
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
            page-break-inside: avoid;
          }
          
          .header h1 {
            color: #007bff;
            font-size: 18px;
            margin-bottom: 5px;
            font-weight: bold;
          }
          
          .header .info {
            font-size: 10px;
            color: #666;
            display: flex;
            justify-content: space-between;
            flex-wrap: wrap;
            margin-top: 5px;
          }
          
          /* Tabla responsive */
          .table-container {
            overflow: hidden;
            width: 100%;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: inherit;
            page-break-inside: auto;
          }
          
          th, td {
            border: 1px solid #ddd;
            padding: 4px;
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
            max-width: 0;
          }
          
          th {
            background-color: #f8f9fa !important;
            font-weight: bold !important;
            color: #000 !important;
            font-size: 10px !important;
            text-align: center !important;
            border: 1px solid #000 !important;
            padding: 6px 4px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            vertical-align: middle !important;
            white-space: nowrap !important;
          }
          
          td {
            font-size: 9px;
          }
          
          /* Distribución de columnas optimizada */
          .col-ine { width: 8%; }
          .col-nne { width: 10%; }
          .col-serie { width: 12%; }
          .col-marca { width: 10%; }
          .col-modelo { width: 12%; }
          .col-tipo { width: 12%; }
          .col-estado { width: 10%; }
          .col-responsable { width: 14%; }
          .col-ubicacion { width: 12%; }
          
          /* Estados con colores */
          .estado-operativo { 
            color: #28a745 !important; 
            font-weight: bold; 
            -webkit-print-color-adjust: exact;
          }
          .estado-mantenimiento { 
            color: #ffc107 !important; 
            font-weight: bold; 
            -webkit-print-color-adjust: exact;
          }
          .estado-reparacion { 
            color: #dc3545 !important; 
            font-weight: bold; 
            -webkit-print-color-adjust: exact;
          }
          .estado-baja { 
            color: #6c757d !important; 
            font-weight: bold; 
            -webkit-print-color-adjust: exact;
          }
          
          /* Control de salto de página */
          .page-break {
            page-break-before: always;
          }
          
          .no-break {
            page-break-inside: avoid;
          }
          
          /* Filas zebra para mejor legibilidad */
          tbody tr:nth-child(even) {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
          }
          
          /* Footer */
          .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ddd;
            padding: 5px;
            background: white;
            page-break-inside: avoid;
          }
          
          /* Configuraciones específicas para impresión */
          @media print {
            .no-print { display: none !important; }
            
            /* Asegurar que los colores se impriman */
            * { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            
            /* Optimizar saltos de página y asegurar headers */
            thead { 
              display: table-header-group !important; 
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            
            thead th {
              background-color: #f8f9fa !important;
              border: 1px solid #000 !important;
              font-weight: bold !important;
              text-align: center !important;
              padding: 6px 4px !important;
              font-size: 10px !important;
              color: #000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            tfoot { 
              display: table-footer-group; 
            }
            
            tbody tr {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            tbody td {
              border: 1px solid #000 !important;
              padding: 4px !important;
              font-size: 9px !important;
            }
            
            /* Asegurar que el header se repita en cada página */
            @page {
              @top-center {
                content: "Inventario de Equipos - ${fechaActual}";
                font-size: 10px;
                color: #666;
              }
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 INVENTARIO COMPLETO DE EQUIPOS</h1>
            <div class="info">
              <span>📅 Fecha: ${fechaActual}</span>
              <span>🕐 Hora: ${horaActual}</span>
              <span>📊 Total: ${window.equipos.length} equipos</span>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th class="col-ine" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">INE</th>
                  <th class="col-nne" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">NNE</th>
                  <th class="col-serie" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">N° Serie</th>
                  <th class="col-marca" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">Marca</th>
                  <th class="col-modelo" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">Modelo</th>
                  <th class="col-tipo" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">Tipo</th>
                  <th class="col-estado" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">Estado</th>
                  <th class="col-responsable" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">Responsable</th>
                  <th class="col-ubicacion" style="background-color: #f8f9fa !important; border: 1px solid #000 !important; font-weight: bold !important; text-align: center !important; padding: 6px 4px !important;">Ubicación</th>
                </tr>
              </thead>
              <tbody>
                ${window.equipos
                  .map((equipo, index) => {
                    const claseEstado = equipo.estadoEquipo
                      ? `estado-${equipo.estadoEquipo
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`
                      : "";

                    return `
                    <tr class="${
                      index > 0 && index % 30 === 0 ? "page-break" : ""
                    }">
                      <td class="col-ine">${equipo.ine || "N/A"}</td>
                      <td class="col-nne"><strong>${
                        equipo.nne || "N/A"
                      }</strong></td>
                      <td class="col-serie">${equipo.numeroSerie || "N/A"}</td>
                      <td class="col-marca">${equipo.marca || "N/A"}</td>
                      <td class="col-modelo">${equipo.modelo || "N/A"}</td>
                      <td class="col-tipo">${equipo.tipoEquipo || "N/A"}</td>
                      <td class="col-estado ${claseEstado}">${
                      equipo.estadoEquipo || "N/A"
                    }</td>
                      <td class="col-responsable">${
                        equipo.responsable || "Sin asignar"
                      }</td>
                      <td class="col-ubicacion">${
                        equipo.ubicacion || "N/A"
                      }</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="footer">
          © 2025 Sistema de Control y Gestión de Equipos | Página <span class="pageNumber"></span>
        </div>
        
        <script>
          // Configurar impresión automática más suave
          window.onload = function() {
            // Forzar estilos de encabezados mediante JavaScript
            const headers = document.querySelectorAll('thead th');
            headers.forEach(header => {
              header.style.backgroundColor = '#f8f9fa';
              header.style.border = '1px solid #000';
              header.style.fontWeight = 'bold';
              header.style.textAlign = 'center';
              header.style.padding = '6px 4px';
              header.style.fontSize = '10px';
              header.style.color = '#000';
              header.style.setProperty('-webkit-print-color-adjust', 'exact', 'important');
              header.style.setProperty('print-color-adjust', 'exact', 'important');
            });
            
            // Mostrar alerta antes de imprimir
            const userWantsToPrint = confirm("¿Está listo para imprimir? El documento se adaptará automáticamente al tamaño de papel de su impresora.");
            
            if (userWantsToPrint) {
              // Pequeña pausa para asegurar que todo se haya renderizado
              setTimeout(() => {
                window.print();
              }, 500);
            }
          }
          
          // Manejar el evento de después de imprimir
          window.onafterprint = function() {
            const shouldClose = confirm("Impresión completada. ¿Desea cerrar esta ventana?");
            if (shouldClose) {
              window.close();
            }
          }
          
          // Detectar cancelación de impresión
          window.onbeforeunload = function() {
            return "¿Está seguro que desea salir sin imprimir?";
          }
        </script>
      </body>
      </html>
    `);

    ventanaImpresion.document.close();

    // Mostrar confirmación de éxito
    Swal.fire({
      title: "✅ Ventana de impresión abierta",
      text: "La ventana de impresión se ha abierto correctamente. El documento se adaptará automáticamente a su papel.",
      icon: "success",
      timer: 2500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error al preparar impresión de tabla:", error);
    Swal.fire({
      title: "Error de Impresión",
      text: "No se pudo preparar la impresión. Verifique que su navegador permita ventanas emergentes.",
      icon: "error",
    });
  }
}

/**
 * Imprime el detalle del equipo seleccionado con diseño adaptativo optimizado
 */
function imprimirDetalleEquipo() {
  try {
    // Función auxiliar para obtener texto de elementos, considerando modo edición
    function obtenerTextoElemento(id, fallback = "N/A") {
      const elemento = document.getElementById(id);
      if (!elemento) return fallback;

      // Si el elemento tiene textContent visible, usar eso
      if (elemento.textContent && elemento.textContent.trim()) {
        const texto = elemento.textContent.trim();
        return texto === "---" || texto === "-" ? fallback : texto;
      }

      return fallback;
    }

    // Obtener los datos actuales mostrados en el modal
    const detalle = {
      ine: obtenerTextoElemento("detalle-ine"),
      nne: obtenerTextoElemento("detalle-nne"),
      numeroSerie: obtenerTextoElemento("detalle-nro-serie"),
      marca: obtenerTextoElemento("detalle-marca"),
      modelo: obtenerTextoElemento("detalle-modelo"),
      tipoEquipo: obtenerTextoElemento("detalle-tipo"),
      estadoEquipo: obtenerTextoElemento("detalle-estado"),
      responsable: obtenerTextoElemento("detalle-responsable", "Sin asignar"),
      ubicacion: obtenerTextoElemento("detalle-ubicacion"),
      observaciones: obtenerTextoElemento(
        "detalle-observaciones",
        "Sin observaciones"
      ),
    };

    // Obtener especificaciones técnicas si existen
    let especificaciones = [];
    const especificacionesContainer = document.getElementById(
      "detalle-especificaciones"
    );
    if (especificacionesContainer) {
      // Buscar elementos li dentro del contenedor
      const liElements = especificacionesContainer.querySelectorAll("li");
      liElements.forEach((li) => {
        const text = li.textContent.trim();
        // Extraer texto omitiendo el punto inicial si existe
        const cleanText = text.replace(/^•\s*/, "").trim();
        if (
          cleanText &&
          cleanText !== "No hay especificaciones técnicas para este modelo."
        ) {
          especificaciones.push(cleanText);
        }
      });
    }

    // Crear ventana de impresión con parámetros optimizados
    const ventanaImpresion = window.open(
      "",
      "_blank",
      "width=800,height=1000,scrollbars=yes,resizable=yes"
    );

    if (!ventanaImpresion) {
      Swal.fire({
        title: "Error de Impresión",
        text: "No se pudo abrir la ventana de impresión. Verifique que su navegador permita ventanas emergentes.",
        icon: "error",
      });
      return;
    }
    const fechaActual = new Date().toLocaleDateString("es-ES");
    const horaActual = new Date().toLocaleTimeString("es-ES");

    if (!ventanaImpresion) {
      throw new Error("No se pudo abrir la ventana de impresión");
    }

    ventanaImpresion.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <title>Detalle del Equipo - ${detalle.nne}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
              /* Reset y configuración base */
              * {
                  box-sizing: border-box;
                  margin: 0;
                  padding: 0;
              }
              
              /* Configuración para diferentes tamaños de papel */
              @page {
                  margin: 1.5cm;
                  size: auto;
              }
              
              body { 
                  font-family: 'Segoe UI', Arial, sans-serif;
                  font-size: 12pt;
                  line-height: 1.5;
                  color: #333;
                  background: white;
                  max-width: 100%;
              }
              
              /* Adaptaciones para diferentes tamaños de papel */
              @media print and (width: 21cm) and (height: 29.7cm) {
                  body { font-size: 11pt; line-height: 1.4; }
                  .seccion { margin-bottom: 15px; }
                  .campo { padding: 8px 12px; }
              }
              
              @media print and (width: 8.5in) and (height: 11in) {
                  body { font-size: 11pt; line-height: 1.4; }
                  .header h1 { font-size: 18pt; }
                  .seccion { margin-bottom: 12px; }
              }
              
              @media print and (width: 8.5in) and (height: 14in) {
                  body { font-size: 12pt; line-height: 1.5; }
                  .seccion { margin-bottom: 18px; }
              }
              
              /* Adaptación para papel más pequeño */
              @media print and (max-width: 18cm) {
                  body { font-size: 10pt; }
                  .header h1 { font-size: 16pt; }
                  .seccion-titulo { padding: 8px 12px; }
                  .campo { padding: 6px 10px; }
              }
              
              .container {
                  max-width: 100%;
                  margin: 0 auto;
                  padding: 0;
              }
              
              .header { 
                  text-align: center; 
                  margin-bottom: 25px; 
                  border-bottom: 3px solid #007bff;
                  padding-bottom: 15px;
                  page-break-inside: avoid;
              }
              
              .header h1 { 
                  color: #007bff; 
                  font-size: 22pt;
                  font-weight: bold;
                  margin-bottom: 8px;
              }
              
              .header-info { 
                  font-size: 11pt; 
                  color: #666; 
                  margin: 3px 0;
                  display: flex;
                  justify-content: space-between;
                  flex-wrap: wrap;
              }
              
              .equipo-id {
                  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                  padding: 10px 20px;
                  border-radius: 8px;
                  display: inline-block;
                  font-weight: bold;
                  color: #495057;
                  margin: 10px 0;
                  border: 2px solid #007bff;
                  font-size: 14pt;
              }
              
              .seccion {
                  margin-bottom: 20px;
                  border: 1px solid #dee2e6;
                  border-radius: 8px;
                  overflow: hidden;
                  page-break-inside: avoid;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              
              .seccion-titulo {
                  background: linear-gradient(135deg, #007bff, #0056b3);
                  color: white;
                  padding: 12px 15px;
                  font-weight: bold;
                  font-size: 13pt;
                  display: flex;
                  align-items: center;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
              }
              
              .seccion-titulo .emoji {
                  margin-right: 8px;
                  font-size: 16pt;
              }
              
              .campo {
                  padding: 12px 15px;
                  border-bottom: 1px solid #f1f3f4;
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  word-wrap: break-word;
              }
              
              .campo:last-child {
                  border-bottom: none;
              }
              
              .campo:nth-child(even) {
                  background-color: #f8f9fa;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
              }
              
              .campo-label {
                  font-weight: bold;
                  color: #495057;
                  min-width: 140px;
                  margin-right: 15px;
              }
              
              .campo-valor {
                  flex: 1;
                  color: #212529;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
              }
              
              /* Estados con colores específicos */
              .estado-operativo { 
                  color: #28a745 !important; 
                  font-weight: bold;
                  -webkit-print-color-adjust: exact;
              }
              .estado-mantenimiento { 
                  color: #ffc107 !important; 
                  font-weight: bold;
                  -webkit-print-color-adjust: exact;
              }
              .estado-reparacion { 
                  color: #dc3545 !important; 
                  font-weight: bold;
                  -webkit-print-color-adjust: exact;
              }
              .estado-baja { 
                  color: #6c757d !important; 
                  font-weight: bold;
                  -webkit-print-color-adjust: exact;
              }
              
              .especificaciones-list {
                  list-style: none;
                  padding: 0;
              }
              
              .especificaciones-list li {
                  background: #e7f1ff;
                  margin: 5px 0;
                  padding: 8px 12px;
                  border-radius: 4px;
                  border-left: 4px solid #007bff;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
              }
              
              .footer { 
                  margin-top: 30px; 
                  text-align: center; 
                  font-size: 9pt; 
                  color: #666;
                  border-top: 2px solid #dee2e6;
                  padding-top: 15px;
                  page-break-inside: avoid;
              }
              
              .footer strong {
                  color: #007bff;
              }
              
              /* Configuraciones específicas para impresión */
              @media print {
                  body { 
                      margin: 0; 
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                  }
                  
                  .no-print { 
                      display: none !important; 
                  }
                  
                  /* Asegurar que los colores se impriman */
                  * { 
                      -webkit-print-color-adjust: exact !important; 
                      print-color-adjust: exact !important;
                  }
                  
                  /* Control de saltos de página */
                  .seccion {
                      page-break-inside: avoid;
                      break-inside: avoid;
                  }
                  
                  .header, .footer {
                      page-break-inside: avoid;
                  }
                  
                  /* Optimizar márgenes para impresión */
                  @page {
                      margin: 1.5cm 1cm;
                  }
              }
              
              /* Responsive para modo vista previa */
              @media screen and (max-width: 600px) {
                  body { font-size: 14pt; }
                  .header h1 { font-size: 24pt; }
                  .campo { flex-direction: column; }
                  .campo-label { min-width: auto; margin-bottom: 5px; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🔧 DETALLE COMPLETO DE EQUIPO</h1>
                  <div class="header-info">
                      <span>📅 Fecha: ${fechaActual}</span>
                      <span>🕐 Hora: ${horaActual}</span>
                  </div>
                  <div class="equipo-id">Equipo: ${detalle.nne}</div>
              </div>
              
              <!-- Sección: Información de Identificación -->
              <div class="seccion">
                  <div class="seccion-titulo">
                      <span class="emoji">📋</span>
                      Información de Identificación
                  </div>
                  <div class="campo">
                      <div class="campo-label">Código INE:</div>
                      <div class="campo-valor">${detalle.ine}</div>
                  </div>
                  <div class="campo">
                      <div class="campo-label">Número NNE:</div>
                      <div class="campo-valor">${detalle.nne}</div>
                  </div>
                  <div class="campo">
                      <div class="campo-label">Número de Serie:</div>
                      <div class="campo-valor">${detalle.numeroSerie}</div>
                  </div>
              </div>
              
              <!-- Sección: Especificaciones Técnicas -->
              <div class="seccion">
                  <div class="seccion-titulo">
                      <span class="emoji">⚙️</span>
                      Especificaciones Técnicas
                  </div>
                  <div class="campo">
                      <div class="campo-label">Marca:</div>
                      <div class="campo-valor">${detalle.marca}</div>
                  </div>
                  <div class="campo">
                      <div class="campo-label">Modelo:</div>
                      <div class="campo-valor">${detalle.modelo}</div>
                  </div>
                  <div class="campo">
                      <div class="campo-label">Tipo de Equipo:</div>
                      <div class="campo-valor">${detalle.tipoEquipo}</div>
                  </div>
                  <div class="campo">
                      <div class="campo-label">Estado Actual:</div>
                      <div class="campo-valor ${
                        detalle.estadoEquipo
                          ? "estado-" +
                            detalle.estadoEquipo
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                          : ""
                      }">${detalle.estadoEquipo}</div>
                  </div>
              </div>
              
              <!-- Sección: Asignación y Ubicación -->
              <div class="seccion">
                  <div class="seccion-titulo">
                      <span class="emoji">📍</span>
                      Asignación y Ubicación
                  </div>
                  <div class="campo">
                      <div class="campo-label">Ubicación Física:</div>
                      <div class="campo-valor">${detalle.ubicacion}</div>
                  </div>
                  <div class="campo">
                      <div class="campo-label">Personal Responsable:</div>
                      <div class="campo-valor">${detalle.responsable}</div>
                  </div>
              </div>
              
              <!-- Sección: Observaciones -->
              <div class="seccion">
                  <div class="seccion-titulo">
                      <span class="emoji">📝</span>
                      Observaciones y Notas
                  </div>
                  <div class="campo">
                      <div class="campo-label">Observaciones:</div>
                      <div class="campo-valor">${detalle.observaciones}</div>
                  </div>
              </div>
              
              ${
                especificaciones.length > 0
                  ? `
              <!-- Sección: Especificaciones Adicionales -->
              <div class="seccion">
                  <div class="seccion-titulo">
                      <span class="emoji">🔧</span>
                      Especificaciones Técnicas Adicionales
                  </div>
                  <div class="campo">
                      <div class="campo-label">Especificaciones:</div>
                      <div class="campo-valor">
                          <ul class="especificaciones-list">
                              ${especificaciones
                                .map((esp) => `<li>${esp}</li>`)
                                .join("")}
                          </ul>
                      </div>
                  </div>
              </div>
              `
                  : ""
              }
              
              <div class="footer">
                  <p><strong>© 2025 Sistema de Control y Gestión de Equipos</strong></p>
                  <p>Detalle completo generado automáticamente</p>
                  <p>Documento generado el ${fechaActual} a las ${horaActual}</p>
              </div>
          </div>
          
          <script>
              // Configurar impresión automática más amigable
              window.onload = function() {
                  // Confirmar antes de imprimir
                  const userWantsToPrint = confirm("¿Desea imprimir el detalle de este equipo? El documento se adaptará automáticamente al tamaño de papel.");
                  
                  if (userWantsToPrint) {
                      setTimeout(() => {
                          window.print();
                      }, 500);
                  }
              }
              
              // Manejar el evento de después de imprimir
              window.onafterprint = function() {
                  const shouldClose = confirm("Impresión completada. ¿Desea cerrar esta ventana?");
                  if (shouldClose) {
                      window.close();
                  }
              }
              
              // Detectar cancelación
              window.onbeforeunload = function() {
                  return "¿Está seguro que desea salir sin imprimir?";
              }
          </script>
      </body>
      </html>
    `);

    ventanaImpresion.document.close();

    // Mostrar confirmación de éxito
    Swal.fire({
      title: "✅ Detalle listo para imprimir",
      text: "La ventana con el detalle completo del equipo se ha abierto correctamente.",
      icon: "success",
      timer: 2500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Error al imprimir detalle del equipo:", error);
    Swal.fire({
      title: "Error de Impresión",
      text: "No se pudo preparar la impresión del detalle. Verifique su configuración de navegador.",
      icon: "error",
    });
  }
}

console.log("[DOMContentLoaded] Inicialización completada");
