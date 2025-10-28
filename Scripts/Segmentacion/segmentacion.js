import { RamSegmentada } from "./RamSeg.js";
import { Program } from "../Program.js";

// -----------------------------------------------------------
// Configuración inicial
// -----------------------------------------------------------
const ram = new RamSegmentada(16); // 16 MB
const TOTAL_KB = 16 * 1024;
const colores = {};
const programasDetalles = {}; // Almacena los detalles de segmentos de cada programa

// Asigna colores únicos a los programas
function getColor(nombre) {
    if (!colores[nombre]) {
        colores[nombre] = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    }
    return colores[nombre];
}

// -----------------------------------------------------------
// Render principal
// -----------------------------------------------------------
function renderAll() {
    renderTablas();
    renderGrafico();
    renderProgramasDetalle();
}

// -----------------------------------------------------------
// Render tablas
// -----------------------------------------------------------
function renderTablas() {
    const { estado, fragmentacion } = ram.getEstado();

    const tablaSeg = document.querySelector("#tablaSegmentos tbody");
    const tablaFrag = document.querySelector("#tablaFragmentacion tbody");

    tablaSeg.innerHTML = "";
    tablaFrag.innerHTML = "";

    // Renderizar cada programa con sus segmentos
    const programasActivos = new Set();
    estado.forEach(seg => {
        if (seg.protegido === "No") {
            programasActivos.add(seg.programa);
        }
    });

    // Para el sistema operativo
    const segSO = estado.find(s => s.protegido === "Sí");
    if (segSO) {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${segSO.programa}</td>
            <td>.system</td>
            <td>${segSO.tamano}</td>
            <td>${segSO.inicio}</td>
            <td>${segSO.fin}</td>
            <td></td>
        `;
        tablaSeg.appendChild(fila);
    }

    // Para cada programa, mostrar sus 4 segmentos
    programasActivos.forEach(nombreProg => {
        const detalles = programasDetalles[nombreProg];
        if (!detalles) return;

        const segmentosPrograma = estado.filter(s => s.programa === nombreProg);
        if (segmentosPrograma.length === 0) return;

        const inicioTotal = segmentosPrograma[0].inicio;
        const finTotal = segmentosPrograma[0].fin;

        const segmentos = [
            { nombre: ".text", size: detalles.text },
            { nombre: ".data", size: detalles.data },
            { nombre: ".stack", size: detalles.stack },
            { nombre: ".heap", size: detalles.heap }
        ];

        let offset = 0;
        const inicioTotalNum = parseInt(inicioTotal.replace("0x", ""), 16) / 1024;

        segmentos.forEach((seg, idx) => {
            if (seg.size > 0) {
                const inicioSeg = inicioTotalNum + offset;
                const finSeg = inicioSeg + seg.size;

                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${nombreProg}</td>
                    <td>${seg.nombre}</td>
                    <td>${seg.size}</td>
                    <td>${ram.kbAHex(inicioSeg)}</td>
                    <td>${ram.kbAHex(finSeg)}</td>
                    <td>
                        ${idx === 0 ? `<button class="btn-del" data-prog="${nombreProg}">Eliminar</button>` : ""}
                    </td>
                `;
                tablaSeg.appendChild(fila);
                offset += seg.size;
            }
        });
    });

    fragmentacion.forEach(frag => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${frag.inicio}</td>
            <td>${frag.fin}</td>
            <td>${frag.tamano}</td>
        `;
        tablaFrag.appendChild(fila);
    });

    document.querySelectorAll(".btn-del").forEach(btn => {
        btn.addEventListener("click", e => {
            const nombre = e.target.dataset.prog;
            ram.finalizarPrograma(nombre);
            delete programasDetalles[nombre];
            delete colores[nombre];
            renderAll();
        });
    });
}

// -----------------------------------------------------------
// Render gráfico horizontal
// -----------------------------------------------------------
function renderGrafico() {
    const contenedor = document.getElementById("ram-horizontal");
    contenedor.innerHTML = "";

    const { estado } = ram.getEstado();

    estado.forEach(seg => {
        const bloque = document.createElement("div");
        bloque.classList.add("ram-bloque");

        const tamPorcentaje = (seg.tamano / TOTAL_KB) * 100;
        bloque.style.width = tamPorcentaje + "%";

        if (seg.protegido === "Sí") {
            bloque.style.backgroundColor = "#2b6cb0";
            bloque.textContent = `${seg.programa} (S.O)`;
        } else {
            bloque.style.backgroundColor = getColor(seg.programa);
            bloque.textContent = `${seg.programa}`;
        }

        contenedor.appendChild(bloque);
    });
}

// -----------------------------------------------------------
// Render detalles de programas (tarjetas verticales)
// -----------------------------------------------------------
function renderProgramasDetalle() {
    const contenedor = document.getElementById("programs-container");
    contenedor.innerHTML = "";

    const { estado } = ram.getEstado();

    // Primero: Tarjeta del Sistema Operativo (siempre fija)
    const segSO = estado.find(seg => seg.protegido === "Sí");
    if (segSO) {
        const cardSO = document.createElement("div");
        cardSO.classList.add("program-card", "program-card-system");
        cardSO.style.borderTopColor = "#2b6cb0";

        const header = document.createElement("div");
        header.classList.add("program-card-header");
        header.innerHTML = `
            <h4>🖥️ Sistema Operativo</h4>
            <div class="total-memory">Total: ${segSO.tamano} KB</div>
        `;
        cardSO.appendChild(header);

        const segmentsContainer = document.createElement("div");
        segmentsContainer.classList.add("segments-vertical");

        const segBlock = document.createElement("div");
        segBlock.classList.add("segment-block", "segment-system");
        segBlock.innerHTML = `
            <div class="segment-name">.system</div>
            <div class="segment-size">${segSO.tamano} KB</div>
            <div class="segment-address">${segSO.inicio} - ${segSO.fin}</div>
        `;

        segmentsContainer.appendChild(segBlock);
        cardSO.appendChild(segmentsContainer);
        contenedor.appendChild(cardSO);
    }

    // Segundo: Obtener programas de usuario
    const programasActivos = new Set();
    estado.forEach(seg => {
        if (seg.protegido === "No") {
            programasActivos.add(seg.programa);
        }
    });

    // Crear tarjeta para cada programa
    programasActivos.forEach(nombreProg => {
        const detalles = programasDetalles[nombreProg];
        if (!detalles) return;

        const card = document.createElement("div");
        card.classList.add("program-card");
        card.style.borderTopColor = getColor(nombreProg);

        // Calcular memoria total
        const totalMemoria = detalles.text + detalles.data + detalles.stack + detalles.heap;

        // Header de la tarjeta
        const header = document.createElement("div");
        header.classList.add("program-card-header");
        header.innerHTML = `
            <h4>${nombreProg}</h4>
            <div class="total-memory">Total: ${totalMemoria} KB</div>
        `;
        card.appendChild(header);

        // Contenedor de segmentos verticales
        const segmentsContainer = document.createElement("div");
        segmentsContainer.classList.add("segments-vertical");

        // Obtener direcciones de memoria de cada segmento del programa
        const segmentosPrograma = ram.getSegmentosPorPrograma(nombreProg);

        // Crear bloques para cada segmento
        const segmentos = [
            { nombre: ".text", size: detalles.text, clase: "segment-text" },
            { nombre: ".data", size: detalles.data, clase: "segment-data" },
            { nombre: ".stack", size: detalles.stack, clase: "segment-stack" },
            { nombre: ".heap", size: detalles.heap, clase: "segment-heap" }
        ];

        let offsetActual = 0;
        segmentos.forEach((seg, idx) => {
            if (seg.size > 0) {
                const segBlock = document.createElement("div");
                segBlock.classList.add("segment-block", seg.clase);

                // Calcular direcciones (relativas al inicio del programa)
                const inicio = offsetActual;
                const fin = offsetActual + seg.size;

                segBlock.innerHTML = `
                    <div class="segment-name">${seg.nombre}</div>
                    <div class="segment-size">${seg.size} KB</div>
                    <div class="segment-address">${ram.kbAHex(inicio)} - ${ram.kbAHex(fin)}</div>
                `;

                segmentsContainer.appendChild(segBlock);
                offsetActual += seg.size;
            }
        });

        card.appendChild(segmentsContainer);
        contenedor.appendChild(card);
    });
}

// -----------------------------------------------------------
// Eventos
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("program-form");
    const btnCompactar = document.getElementById("compact-btn");
    const btnFinalizar = document.getElementById("finish-btn");

    form.addEventListener("submit", e => {
        e.preventDefault();

        const nombre = document.getElementById("prog-name").value.trim();
        const text = parseInt(document.getElementById("text-size").value);
        const data = parseInt(document.getElementById("data-size").value);
        const stack = parseInt(document.getElementById("stack-size").value);
        const heap = parseInt(document.getElementById("heap-size").value);

        if (!nombre || [text, data, stack, heap].some(isNaN)) {
            alert("Completa todos los campos correctamente.");
            return;
        }

        const total = text + data + stack + heap;
        const prog = new Program(Date.now(), nombre, total, 0);

        // Guardar detalles de segmentos
        programasDetalles[nombre] = { text, data, stack, heap };

        try {
            ram.insertarPrograma(prog);
        } catch (err) {
            alert(err.message);
        }

        form.reset();
        renderAll();
    });

    btnFinalizar.addEventListener("click", () => {
        const nombre = prompt("Ingrese el nombre del programa a finalizar:");
        if (!nombre) return;

        try {
            ram.finalizarPrograma(nombre);
            delete programasDetalles[nombre]; // Eliminar detalles al finalizar
            delete colores[nombre]; // Liberar color
            renderAll();
        } catch (err) {
            alert(err.message);
        }
    });

    btnCompactar.addEventListener("click", () => {
        ram.compactar();
        renderAll();
    });

    renderAll();
});
