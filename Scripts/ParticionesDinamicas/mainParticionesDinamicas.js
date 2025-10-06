// Simulador de particiones dinámicas (sin/ con compactación)
// - Direccionamiento hasta 16 MiB (0 .. 16)
// - Soporta Primer Ajuste, Mejor Ajuste y Peor Ajuste
// - Dos modos: sin compactación y con compactación (compaction triggered manualmente)
// - Por defecto incluye 5 programas simulados con segmentos (cada programa puede tener varios segmentos)

// --------------------------------------------------
// Configuración y datos iniciales
// --------------------------------------------------
const TOTAL_MEM_MB = 16; // 16 MB direccionables
const HEAP_PILA = 0.2; // overhead por programa (MB)

// Programas por defecto: cada uno tiene segmentos (lista de tamaños en MB)
let programasDisponibles = [
  { name: 'Chrome', segments: [0.5, 0.2] },
  { name: 'VSCode', segments: [0.8, 0.2] },
  { name: 'Spotify', segments: [0.4, 0.1] },
  { name: 'Discord', segments: [0.6, 0.15] },
  { name: 'Minecraft', segments: [1.2, 0.5] }
];

// Estructura de una partición libre/ocupada en memoria dinámica
// Si es libre: { start: Number, size: Number, free: true }
// Si está ocupada: { start: Number, size: Number, free: false, progName: String, segIndex: Number }

// Clases pequeñas para manejar el espacio libre y la RAM
class DynamicRam {
  constructor(totalMb) {
    this.total = totalMb;
    // inicia con un solo bloque libre que ocupa toda la memoria
    this.blocks = [{ start: 0, size: totalMb, free: true }];
  }

  // Reserva un bloque protegido para el sistema operativo (S.O.)
  reserveSO(size = 1.0) {
    // size en MiB
    if (size <= 0 || size >= this.total) return;
    // Colocar el S.O. al final de la memoria (último bloque)
    const freeSize = this.total - size;
    this.blocks = [
      { start: 0, size: freeSize, free: true },
      { start: freeSize, size: size, free: false, progName: 'S.O.', protected: true }
    ];
  }

  // Obtener vista resumida (ordenada por dirección)
  getEstado() {
    return this.blocks.slice().sort((a, b) => a.start - b.start);
  }

  // Inserta un bloque para un segmento en una posición determinada (inserción directa)
  insertBlockAt(index, progName, segIndex, size) {
    const block = this.blocks[index];
    if (!block.free) throw new Error('Bloque objetivo no es libre');
    if (size > block.size) throw new Error('No cabe en el bloque');

    const allocated = { start: block.start, size: size, free: false, progName, segIndex };

    // reemplazar/ajustar el bloque libre
    if (size === block.size) {
      // ocupa todo el bloque
      this.blocks.splice(index, 1, allocated);
    } else {
      // reduce el bloque libre y añade el asignado en su lugar
      const remaining = { start: block.start + size, size: block.size - size, free: true };
      this.blocks.splice(index, 1, allocated, remaining);
    }
  }

  // Liberar bloques que coincidan con programName y segIndex
  freeProgramSegment(progName, segIndex) {
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      // No liberar bloques protegidos
      if (!b.free && b.progName === progName && b.segIndex === segIndex && !b.protected) {
        // convertir a bloque libre
        this.blocks[i] = { start: b.start, size: b.size, free: true };
        // intentar fusionar con vecinos libres
        this._mergeAround(i);
        return true;
      }
    }
    return false;
  }

  // Liberar todos los bloques pertenecientes a un programa (por nombre)
  freeProgram(progName) {
    let any = false;
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (!b.free && b.progName === progName && !b.protected) {
        this.blocks[i] = { start: b.start, size: b.size, free: true };
        any = true;
      }
    }
    // fusionar bloques libres resultantes
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].free) this._mergeAround(i);
    }
    return any;
  }

  // Fusiona bloques libres contiguos alrededor del índice
  _mergeAround(idx) {
    // merge left
    if (idx > 0 && this.blocks[idx - 1].free && this.blocks[idx].free) {
      const left = this.blocks[idx - 1];
      const cur = this.blocks[idx];
      this.blocks.splice(idx - 1, 2, { start: left.start, size: left.size + cur.size, free: true });
      idx = idx - 1;
    }
    // merge right
    if (idx < this.blocks.length - 1 && this.blocks[idx + 1].free && this.blocks[idx].free) {
      const cur = this.blocks[idx];
      const right = this.blocks[idx + 1];
      this.blocks.splice(idx, 2, { start: cur.start, size: cur.size + right.size, free: true });
    }
  }

  // Compactar memoria: mover todos los bloques ocupados hacia el inicio y crear un único bloque libre al final
  compact() {
    // Compactación bottom-up: mover ocupados hacia direcciones mayores (cerca del S.O.)
    // y dejar el espacio libre al inicio. Conservamos cualquier bloque S.O. protegido y lo dejamos al final.
    const so = this.blocks.find(b => !b.free && b.progName === 'S.O.');
    const soSize = so ? so.size : 0;
    // recolectar ocupados (excluyendo S.O.)
    const occupied = this.blocks.filter(b => !b.free && b.progName !== 'S.O.').sort((a, b) => a.start - b.start);
    // calcular cursor para empezar a colocar ocupados de modo que queden antes del S.O.
    let cursor = this.total - soSize - occupied.reduce((acc, b) => acc + b.size, 0);
    const newBlocks = [];
    // bloque libre inicial si cursor > 0
    if (cursor > 0) {
      newBlocks.push({ start: 0, size: cursor, free: true });
    }
    // colocar ocupados en orden
    for (const occ of occupied) {
      newBlocks.push({ start: cursor, size: occ.size, free: false, progName: occ.progName, segIndex: occ.segIndex });
      cursor += occ.size;
    }
    // añadir S.O. al final si existe
    if (so) {
      newBlocks.push({ start: this.total - soSize, size: soSize, free: false, progName: 'S.O.', protected: true });
    } else {
      // si no hay S.O., el resto del espacio es libre
      const used = newBlocks.reduce((acc, b) => acc + b.size, 0);
      if (used < this.total) newBlocks.push({ start: used, size: this.total - used, free: true });
    }
    this.blocks = newBlocks;
  }

  // Borrar todos los bloques (reiniciar)
  reset() {
    this.blocks = [{ start: 0, size: this.total, free: true }];
  }

}

// --------------------------------------------------
// Algoritmos de asignación (devuelven índice de bloque libre o -1)
// - firstFit: primer bloque libre que acomode el tamaño
// - bestFit: bloque libre con fragmento mínimo >= 0
// - worstFit: bloque libre con fragmento máximo
// --------------------------------------------------
function firstFitIndex(ram, size) {
  // Buscar desde abajo hacia arriba (bloques con mayor dirección primero)
  const blocks = ram.blocks;
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].free && blocks[i].size >= size) return i;
  }
  return -1;
}

function bestFitIndex(ram, size) {
  let best = -1;
  let bestFrag = Infinity;
  for (let i = 0; i < ram.blocks.length; i++) {
    const b = ram.blocks[i];
    if (b.free && b.size >= size) {
      const frag = b.size - size;
      // si frag igual, preferir bloque con mayor dirección (más cerca del S.O.)
      if (frag < bestFrag || (frag === bestFrag && b.start > (ram.blocks[best]?.start ?? -1))) { bestFrag = frag; best = i; }
    }
  }
  return best;
}

function worstFitIndex(ram, size) {
  let worst = -1;
  let worstFrag = -1;
  for (let i = 0; i < ram.blocks.length; i++) {
    const b = ram.blocks[i];
    if (b.free && b.size >= size) {
      const frag = b.size - size;
      // si frag igual, preferir bloque con mayor dirección
      if (frag > worstFrag || (frag === worstFrag && b.start > (ram.blocks[worst]?.start ?? -1))) { worstFrag = frag; worst = i; }
    }
  }
  return worst;
}

// --------------------------------------------------
// Instancias: 6 simulaciones (sin compactación: primer/mejor/peor) x (con compactación: primer/mejor/peor)
// --------------------------------------------------
const ramNo_Primer = new DynamicRam(TOTAL_MEM_MB);
const ramNo_Mejor = new DynamicRam(TOTAL_MEM_MB);
const ramNo_Peor = new DynamicRam(TOTAL_MEM_MB);

const ramC_Primer = new DynamicRam(TOTAL_MEM_MB);
const ramC_Mejor = new DynamicRam(TOTAL_MEM_MB);
const ramC_Peor = new DynamicRam(TOTAL_MEM_MB);

// Utilidades para clonar estados al iniciar (copiar la lista de programas default)
function resetAllRams() {
  ramNo_Primer.reset();
  ramNo_Mejor.reset();
  ramNo_Peor.reset();
  ramC_Primer.reset();
  ramC_Mejor.reset();
  ramC_Peor.reset();
  // Reservar S.O. protegido de 1.00 MiB en cada RAM
  ramNo_Primer.reserveSO(1.0);
  ramNo_Mejor.reserveSO(1.0);
  ramNo_Peor.reserveSO(1.0);
  ramC_Primer.reserveSO(1.0);
  ramC_Mejor.reserveSO(1.0);
  ramC_Peor.reserveSO(1.0);
}

// --------------------------------------------------
// Interfaz y renderizado
// --------------------------------------------------
const listaProgramasDiv = document.getElementById('listaProgramas');
const ramNo_PrimerEstado = document.getElementById('ramNo_PrimerEstado');
const ramNo_MejorEstado = document.getElementById('ramNo_MejorEstado');
const ramNo_PeorEstado = document.getElementById('ramNo_PeorEstado');

const ramC_PrimerEstado = document.getElementById('ramC_PrimerEstado');
const ramC_MejorEstado = document.getElementById('ramC_MejorEstado');
const ramC_PeorEstado = document.getElementById('ramC_PeorEstado');

// Representa la lista de programas disponibles con botones para insertar en cada esquema
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

  programasDisponibles.forEach((p, idx) => {
    const total = (p.segments.reduce((a, b) => a + b, 0) + HEAP_PILA).toFixed(2);
    html += `
      <tr>
        <td>${p.name}</td>
        <td>${total}</td>
        <td>
          <button data-idx="${idx}" data-action="insertAll">Insertar</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  listaProgramasDiv.innerHTML = html;

  listaProgramasDiv.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      insertarProgramaEnTodos(esquemaInsertAll, idx);
    });
  });
}

// esquemaInsertAll determina cómo insertar: intentará insertar todos los segmentos del programa en cada ram simulada
function esquemaInsertAll(ram, strategyFn, prog, progIdx, compactOnFail = false) {
  // Insertar el programa como UN SOLO BLOQUE: sumar segmentos + overhead
  const totalSize = prog.segments.reduce((a, b) => a + b, 0) + HEAP_PILA;
  let index = strategyFn(ram, totalSize);
  if (index === -1 && compactOnFail) {
    ram.compact();
    index = strategyFn(ram, totalSize);
  }
  if (index === -1) return false;
  // Insertar como único bloque; asignamos segIndex = 0 (ya no hay múltiples segmentos físicos)
  ram.insertBlockAt(index, prog.name, 0, totalSize);
  return true;
}

// Insertar en las 6 rams (3 sin compact, 3 con compact)
function insertarProgramaEnTodos(insertFn, progIdx) {
  const prog = programasDisponibles[progIdx];

  // Sin compactación
  insertFn(ramNo_Primer, firstFitIndex, prog, progIdx, false);
  insertFn(ramNo_Mejor, bestFitIndex, prog, progIdx, false);
  insertFn(ramNo_Peor, worstFitIndex, prog, progIdx, false);

  // Con compactación (permitir compactar en caso de fallo)
  insertFn(ramC_Primer, firstFitIndex, prog, progIdx, true);
  insertFn(ramC_Mejor, bestFitIndex, prog, progIdx, true);
  insertFn(ramC_Peor, worstFitIndex, prog, progIdx, true);

  actualizarVistas();
  saveState();
}

// Renderizado reutilizable de un DynamicRam
function renderRam(ram, contenedor, titulo) {
  const estado = ram.getEstado();
  let html = `<h3 class="mini-title">${titulo}</h3>`;
  // Controles: compactar y liberar programa (libera todos los segmentos con el mismo nombre)
  html += `<div class="controls"><button data-compact>Compactar</button><button data-freeprog>Liberar Programa</button></div>`;
  // Métricas
  const metrics = calcularMetricas(ram);
  html += `<div class="metrics">Usado: ${metrics.porcentajeUsado}% | Fragmentación externa: ${metrics.fragmentacion.toFixed(2)} MiB | Bloques libres: ${metrics.bloquesLibres}</div>`;
  html += `\n<table><thead><tr><th>Partición</th><th>Programa</th><th>Memoria Usada (MB)</th><th>Fragmentación (MB)</th><th>Acción</th></tr></thead><tbody>`;
  estado.forEach((b, i) => {
    const partIndex = i; // índice basado en orden actual de bloques
    if (b.free) {
      html += `<tr><td>${partIndex}</td><td>-</td><td>-</td><td>${b.size.toFixed(2)}</td><td>Libre</td></tr>`;
    } else {
      const frag = b.protected ? 0 : 0; // para bloques ocupados mostramos 0 como fragmentación interna
      const accion = b.protected ? 'Protegido' : `<button data-freeprog="${b.progName}">Finalizar</button>`;
      html += `<tr><td>${partIndex}</td><td>${b.progName}</td><td>${b.size.toFixed(2)}</td><td>${frag.toFixed(2)}</td><td>${accion}</td></tr>`;
    }
  });
  html += `</tbody></table>`;
  contenedor.innerHTML = html;

  // Render gráfico de la RAM como barras (proporcional al total)
  const visual = document.createElement('div');
  visual.className = 'ram-visual';
  estado.forEach(b => {
    const w = (b.size / TOTAL_MEM_MB) * 100;
    const blk = document.createElement('div');
    blk.className = 'ram-block ' + (b.free ? 'free' : 'occupied');
    blk.style.width = w + '%';
    blk.textContent = b.free ? '' : `${b.progName}`;
    visual.appendChild(blk);
  });
  contenedor.appendChild(visual);

  // vincular botón de liberar programa (entero)
  contenedor.querySelectorAll('button[data-freeprog]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pname = btn.dataset.freeprog;
      ram.freeProgram(pname);
      actualizarVistas();
      saveState();
    });
  });

  // vincular compactar y liberar programa (global dentro del contenedor)
  const btnCompact = contenedor.querySelector('button[data-compact]');
  const btnFreeProg = contenedor.querySelector('button[data-freeprog]');
  if (btnCompact) {
    btnCompact.addEventListener('click', () => { ram.compact(); actualizarVistas(); saveState(); });
  }
  if (btnFreeProg) {
    btnFreeProg.addEventListener('click', () => {
      const pname = prompt('Nombre del programa a liberar (ej: Chrome)');
      if (pname) {
        const freed = ram.freeProgram(pname);
        if (!freed) alert('No se encontró el programa: ' + pname);
        actualizarVistas(); saveState();
      }
    });
  }
}

function actualizarVistas() {
  renderRam(ramNo_Primer, ramNo_PrimerEstado, 'Sin Compactación - Primer Ajuste');
  renderRam(ramNo_Mejor, ramNo_MejorEstado, 'Sin Compactación - Mejor Ajuste');
  renderRam(ramNo_Peor, ramNo_PeorEstado, 'Sin Compactación - Peor Ajuste');

  renderRam(ramC_Primer, ramC_PrimerEstado, 'Con Compactación - Primer Ajuste');
  renderRam(ramC_Mejor, ramC_MejorEstado, 'Con Compactación - Mejor Ajuste');
  renderRam(ramC_Peor, ramC_PeorEstado, 'Con Compactación - Peor Ajuste');
}

// --------------------------------------------------
// Formulario para agregar nuevos programas a la lista disponible
// --------------------------------------------------
document.getElementById('formPrograma').addEventListener('submit', e => {
  e.preventDefault();
  const nombre = document.getElementById('progNombre').value.trim();
  const memoria = parseFloat(document.getElementById('progMemoria').value);
  if (!nombre || isNaN(memoria) || memoria <= 0) {
    alert('Datos inválidos');
    return;
  }
  // por simplicidad añadimos un único segmento con el valor indicado
  programasDisponibles.push({ name: nombre, segments: [memoria] });
  e.target.reset();
  renderListaProgramas();
  saveState();
});

// Botones extra para compactar cada ram manualmente (accesibles desde consola o UI futura)
// (Implementamos atajos con click en títulos)
// Añadir listeners simples para compactar al hacer doble click en el título de cada contenedor
ramC_PrimerEstado.addEventListener('dblclick', () => { ramC_Primer.compact(); actualizarVistas(); saveState(); });
ramC_MejorEstado.addEventListener('dblclick', () => { ramC_Mejor.compact(); actualizarVistas(); saveState(); });
ramC_PeorEstado.addEventListener('dblclick', () => { ramC_Peor.compact(); actualizarVistas(); saveState(); });

// Crear un par de utilidades para pruebas: reiniciar todo
function init() {
  // Intentar cargar estado desde localStorage; si no existe, inicializar por defecto
  if (!loadState()) {
    resetAllRams();
  }
  renderListaProgramas();
  actualizarVistas();
}

// Inicializar
init();

// Exportar para pruebas manuales desde consola (opcional)
window.__sim = {
  ramNo_Primer, ramNo_Mejor, ramNo_Peor,
  ramC_Primer, ramC_Mejor, ramC_Peor,
  programasDisponibles, firstFitIndex, bestFitIndex, worstFitIndex
};

// -------------------------------
// Métricas y Persistencia
// -------------------------------
function calcularMetricas(ram) {
  const estado = ram.getEstado();
  const usados = estado.filter(b => !b.free).reduce((acc, b) => acc + b.size, 0);
  const libres = estado.filter(b => b.free);
  const fragmentacion = libres.reduce((acc, b) => acc + b.size, 0);
  const bloquesLibres = libres.length;
  const porcentajeUsado = Math.round((usados / ram.total) * 100);
  return { usados, fragmentacion, bloquesLibres, porcentajeUsado };
}

function saveState() {
  try {
    const state = {
      programas: programasDisponibles,
      rams: {
        no_primer: ramNo_Primer.blocks,
        no_mejor: ramNo_Mejor.blocks,
        no_peor: ramNo_Peor.blocks,
        c_primer: ramC_Primer.blocks,
        c_mejor: ramC_Mejor.blocks,
        c_peor: ramC_Peor.blocks
      }
    };
    localStorage.setItem('sim_particiones_dinamicas_v1', JSON.stringify(state));
  } catch (e) {
    console.warn('No se pudo guardar estado:', e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem('sim_particiones_dinamicas_v1');
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (state.programas) programasDisponibles = state.programas;
    if (state.rams) {
      ramNo_Primer.blocks = state.rams.no_primer || ramNo_Primer.blocks;
      ramNo_Mejor.blocks = state.rams.no_mejor || ramNo_Mejor.blocks;
      ramNo_Peor.blocks = state.rams.no_peor || ramNo_Peor.blocks;
      ramC_Primer.blocks = state.rams.c_primer || ramC_Primer.blocks;
      ramC_Mejor.blocks = state.rams.c_mejor || ramC_Mejor.blocks;
      ramC_Peor.blocks = state.rams.c_peor || ramC_Peor.blocks;
    }
    // Asegurar S.O. presente y protegido en cada RAM; si no, reservarlo
    [ramNo_Primer, ramNo_Mejor, ramNo_Peor, ramC_Primer, ramC_Mejor, ramC_Peor].forEach(r => {
      const idxSO = r.blocks.findIndex(b => !b.free && b.progName === 'S.O.');
      if (idxSO === -1) {
        r.reserveSO(1.0);
      } else {
        // mover S.O. al final: construir nuevos bloques sin S.O. y añadir S.O. al final
        const soBlock = r.blocks[idxSO];
        const others = r.blocks.filter((_, i) => i !== idxSO);
        // recalcular starts
        let cursor = 0;
        const rebuilt = [];
        for (const b of others) {
          if (b.free) {
            rebuilt.push({ start: cursor, size: b.size, free: true });
            cursor += b.size;
          } else {
            rebuilt.push({ start: cursor, size: b.size, free: false, progName: b.progName, segIndex: b.segIndex });
            cursor += b.size;
          }
        }
        // añadir S.O. al final con tamaño original
        rebuilt.push({ start: cursor, size: soBlock.size, free: false, progName: 'S.O.', protected: true });
        r.blocks = rebuilt;
      }
    });
    return true;
  } catch (e) {
    console.warn('No se pudo cargar estado:', e);
    return false;
  }
}
