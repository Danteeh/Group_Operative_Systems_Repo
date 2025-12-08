class Proc {
    constructor(name, li, t, bi, bd) {
        this.name = String(name);
        this.li = Number(li);
        this.t_original = Number(t);
        this.t = Number(t);
        this.bi = Number(bi);
        this.bd = Number(bd);

        this.estado = 'nuevo';
        this.tiempo_bloqueo_restante = 0;
        this.contador_bloqueo = 0;  // Solo para controlar bloqueos
        this.contador_total = 0;     // Para contar todas las ejecuciones

        this.tr = null;
        this.if = null;
        this.t_espera = 0;
        this.t_bloqueo = 0;
        this.t_ejecucion = 0;
        this.ya_se_bloqueo = false;
    }
}

function testPriorityCompleto() {
    console.log("=== PRIORITY (TIEMPO RESTANTE) CON BLOQUEOS ===");
    
    // Crear todos los procesos del ejemplo
    const procesos = [
        new Proc('A', 0, 6, 3, 2),
        new Proc('B', 1, 8, 1, 3),
        new Proc('C', 2, 7, 5, 1),
        new Proc('D', 4, 3, 0, 0),
        new Proc('E', 6, 9, 2, 4),
        new Proc('F', 6, 2, 0, 0)
    ];
    
    console.log("PROCESOS:");
    procesos.forEach(p => {
        console.log(`  ${p.name}: li=${p.li}, t=${p.t_original}, bi=${p.bi}, bd=${p.bd}`);
    });
    console.log("\n=== EJECUCIÓN DETALLADA ===");

    // Reset containers
    let listos = [];
    let bloqueados = [];
    let terminados = [];
    let tiempo = 0;
    let proceso_actual = null;
    let timeline = [];

    while (terminados.length < procesos.length && tiempo < 50) {
        let log = [`T=${tiempo}:`];
        
        // Llegadas
        for (let p of procesos) {
            if (p.estado === 'nuevo' && tiempo >= p.li) {
                p.estado = 'listo';
                listos.push(p);
                log.push(`${p.name} llega`);
            }
        }

        // ORDENAR PRIORITY (menor tiempo restante primero)
        listos.sort((a, b) => {
            if (a.t !== b.t) return a.t - b.t;
            return a.li - b.li;
        });
        
        if (listos.length > 0) {
            log.push(`Listos:[${listos.map(p => `${p.name}(${p.t})`).join(',')}]`);
        }

        // Actualizar bloqueados
        for (let p of bloqueados) {
            p.tiempo_bloqueo_restante--;
            p.t_bloqueo++;
            if (p.tiempo_bloqueo_restante >= 0) {
                log.push(`${p.name} bloqueado(${p.tiempo_bloqueo_restante})`);
            }
        }
        
        // Salir de bloqueo
        for (let i = bloqueados.length - 1; i >= 0; i--) {
            const p = bloqueados[i];
            if (p.tiempo_bloqueo_restante <= 0) {
                p.estado = 'listo';
                p.ya_se_bloqueo = true;
                p.contador_bloqueo = 0; // Reiniciar solo contador de bloqueo
                listos.push(p);
                log.push(`${p.name} sale_bloqueo`);
                bloqueados.splice(i, 1);
            }
        }

        // Tomar proceso si no hay actual
        if (!proceso_actual && listos.length > 0) {
            proceso_actual = listos.shift();
            proceso_actual.estado = 'ejecutando';
            if (proceso_actual.tr === null) proceso_actual.tr = tiempo - proceso_actual.li;
            log.push(`→${proceso_actual.name}_INICIA`);
        }

        // Ejecutar
        if (proceso_actual) {
            timeline.push(proceso_actual.name);
            
            log.push(`${proceso_actual.name}ejec(resta:${proceso_actual.t}, bloqueo:${proceso_actual.contador_bloqueo + 1}/${proceso_actual.bi})`);
            
            proceso_actual.t--;
            proceso_actual.t_ejecucion++;
            proceso_actual.contador_total++;      // Todas las ejecuciones
            proceso_actual.contador_bloqueo++;    // Ejecuciones para bloqueo

            // ¿Terminado?
            if (proceso_actual.t <= 0) {
                proceso_actual.estado = 'terminado';
                proceso_actual.if = tiempo + 1;
                terminados.push(proceso_actual);
                log.push(`★${proceso_actual.name}_TERMINA`);
                proceso_actual = null;
            } 
            // ¿Debe bloquearse?
            else if (proceso_actual.bi > 0 && 
                     proceso_actual.contador_bloqueo >= proceso_actual.bi && 
                     !proceso_actual.ya_se_bloqueo) {
                
                proceso_actual.estado = 'bloqueado';
                proceso_actual.tiempo_bloqueo_restante = proceso_actual.bd;
                bloqueados.push(proceso_actual);
                log.push(`⚡${proceso_actual.name}_BLOQUEA${proceso_actual.bd}u`);
                proceso_actual = null;
            }
        } else if (listos.length === 0 && bloqueados.length === 0) {
            timeline.push('_');
            log.push(`CPU_idle`);
        } else {
            timeline.push('_');
        }

        // Espera para listos
        for (let p of listos) {
            p.t_espera++;
        }

        console.log(log.join(' '));
        tiempo++;
    }

    console.log("\n=== TIMELINE COMPLETO ===");
    console.log("Tiempos: " + Array.from({length: timeline.length}, (_, i) => i).join(' ').substring(0, 100));
    console.log("Ejecución: " + timeline.join(' '));
    
    console.log("\n=== RESUMEN POR PROCESO ===");
    terminados.sort((a,b) => a.name.localeCompare(b.name)).forEach(p => {
        const T = p.if - p.li;
        const perdido = T - p.t_original;
        const P = (T / p.t_original).toFixed(2);
        console.log(`${p.name}: t=${p.t_original}, ejec=${p.t_ejecucion}, total_ejec=${p.contador_total}, espera=${p.t_espera}, bloqueo=${p.t_bloqueo}, if=${p.if}, T=${T}, TR=${p.tr}`);
    });
    
    console.log("\n=== DETALLE PROCESO C ===");
    const procesoC = procesos.find(p => p.name === 'C');
    if (procesoC) {
        console.log(`C: t_original=7, t_ejecucion=${procesoC.t_ejecucion}, bi=5`);
        console.log(`Contador bloqueo: ${procesoC.contador_bloqueo}`);
        console.log(`Contador total: ${procesoC.contador_total}`);
        console.log(`¿Se bloqueó? ${procesoC.ya_se_bloqueo}, if=${procesoC.if}`);
        
        // Mostrar línea de tiempo específica para C
        let cTimeline = '';
        for (let i = 0; i < timeline.length; i++) {
            cTimeline += timeline[i] === 'C' ? 'C' : '.';
        }
        console.log(`Timeline C: ${cTimeline}`);
        
        // Mostrar en qué tiempos se ejecutó C
        const tiemposC = [];
        for (let i = 0; i < timeline.length; i++) {
            if (timeline[i] === 'C') tiemposC.push(i);
        }
        console.log(`Tiempos ejecución C: ${tiemposC.join(', ')}`);
        console.log(`Ejecuciones consecutivas antes del bloqueo: buscar 5 C's seguidas`);
    }
    
    // Mostrar secuencia de ejecución por bloques
    console.log("\n=== BLOQUES DE EJECUCIÓN ===");
    let currentProc = null;
    let startTime = 0;
    for (let i = 0; i <= timeline.length; i++) {
        if (timeline[i] !== currentProc) {
            if (currentProc && currentProc !== '_') {
                const duration = i - startTime;
                console.log(`${currentProc}: ${startTime}-${i-1} (${duration}u)`);
            }
            currentProc = timeline[i];
            startTime = i;
        }
    }
}

// Ejecutar prueba completa
testPriorityCompleto();