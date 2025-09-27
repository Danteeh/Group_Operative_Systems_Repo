//Misma logica que teniamos pero mas resumida
//NO es necesario importar programa por si necesitamos tenerlo en otros contextos
export function validarTamFijo(program, sizeMB = 1) {
    return program.totalMemory <= sizeMB;
}
