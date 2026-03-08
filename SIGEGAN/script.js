/* ============================================================
   SIGEGAN – Sistema Integral de Gestión Ganadera
   script.js – Lógica principal compartida del sistema
   ============================================================ */

/* ──────────────────────────────────────────────
   1. BASE DE DATOS SIMULADA (localStorage)
────────────────────────────────────────────── */
const DB = {
  usuarios: [
    { id: 1, nombre: "Carlos Mendoza",   usuario: "admin",        clave: "admin123", rol: "administrador" },
    { id: 2, nombre: "Luis Herrera",     usuario: "propietario1", clave: "prop123",  rol: "propietario",  propietarioId: 1 },
    { id: 3, nombre: "Rosa Gutiérrez",   usuario: "propietario2", clave: "prop456",  rol: "propietario",  propietarioId: 2 },
    { id: 4, nombre: "Dr. Andrés Ríos",  usuario: "veterinario",  clave: "vet123",   rol: "veterinario" },
  ],
  propietarios: [
    { id: 1, nombre: "Luis Herrera",    doc: "12345678", tel: "310-000-0001", email: "luis@correo.com" },
    { id: 2, nombre: "Rosa Gutiérrez",  doc: "87654321", tel: "320-000-0002", email: "rosa@correo.com" },
    { id: 3, nombre: "Marcos Castillo", doc: "11223344", tel: "300-000-0003", email: "marcos@correo.com" },
  ],
  lotes: [
    { id: 1, propietarioId: 1, propietarioNombre: "Luis Herrera",    cantidad: 25, fechaIngreso: "2026-03-01", estado: "activo" },
    { id: 2, propietarioId: 2, propietarioNombre: "Rosa Gutiérrez",  cantidad: 40, fechaIngreso: "2026-03-10", estado: "activo" },
    { id: 3, propietarioId: 3, propietarioNombre: "Marcos Castillo", cantidad: 15, fechaIngreso: "2026-03-15", estado: "activo" },
  ],
  salidas: [
    { id: 1, loteId: 99, propietarioId: 1, propietarioNombre: "Luis Herrera", cantidad: 10, dias: 20, preciodia: 30, total: 6000, fechaSalida: "2026-02-20" },
  ],
  veterinario: [
    { id: 1, loteId: 1, propietarioId: 1, propietarioNombre: "Luis Herrera",   fecha: "2026-03-05", diagnostico: "Buen estado general",  tratamiento: "Vitaminas A y B12",   veterinario: "Dr. Andrés Ríos", costo: 150000 },
    { id: 2, loteId: 2, propietarioId: 2, propietarioNombre: "Rosa Gutiérrez", fecha: "2026-03-12", diagnostico: "Revisión preventiva",   tratamiento: "Desparasitante oral", veterinario: "Dr. Andrés Ríos", costo: 200000 },
  ],
  alimentacion: [
    { id: 1, loteId: 1, propietarioId: 1, propietarioNombre: "Luis Herrera",    fecha: "2026-03-20", tipo: "Pasto Natural", cantidad: 200, unidad: "kg" },
    { id: 2, loteId: 2, propietarioId: 2, propietarioNombre: "Rosa Gutiérrez",  fecha: "2026-03-21", tipo: "Concentrado",   cantidad: 150, unidad: "kg" },
    { id: 3, loteId: 3, propietarioId: 3, propietarioNombre: "Marcos Castillo", fecha: "2026-03-22", tipo: "Forraje",       cantidad: 100, unidad: "kg" },
  ],
  historial: [
    { id: 1, fecha: "2026-03-20 08:10", accion: "Ingreso de ganado",     usuario: "admin",        detalle: "Lote #3: 15 animales de Marcos Castillo" },
    { id: 2, fecha: "2026-03-21 10:25", accion: "Control veterinario",   usuario: "veterinario",  detalle: "Revisión preventiva en lote de Rosa Gutiérrez" },
    { id: 3, fecha: "2026-03-22 09:00", accion: "Registro alimentación", usuario: "veterinario",  detalle: "Forraje 100kg para lote de Marcos Castillo" },
    { id: 4, fecha: "2026-03-22 14:30", accion: "Inicio de sesión",      usuario: "propietario1", detalle: "Luis Herrera consultó su información" },
  ],
  precioAnimalDia: 30,
  capacidadMax: 150,
};

function guardarDB() {
  localStorage.setItem("sigegan_db", JSON.stringify(DB));
}
function cargarDB() {
  const guardada = localStorage.getItem("sigegan_db");
  if (guardada) {
    try { Object.assign(DB, JSON.parse(guardada)); } catch(e) {}
  }
}

/* ──────────────────────────────────────────────
   2. AUTENTICACIÓN Y SESIÓN
────────────────────────────────────────────── */
function iniciarSesion(usuario, clave) {
  const user = DB.usuarios.find(u => u.usuario === usuario && u.clave === clave);
  if (!user) return null;
  const sesion = { id: user.id, nombre: user.nombre, usuario: user.usuario, rol: user.rol, propietarioId: user.propietarioId || null };
  localStorage.setItem("sigegan_sesion", JSON.stringify(sesion));
  return sesion;
}
function getSesion() {
  const s = localStorage.getItem("sigegan_sesion");
  return s ? JSON.parse(s) : null;
}
function cerrarSesion() {
  localStorage.removeItem("sigegan_sesion");
  window.location.href = "index.html";
}
function protegerPagina(rolRequerido) {
  const sesion = getSesion();
  if (!sesion) { window.location.href = "index.html"; return null; }
  if (sesion.rol !== rolRequerido) {
    const rutas = { administrador: "admin.html", propietario: "propietario.html", veterinario: "veterinario.html" };
    window.location.href = rutas[sesion.rol] || "index.html";
    return null;
  }
  return sesion;
}

/* ──────────────────────────────────────────────
   3. UTILIDADES GENERALES
────────────────────────────────────────────── */
function formatFecha(f) {
  if (!f) return "—";
  const p = f.split("-");
  return `${p[2]}/${p[1]}/${p[0]}`;
}
function hoy() {
  return new Date().toISOString().split("T")[0];
}
function calcDias(ingreso, salida) {
  const a = new Date(ingreso);
  const b = new Date(salida || hoy());
  return Math.max(0, Math.round((b - a) / 86400000));
}
function formatMoney(n) {
  return "$" + Number(n).toLocaleString("es-CO");
}
function totalAnimalesActivos() {
  return DB.lotes.filter(l => l.estado === "activo").reduce((s, l) => s + l.cantidad, 0);
}

/* ──────────────────────────────────────────────
   4. NAVEGACIÓN SPA
────────────────────────────────────────────── */
function mostrarSeccion(id) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  const seccion = document.getElementById("sec-" + id);
  if (seccion) seccion.classList.add("active");
  const navItem = document.querySelector(`[data-nav="${id}"]`);
  if (navItem) navItem.classList.add("active");
  if (navItem) {
    const titulo = navItem.querySelector("span:last-child")?.textContent;
    const topTitle = document.getElementById("top-title");
    if (topTitle && titulo) topTitle.textContent = titulo;
  }
  // Cierra sidebar en móvil al navegar
  cerrarSidebarMovil();
}

/* ──────────────────────────────────────────────
   5. SIDEBAR MÓVIL CON OVERLAY
────────────────────────────────────────────── */
function abrirSidebar() {
  const sidebar  = document.querySelector(".sidebar");
  const overlay  = document.getElementById("sidebar-overlay");
  if (sidebar)  sidebar.classList.add("open");
  if (overlay) {
    overlay.classList.add("show");
    overlay.style.pointerEvents = "all";
  }
  document.body.style.overflow = "hidden"; // evita scroll del fondo
}

function cerrarSidebarMovil() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  if (sidebar)  sidebar.classList.remove("open");
  if (overlay) {
    overlay.classList.remove("show");
    overlay.style.pointerEvents = "none";
  }
  document.body.style.overflow = "";
}

/* ──────────────────────────────────────────────
   6. NOTIFICACIONES TOAST
────────────────────────────────────────────── */
function showToast(mensaje, tipo = "ok") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const icons = { ok: "✅", warn: "⚠️", error: "❌" };
  const toast = document.createElement("div");
  toast.className = `toast ${tipo === "warn" ? "warn" : tipo === "error" ? "error" : ""}`;
  toast.innerHTML = `<span>${icons[tipo]}</span><span>${mensaje}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 50);
  setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 400); }, 3500);
}

/* ──────────────────────────────────────────────
   7. HISTORIAL
────────────────────────────────────────────── */
function logHistorial(accion, detalle) {
  const sesion = getSesion();
  const now    = new Date();
  const fecha  = `${now.toLocaleDateString("es-CO")} ${now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
  DB.historial.unshift({ id: Date.now(), fecha, accion, usuario: sesion?.usuario || "sistema", detalle });
  guardarDB();
}

/* ──────────────────────────────────────────────
   8. HELPERS DE RENDER COMPARTIDOS
────────────────────────────────────────────── */
function renderCapacityBar(containerId) {
  const activos    = totalAnimalesActivos();
  const pct        = Math.round((activos / DB.capacidadMax) * 100);
  const fillClass  = pct >= 90 ? "danger" : pct >= 70 ? "warn" : "";
  const el         = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="capacity-block">
      <div class="capacity-labels">
        <span>Ocupación de la Hacienda</span>
        <strong>${activos} / ${DB.capacidadMax} animales — Disponibles: ${DB.capacidadMax - activos}</strong>
      </div>
      <div class="bar-track">
        <div class="bar-fill ${fillClass}" style="width:${pct}%"></div>
      </div>
    </div>`;
}
function fillSelectPropietarios(selectId, placeholder = "Seleccionar propietario") {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = `<option value="">— ${placeholder} —</option>` +
    DB.propietarios.map(p => `<option value="${p.id}">${p.nombre}</option>`).join("");
}
function fillSelectLotes(selectId) {
  const sel     = document.getElementById(selectId);
  if (!sel) return;
  const activos = DB.lotes.filter(l => l.estado === "activo");
  sel.innerHTML = activos.length
    ? `<option value="">— Seleccionar lote —</option>` + activos.map(l =>
        `<option value="${l.id}">Lote #${l.id} – ${l.propietarioNombre} (${l.cantidad} animales)</option>`
      ).join("")
    : `<option value="">Sin lotes activos</option>`;
}

/* ──────────────────────────────────────────────
   9. INICIALIZACIÓN AL CARGAR LA PÁGINA
────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  cargarDB();

  /* ── Inyecta el overlay si no existe ── */
  if (!document.getElementById("sidebar-overlay")) {
    const ov = document.createElement("div");
    ov.id        = "sidebar-overlay";
    ov.className = "sidebar-overlay";
    // Al tocar el overlay se cierra el sidebar
    ov.addEventListener("click",   cerrarSidebarMovil);
    ov.addEventListener("touchend", cerrarSidebarMovil);
    document.body.appendChild(ov);
  }

  /* ── Botón cerrar sesión ── */
  const btnLogout = document.getElementById("btn-logout");
  if (btnLogout) btnLogout.addEventListener("click", cerrarSesion);

  /* ── Navegación del sidebar ── */
  document.querySelectorAll(".nav-item[data-nav]").forEach(item => {
    item.addEventListener("click", () => mostrarSeccion(item.dataset.nav));
  });

  /* ── Menú hamburguesa (abre sidebar) ── */
  const menuToggle = document.getElementById("menu-toggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const sidebar = document.querySelector(".sidebar");
      if (sidebar && sidebar.classList.contains("open")) {
        cerrarSidebarMovil();
      } else {
        abrirSidebar();
      }
    });
  }

  /* ── Cierra sidebar con tecla Escape ── */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrarSidebarMovil();
  });
});