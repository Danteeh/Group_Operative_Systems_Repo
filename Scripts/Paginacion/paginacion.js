import { Ram } from "../Ram.js";
import { Program } from "../Program.js";

// Crear RAM simulada de 16 MB dividida en bloques de 1 MB
const ram = new Ram(16, Array(16).fill(null));


const tablaSegmentos = document.getElementById("tablaSegmentos").querySelector("tbody");
const tablaRam = document.getElementById("tablaRam").querySelector("tbody");
const btnInsertar = document.getElementById("btnInsertar");

let contadorProgramas = 0;
let memoriaUsada = 0;

// Función para actualizar tabla RAM
function actualizarTablaRam() {
    tablaRam.innerHTML = "";
    ram.particiones.forEach((p, i) => {
        const row = document.createElement("tr");
        row.innerHTML = `
      <td>${i}</td>
      <td>${p ? "Ocupado" : "Libre"}</td>
      <td>${p ? p.name : "-"}</td>
      <td>${p ? p.segmento : "-"}</td>
    `;
        tablaRam.appendChild(row);
    });
}

// Insertar programa con segmentos
btnInsertar.addEventListener("click", () => {
    const nombre = document.getElementById("nombrePrograma").value.trim();
    const segCodigo = parseFloat(document.getElementById("codigo").value);
    const segDatos = parseFloat(document.getElementById("datos").value);
    const segPila = parseFloat(document.getElementById("pila").value);

    if (!nombre || isNaN(segCodigo) || isNaN(segDatos) || isNaN(segPila)) {
        alert("Por favor completa todos los campos correctamente.");
        return;
    }

    const segmentos = [
        { nombre: "Código", tamaño: segCodigo },
        { nombre: "Datos", tamaño: segDatos },
        { nombre: "Pila", tamaño: segPila }
    ];

    for (const seg of segmentos) {
        if (memoriaUsada + seg.tamaño > ram.capacidad) {
            alert("No hay suficiente memoria para este segmento.");
            return;
        }

        const programa = new Program(contadorProgramas++, nombre, seg.tamaño, 0);
        programa.segmento = seg.nombre;

        const indiceLibre = ram.particiones.findIndex(p => p === null);
        if (indiceLibre === -1) {
            alert("No hay bloques libres en la memoria.");
            return;
        }

        ram.particiones[indiceLibre] = programa;
        memoriaUsada += seg.tamaño;

        const fila = document.createElement("tr");
        fila.innerHTML = `
      <td>${nombre}</td>
      <td>${seg.nombre}</td>
      <td>${seg.tamaño.toFixed(2)} MB</td>
      <td>${indiceLibre}</td>
      <td>${indiceLibre + seg.tamaño}</td>
    `;
        tablaSegmentos.appendChild(fila);
    }

    actualizarTablaRam();

    document.getElementById("nombrePrograma").value = "";
    document.getElementById("codigo").value = "";
    document.getElementById("datos").value = "";
    document.getElementById("pila").value = "";
});

actualizarTablaRam();
