//Misma logica que teniamos pero mas resumida
//NO es necesario importar programa por si necesitamos tenerlo en otros contextos
export const comprobador_tamfijo = new Array(16).fill(1);
export function validarTamFijo(program, indice) {
    return program.totalMemory <= comprobador_tamfijo[indice];
}

//Tamaño variable estatico
//Primer Ajuste
//export const comprobador =[4,4,2,2,1,1,0.5,0.5,1];
export const comprobador = [1, 0.5, 0.5, 1, 1, 2, 2, 4, 4];
export function validarPrimerAjuste(proram, indice) {
    return proram.totalMemory <= comprobador[indice];
}

//todo Paginacion logica
export var numeroPaginas;
export var Memoria_virtual;
export var Marcos_virtuales;
export var Total_memoria;
var offset;
export var tamPaginas;
export function Paginacion(tamRam) {
    numeroPaginas = 2 ** (tamRam / 2);
    offset = numeroPaginas;
    Memoria_virtual = 2 ** 28;
    Marcos_virtuales = (Memoria_virtual / 1024) / offset;//Asi queda repesentado el marco en 8 bits
    Total_memoria = ((tamRam * 1024) * 1024) + Memoria_virtual;
    return tamPaginas, Memoria_virtual, Marcos_virtuales, Total_memoria, numeroPaginas;
}


export function NumeroPaginas_Programa(programa) {
    numero_segmentos = programa.numSeg;
    resultados = [];
    for (i = 0; i < numero_segmentos; i++) {
        resultados[i] = programa.Tamseg(i) / tamPaginas;
    }
    return resultados;
}
export var Insertar;
export function insertarPrograma(Num_Paginas_Programa, indice) {

    if ((indice + Num_Paginas_Programa) > numeroPaginas) {
        console.error("No se puede agregar el programa");
        Insertar = false;
    } else {
        Insertar = true;
    }

}
