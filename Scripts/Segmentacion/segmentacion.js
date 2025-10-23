import { RamSegmentada } from "./RamSeg.js";
import { Program } from "../Program.js";

// -----------------------------------------------------------
// Configuración inicial
// -----------------------------------------------------------
const ram = new RamSegmentada(16); // 16 MB
const TOTAL_KB = 16 * 1024;
const colores = {};

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

    estado.forEach(seg => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${seg.programa}</td>
            <td>${seg.protegido === "Sí" ? ".system" : ".segmento"}</td>
            <td>${seg.tamano}</td>
            <td>${seg.inicio}</td>
            <td>${seg.fin}</td>
            <td>
                ${seg.protegido === "No"
                    ? `<button class="btn-eliminar" data-prog="${seg.programa}">Eliminar</button>`
                    : ""}
            </td>
        `;
        tablaSeg.appendChild(fila);
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

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", e => {
            const nombre = e.target.dataset.prog;
            ram.finalizarPrograma(nombre);
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
