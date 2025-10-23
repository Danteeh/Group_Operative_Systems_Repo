//Misma logica que teniamos pero mas resumida
//NO es necesario importar programa por si necesitamos tenerlo en otros contextos
export const comprobador_tamfijo =new Array(16).fill(1);
export function validarTamFijo(program, indice) {
    return program.totalMemory <= comprobador_tamfijo[indice];
}

//Tamaño variable estatico
//Primer Ajuste
//export const comprobador =[4,4,2,2,1,1,0.5,0.5,1];
export const comprobador =[1,0.5,0.5,1,1,2,2,4,4];
export function validarPrimerAjuste(proram, indice){
    return proram.totalMemory <= comprobador[indice];
}

//todo Paginacion logica
export const numeroPaginas = 16;
export function tamPaginas(tamRam){
    if(tamRam == 8){
        tamPaginas = 0.5;
    }
    else if(tamRam == 16 ){
        tamPaginas = 1;
    }
    else if(tamRam == 32){
        tamPaginas = 2;
    }
    else {
        tamPaginas = 0;
        console.log("El equipo no cumple con los requisitos del sistema");
    }
return tamPaginas;
}
