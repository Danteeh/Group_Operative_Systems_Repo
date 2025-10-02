import { Program } from "../Program.js";

export class Ram {
    constructor(capacidadMB, particiones) {
        this.capacidad = capacidadMB;
        this.particiones = particiones;
    }

    insertarPrograma(programa, indice) {
        if (indice < 0 || indice >= this.particiones.length) {
            throw new Error("Índice fuera de rango");
        }
        if (this.particiones[indice] !== null) {
            throw new Error("La partición ya está ocupada");
        }
        this.particiones[indice] = programa;
    }

    finalizarPrograma(indice) {   // 👈 más intuitivo que borrarPrograma
        if (indice < 0 || indice >= this.particiones.length) {
            throw new Error("Índice fuera de rango");
        }
        if (this.particiones[indice] === null) {
            throw new Error("La partición ya está vacía");
        }
        this.particiones[indice] = null;
    }
    getEstado() {
        return this.particiones.map((p, i) => {
            if (p) {
                const fragmentacion = Math.max(0, 1 - p.totalMemory); // 1 MB - programa
                return {
                    particion: i,
                    ocupado: true,
                    programa: p.info,
                    fragmentacion: fragmentacion.toFixed(2)
                };
            } else {
                return {
                    particion: i,
                    ocupado: false,
                    programa: null,
                    fragmentacion: "1.00" // partición libre = fragmentada completa
                };
            }
        });
    }


}
