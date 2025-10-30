import { Paginacion, NumeroPaginas_Programa } from "../Script_Condiciones.js";

// --- Configuración inicial ---
const conf = Paginacion(16, 4);
const total_paginas = conf.numeroPaginas || conf.numero_paginas || conf.numeroPaginas || 16; // fallback
const tamPaginaKB = conf.tamPaginas || conf.tam_pagina || 4; // fallback a 4 KB si no viene

// --- Estado y referencias DOM ---
let paginasUsadas = [];
const ramDiv = document.getElementById("ram-horizontal");
const tablaPaginas = document.querySelector("#tablaPaginas tbody");
const tablaProgramas = document.querySelector("#tablaProgramas tbody");

// Sistema operativo (siempre en inicio)
const so = {
    nombre: "S.O.",
    textSize: 4,
    dataSize: 0,
    stackSize: 0,
    heapSize: 0
};

// Lista de programas disponibles (puedes editar/añadir aquí)
const programasDisponibles = [
    { nombre: "Navegador", textSize: 6, dataSize: 4, stackSize: 2, heapSize: 2 },
    { nombre: "EditorTexto", textSize: 4, dataSize: 2, stackSize: 1, heapSize: 1 },
    { nombre: "Spotify", textSize: 5, dataSize: 3, stackSize: 2, heapSize: 2 },
    { nombre: "Juego", textSize: 8, dataSize: 6, stackSize: 4, heapSize: 3 },
    { nombre: "IDE", textSize: 6, dataSize: 4, stackSize: 3, heapSize: 2 }
];

const colores = ["#004d63", "#006989", "#00a8b5", "#3ccfcf", "#5cd2c6"];

// ---------------- utilidades visuales ----------------
function generarColor(nombre) {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 60%, 45%)`;
}

// ---------------- inicialización RAM ----------------
function initRam() {
    ramDiv.innerHTML = "";
    paginasUsadas = new Array(total_paginas).fill(null);
    // crear bloques visuales vacíos inicialmente
    for (let i = 0; i < total_paginas; i++) {
        const bloque = document.createElement("div");
        bloque.className = "bloque-pagina";
        bloque.style.flex = "1";
        bloque.style.backgroundColor = "#bcd3d8";
        bloque.style.borderRight = "1px solid #fff";
        bloque.textContent = "";
        ramDiv.appendChild(bloque);
    }
    // no renderAll aquí porque pintamos bloques base; agregamos SO aparte
}

// renderiza la vista compacta: agrupa programas contiguos y muestra bloque libre
function renderAll() {
    ramDiv.innerHTML = "";

    // construir lista de segmentos contiguos
    const programas = [];
    for (let i = 0; i < paginasUsadas.length;) {
        if (paginasUsadas[i] !== null) {
            const nombre = paginasUsadas[i];
            let inicio = i;
            let longitud = 0;
            while (i < paginasUsadas.length && paginasUsadas[i] === nombre) {
                longitud++;
                i++;
            }
            programas.push({ nombre, inicio, longitud });
        } else {
            i++;
        }
    }

    // añadir bloques ocupados
    programas.forEach(p => {
        const bloque = document.createElement("div");
        bloque.className = "bloque-programa";
        bloque.style.flex = String(p.longitud);
        bloque.textContent = `${p.nombre} (${p.longitud} pág)`;
        bloque.style.display = "flex";
        bloque.style.alignItems = "center";
        bloque.style.justifyContent = "center";
        bloque.style.fontSize = "0.9rem";
        bloque.style.fontWeight = "500";
        bloque.style.color = "#fff";
        bloque.style.backgroundColor = generarColor(p.nombre);
        bloque.style.borderRight = "1px solid #fff";
        bloque.title = `Inicio: ${p.inicio}, Páginas: ${p.longitud}`;
        ramDiv.appendChild(bloque);
    });

    // espacio libre restante (si lo hay)
    const usados = programas.reduce((a, b) => a + b.longitud, 0);
    if (usados < total_paginas) {
        const libre = document.createElement("div");
        libre.style.flex = String(total_paginas - usados);
        libre.style.backgroundColor = "#d9e3e7";
        libre.style.border = "1px dashed #9aa3a7";
        libre.style.display = "flex";
        libre.style.alignItems = "center";
        libre.style.justifyContent = "center";
        libre.textContent = "Libre";
        ramDiv.appendChild(libre);
    }
}

// busca un rango contiguo de páginas libres de longitud `length`
function findFreeRange(length) {
    if (length <= 0) return -1;
    let consec = 0;
    for (let i = 0; i < paginasUsadas.length; i++) {
        if (paginasUsadas[i] === null) {
            consec++;
            if (consec === length) return i - length + 1;
        } else {
            consec = 0;
        }
    }
    return -1;
}

// asigna el nombre del programa a `paginas` posiciones desde `inicio`
function asignarPrograma(nombre, paginas, inicio) {
    for (let i = 0; i < paginas; i++) {
        paginasUsadas[inicio + i] = nombre;
    }
    renderAll();
}

// libera todas las páginas del programa (no permite eliminar S.O.)
function eliminarPrograma(nombre) {
    if (nombre === so.nombre) return;
    paginasUsadas = paginasUsadas.map(p => (p === nombre ? null : p));
    renderAll();
    // quitar filas de tabla
    [...tablaPaginas.querySelectorAll("tr")].forEach(fila => {
        if (fila.children[0].textContent === nombre) fila.remove();
    });
}

// ---------------- formulario / agregar programa ----------------
const form = document.getElementById("program-form");
form.addEventListener("submit", (e) => {
    e.preventDefault();

    const programa = {
        nombre: document.getElementById("prog-name").value.trim(),
        textSize: parseInt(document.getElementById("text-size").value, 10),
        dataSize: parseInt(document.getElementById("data-size").value, 10),
        stackSize: parseInt(document.getElementById("stack-size").value, 10),
        heapSize: parseInt(document.getElementById("heap-size").value, 10)
    };

    if (!programa.nombre || programa.nombre.toUpperCase() === "S.O.") {
        alert("Nombre inválido o reservado.");
        return;
    }

    // NumeroPaginas_Programa debe devolver array [pages_text, pages_data, pages_stack, pages_heap]
    const paginasPorSeg = NumeroPaginas_Programa(programa);
    if (!Array.isArray(paginasPorSeg) || paginasPorSeg.length < 4) {
        alert("Error: la función NumeroPaginas_Programa devolvió un formato inesperado.");
        return;
    }

    const totalProgPaginas = paginasPorSeg.reduce((a, b) => a + b, 0);
    const inicio = findFreeRange(totalProgPaginas);

    if (inicio === -1) {
        alert("No hay suficiente espacio contiguo en la RAM.");
        return;
    }

    asignarPrograma(programa.nombre, totalProgPaginas, inicio);

    // Llenar tabla con botón eliminar por programa (una fila por página, indicando segmento)
    const segs = ["text", "data", "stack", "heap"];
    let global = 0;
    for (let s = 0; s < segs.length; s++) {
        for (let p = 0; p < paginasPorSeg[s]; p++) {
            const fila = document.createElement("tr");
            fila.innerHTML = `
        <td>${programa.nombre}</td>
        <td>${segs[s]}</td>
        <td>${global}</td>
        <td>${inicio + global}</td>
        <td>${tamPaginaKB}</td>
        <td><button class="btn-del" data-prog="${programa.nombre}">Eliminar</button></td>
      `;
            tablaPaginas.appendChild(fila);
            global++;
        }
    }

    form.reset();
});

// delegado para botones eliminar en la tabla de páginas
tablaPaginas.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-del")) {
        const nombre = e.target.getAttribute("data-prog");
        eliminarPrograma(nombre);
    }
});

// boton reiniciar: limpia tabla y reinicia RAM + vuelve a cargar S.O.
document.getElementById("reset-btn").addEventListener("click", () => {
    tablaPaginas.innerHTML = "";
    initRam();
    agregarSO();
});

// ----------------- SO -----------------
function agregarSO() {
    // calcular páginas del S.O. con la misma función
    const paginasPorSeg = NumeroPaginas_Programa(so);
    const paginasSO = paginasPorSeg.reduce((a, b) => a + b, 0);
    // asignar S.O. al inicio (posición 0)
    asignarPrograma(so.nombre, paginasSO, 0);

    // mostrar en tabla (pero sin botón eliminar)
    const segs = ["text", "data", "stack", "heap"];
    let global = 0;
    for (let s = 0; s < segs.length; s++) {
        for (let p = 0; p < paginasPorSeg[s]; p++) {
            const fila = document.createElement("tr");
            fila.innerHTML = `
        <td>${so.nombre}</td>
        <td>${segs[s]}</td>
        <td>${global}</td>
        <td>${p}</td>
        <td>${tamPaginaKB}</td>
        <td>-</td>
      `;
            tablaPaginas.appendChild(fila);
            global++;
        }
    }
}

// --------------- PROGRAMAS DISPONIBLES (tabla lateral) ---------------
function cargarProgramasDisponibles() {
    tablaProgramas.innerHTML = "";
    programasDisponibles.forEach(prog => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
      <td>${prog.nombre}</td>
      <td>${prog.textSize}</td>
      <td>${prog.dataSize}</td>
      <td>${prog.stackSize}</td>
      <td>${prog.heapSize}</td>
      <td><button class="btn-cargar" data-nombre="${prog.nombre}">Cargar</button></td>
    `;
        tablaProgramas.appendChild(fila);
    });

    // eventos para botones cargar (delegación simple)
    tablaProgramas.querySelectorAll(".btn-cargar").forEach(btn => {
        btn.addEventListener("click", () => {
            const nombre = btn.getAttribute("data-nombre");
            const prog = programasDisponibles.find(p => p.nombre === nombre);
            if (!prog) return;

            // reutilizar mismo flujo que el formulario: calcular páginas y asignar
            const paginasPorSeg = NumeroPaginas_Programa(prog);
            if (!Array.isArray(paginasPorSeg) || paginasPorSeg.length < 4) {
                alert("Error: NumeroPaginas_Programa devolvió formato inesperado.");
                return;
            }
            const totalProgPaginas = paginasPorSeg.reduce((a, b) => a + b, 0);
            const inicio = findFreeRange(totalProgPaginas);
            if (inicio === -1) {
                alert("No hay suficiente espacio contiguo en la RAM.");
                return;
            }
            asignarPrograma(prog.nombre, totalProgPaginas, inicio);

            // llenar tabla de páginas con filas por segmento/página
            const segs = ["text", "data", "stack", "heap"];
            let global = 0;
            for (let s = 0; s < segs.length; s++) {
                for (let p = 0; p < paginasPorSeg[s]; p++) {
                    const fila = document.createElement("tr");
                    fila.innerHTML = `
            <td>${prog.nombre}</td>
            <td>${segs[s]}</td>
            <td>${global}</td>
            <td>${inicio + global}</td>
            <td>${tamPaginaKB}</td>
            <td><button class="btn-del" data-prog="${prog.nombre}">Eliminar</button></td>
          `;
                    tablaPaginas.appendChild(fila);
                    global++;
                }
            }
        });
    });
}

// --------------- Inicio ---------------
initRam();
cargarProgramasDisponibles();
agregarSO();
