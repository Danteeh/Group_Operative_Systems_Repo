import { Program } from "./Program.js";

export class Ram {
    constructor(capacidadMiB = 16) {//La dejo capada a 16 pero podemos cambiarlo para crear RAM de otros tamaños 
        this.capacidadMiB = capacidadMiB;       // capacidad total de la RAM
        this.particiones = new Array(capacidadMiB).fill(null);
        // cada índice = 1 MiB
    }

    //Nueva logica de insercion para cuando se crean programas y evitar problemas
    insertarPrograma(program, indx) {
        if (!(program instanceof Program)) {
            throw new Error("Solo se pueden insertar instancias de Program");
        }
        if (indx < 0 || indx >= this.particiones.length) {
            throw new Error("Índice fuera de rango");
        }
        if (this.particiones[indx] !== null) {
            throw new Error(`La partición ${indx} ya está ocupada`);
        }
        this.particiones[indx] = program;
        return true;
    }
    //Una validacion sencilla para evitar problemas
    borrarPorIndice(indx) {
        if (indx < 0 || indx >= this.particiones.length) {
            throw new Error("Índice fuera de rango");
        }
        this.particiones[indx] = null;
        return true;
    }
    //Para borrar programas validar que este el programa y eliminarlo
    borrarPorPrograma(program) {
        const indx = this.particiones.findIndex(p => p === program);
        if (indx === -1) {
            throw new Error("El programa no está en RAM");
        }
        this.particiones[indx] = null;
        return true;
    }
    //Para dar mas datos y ver que sucede en la memoria ram 
    getEstado() {
        return this.particiones.map((p, i) => ({
            indice: i,
            ocupado: p !== null,
            programa: p ? p.info() : null
        }));
    }
}
