import { Program } from "../Program.js";
import { Ram } from "../Ram.js";
import { comprobador } from "../Script_Condiciones.js";

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

// Creamos 3 RAM distintas para comparar
const ramPrimer = new Ram(16, new Array(9).fill(null));
const ramMejor = new Ram(16, new Array(9).fill(null));
const ramPeor = new Ram(16, new Array(9).fill(null));

const listaProgramas = document.getElementById("listaProgramas");
const ramPrimerEstado = document.getElementById("ramPrimerEstado");
const ramMejorEstado = document.getElementById("ramMejorEstado");
const ramPeorEstado = document.getElementById("ramPeorEstado");

let Lis_Frag_Primer = new Array(9).fill(null);
let Lis_Frag_Mejor = new Array(9).fill(null);
let Lis_Frag_Peor = new Array(9).fill(null);


const sistemaOperativo = new Program(0, "S.O.", 0.8, 0.2);
ramPrimer.insertarPrograma(sistemaOperativo, 0);
Lis_Frag_Primer[0] = comprobador[0] - sistemaOperativo.totalMemory;

ramMejor.insertarPrograma(sistemaOperativo, 0);
Lis_Frag_Mejor[0] = comprobador[0] - 1;

ramPeor.insertarPrograma(sistemaOperativo, 0);
Lis_Frag_Peor[0] = comprobador[0] - 1;



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
        <td><button data-program="${p.name}">Insertar</button></td>
      </tr>
    `;
    });

    html += `</tbody></table>`;
    listaProgramas.innerHTML = html;
    let indice = 0;
    // Eventos de insertar en los tres esquemas
    listaProgramas.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const programName = btn.dataset.program;
            indice = indice+1;
            insertarPrimerAjuste(programName,indice);
            insertarMejorAjuste(programName,indice);
            insertarPeorAjuste(programName,indice);
        });
    });
}


// Primer Ajuste
function insertarPrimerAjuste(programName, PID) {
    const datos = programasDisponibles.find(p => p.name === programName);
    const prog = new Program(PID,datos.name, datos.memoryToUse, HEAP_PILA);

    let indice = ramPrimer.particiones.findIndex((p, i) =>
        p === null && prog.totalMemory <= comprobador[i]
    );

    if (indice === -1) {
        alert("No cabe en Primer Ajuste");
        return;
    }

    ramPrimer.insertarPrograma(prog, indice);
    Lis_Frag_Primer[indice] = redondear(comprobador[indice] - prog.totalMemory);
    actualizarVista(ramPrimer, ramPrimerEstado, Lis_Frag_Primer, "Primer Ajuste");
}

// Mejor Ajuste
function insertarMejorAjuste(programName, PID) {
    const datos = programasDisponibles.find(p => p.name === programName);
    const prog = new Program(PID,datos.name, datos.memoryToUse, HEAP_PILA);

    let mejorIndice = -1;
    let mejorEspacio = Infinity;

    comprobador.forEach((tam, i) => {
        if (ramMejor.particiones[i] === null && prog.totalMemory <= tam) {
            let frag = tam - prog.totalMemory;
            if (frag < mejorEspacio) {
                mejorEspacio = frag;
                mejorIndice = i;
            }
        }
    });

    if (mejorIndice === -1) {
        alert("No cabe en Mejor Ajuste");
        return;
    }

    ramMejor.insertarPrograma(prog, mejorIndice);
    Lis_Frag_Mejor[mejorIndice] = redondear(mejorEspacio);
    actualizarVista(ramMejor, ramMejorEstado, Lis_Frag_Mejor, "Mejor Ajuste");
}

// Peor Ajuste
function insertarPeorAjuste(programName,PID) {
    const datos = programasDisponibles.find(p => p.name === programName);
    const prog = new Program(PID,datos.name, datos.memoryToUse, HEAP_PILA);

    let peorIndice = -1;
    let peorEspacio = -1;

    comprobador.forEach((tam, i) => {
        if (ramPeor.particiones[i] === null && prog.totalMemory <= tam) {
            let frag = tam - prog.totalMemory;
            if (frag > peorEspacio) {
                peorEspacio = frag;
                peorIndice = i;
            }
        }
    });

    if (peorIndice === -1) {
        alert("No cabe en Peor Ajuste");
        return;
    }

    ramPeor.insertarPrograma(prog, peorIndice);
    Lis_Frag_Peor[peorIndice] = redondear(peorEspacio);
    actualizarVista(ramPeor, ramPeorEstado, Lis_Frag_Peor, "Peor Ajuste");
}

// Mostrar tabla de la RAM (reutilizable)
function actualizarVista(ram, contenedor, listaFrag, titulo) {
    const estado = ram.getEstado();

    // Tabla de estado
    let html = `<h3>${titulo}</h3>
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
          <td>${listaFrag[i]?.toFixed(2)}</td>
          <td>${p.programa.name === "S.O." ? "Protegido" : 
        `<button data-action="finalizar" data-index="${i}">Finalizar</button>`}
      </td>
        </tr>`;
        } else {
            html += `
        <tr>
          <td>${i}</td>
          <td>-</td>
          <td>-</td>
          <td>${comprobador[i]}</td>
          <td>Libre</td>
        </tr>`;
        }
    });

    html += `</tbody></table>`;

    // 🔹 Agregar gráfica
    html += `<div class="ram-grafica">`;
    estado.forEach((p, i) => {
        html += `<div class="particion">`;
        if (p.ocupado && p.programa) {
            html += `
              <div class="ocupado" style="height:${p.programa.totalMemory * 100}%">
                ${p.programa.name}<br>${p.programa.totalMemory.toFixed(2)}MB
              </div>`;
            if (listaFrag[i] > 0) {
                html += `
                  <div class="fragmento" style="height:${listaFrag[i] * 100}%">
                    Frag ${listaFrag[i].toFixed(2)}MB
                  </div>`;
            }
        } else {
            html += `<div class="libre">Libre<br>${comprobador[i]}MB</div>`;
        }
        html += `</div>`;
    });
    html += `</div>`;

    contenedor.innerHTML = html;

    // Eventos de finalizar
    contenedor.querySelectorAll("button[data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
            const index = parseInt(btn.dataset.index);
            ram.finalizarPrograma(index);
            listaFrag[index] = null;
            actualizarVista(ram, contenedor, listaFrag, titulo);
        });
    });
}


// Utilidad para redondear
function redondear(num, decimales = 2) {
    const factor = Math.pow(10, decimales);
    return Math.round(num * factor) / factor;
}

// --- Evento para el formulario ---
document.getElementById("formPrograma").addEventListener("submit", e => {
    e.preventDefault();

    const nombre = document.getElementById("progNombre").value.trim();
    const memoria = parseFloat(document.getElementById("progMemoria").value);

    if (!nombre || isNaN(memoria) || memoria <= 0) {
        alert("Por favor ingrese un nombre válido y una memoria mayor a 0");
        return;
    }

    programasDisponibles.push({ name: nombre, memoryToUse: memoria });
    renderListaProgramas();
    e.target.reset();
});

// Inicializar
renderListaProgramas();
actualizarVista(ramPrimer, ramPrimerEstado, Lis_Frag_Primer, "Primer Ajuste");
actualizarVista(ramMejor, ramMejorEstado, Lis_Frag_Mejor, "Mejor Ajuste");
actualizarVista(ramPeor, ramPeorEstado, Lis_Frag_Peor, "Peor Ajuste");
