import { Paginacion, NumeroPaginas_Programa } from "../Script_Condiciones.js";

const conf = Paginacion(16, 4);
const total_paginas = conf.numeroPaginas;
const tamPaginaKB = conf.tamPaginas || 4;

let paginasUsadas = [];
let tablaPaginas = document.querySelector("#tablaPaginas tbody");
let ramDiv = document.getElementById("ram-horizontal");

const so = {
    nombre: "S.O.",
    textSize: 4,
    dataSize: 0,
    stackSize: 0,
    heapSize: 0
};

function initRam() {
    ramDiv.innerHTML = "";
    paginasUsadas = new Array(total_paginas).fill(null);
    renderAll();
}

function renderAll() {
    ramDiv.innerHTML = "";

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

    programas.forEach(p => {
        const bloque = document.createElement("div");
        bloque.classList.add("bloque-programa");
        bloque.style.flex = p.longitud.toString();
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

    // mostrar espacio libre
    const usados = programas.reduce((a, b) => a + b.longitud, 0);
    if (usados < total_paginas) {
        const libre = document.createElement("div");
        libre.style.flex = (total_paginas - usados).toString();
        libre.style.backgroundColor = "#d9e3e7";
        libre.style.border = "1px dashed #9aa3a7";
        libre.style.display = "flex";
        libre.style.alignItems = "center";
        libre.style.justifyContent = "center";
        libre.textContent = "Libre";
        ramDiv.appendChild(libre);
    }
}

function generarColor(nombre) {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 60%, 45%)`;
}

// --- lógica de asignación ---
function findFreeRange(length) {
    if (length <= 0) return -1;
    let consec = 0;
    for (let i = 0; i < paginasUsadas.length; i++) {
        if (paginasUsadas[i] === null) {
            consec++;
            if (consec === length) return i - length + 1;
        } else consec = 0;
    }
    return -1;
}

function asignarPrograma(nombre, paginas, inicio) {
    for (let i = 0; i < paginas; i++) {
        paginasUsadas[inicio + i] = nombre;
    }
    renderAll();
}

// --- Formulario ---
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

    const paginasPorSeg = NumeroPaginas_Programa(programa);
    const totalProgPaginas = paginasPorSeg.reduce((a, b) => a + b, 0);
    const inicio = findFreeRange(totalProgPaginas);

    if (inicio === -1) {
        alert("No hay suficiente espacio contiguo en la RAM.");
        return;
    }

    asignarPrograma(programa.nombre, totalProgPaginas, inicio);

    // Llenar tabla
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
      `;
            tablaPaginas.appendChild(fila);
            global++;
        }
    }

    form.reset();
});

document.getElementById("reset-btn").addEventListener("click", () => {
    tablaPaginas.innerHTML = "";
    initRam();
    agregarSO();

});

function agregarSO() {
    const paginasPorSeg = NumeroPaginas_Programa(so);
    const paginasSO = paginasPorSeg.reduce((a, b) => a + b, 0);
    asignarPrograma(so.nombre, paginasSO, 0);

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
      `;
            tablaPaginas.appendChild(fila);
            global++;
        }
    }
}

// Inicialización
initRam();
agregarSO();
