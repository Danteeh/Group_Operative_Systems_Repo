//Misma logica que teniamos pero mas resumida
//NO es necesario importar programa por si necesitamos tenerlo en otros contextos
export function validarTamFijo(program, sizeMB = 1) {
    return program.totalMemory <= sizeMB;
}

//Tamaño variable estatico
//Primer Ajuste
export const comprobador =[4,4,2,2,1,1,0.5,0.5,1];
export function validarPrimerAjuste(proram, indice){
    return proram.totalMemory <= comprobador[indice];
}

