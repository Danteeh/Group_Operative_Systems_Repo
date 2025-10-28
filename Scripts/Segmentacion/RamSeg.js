import { Program } from "../Program.js";

export class RamSegmentada {
    constructor(capacidadMB = 16) {
        this.capacidad = capacidadMB * 1024; // en KB
        this.segmentos = [];
        this.insertarSistemaOperativo();
    }

    insertarSistemaOperativo() {
        const so = new Program(0, "Sistema Operativo", 1024, 0);
        this.segmentos.push({
            programa: so,
            inicio: 0,
            fin: 1024,
            protegido: true
        });
    }

    kbAHex(kb) {
        return "0x" + (kb * 1024).toString(16).padStart(5, "0").toUpperCase();
    }

    insertarPrograma(programa) {
        const tamano = programa.totalMemory;
        this.segmentos.sort((a, b) => a.inicio - b.inicio);
        let inicio = 0;

        for (let i = 0; i <= this.segmentos.length; i++) {
            const finPrevio = i === 0 ? 0 : this.segmentos[i - 1].fin;
            const inicioSiguiente =
                i === this.segmentos.length ? this.capacidad : this.segmentos[i].inicio;

            if (inicioSiguiente - finPrevio >= tamano) {
                inicio = finPrevio;
                break;
            }
        }

        const fin = inicio + tamano;
        if (fin > this.capacidad)
            throw new Error("No hay suficiente memoria para este programa.");

        this.segmentos.push({ programa, inicio, fin, protegido: false });
    }

    finalizarPrograma(nombre) {
        const idx = this.segmentos.findIndex(
            (s) => s.programa.name === nombre && !s.protegido
        );
        if (idx === -1) throw new Error("Programa no encontrado o protegido.");
        this.segmentos.splice(idx, 1);
    }

    compactar() {
        this.segmentos.sort((a, b) => a.inicio - b.inicio);
        let desplazamiento = 0;
        for (let seg of this.segmentos) {
            const tam = seg.fin - seg.inicio;
            seg.inicio = desplazamiento;
            seg.fin = desplazamiento + tam;
            desplazamiento += tam;
        }
    }

    getSegmentosPorPrograma(nombre) {
        return this.segmentos
            .filter(seg => seg.programa.name === nombre && !seg.protegido)
            .map(seg => ({
                inicio: seg.inicio,
                fin: seg.fin,
                tamano: seg.fin - seg.inicio
            }));
    }

    getEstado() {
        this.segmentos.sort((a, b) => a.inicio - b.inicio);

        const estado = this.segmentos.map((seg) => ({
            programa: seg.programa.name,
            inicio: this.kbAHex(seg.inicio),
            fin: this.kbAHex(seg.fin),
            tamano: seg.fin - seg.inicio,
            protegido: seg.protegido ? "Sí" : "No"
        }));

        const fragmentacion = [];
        let pos = 0;
        for (let seg of this.segmentos) {
            if (seg.inicio > pos) {
                fragmentacion.push({
                    inicio: this.kbAHex(pos),
                    fin: this.kbAHex(seg.inicio),
                    tamano: seg.inicio - pos
                });
            }
            pos = seg.fin;
        }
        if (pos < this.capacidad) {
            fragmentacion.push({
                inicio: this.kbAHex(pos),
                fin: this.kbAHex(this.capacidad),
                tamano: this.capacidad - pos
            });
        }

        return { estado, fragmentacion };
    }
}
