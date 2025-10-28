// --------------------------------------------------------
// PARTICIONES FIJAS
// --------------------------------------------------------
export const comprobador_tamfijo = new Array(16).fill(1); // 16 bloques de 1 MB
export function validarTamFijo(program, indice) {
    return program.totalMemory <= comprobador_tamfijo[indice];
}

// --------------------------------------------------------
// PARTICIONES VARIABLES (Primer Ajuste)
// --------------------------------------------------------
export const comprobador = [1, 0.5, 0.5, 1, 1, 2, 2, 4, 4]; // En MB
export function validarPrimerAjuste(program, indice) {
    return program.totalMemory <= comprobador[indice];
}

// --------------------------------------------------------
// PAGINACIÓN LÓGICA
// --------------------------------------------------------
export let numeroPaginas = 0;
export let Memoria_virtual = 0;
export let Marcos_virtuales = 0;
export let Total_memoria = 0;
export let tamPaginas = 0;

/**
 * Inicializa la configuración de paginación.
 * @param {number} tamRam Tamaño de la RAM en MB (por ejemplo, 16 MB)
 * @param {number} tamPaginaKB Tamaño de página en KB (por defecto 4 KB)
 */
export function Paginacion(tamRam, tamPaginaKB = 4) {
    // Convertimos la RAM a KB
    const tamRamKB = tamRam * 1024;

    // Cálculo de número de páginas físicas
    numeroPaginas = Math.floor(tamRamKB / tamPaginaKB);

    // Configuración de la memoria virtual (ej: 256 MB)
    Memoria_virtual = 256 * 1024; // En KB
    Marcos_virtuales = Math.floor(Memoria_virtual / tamPaginaKB);

    // Tamaño total (RAM + memoria virtual)
    Total_memoria = tamRamKB + Memoria_virtual;
    tamPaginas = tamPaginaKB;

    return {
        tamPaginas,
        numeroPaginas,
        Memoria_virtual,
        Marcos_virtuales,
        Total_memoria
    };
}

/**
 * Calcula cuántas páginas necesita un programa según sus segmentos.
 * @param {object} programa Objeto con los tamaños de segmento en KB.
 * @returns {number[]} Arreglo con el número de páginas por segmento.
 */
export function NumeroPaginas_Programa(programa) {
    if (!tamPaginas || tamPaginas <= 0) {
        console.error("Error: La paginación no ha sido inicializada.");
        return [];
    }

    const segmentos = [
        programa.textSize,
        programa.dataSize,
        programa.stackSize,
        programa.heapSize
    ];

    return segmentos.map(seg => Math.ceil(seg / tamPaginas));
}

/**
 * Intenta insertar un programa según el número de páginas disponibles.
 * @param {number} paginasNecesarias Total de páginas requeridas por el programa.
 * @param {number} paginasOcupadas Páginas actualmente usadas.
 * @returns {boolean} true si se puede insertar, false si no.
 */
export function insertarPrograma(paginasNecesarias, paginasOcupadas) {
    if (paginasOcupadas + paginasNecesarias > numeroPaginas) {
        console.warn("No hay suficiente espacio para insertar el programa.");
        return false;
    }
    return true;
}
