class Process {
    constructor(li, t, bi, bd, name) {
        this.li = li;
        this.t = t;
        this.t_original = t;
        this.bi = bi;
        this.bd = bd;
        this.name = name;
        
        this.estado = 'nuevo';
        this.tiempo_bloqueo_restante = 0;
        this.contador_ejecucion = 0;
        
        this.tr = null;
        this.if = null;
        this.t_espera = 0;
        this.t_bloqueo = 0;
        this.t_ejecucion = 0;
        
        this.tiempo_llegada_sistema = li;
        this.ya_se_bloqueo = false;
    }
}

// Crear procesos
const procesos = [
    new Process(0, 6, 3, 2, 'A'),
    new Process(1, 8, 1, 3, 'B'),
    new Process(2, 7, 5, 1, 'C'),
    new Process(4, 3, 0, 0, 'D'),
    new Process(6, 9, 2, 4, 'E'),
    new Process(6, 2, 0, 0, 'F')
];

let listos = [];
let bloqueados = [];
let terminados = [];
let tiempo = 0;
let proceso_actual = null;
let timeline = [];
let procesos_data = []; // Para almacenar datos de ejecución de cada proceso

// Algoritmo FCFS con bloqueos
while (terminados.length < 6) {
    // Llegada de nuevos procesos
    for (let p of procesos) {
        if (p.estado === 'nuevo' && tiempo >= p.li) {
            p.estado = 'listo';
            listos.push(p);
        }
    }
    
    // Ordenar listos por tiempo de llegada (FCFS)
    listos.sort((a, b) => a.tiempo_llegada_sistema - b.tiempo_llegada_sistema);
    
    // Actualizar bloqueados
    for (let p of bloqueados) {
        p.tiempo_bloqueo_restante--;
        p.t_bloqueo++;
        
        if (p.tiempo_bloqueo_restante <= 0) {
            p.estado = 'listo';
            p.ya_se_bloqueo = true;
            p.contador_ejecucion = 0;
            listos.push(p);
        }
    }
    bloqueados = bloqueados.filter(p => p.tiempo_bloqueo_restante > 0);
    
    // Tomar proceso si no hay actual
    if (!proceso_actual && listos.length > 0) {
        proceso_actual = listos.shift();
        proceso_actual.estado = 'ejecutando';
        
        if (proceso_actual.t_ejecucion === 0) {
            proceso_actual.tr = tiempo - proceso_actual.li;
        }
    }
    
    // Ejecutar proceso actual
    if (proceso_actual) {
        timeline.push(proceso_actual.name);
        
        proceso_actual.t--;
        proceso_actual.t_ejecucion++;
        proceso_actual.contador_ejecucion++;
        
        // Verificar si terminó
        if (proceso_actual.t <= 0) {
            proceso_actual.estado = 'terminado';
            proceso_actual.if = tiempo + 1;
            terminados.push(proceso_actual);
            proceso_actual = null;
        }
        // Verificar si debe bloquearse
        else if (proceso_actual.bi > 0 && 
                 proceso_actual.contador_ejecucion >= proceso_actual.bi &&
                 !proceso_actual.ya_se_bloqueo) {
            
            proceso_actual.estado = 'bloqueado';
            proceso_actual.tiempo_bloqueo_restante = proceso_actual.bd;
            bloqueados.push(proceso_actual);
            proceso_actual = null;
        }
    }
    
    // Espera para procesos en listos
    for (let p of listos) {
        p.t_espera++;
    }
    
    tiempo++;
}

// Ordenar terminados por nombre para mostrar
terminados.sort((a, b) => a.name.localeCompare(b.name));

// TABLA DE RESULTADOS
console.log("=".repeat(80));
console.log("RESULTADOS FCFS CON BLOQUEOS");
console.log("=".repeat(80));
console.log("Proc |  t | Espera | Bloqueo |  if |   T | T-t |   P |  TR");
console.log("-".repeat(80));

let T_total_sistema = 0;
for (let p of terminados) {
    let T = p.if - p.li;
    let perdido = T - p.t_original;
    let P = (T / p.t_original).toFixed(2);
    T_total_sistema = Math.max(T_total_sistema, p.if);
    
    console.log(` ${p.name}  | ${p.t_original.toString().padStart(2)} | ${p.t_espera.toString().padStart(6)} | ${p.t_bloqueo.toString().padStart(7)} | ${p.if.toString().padStart(3)} | ${T.toString().padStart(3)} | ${perdido.toString().padStart(3)} | ${P.padStart(4)} | ${p.tr.toString().padStart(3)}`);
}

console.log("-".repeat(80));
console.log(`T total del sistema: ${T_total_sistema}`);
console.log(`Secuencia ejecución: ${timeline.join('')}`);
console.log("\n");

// GENERAR DATOS PARA GRÁFICA
// Crear array con estado de cada proceso en cada tiempo
let estados_por_tiempo = [];
for (let t = 0; t < T_total_sistema; t++) {
    let estado_tiempo = { tiempo: t };
    for (let p of procesos) {
        estado_tiempo[p.name] = ' '; // Inicialmente vacío
    }
    estados_por_tiempo.push(estado_tiempo);
}

// Reconstruir timeline desde el array
for (let t = 0; t < timeline.length && t < T_total_sistema; t++) {
    let proceso = timeline[t];
    estados_por_tiempo[t][proceso] = '█'; // Ejecutando
}

// Guardar el HTML en un archivo
