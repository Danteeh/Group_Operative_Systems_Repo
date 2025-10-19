// Simulador de particiones dinámicas (sin/ con compactación)
// - Direccionamiento hasta 16 MiB (0 .. 16)
// - Soporta Primer Ajuste, Mejor Ajuste y Peor Ajuste
// - Dos modos: sin compactación y con compactación (compactación automática al finalizar)
// - Incluye programas simulados con segmentos

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

// Estructura de bloques de memoria dinámica
class DynamicRam {
  constructor(totalMb) {
    this.total = totalMb;
    this.blocks = [{ start: 0, size: totalMb, free: true }];
  }

  // Reserva el bloque del sistema operativo en la posición 0
  //todo: Se paso de la ultima casilla a la primera 
  reserveSO(size = 1.0) {
    if (size <= 0 || size >= this.total) return;
    const freeSize = this.total - size;
    this.blocks = [
      { start: 0, size: size, free: false, progName: 'S.O.', protected: true },
      { start: size, size: freeSize, free: true }
    ];
  }

  getEstado() {
    return this.blocks.slice().sort((a, b) => a.start - b.start);
  }

  insertBlockAt(index, progName, segIndex, size) {
    const block = this.blocks[index];
    if (!block.free) throw new Error('Bloque objetivo no es libre');
    if (size > block.size) throw new Error('No cabe en el bloque');

    const allocated = { start: block.start, size: size, free: false, progName, segIndex };

    if (size === block.size) {
      this.blocks.splice(index, 1, allocated);
    } else {
      const remaining = { start: block.start + size, size: block.size - size, free: true };
      this.blocks.splice(index, 1, allocated, remaining);
    }
  }

  freeProgram(progName) {
    let any = false;
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (!b.free && b.progName === progName && !b.protected) {
        this.blocks[i] = { start: b.start, size: b.size, free: true };
        any = true;
      }
    }
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i].free) this._mergeAround(i);
    }
    return any;
  }

  _mergeAround(idx) {
    // unir izquierda
    if (idx > 0 && this.blocks[idx - 1].free && this.blocks[idx].free) {
      const left = this.blocks[idx - 1];
      const cur = this.blocks[idx];
      this.blocks.splice(idx - 1, 2, { start: left.start, size: left.size + cur.size, free: true });
      idx = idx - 1;
    }
    // unir derecha
    if (idx < this.blocks.length - 1 && this.blocks[idx + 1].free && this.blocks[idx].free) {
      const cur = this.blocks[idx];
      const right = this.blocks[idx + 1];
      this.blocks.splice(idx, 2, { start: cur.start, size: cur.size + right.size, free: true });
    }
  }

  // Compactar hacia arriba (dejando libre el espacio al final)
  compact() {
    const so = this.blocks.find(b => !b.free && b.progName === 'S.O.');
    const soSize = so ? so.size : 0;
    const occupied = this.blocks.filter(b => !b.free && b.progName !== 'S.O.').sort((a, b) => a.start - b.start);

    let cursor = soSize; // comienza después del S.O.
    const newBlocks = [];

    // mantener el S.O. al inicio
    if (so) newBlocks.push({ start: 0, size: soSize, free: false, progName: 'S.O.', protected: true });

    for (const occ of occupied) {
      newBlocks.push({ start: cursor, size: occ.size, free: false, progName: occ.progName, segIndex: occ.segIndex });
      cursor += occ.size;
    }

    // bloque libre final
    if (cursor < this.total) newBlocks.push({ start: cursor, size: this.total - cursor, free: true });

    this.blocks = newBlocks;
  }

  reset() {
    this.blocks = [{ start: 0, size: this.total, free: true }];
  }
}

// --------------------------------------------------
// Algoritmos de ajuste
// --------------------------------------------------
function firstFitIndex(ram, size) {
  for (let i = 0; i < ram.blocks.length; i++) {
    if (ram.blocks[i].free && ram.blocks[i].size >= size) return i;
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
      if (frag < bestFrag) { bestFrag = frag; best = i; }
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
      if (frag > worstFrag) { worstFrag = frag; worst = i; }
    }
  }
  return worst;
}

// --------------------------------------------------
// Instancias de RAM
// --------------------------------------------------
const ramNo_Primer = new DynamicRam(TOTAL_MEM_MB);
const ramNo_Mejor = new DynamicRam(TOTAL_MEM_MB);
const ramNo_Peor = new DynamicRam(TOTAL_MEM_MB);
const ramC_Primer = new DynamicRam(TOTAL_MEM_MB);
const ramC_Mejor = new DynamicRam(TOTAL_MEM_MB);
const ramC_Peor = new DynamicRam(TOTAL_MEM_MB);

function resetAllRams() {
  [ramNo_Primer, ramNo_Mejor, ramNo_Peor, ramC_Primer, ramC_Mejor, ramC_Peor].forEach(r => {
    r.reset();
    r.reserveSO(1.0); // S.O. al inicio
  });
}

// --------------------------------------------------
// Renderizado
// --------------------------------------------------
const listaProgramasDiv = document.getElementById('listaProgramas');
const ramNo_PrimerEstado = document.getElementById('ramNo_PrimerEstado');
const ramNo_MejorEstado = document.getElementById('ramNo_MejorEstado');
const ramNo_PeorEstado = document.getElementById('ramNo_PeorEstado');
const ramC_PrimerEstado = document.getElementById('ramC_PrimerEstado');
const ramC_MejorEstado = document.getElementById('ramC_MejorEstado');
const ramC_PeorEstado = document.getElementById('ramC_PeorEstado');

function renderListaProgramas() {
  let html = `
    <table>
      <thead>
        <tr><th>Programa</th><th>Memoria Total (MB)</th><th>Acción</th></tr>
      </thead>
      <tbody>
  `;
  programasDisponibles.forEach((p, idx) => {
    const total = (p.segments.reduce((a, b) => a + b, 0) + HEAP_PILA).toFixed(2);
    html += `
      <tr>
        <td>${p.name}</td>
        <td>${total}</td>
        <td><button data-idx="${idx}" data-action="insertAll">Insertar</button></td>
      </tr>`;
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

function esquemaInsertAll(ram, strategyFn, prog, progIdx, compactOnFail = false) {
  const totalSize = prog.segments.reduce((a, b) => a + b, 0) + HEAP_PILA;
  let index = strategyFn(ram, totalSize);
  if (index === -1 && compactOnFail) {
    ram.compact();
    index = strategyFn(ram, totalSize);
  }
  if (index === -1) return false;
  ram.insertBlockAt(index, prog.name, 0, totalSize);
  return true;
}

function insertarProgramaEnTodos(insertFn, progIdx) {
  const prog = programasDisponibles[progIdx];
  insertFn(ramNo_Primer, firstFitIndex, prog, progIdx, false);
  insertFn(ramNo_Mejor, bestFitIndex, prog, progIdx, false);
  insertFn(ramNo_Peor, worstFitIndex, prog, progIdx, false);
  insertFn(ramC_Primer, firstFitIndex, prog, progIdx, true);
  insertFn(ramC_Mejor, bestFitIndex, prog, progIdx, true);
  insertFn(ramC_Peor, worstFitIndex, prog, progIdx, true);
  actualizarVistas();
}

function renderRam(ram, contenedor, titulo) {
  const estado = ram.getEstado();
  const metrics = calcularMetricas(ram);
  let html = `<h3 class="mini-title">${titulo}</h3>`;
  html += `<div class="metrics">Usado: ${metrics.porcentajeUsado}% | Fragmentación externa: ${metrics.fragmentacion.toFixed(2)} MiB | Bloques libres: ${metrics.bloquesLibres}</div>`;
  html += `<table><thead><tr><th>Partición</th><th>Programa</th><th>Tamaño (MB)</th><th>Acción</th></tr></thead><tbody>`;

  estado.forEach((b, i) => {
    if (b.free) {
      html += `<tr><td>${i}</td><td>-</td><td>${b.size.toFixed(2)}</td><td>Libre</td></tr>`;
    } else {
      const accion = b.protected ? 'Protegido' : `<button data-freeprog="${b.progName}">Finalizar</button>`;
      html += `<tr><td>${i}</td><td>${b.progName}</td><td>${b.size.toFixed(2)}</td><td>${accion}</td></tr>`;
    }
  });

  html += `</tbody></table>`;
  contenedor.innerHTML = html;

  // Visual RAM
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

  // Finalizar programa
  contenedor.querySelectorAll('button[data-freeprog]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pname = btn.dataset.freeprog;
      const freed = ram.freeProgram(pname);

      // Compactar automáticamente si es una versión con compactación
      if (ram === ramC_Primer || ram === ramC_Mejor || ram === ramC_Peor) {
        ram.compact();
      }

      if (!freed) alert('No se encontró el programa: ' + pname);
      actualizarVistas();
    });
  });
}

function actualizarVistas() {
  renderRam(ramNo_Primer, ramNo_PrimerEstado, 'Sin Compactación - Primer Ajuste');
  renderRam(ramNo_Mejor, ramNo_MejorEstado, 'Sin Compactación - Mejor Ajuste');
  renderRam(ramNo_Peor, ramNo_PeorEstado, 'Sin Compactación - Peor Ajuste');
  renderRam(ramC_Primer, ramC_PrimerEstado, 'Con Compactación - Primer Ajuste');
  renderRam(ramC_Mejor, ramC_MejorEstado, 'Con Compactación - Mejor Ajuste');
  renderRam(ramC_Peor, ramC_PeorEstado, 'Con Compactación - Peor Ajuste');
}

document.getElementById('formPrograma').addEventListener('submit', e => {
  e.preventDefault();
  const nombre = document.getElementById('progNombre').value.trim();
  const memoria = parseFloat(document.getElementById('progMemoria').value);
  if (!nombre || isNaN(memoria) || memoria <= 0) {
    alert('Datos inválidos');
    return;
  }
  programasDisponibles.push({ name: nombre, segments: [memoria] });
  e.target.reset();
  renderListaProgramas();
});

function calcularMetricas(ram) {
  const estado = ram.getEstado();
  const usados = estado.filter(b => !b.free).reduce((acc, b) => acc + b.size, 0);
  const libres = estado.filter(b => b.free);
  const fragmentacion = libres.reduce((acc, b) => acc + b.size, 0);
  const bloquesLibres = libres.length;
  const porcentajeUsado = Math.round((usados / ram.total) * 100);
  return { usados, fragmentacion, bloquesLibres, porcentajeUsado };
}

// --------------------------------------------------
// Inicialización
// --------------------------------------------------
function init() {
  resetAllRams();
  renderListaProgramas();
  actualizarVistas();
}
init();
