//-----------------------------------------------------------------------------------------------------
// EQUIPOS.JS - VERSIÓN 2.7 - CAMPOS MARCA Y MODELO AGREGADOS
// CONFIGURACION E INICIALIZACION
//-----------------------------------------------------------------------------------------------------

// Verificar que CONFIG esté disponible
if (typeof CONFIG === "undefined") {
  console.error(
    "CONFIG no está definido. Asegúrate de cargar config.js antes que Equipos.js"
  );
}

// Función helper para obtener la URL base de la API
function getApiBaseUrl() {
  return typeof CONFIG !== "undefined"
    ? CONFIG.API_BASE_URL
    : "https://sistema-control-gestion-backend.onrender.com/api";
}

// URL base de la API - Usar configuración centralizada
const API_URL = getApiBaseUrl() + "/equipos";
const API_URL_PERSONA = getApiBaseUrl() + "/personal";
const API_URL_ESTADOS = getApiBaseUrl() + "/estadoequipo";
const API_URL_TIPO_EQUIPO = getApiBaseUrl() + "/tipoequipo";

// Función de diagnóstico para testear las APIs
window.testAPIs = async function () {
  console.log("=== DIAGNÓSTICO DE APIs ===");
  console.log("API Base URL:", getApiBaseUrl());
  console.log("API_URL:", API_URL);
  console.log("API_URL_ESTADOS:", API_URL_ESTADOS);

  try {
    console.log("1. Probando API de equipos...");
    const equiposRes = await fetch(API_URL);
    console.log("- Status equipos:", equiposRes.status);
    const equipos = await equiposRes.json();
    console.log("- Equipos obtenidos:", equipos?.length || 0);
    console.log("- Primer equipo:", equipos?.[0]);

    console.log("2. Probando API de unidades...");
    const unidadesRes = await fetch(getApiBaseUrl() + "/unidadesequipo");
    console.log("- Status unidades:", unidadesRes.status);
    const unidades = await unidadesRes.json();
    console.log("- Unidades obtenidas:", unidades?.length || 0);
    console.log("- Primera unidad:", unidades?.[0]);

    console.log("3. Probando API de estados...");
    const estadosRes = await fetch(API_URL_ESTADOS);
    console.log("- Status estados:", estadosRes.status);
    const estados = await estadosRes.json();
    console.log("- Estados obtenidos:", estados?.length || 0);
    console.log("- Primer estado:", estados?.[0]);

    return { equipos, unidades, estados };
  } catch (error) {
    console.error("Error en diagnóstico:", error);
    return { error };
  }
};

// Almacena una instancia del modal de Bootstrap para poder manipularlo desde el código.
let modalEquipo; // Obsoleto, pero se mantiene por si se reutiliza
let modalDetalles;
let modalInventario; // Obsoleto
let modalCrearModelo;
let modalAgregarUnidad;

// Almacena el contexto del modelo de equipo que se está viendo en el modal de detalles.
let equipoIdActual = null;
let equipoNneActual = null;

//-----------------------------------------------------------------------------------------------------
// FUNCION AUXILIAR PARA RECARGAR EQUIPO DESDE LA API
//-----------------------------------------------------------------------------------------------------
async function recargarEquipoActual(nne, nroSerie) {
  let url = "";
  if (nne) {
    url = `${getApiBaseUrl()}/equipos/nne/${nne}`;
  } else if (nroSerie) {
    url = `${getApiBaseUrl()}/equipos/nroSerie/${encodeURIComponent(nroSerie)}`;
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

// Event listener para el botón de exportar PDF con html2pdf.js
const btnExportarPDF = document.getElementById("btnExportarPDF");
if (btnExportarPDF)
  btnExportarPDF.addEventListener("click", exportarEquiposPDF);

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
  console.log("[cargarPersonalParaModal] Iniciando carga de personal");
  const select = document.getElementById("unidad-responsable");
  if (!select) {
    console.error("[cargarPersonalParaModal] No se encontró el select unidad-responsable");
    return;
  }
  
  try {
    console.log("[cargarPersonalParaModal] Consultando API:", API_URL_PERSONA);
    const personal = await fetch(API_URL_PERSONA).then((res) =>
      res.ok ? res.json() : Promise.reject(res)
    );
    console.log("[cargarPersonalParaModal] Personal obtenido:", personal);
    
    select.innerHTML = '<option value="">Seleccionar responsable...</option>'; // Opción para no asignar a nadie
    personal.forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id_persona;
      option.textContent = `${p.nombreGrado || ""} ${p.nombreArmEsp || ""} ${
        p.nombre
      } ${p.apellido}`.trim();
      select.appendChild(option);
      console.log(`[cargarPersonalParaModal] Agregada opción: ${option.textContent} (ID: ${option.value})`);
    });
    console.log("[cargarPersonalParaModal] Carga completada. Total opciones:", select.options.length);
  } catch (error) {
    console.error("[cargarPersonalParaModal] Error al cargar el personal:", error);
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
async function abrirModalAgregarUnidad() {
  if (!equipoIdActual) {
    mostrarAlerta("No se ha seleccionado un modelo de equipo válido.", "error");
    return;
  }
  const form = document.getElementById("formAgregarUnidad");
  form.reset();
  document.getElementById("unidad-equipo-id").value = equipoIdActual;
  
  // Cargar el personal disponible para el select
  await cargarPersonalParaModal();
  
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
      `${getApiBaseUrl()}/equipos/nroSerie/${encodeURIComponent(nroSerie)}`,
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
      `${getApiBaseUrl()}/equipos/nne/${encodeURIComponent(nne)}`,
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
      fetch(getApiBaseUrl() + "/unidadesequipo").then((res) =>
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
      response = await fetch(`${getApiBaseUrl()}/equipos/nne/${nne}`);
    } else if (nroSerie) {
      // 1b. Obtener datos del equipo por nroSerie
      response = await fetch(
        `${getApiBaseUrl()}/equipos/nroSerie/${encodeURIComponent(nroSerie)}`
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
    console.log("[window.mostrarDetalles] Equipo cargado:", equipo.ine, "- NNE:", equipo.nne);

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
    
    let responsable = "Sin asignar";

    // Verificar si hay un responsable válido asignado
    // personaId debe ser un número válido (no null, no undefined, no 0)
    // Y la persona debe tener al menos nombre o apellido con contenido
    if (personaId && personaId !== null && typeof personaId === 'number' && personaId > 0 && 
        persona && (persona.nombre?.trim() || persona.apellido?.trim())) {
      
      const grado = persona.nombreGrado || "";
      const arma = persona.nombreArmEsp || "";
      const nombre = persona.nombre?.trim() || "";
      const apellido = persona.apellido?.trim() || "";
      
      console.log("[window.mostrarDetalles] Responsable válido encontrado:");
      console.log("  - grado:", grado);
      console.log("  - arma:", arma);
      console.log("  - nombre:", nombre);
      console.log("  - apellido:", apellido);
      
      // Construir el nombre completo
      const nombreCompleto = `${grado} ${arma} ${nombre} ${apellido}`
        .replace(/\s+/g, " ")
        .trim();
      
      if (nombreCompleto) {
        responsable = nombreCompleto;
        console.log("[window.mostrarDetalles] Responsable asignado:", responsable);
      }
    } else {
      console.log("[window.mostrarDetalles] Sin responsable válido:");
      console.log("  - personaId:", personaId, "(tipo:", typeof personaId, ")");
      console.log("  - personaId > 0:", personaId > 0);
      if (persona) {
        console.log("  - nombre con contenido:", !!(persona.nombre?.trim()));
        console.log("  - apellido con contenido:", !!(persona.apellido?.trim()));
      }
    }
    const elResponsable = document.getElementById("detalle-responsable");
    if (elResponsable) elResponsable.textContent = responsable;

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
    const response = await fetch(`${getApiBaseUrl()}/tipoequipo`);
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

//-----------------------------------------------------------------------------------------------------
// EXPORTACIÓN PDF
//-----------------------------------------------------------------------------------------------------

/**
 * Exporta la tabla de equipos a PDF usando html2pdf.js
 */
function exportarEquiposPDF() {
  console.log("[exportarEquiposPDF] Iniciando exportación PDF");

  // Verificar que html2pdf esté disponible
  if (typeof html2pdf === "undefined") {
    console.error("[exportarEquiposPDF] html2pdf.js no está cargado");
    mostrarAlerta("Error: La biblioteca de PDF no está disponible", "error");
    return;
  }

  // Obtener el contenedor que se va a exportar
  const contenido = document.getElementById("contenidoPDF");
  if (!contenido) {
    console.error(
      "[exportarEquiposPDF] No se encontró el elemento contenidoPDF"
    );
    mostrarAlerta("Error: No se encontró el contenido para exportar", "error");
    return;
  }

  // Crear una copia del contenido para modificar sin afectar la vista
  const contenidoCopia = contenido.cloneNode(true);

  // Ocultar la columna de acciones en la copia
  const headerAcciones = contenidoCopia.querySelector("th:last-child");
  if (headerAcciones) headerAcciones.style.display = "none";

  const cellsAcciones = contenidoCopia.querySelectorAll("td:last-child");
  cellsAcciones.forEach((cell) => (cell.style.display = "none"));

  // Agregar título y fecha al PDF
  const wrapper = document.createElement("div");
  wrapper.style.padding = "20px";

  const titulo = document.createElement("h2");
  titulo.textContent = "Listado de Equipos";
  titulo.style.textAlign = "center";
  titulo.style.marginBottom = "10px";
  titulo.style.color = "#333";

  const fecha = document.createElement("p");
  fecha.textContent = `Fecha de generación: ${new Date().toLocaleDateString(
    "es-ES",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
  fecha.style.textAlign = "center";
  fecha.style.marginBottom = "20px";
  fecha.style.color = "#666";

  wrapper.appendChild(titulo);
  wrapper.appendChild(fecha);
  wrapper.appendChild(contenidoCopia);

  // Configuración para html2pdf
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Equipos_${new Date()
      .toLocaleDateString("es-ES")
      .replace(/\//g, "-")}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "landscape",
    },
  };

  // Mostrar indicador de carga
  const loading = Swal.fire({
    title: "Generando PDF...",
    html: "Por favor espera mientras se genera el archivo.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Generar PDF
  html2pdf()
    .set(opt)
    .from(wrapper)
    .save()
    .then(() => {
      console.log("[exportarEquiposPDF] PDF generado exitosamente");
      loading.close();
      mostrarAlerta("PDF exportado exitosamente", "success");
    })
    .catch((error) => {
      console.error("[exportarEquiposPDF] Error al generar PDF:", error);
      loading.close();
      mostrarAlerta("Error al generar el PDF", "error");
    });
}

/**
 * Exporta los detalles del equipo a PDF usando html2pdf.js
 */
function exportarDetalleEquipoPDF() {
  console.log(
    "[exportarDetalleEquipoPDF] Iniciando exportación PDF del detalle"
  );

  // Verificar que html2pdf esté disponible
  if (typeof html2pdf === "undefined") {
    console.error("[exportarDetalleEquipoPDF] html2pdf.js no está cargado");
    mostrarAlerta("Error: La biblioteca de PDF no está disponible", "error");
    return;
  }

  // Verificar que tenemos el equipo actual
  if (!window.__equipoDetallesActual) {
    console.error("[exportarDetalleEquipoPDF] No hay datos del equipo actual");
    mostrarAlerta("Error: No se encontraron los datos del equipo", "error");
    return;
  }

  // Obtener información para el nombre del archivo
  const equipo = window.__equipoDetallesActual;
  const nne =
    equipo.nne ||
    document.getElementById("detalle-nne")?.textContent?.trim() ||
    "";
  const nroSerie =
    equipo.nroSerie ||
    document.getElementById("detalle-nro-serie")?.textContent?.trim() ||
    "";
  const identificador =
    nne && nne !== "-" && nne !== "---" ? nne : nroSerie || "Detalle";

  // Obtener datos del DOM para completar la información
  const datosDOM = {
    ine: document.getElementById("detalle-ine")?.textContent?.trim() || "",
    nne: document.getElementById("detalle-nne")?.textContent?.trim() || "",
    nroSerie:
      document.getElementById("detalle-nro-serie")?.textContent?.trim() || "",
    marca: document.getElementById("detalle-marca")?.textContent?.trim() || "",
    modelo:
      document.getElementById("detalle-modelo")?.textContent?.trim() || "",
    tipoEquipo:
      document.getElementById("detalle-tipo-equipo")?.textContent?.trim() || "",
    estado:
      document.getElementById("detalle-estado")?.textContent?.trim() || "",
    responsable:
      document.getElementById("detalle-responsable")?.textContent?.trim() || "",
    ubicacion:
      document.getElementById("detalle-ubicacion")?.textContent?.trim() || "",
    observaciones:
      document.getElementById("detalle-observaciones")?.textContent?.trim() ||
      "",
  };

  console.log("[exportarDetalleEquipoPDF] Datos del DOM obtenidos:", datosDOM);

  // Crear contenido optimizado para PDF
  const contenidoPDF = crearContenidoPDFDetalle(equipo, datosDOM);

  if (!contenidoPDF) {
    console.error("[exportarDetalleEquipoPDF] Error al crear el contenido PDF");
    mostrarAlerta("Error al generar el contenido del PDF", "error");
    return;
  }

  // Configuración para html2pdf
  const opt = {
    margin: [15, 15, 15, 15],
    filename: `Detalle_Equipo_${identificador}_${new Date()
      .toLocaleDateString("es-ES")
      .replace(/\//g, "-")}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    },
  };

  // Mostrar indicador de carga
  const loading = Swal.fire({
    title: "Generando PDF del detalle...",
    html: "Por favor espera mientras se genera el archivo.",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });

  // Generar PDF
  html2pdf()
    .set(opt)
    .from(contenidoPDF)
    .save()
    .then(() => {
      console.log(
        "[exportarDetalleEquipoPDF] PDF del detalle generado exitosamente"
      );
      loading.close();
      mostrarAlerta("PDF del detalle exportado exitosamente", "success");
    })
    .catch((error) => {
      console.error(
        "[exportarDetalleEquipoPDF] Error al generar PDF del detalle:",
        error
      );
      loading.close();
      mostrarAlerta("Error al generar el PDF del detalle", "error");
    });
}

/**
 * Crea el contenido HTML optimizado para PDF del detalle del equipo
 */
function crearContenidoPDFDetalle(equipo, datosDOM = {}) {
  console.log("[crearContenidoPDFDetalle] Datos del equipo:", equipo);
  console.log("[crearContenidoPDFDetalle] Datos del DOM:", datosDOM);

  const container = document.createElement("div");
  container.style.cssText = `
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    padding: 20px;
    background: white;
    color: #333;
    line-height: 1.4;
  `;

  // Header del documento
  const header = document.createElement("div");
  header.style.cssText = `
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 3px solid #007bff;
    padding-bottom: 15px;
  `;

  const titulo = document.createElement("h1");
  titulo.textContent = "Detalle del Equipo";
  titulo.style.cssText = `
    color: #007bff;
    margin: 0 0 5px 0;
    font-size: 28px;
    font-weight: bold;
  `;

  const subtitulo = document.createElement("p");
  subtitulo.textContent = `Generado el ${new Date().toLocaleDateString(
    "es-ES",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  )}`;
  subtitulo.style.cssText = `
    color: #666;
    margin: 0;
    font-size: 14px;
  `;

  header.appendChild(titulo);
  header.appendChild(subtitulo);

  // Función helper para obtener valor con fallback
  const obtenerValor = (valorEquipo, valorDOM, defecto = "No especificado") => {
    return valorDOM &&
      valorDOM !== "-" &&
      valorDOM !== "---" &&
      valorDOM.trim() !== ""
      ? valorDOM
      : valorEquipo || defecto;
  };

  // Información básica
  const seccionBasica = crearSeccionPDF(
    "Información Básica de Identificación",
    [
      {
        label: "INE",
        valor: obtenerValor(equipo.ine, datosDOM.ine, "No asignado"),
      },
      {
        label: "NNE",
        valor: obtenerValor(equipo.nne, datosDOM.nne, "No asignado"),
      },
      {
        label: "NRO Serie",
        valor: obtenerValor(
          equipo.unidades?.[0]?.nroSerie ||
            equipo.unidades?.[0]?.nro_serie ||
            equipo.nroSerie,
          datosDOM.nroSerie,
          "No asignado"
        ),
      },
      {
        label: "Estado",
        valor: obtenerValor(
          equipo.unidades?.[0]?.estado?.nombre ||
            equipo.unidades?.[0]?.estado_nombre,
          datosDOM.estado,
          "No definido"
        ),
      },
      {
        label: "Tipo de Equipo",
        valor: obtenerValor(
          equipo.tipoNombre || equipo.tipo,
          datosDOM.tipoEquipo,
          "No especificado"
        ),
      },
    ],
    "#007bff"
  );

  console.log(
    "[crearContenidoPDFDetalle] Punto de control: antes de definir seccionTecnica"
  );

  // Especificaciones técnicas (solo Marca y Modelo)
  const seccionTecnica = crearSeccionPDF(
    "Especificaciones Técnicas",
    [
      {
        label: "Marca",
        valor: obtenerValor(equipo.marca, datosDOM.marca, "No especificada"),
      },
      {
        label: "Modelo",
        valor: obtenerValor(equipo.modelo, datosDOM.modelo, "No especificado"),
      },
    ],
    "#17a2b8"
  );

  console.log(
    "[crearContenidoPDFDetalle] seccionTecnica creada:",
    seccionTecnica
  );

  // Especificaciones adicionales (excluyendo Marca y Modelo)
  let especificacionesHtml = "";

  // Intentar obtener especificaciones del equipo o del DOM
  if (equipo.especificaciones && equipo.especificaciones.length > 0) {
    // Filtrar especificaciones excluyendo Marca y Modelo
    const especificacionesFiltradas = equipo.especificaciones.filter(
      (spec) =>
        spec.clave.toLowerCase() !== "marca" &&
        spec.clave.toLowerCase() !== "modelo"
    );

    if (especificacionesFiltradas.length > 0) {
      especificacionesHtml = especificacionesFiltradas
        .map(
          (spec) =>
            `<div style="margin-bottom: 8px;">
          <strong style="color: #495057;">${spec.clave}:</strong> 
          <span style="color: #6c757d;">${spec.valor}</span>
        </div>`
        )
        .join("");
    }
  } else {
    // Intentar obtener especificaciones del DOM si no están en el objeto equipo
    const especificacionesUL = document.getElementById(
      "detalle-especificaciones"
    );
    if (especificacionesUL) {
      const liElements = especificacionesUL.querySelectorAll("li");
      if (liElements.length > 0) {
        especificacionesHtml = Array.from(liElements)
          .map((li) => {
            const strong = li.querySelector("strong");
            if (strong) {
              const clave = strong.textContent.replace(":", "").trim();
              const valor = li.textContent
                .replace(strong.textContent, "")
                .trim();

              // Filtrar Marca y Modelo
              if (
                clave.toLowerCase() !== "marca" &&
                clave.toLowerCase() !== "modelo"
              ) {
                return `<div style="margin-bottom: 8px;">
                <strong style="color: #495057;">${clave}:</strong> 
                <span style="color: #6c757d;">${valor}</span>
              </div>`;
              }
            }
            return "";
          })
          .filter((item) => item !== "")
          .join("");
      }
    }
  }

  // Si no hay especificaciones adicionales, mostrar mensaje por defecto
  if (!especificacionesHtml) {
    especificacionesHtml =
      '<p style="color: #999; font-style: italic;">No hay especificaciones adicionales registradas.</p>';
  }

  const especificacionesDiv = document.createElement("div");
  especificacionesDiv.style.cssText = `
    background: #f8f9fa;
    border-left: 4px solid #17a2b8;
    padding: 15px;
    margin: 15px 0;
  `;
  especificacionesDiv.innerHTML = `
    <h4 style="color: #17a2b8; margin: 0 0 10px 0; font-size: 16px;">Especificaciones Adicionales</h4>
    ${especificacionesHtml}
  `;

  // Asignación y ubicación
  const personaId = equipo.unidades?.[0]?.personaId;
  const persona = equipo.unidades?.[0]?.persona;
  let responsable = "Sin asignar";

  // Intentar obtener responsable del objeto equipo
  if (personaId && persona && (persona.nombre || persona.apellido)) {
    const grado = persona.nombreGrado || "";
    const arma = persona.nombreArmEsp || "";
    const nombre = persona.nombre || "";
    const apellido = persona.apellido || "";
    responsable = `${grado} ${arma} ${nombre} ${apellido}`
      .replace(/\s+/g, " ")
      .trim();
  }

  // Usar datos del DOM si están disponibles (prioridad al DOM)
  if (
    datosDOM.responsable &&
    datosDOM.responsable !== "-" &&
    datosDOM.responsable !== "---" &&
    datosDOM.responsable.trim() !== ""
  ) {
    responsable = datosDOM.responsable;
  }

  const seccionAsignacion = crearSeccionPDF(
    "Asignación y Ubicación",
    [
      {
        label: "Responsable",
        valor: responsable,
      },
      {
        label: "Ubicación",
        valor: obtenerValor(
          equipo.ubicacion,
          datosDOM.ubicacion,
          "No especificada"
        ),
      },
      {
        label: "Observaciones",
        valor: obtenerValor(
          equipo.observaciones,
          datosDOM.observaciones,
          "Sin observaciones"
        ),
      },
    ],
    "#28a745"
  );

  // Ensamblar todo
  console.log(
    "[crearContenidoPDFDetalle] Punto de control: antes de usar seccionTecnica"
  );
  console.log(
    "[crearContenidoPDFDetalle] seccionTecnica disponible:",
    typeof seccionTecnica,
    seccionTecnica
  );

  container.appendChild(header);
  container.appendChild(seccionBasica);
  container.appendChild(seccionTecnica);
  container.appendChild(especificacionesDiv);
  container.appendChild(seccionAsignacion);

  return container;
}

/**
 * Crea una sección estilizada para el PDF
 */
function crearSeccionPDF(titulo, campos, color) {
  const seccion = document.createElement("div");
  seccion.style.cssText = `
    margin-bottom: 25px;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    background: ${color};
    color: white;
    padding: 12px 15px;
    font-weight: bold;
    font-size: 16px;
  `;
  header.textContent = titulo;

  const body = document.createElement("div");
  body.style.cssText = `
    padding: 15px;
  `;

  const tabla = document.createElement("table");
  tabla.style.cssText = `
    width: 100%;
    border-collapse: collapse;
  `;

  campos.forEach((campo, index) => {
    const fila = document.createElement("tr");
    fila.style.cssText =
      index % 2 === 0 ? "background: #f8f9fa;" : "background: white;";

    const celdaLabel = document.createElement("td");
    celdaLabel.style.cssText = `
      padding: 10px 12px;
      font-weight: bold;
      color: #495057;
      width: 40%;
      vertical-align: top;
    `;
    celdaLabel.textContent = campo.label;

    const celdaValor = document.createElement("td");
    celdaValor.style.cssText = `
      padding: 10px 12px;
      color: #6c757d;
      vertical-align: top;
    `;
    celdaValor.textContent = campo.valor;

    fila.appendChild(celdaLabel);
    fila.appendChild(celdaValor);
    tabla.appendChild(fila);
  });

  body.appendChild(tabla);
  seccion.appendChild(header);
  seccion.appendChild(body);

  return seccion;
}

/**
 * Función de diagnóstico para verificar el PDF del detalle
 */
function diagnosticarPDFDetalle() {
  console.log("=== DIAGNÓSTICO PDF DETALLE ===");
  console.log("1. html2pdf disponible:", typeof html2pdf !== "undefined");
  console.log("2. Equipo actual:", window.__equipoDetallesActual);

  // Verificar elementos del DOM
  const elementos = [
    "detalle-ine",
    "detalle-nne",
    "detalle-nro-serie",
    "detalle-marca",
    "detalle-modelo",
    "detalle-tipo-equipo",
    "detalle-estado",
    "detalle-responsable",
    "detalle-ubicacion",
    "detalle-observaciones",
    "detalle-especificaciones",
    "contenidoPDFDetalle",
  ];

  elementos.forEach((id) => {
    const elemento = document.getElementById(id);
    console.log(
      `3. Elemento ${id}:`,
      elemento ? "EXISTE" : "NO EXISTE",
      elemento ? elemento.textContent?.trim() : ""
    );
  });

  if (window.__equipoDetallesActual) {
    try {
      const datosDOM = {
        ine: document.getElementById("detalle-ine")?.textContent?.trim() || "",
        nne: document.getElementById("detalle-nne")?.textContent?.trim() || "",
        nroSerie:
          document.getElementById("detalle-nro-serie")?.textContent?.trim() ||
          "",
        marca:
          document.getElementById("detalle-marca")?.textContent?.trim() || "",
        modelo:
          document.getElementById("detalle-modelo")?.textContent?.trim() || "",
      };

      const contenidoPDF = crearContenidoPDFDetalle(
        window.__equipoDetallesActual,
        datosDOM
      );
      console.log("4. Contenido PDF generado:", contenidoPDF ? "SÍ" : "NO");

      if (contenidoPDF) {
        // Mostrar temporalmente el contenido
        contenidoPDF.style.cssText +=
          "position: fixed; top: 10px; left: 10px; z-index: 9999; background: white; border: 2px solid red; max-width: 400px; max-height: 400px; overflow: auto;";
        document.body.appendChild(contenidoPDF);

        setTimeout(() => {
          contenidoPDF.remove();
        }, 5000);
      }
    } catch (error) {
      console.error("Error generando contenido:", error);
    }
  }

  console.log("=== FIN DIAGNÓSTICO ===");
}

// Event listener para cargar datos al cargar la página
document.addEventListener("DOMContentLoaded", function () {
  console.log("[DOMContentLoaded] Iniciando carga de equipos...");

  // Inicializar modales
  window.bootstrap = window.bootstrap || {};
  window.bootstrap.Modal = bootstrap.Modal;

  // Inicializar modal de detalles
  const modalDetallesElement = document.getElementById("modalDetallesEquipo");
  if (modalDetallesElement) {
    window.modalDetalles = new bootstrap.Modal(modalDetallesElement);
  }

  // Inicializar otros modales
  const modalCrearModeloElement = document.getElementById("modalCrearModelo");
  if (modalCrearModeloElement) {
    window.modalCrearModelo = new bootstrap.Modal(modalCrearModeloElement);
  }

  const modalAgregarUnidadElement =
    document.getElementById("modalAgregarUnidad");
  if (modalAgregarUnidadElement) {
    window.modalAgregarUnidad = new bootstrap.Modal(modalAgregarUnidadElement);
  }

  const modalInventarioElement = document.getElementById("modalInventario");
  if (modalInventarioElement) {
    window.modalInventario = new bootstrap.Modal(modalInventarioElement);
  }

  // Cargar datos iniciales
  cargarEquipos();

  // Asignar eventos si las funciones existen
  if (typeof asignarEventListeners === "function") {
    asignarEventListeners();
  }

  // Cargar datos para modales si las funciones existen
  if (typeof cargarEstadosParaModal === "function") {
    cargarEstadosParaModal();
  }

  if (typeof cargarTiposEquipo === "function") {
    cargarTiposEquipo();
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

  // Event listener para exportar PDF
  const btnExportarPDF = document.getElementById("btn-exportar-pdf");
  if (btnExportarPDF) {
    btnExportarPDF.addEventListener("click", exportarEquiposPDF);
    console.log(
      "[DOMContentLoaded] Event listener agregado para btn-exportar-pdf"
    );
  } else {
    console.error(
      "[DOMContentLoaded] No se encontró el botón btn-exportar-pdf"
    );
  }

  // Event listener para exportar PDF del detalle
  const btnExportarPDFDetalle = document.getElementById(
    "btn-exportar-pdf-detalle"
  );
  if (btnExportarPDFDetalle) {
    btnExportarPDFDetalle.addEventListener("click", exportarDetalleEquipoPDF);
    console.log(
      "[DOMContentLoaded] Event listener agregado para btn-exportar-pdf-detalle"
    );
  } else {
    console.error(
      "[DOMContentLoaded] No se encontró el botón btn-exportar-pdf-detalle"
    );
  }

  // Event listener para abrir modal crear modelo
  const btnAbrirModalCrearModelo = document.getElementById(
    "btn-abrir-modal-crear-modelo"
  );
  if (btnAbrirModalCrearModelo) {
    btnAbrirModalCrearModelo.addEventListener("click", function () {
      if (window.modalCrearModelo) {
        window.modalCrearModelo.show();
      }
    });
    console.log(
      "[DOMContentLoaded] Event listener agregado para btn-abrir-modal-crear-modelo"
    );
  } else {
    console.error(
      "[DOMContentLoaded] No se encontró el botón btn-abrir-modal-crear-modelo"
    );
  }
});
