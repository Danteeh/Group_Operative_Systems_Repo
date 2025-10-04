import { Program } from "./Program.js";
import { Ram } from "./Ram.js";
import { validarPrimerAjuste, validarTamFijo, comprobador_tamfijo } from "./Script_Condiciones.js";

// Constante global: heap/pila fijo (< 1 MB)
const HEAP_PILA = 0.2;

// Lista de programas predefinidos
let programasDisponibles = [
    { name: "Chrome", memoryToUse: 0.7 },
    { name: "VSCode", memoryToUse: 0.8 },
    { name: "Spotify", memoryToUse: 0.5 },
    { name: "Discord", memoryToUse: 0.6 },
    { name: "Minecraft", memoryToUse: 0.9 }
];

// Creamos la RAM de 16 MB
const particiones = new Array(16).fill(null);
const ram = new Ram(16, particiones);

const listaProgramas = document.getElementById("listaProgramas");
const ramEstado = document.getElementById("ramEstado");
const ramUso = document.getElementById("ramUso");

var fragmentacion;
var Lis_Frag = new Array(16).fill(null);

const sistemaOperativo = new Program("S.O.", 0.8, 0.2);
ram.insertarPrograma(sistemaOperativo,0);
Lis_Frag[0] = (comprobador_tamfijo[0] - sistemaOperativo.totalMemory).toFixed(2)
// Mostrar tabla de programas disponibles
function renderListaProgramas() {
    let html = `
    <table>
      <thead>
        <tr>
          <th>Programa</th>
          <th>Memoria Total (MB)</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
  `;

    programasDisponibles.forEach(p => {
        html += `
      <tr>
        <td>${p.name}</td>
        <td>${(p.memoryToUse + HEAP_PILA).toFixed(2)}</td>
        <td><button data-program="${p.name}">Insertar en RAM</button></td>
      </tr>
    `;
    });

    html += `</tbody></table>`;
    listaProgramas.innerHTML = html;

    // Eventos de insertar
    listaProgramas.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const programName = btn.dataset.program;
            insertarProgramaEnRAM(programName);
        });
    });
}

// Insertar programa en la primera partición libre
function insertarProgramaEnRAM(programName) {
    const datos = programasDisponibles.find(p => p.name === programName);
    const prog = new Program(datos.name, datos.memoryToUse, HEAP_PILA);

    // Buscar primera partición libre
    const libre = ram.particiones.findIndex(p => p === null);
    if (libre === -1) {
        alert("No hay particiones libres en la RAM");
        return;
    }

    if (validarTamFijo(prog, libre)) {
        try {
            ram.insertarPrograma(prog, libre);
            fragmentacion = (comprobador_tamfijo[libre] - prog.totalMemory).toFixed(2);
            Lis_Frag[libre] = parseFloat(fragmentacion);
            actualizarVista();
        } catch (err) {
            alert("Error: " + err.message);
        }
    } else {
        alert("El programa excede el tamaño de la partición (1 MB)");
    }
}

// Mostrar tabla + vista gráfica de la RAM
function actualizarVista() {
    const estado = ram.getEstado();

    // 🔹 Tabla
    let html = `
    <table>
      <thead>
        <tr>
          <th>Partición</th>
          <th>Programa</th>
          <th>Memoria Usada (MB)</th>
          <th>Fragmentación (MB)</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
  `;

    estado.forEach((p, i) => {
        if (p.ocupado && p.programa) {
            html += `
        <tr>
          <td>${i}</td>
          <td>${p.programa.name}</td>
          <td>${p.programa.totalMemory.toFixed(2)}</td>
          <td>${Lis_Frag[i]}</td>
          <td>${p.programa.name === "S.O." ? "Protegido" : `<button data-action="finalizar" data-index="${i}">Finalizar</button>`}</td>
        </tr>
      `;
        } else {
            html += `
        <tr>
          <td>${i}</td>
          <td>-</td>
          <td>-</td>
          <td>${comprobador_tamfijo[i]}</td>
          <td>Libre</td>
        </tr>
      `;
        }
    });

    html += `</tbody></table>`;
    ramEstado.innerHTML = html;

    // Eventos de finalizar
    ramEstado.querySelectorAll("button[data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            try {
                ram.finalizarPrograma(index);
                Lis_Frag[index] = null;
                actualizarVista();
            } catch (err) {
                alert("Error: " + err.message);
            }
        });
    });

    // 🔹 Vista gráfica de memoria
    const contenedor = document.createElement("div");
    contenedor.classList.add("ram-grafica");

    estado.forEach((p, i) => {
        const particionDiv = document.createElement("div");
        particionDiv.classList.add("particion");

        if (p.ocupado && p.programa) {
            // Bloque verde (programa)
            const bloque = document.createElement("div");
            bloque.classList.add("ocupado");
            bloque.style.height = `${(p.programa.totalMemory * 100)}%`;
            bloque.textContent = `${p.programa.name} (${p.programa.totalMemory.toFixed(2)}MB)`;
            particionDiv.appendChild(bloque);

            // Bloque gris (fragmentación)
            if (Lis_Frag[i] > 0) {
                const frag = document.createElement("div");
                frag.classList.add("fragmento");
                frag.style.height = `${Lis_Frag[i] * 100}%`;
                frag.textContent = `Frag: ${Lis_Frag[i]}MB`;
                particionDiv.appendChild(frag);
            }
        } else {
            particionDiv.textContent = "Libre";
        }

        contenedor.appendChild(particionDiv);
    });

    ramEstado.appendChild(contenedor);

    // Calcular resumen
    const totalUsado = estado
        .filter(p => p.ocupado && p.programa)
        .reduce((acc, p) => acc + p.programa.totalMemory, 0);

    const totalFragmentacion = Lis_Frag.reduce((acc, f) => acc + (f ? f : 0), 0);

    ramUso.textContent =
        `RAM usada: ${totalUsado.toFixed(2)} MB de ${ram.capacidad} MB | ` +
        `Fragmentación total: ${totalFragmentacion.toFixed(2)} MB`;
}

// --- Manejo del formulario de creación de programas ---
const form = document.getElementById("formPrograma");
form.addEventListener("submit", e => {
    e.preventDefault();
    const nombre = document.getElementById("progNombre").value.trim();
    const memoria = parseFloat(document.getElementById("progMemoria").value);

    if (!nombre || isNaN(memoria) || memoria <= 0) {
        alert("Datos inválidos");
        return;
    }

    // Agregar a la lista
    programasDisponibles.push({ name: nombre, memoryToUse: memoria });

    // Limpiar formulario
    form.reset();

    // Volver a renderizar tabla
    renderListaProgramas();
});

// Inicializar
renderListaProgramas();
actualizarVista();
