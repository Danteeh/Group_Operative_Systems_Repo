import { RamSegmentada } from "./RamSeg.js";
import { Program } from "../Program.js";

const ram = new RamSegmentada(16); // 16 MB
const TOTAL_KB = 16 * 1024;
const colores = {};
const programasDetalles = {};

function getColor(nombre) {
    if (!colores[nombre]) {
        colores[nombre] = "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
    }
    return colores[nombre];
}

function renderAll() {
    renderTablas();
    renderGrafico();
    renderProgramasDetalle();
}

function renderTablas() {
    const { estado, fragmentacion } = ram.getEstado();

    const tablaSeg = document.querySelector("#tablaSegmentos tbody");
    const tablaFrag = document.querySelector("#tablaFragmentacion tbody");

    tablaSeg.innerHTML = "";
    tablaFrag.innerHTML = "";

    const programasActivos = new Set();
    estado.forEach(seg => {
        if (seg.protegido === "No") programasActivos.add(seg.programa);
    });

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

    programasActivos.forEach(nombreProg => {
        const detalles = programasDetalles[nombreProg];
        if (!detalles) return;

        const segmentos = [
            { nombre: ".text", size: detalles.text },
            { nombre: ".data", size: detalles.data },
            { nombre: ".stack", size: detalles.stack },
            { nombre: ".heap", size: detalles.heap }
        ];

        let offset = 0;
        segmentos.forEach((seg, idx) => {
            if (seg.size > 0) {
                const fila = document.createElement("tr");
                fila.innerHTML = `
          <td>${nombreProg}</td>
          <td>${seg.nombre}</td>
          <td>${seg.size}</td>
          <td>0x${(offset * 1024).toString(16).padStart(4, "0")}</td>
          <td>0x${((offset + seg.size) * 1024).toString(16).padStart(4, "0")}</td>
          ${idx === 0 ? `<td rowspan="4"><button class="btn-eliminar" data-nombre="${nombreProg}">Eliminar</button></td>` : ""}
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
}

function renderGrafico() {
    const contenedor = document.getElementById("ram-horizontal");
    contenedor.innerHTML = "";
    const { estado } = ram.getEstado();

    estado.forEach(seg => {
        const bloque = document.createElement("div");
        bloque.classList.add("ram-bloque");
        bloque.style.width = (seg.tamano / TOTAL_KB) * 100 + "%";
        bloque.style.backgroundColor = seg.protegido === "Sí" ? "#2b6cb0" : getColor(seg.programa);
        bloque.textContent = seg.programa;
        contenedor.appendChild(bloque);
    });
}

function renderProgramasDetalle() {
    const contenedor = document.getElementById("programs-container");
    contenedor.innerHTML = "";

    const { estado } = ram.getEstado();

    const segSO = estado.find(seg => seg.protegido === "Sí");
    if (segSO) {
        const cardSO = document.createElement("div");
        cardSO.classList.add("program-card");
        cardSO.style.borderTopColor = "#2b6cb0";
        cardSO.innerHTML = `<h4>Sistema Operativo</h4><p>${segSO.tamano} KB</p>`;
        contenedor.appendChild(cardSO);
    }

    const programasActivos = new Set();
    estado.forEach(seg => {
        if (seg.protegido === "No") programasActivos.add(seg.programa);
    });

    programasActivos.forEach(nombreProg => {
        const detalles = programasDetalles[nombreProg];
        if (!detalles) return;
        const card = document.createElement("div");
        card.classList.add("program-card");
        card.style.borderTopColor = getColor(nombreProg);
        card.innerHTML = `<h4>${nombreProg}</h4>
      <p><b>.text:</b> ${detalles.text} KB</p>
      <p><b>.data:</b> ${detalles.data} KB</p>
      <p><b>.stack:</b> ${detalles.stack} KB</p>
      <p><b>.heap:</b> ${detalles.heap} KB</p>`;
        contenedor.appendChild(card);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("program-form");

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
        programasDetalles[nombre] = { text, data, stack, heap };

        try {
            ram.insertarPrograma(prog);
        } catch (err) {
            alert(err.message);
        }

        form.reset();
        renderAll();
    });

    // Evento de eliminación en la tabla de segmentos
    document.querySelector("#tablaSegmentos tbody").addEventListener("click", e => {
        if (e.target.classList.contains("btn-eliminar")) {
            const nombre = e.target.dataset.nombre;
            if (confirm(`¿Finalizar programa "${nombre}"?`)) {
                try {
                    ram.finalizarPrograma(nombre);
                    delete programasDetalles[nombre];
                    delete colores[nombre];
                    renderAll();
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    });

    // ---- Tabla de programas precargados ----
    const precargados = [
        { nombre: "Editor", text: 200, data: 150, stack: 50, heap: 100 },
        { nombre: "Navegador", text: 300, data: 200, stack: 80, heap: 120 },
        { nombre: "Juego", text: 400, data: 250, stack: 100, heap: 200 },
        { nombre: "IDE", text: 350, data: 220, stack: 90, heap: 180 }
    ];

    const tabla = document.querySelector("#tablaProgramas tbody");
    precargados.forEach(p => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
      <td>${p.nombre}</td>
      <td>${p.text}</td>
      <td>${p.data}</td>
      <td>${p.stack}</td>
      <td>${p.heap}</td>
      <td><button class="btn-cargar" data-nombre="${p.nombre}">Cargar</button></td>
    `;
        tabla.appendChild(fila);
    });

    tabla.addEventListener("click", e => {
        if (e.target.classList.contains("btn-cargar")) {
            const nombre = e.target.dataset.nombre;
            const prog = precargados.find(p => p.nombre === nombre);
            if (prog) {
                const total = prog.text + prog.data + prog.stack + prog.heap;
                const programa = new Program(Date.now(), nombre, total, 0);
                programasDetalles[nombre] = prog;
                try {
                    ram.insertarPrograma(programa);
                    renderAll();
                } catch (err) {
                    alert(err.message);
                }
            }
        }
    });

    renderAll();
});
