function runSimulation() {
    // Leer procesos del formulario
    const rows = Array.from(formContainer.querySelectorAll('.form-row'));
    const procesos = rows.map(r => {
        const inputs = r.querySelectorAll('input');
        return new Proc(
            inputs[0].value || 'P',
            Number(inputs[1].value) || 0,
            Math.max(1, Number(inputs[2].value) || 1),
            Math.max(0, Number(inputs[3].value) || 0),
            Math.max(0, Number(inputs[4].value) || 0)
        );
    });

    // Reset containers
    let listos = [];
    let bloqueados = [];
    let terminados = [];
    let tiempo = 0;
    let proceso_actual = null;
    let timeline = [];
    
    console.log("=== INICIO SIMULACIÓN SJF CON BLOQUEOS ===");
    console.log("Procesos:", procesos.map(p => `${p.name}(li:${p.li}, t:${p.t}, bi:${p.bi}, bd:${p.bd})`));

    // Por seguridad evitar loops infinitos
    const safeLimit = procesos.reduce((s,p) => s + p.t_original + p.bd, 0) * 5 + 2000;

    while (terminados.length < procesos.length && tiempo < safeLimit) {
        console.log(`\n=== TIEMPO ${tiempo} ===`);
        
        // Llegadas
        for (let p of procesos) {
            if (p.estado === 'nuevo' && tiempo >= p.li) {
                p.estado = 'listo';
                listos.push(p);
                console.log(`  ${p.name} llega al sistema`);
            }
        }

        // ORDENAR SEGÚN SJF: por tiempo restante (t)
        listos.sort((a, b) => {
            if (a.t !== b.t) return a.t - b.t;
            return a.li - b.li;
        });
        
        if (listos.length > 0) {
            console.log(`  Listos ordenados SJF: ${listos.map(p => `${p.name}(t:${p.t})`).join(', ')}`);
        }

        // Actualizar bloqueados
        for (let p of bloqueados) {
            p.tiempo_bloqueo_restante = Math.max(0, p.tiempo_bloqueo_restante - 1);
            p.t_bloqueo++;
            console.log(`  ${p.name} en bloqueo (restan: ${p.tiempo_bloqueo_restante})`);
        }
        
        // Mover quienes salen de bloqueo
        for (let i = bloqueados.length - 1; i >= 0; i--) {
            const p = bloqueados[i];
            if (p.tiempo_bloqueo_restante === 0) {
                p.estado = 'listo';
                p.ya_se_bloqueo = true;
                listos.push(p);
                console.log(`  ${p.name} sale de bloqueo, tiempo restante: ${p.t}`);
                bloqueados.splice(i, 1);
            }
        }

        // ORDENAR NUEVAMENTE después de agregar procesos que salieron del bloqueo
        listos.sort((a, b) => {
            if (a.t !== b.t) return a.t - b.t;
            return a.li - b.li;
        });

        // Si no hay proceso actual, tomar de listos (será el de menor t)
        if (!proceso_actual && listos.length > 0) {
            proceso_actual = listos.shift();
            proceso_actual.estado = 'ejecutando';
            if (proceso_actual.tr === null) {
                proceso_actual.tr = tiempo - proceso_actual.li;
                console.log(`  ${proceso_actual.name} comienza ejecución (TR: ${proceso_actual.tr})`);
            }
        }

        // Ejecutar
        if (proceso_actual) {
            timeline.push(proceso_actual.name);
            
            console.log(`  EJECUTANDO: ${proceso_actual.name} (ejecuciones: ${proceso_actual.t_ejecucion + 1}/${proceso_actual.t_original}, contador: ${proceso_actual.contador_ejecucion + 1}/${proceso_actual.bi})`);
            
            // Decrementar tiempo restante
            proceso_actual.t--;
            proceso_actual.t_ejecucion++;
            
            // Incrementar contador de ejecución (consecutivas para este ciclo)
            proceso_actual.contador_ejecucion++;

            // ¿Terminado?
            if (proceso_actual.t <= 0) {
                proceso_actual.estado = 'terminado';
                proceso_actual.if = tiempo + 1;
                terminados.push(proceso_actual);
                console.log(`  ${proceso_actual.name} TERMINA en t=${proceso_actual.if}`);
                proceso_actual = null;
            } 
            // ¿Debe bloquearse? 
            else if (proceso_actual.bi > 0 && 
                     proceso_actual.contador_ejecucion >= proceso_actual.bi && 
                     !proceso_actual.ya_se_bloqueo) {
                
                // Se bloquea
                proceso_actual.estado = 'bloqueado';
                proceso_actual.tiempo_bloqueo_restante = proceso_actual.bd;
                bloqueados.push(proceso_actual);
                console.log(`  ${proceso_actual.name} SE BLOQUEA por ${proceso_actual.bd} unidades`);
                proceso_actual = null;
            }
        } else {
            // CPU idle
            timeline.push(' ');
            console.log(`  CPU IDLE`);
        }

        // Incrementar espera para procesos en cola (listos)
        for (let p of listos) {
            p.t_espera++;
        }

        tiempo++;
    }

    console.log("\n=== RESULTADOS FINALES ===");
    console.log("Timeline:", timeline.join(''));
    console.log("Tiempo total del sistema:", tiempo);
    
    // Orden final por nombre para reporte
    terminados.sort((a,b) => a.name.localeCompare(b.name));

    // Calcular T_total
    const T_total_sistema = Math.max(...terminados.map(p => p.if));

    return {procesos, terminados, timeline, T_total_sistema};
}


function testSJFTOriginal() {
    console.log("=== TEST SJF CON t_original (NO tiempo restante) ===");
    
    // Crear todos los procesos
    const procesos = [
        new Proc('A', 0, 6, 3, 2),
        new Proc('B', 1, 8, 1, 3),
        new Proc('C', 2, 7, 5, 1),
        new Proc('D', 4, 3, 0, 0),
        new Proc('E', 6, 9, 2, 4),
        new Proc('F', 6, 2, 0, 0)
    ];
    
    console.log("PROCESOS (ordenados por t_original):");
    const procesosOrdenados = [...procesos].sort((a, b) => {
        if (a.t_original !== b.t_original) return a.t_original - b.t_original;
        return a.li - b.li;
    });
    
    procesosOrdenados.forEach(p => {
        console.log(`  ${p.name}: li=${p.li}, t=${p.t_original}, bi=${p.bi}, bd=${p.bd}`);
    });

    let listos = [];
    let bloqueados = [];
    let terminados = [];
    let tiempo = 0;
    let proceso_actual = null;
    let timeline = [];

    console.log("\n=== EJECUCIÓN DETALLADA ===");

    while (terminados.length < procesos.length && tiempo < 50) {
        let log = `T=${tiempo.toString().padStart(2)}:`;
        
        // Llegadas
        for (let p of procesos) {
            if (p.estado === 'nuevo' && tiempo >= p.li) {
                p.estado = 'listo';
                listos.push(p);
                log += ` ${p.name}+`;
            }
        }

        // ORDENAR SEGÚN SJF: por t_original (NO tiempo restante)
        listos.sort((a, b) => {
            if (a.t_original !== b.t_original) return a.t_original - b.t_original;
            return a.li - b.li;
        });
        
        if (listos.length > 0) {
            log += ` [${listos.map(p => `${p.name}(${p.t_original})`).join(',')}]`;
        }

        // Actualizar bloqueados
        for (let p of bloqueados) {
            p.tiempo_bloqueo_restante--;
            p.t_bloqueo++;
            if (p.tiempo_bloqueo_restante > 0) {
                log += ` ${p.name}⏳${p.tiempo_bloqueo_restante}`;
            }
        }
        
        // Salir de bloqueo
        for (let i = bloqueados.length - 1; i >= 0; i--) {
            const p = bloqueados[i];
            if (p.tiempo_bloqueo_restante <= 0) {
                p.estado = 'listo';
                p.ya_se_bloqueo = true;
                p.contador_ejecucion = 0; // Reiniciar contador después de bloqueo
                listos.push(p);
                log += ` ${p.name}✓`;
                bloqueados.splice(i, 1);
            }
        }

        // Ordenar nuevamente después de agregar procesos del bloqueo
        listos.sort((a, b) => {
            if (a.t_original !== b.t_original) return a.t_original - b.t_original;
            return a.li - b.li;
        });

        // Tomar proceso si no hay actual
        if (!proceso_actual && listos.length > 0) {
            proceso_actual = listos.shift();
            proceso_actual.estado = 'ejecutando';
            if (proceso_actual.tr === null) proceso_actual.tr = tiempo - proceso_actual.li;
            log += ` →${proceso_actual.name}`;
        }

        // Ejecutar
        if (proceso_actual) {
            timeline.push(proceso_actual.name);
            
            log += ` ${proceso_actual.name}🏃(${proceso_actual.contador_ejecucion + 1}/${proceso_actual.bi})`;
            
            proceso_actual.t--;
            proceso_actual.t_ejecucion++;
            proceso_actual.contador_ejecucion++;

            // ¿Terminado?
            if (proceso_actual.t <= 0) {
                proceso_actual.estado = 'terminado';
                proceso_actual.if = tiempo + 1;
                terminados.push(proceso_actual);
                log += ` ${proceso_actual.name}✅`;
                proceso_actual = null;
            } 
            // ¿Debe bloquearse?
            else if (proceso_actual.bi > 0 && 
                     proceso_actual.contador_ejecucion >= proceso_actual.bi && 
                     !proceso_actual.ya_se_bloqueo) {
                
                proceso_actual.estado = 'bloqueado';
                proceso_actual.tiempo_bloqueo_restante = proceso_actual.bd;
                bloqueados.push(proceso_actual);
                log += ` ${proceso_actual.name}🚫${proceso_actual.bd}`;
                proceso_actual = null;
            }
        } else if (listos.length === 0 && bloqueados.length === 0) {
            timeline.push('_');
            log += ` 💤`;
        } else {
            timeline.push('_');
        }

        // Espera para listos
        for (let p of listos) {
            p.t_espera++;
        }

        console.log(log);
        tiempo++;
    }

    console.log("\n=== TIMELINE COMPLETA ===");
    console.log(timeline.join(''));
    
    console.log("\n=== ORDEN DE EJECUCIÓN ESPERADO (por t_original) ===");
    console.log("1. F (t=2) - más corto");
    console.log("2. D (t=3)");
    console.log("3. A (t=6)");
    console.log("4. C (t=7)");
    console.log("5. B (t=8)");
    console.log("6. E (t=9) - más largo");
    
    console.log("\n=== ANÁLISIS DETALLADO ===");
    
    // Análisis de cuando cada proceso ejecuta
    console.log("\nEjecuciones por tiempo:");
    for (let i = 0; i < timeline.length; i++) {
        if (i % 20 === 0) console.log(`\nT${i.toString().padStart(2)}-${Math.min(i+19, timeline.length-1).toString().padStart(2)}: `);
        process.stdout.write(`${timeline[i] || '_'} `);
    }
    
    console.log("\n\n=== RESUMEN POR PROCESO ===");
    terminados.sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
        const T = p.if - p.li;
        console.log(`${p.name}: t=${p.t_original}, ejec=${p.t_ejecucion}, espera=${p.t_espera}, bloqueo=${p.t_bloqueo}, if=${p.if}, T=${T}`);
        
        // Mostrar tiempos de ejecución específicos
        let tiempos = [];
        for (let i = 0; i < timeline.length; i++) {
            if (timeline[i] === p.name) tiempos.push(i);
        }
        console.log(`  Tiempos ejecución: ${tiempos.join(', ')}`);
    });
}

// Clase Proc actualizada
class Proc {
    constructor(name, li, t, bi, bd) {
        this.name = String(name);
        this.li = Number(li);
        this.t_original = Number(t);
        this.t = Number(t); // Tiempo restante (para control interno)
        this.bi = Number(bi);
        this.bd = Number(bd);

        this.estado = 'nuevo';
        this.tiempo_bloqueo_restante = 0;
        this.contador_ejecucion = 0;

        this.tr = null;
        this.if = null;
        this.t_espera = 0;
        this.t_bloqueo = 0;
        this.t_ejecucion = 0;
        this.ya_se_bloqueo = false;
    }
}

// Ejecutar prueba
testSJFTOriginal();