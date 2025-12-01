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

// CÓDIGO HTML PARA MOSTRAR LA GRÁFICA
const htmlCode = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FCFS con Bloqueos - Diagrama de Gantt</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: #f5f7fa;
            color: #333;
            line-height: 1.6;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            padding: 30px;
        }
        
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 15px;
        }
        
        h2 {
            color: #34495e;
            margin: 25px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }
        
        .results-table th {
            background-color: #3498db;
            color: white;
            padding: 12px;
            text-align: center;
            font-weight: 600;
        }
        
        .results-table td {
            padding: 10px;
            text-align: center;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .results-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        .results-table tr:hover {
            background-color: #e8f4fc;
        }
        
        .timeline-container {
            margin: 30px 0;
            overflow-x: auto;
        }
        
        .timeline-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
            min-width: ${T_total_sistema * 30}px;
        }
        
        .timeline-row {
            display: flex;
            align-items: center;
            height: 40px;
        }
        
        .process-label {
            width: 50px;
            font-weight: bold;
            text-align: center;
            color: #2c3e50;
        }
        
        .time-scale {
            display: flex;
            margin-left: 50px;
            border-top: 2px solid #7f8c8d;
            position: relative;
            height: 30px;
        }
        
        .time-tick {
            flex: 1;
            border-left: 1px solid #bdc3c7;
            text-align: center;
            padding-top: 5px;
            font-size: 12px;
            color: #7f8c8d;
            min-width: 30px;
            position: relative;
        }
        
        .time-tick:first-child {
            border-left: none;
        }
        
        .timeline-block {
            flex: 1;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            transition: all 0.3s;
            min-width: 30px;
            border-radius: 3px;
            margin: 1px;
        }
        
        .timeline-block:hover {
            transform: scale(1.05);
            box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        }
        
        .executing {
            background-color: #2ecc71;
        }
        
        .blocked {
            background-color: #e74c3c;
        }
        
        .ready {
            background-color: #f39c12;
        }
        
        .empty {
            background-color: #ecf0f1;
        }
        
        .legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .legend-color {
            width: 20px;
            height: 20px;
            border-radius: 3px;
        }
        
        .summary {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            border-left: 4px solid #3498db;
        }
        
        .summary p {
            margin: 5px 0;
        }
        
        .sequence {
            font-family: monospace;
            font-size: 18px;
            background-color: #2c3e50;
            color: white;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            letter-spacing: 2px;
            margin: 10px 0;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .timeline-block {
                min-width: 20px;
                font-size: 12px;
            }
            
            .time-tick {
                min-width: 20px;
                font-size: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>FCFS con Control de Bloqueos</h1>
        
        <div class="summary">
            <p><strong>Tiempo total del sistema:</strong> ${T_total_sistema} unidades</p>
            <p><strong>Secuencia de ejecución:</strong></p>
            <div class="sequence">${timeline.join('')}</div>
        </div>
        
        <h2>Tabla de Resultados</h2>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Proceso</th>
                    <th>t</th>
                    <th>Espera</th>
                    <th>Bloqueo</th>
                    <th>if</th>
                    <th>T</th>
                    <th>T-t</th>
                    <th>P</th>
                    <th>TR</th>
                </tr>
            </thead>
            <tbody>
                ${terminados.map(p => {
                    let T = p.if - p.li;
                    let perdido = T - p.t_original;
                    let P = (T / p.t_original).toFixed(2);
                    return `
                    <tr>
                        <td><strong>${p.name}</strong></td>
                        <td>${p.t_original}</td>
                        <td>${p.t_espera}</td>
                        <td>${p.t_bloqueo}</td>
                        <td>${p.if}</td>
                        <td>${T}</td>
                        <td>${perdido}</td>
                        <td>${P}</td>
                        <td>${p.tr}</td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <h2>Diagrama de Gantt</h2>
        <div class="timeline-container">
            <!-- Escala de tiempo -->
            <div class="time-scale">
                ${Array.from({length: T_total_sistema}, (_, i) => 
                    `<div class="time-tick">${i}</div>`
                ).join('')}
            </div>
            
            <!-- Líneas de tiempo por proceso -->
            <div class="timeline-grid">
                ${procesos.map(p => {
                    // Determinar los estados del proceso en cada tiempo
                    let blocks = [];
                    let currentTime = 0;
                    let inBlock = false;
                    let blockRemaining = 0;
                    let executed = 0;
                    let hasBlocked = false;
                    
                    for (let t = 0; t < T_total_sistema; t++) {
                        let state = 'empty';
                        
                        // Si el proceso está ejecutando en este tiempo
                        if (timeline[t] === p.name) {
                            state = 'executing';
                            executed++;
                            
                            // Verificar si debe bloquearse después de esta ejecución
                            if (p.bi > 0 && executed >= p.bi && !hasBlocked) {
                                // El próximo estado será bloqueado
                                inBlock = true;
                                blockRemaining = p.bd;
                                hasBlocked = true;
                                executed = 0;
                            }
                        } 
                        // Si está bloqueado
                        else if (inBlock && blockRemaining > 0) {
                            state = 'blocked';
                            blockRemaining--;
                            if (blockRemaining === 0) {
                                inBlock = false;
                                executed = 0;
                            }
                        }
                        // Si está en cola de listos (llegó pero no ejecuta)
                        else if (t >= p.li && t < (p.if || T_total_sistema) && timeline[t] !== p.name && !inBlock) {
                            state = 'ready';
                        }
                        
                        blocks.push(state);
                    }
                    
                    return `
                    <div class="timeline-row">
                        <div class="process-label">${p.name}</div>
                        ${blocks.map((state, index) => 
                            `<div class="timeline-block ${state}" title="${p.name} en t=${index}: ${state === 'executing' ? 'Ejecutando' : state === 'blocked' ? 'Bloqueado' : state === 'ready' ? 'En cola' : 'No activo'}"></div>`
                        ).join('')}
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color executing"></div>
                <span>Ejecutando</span>
            </div>
            <div class="legend-item">
                <div class="legend-color blocked"></div>
                <span>Bloqueado</span>
            </div>
            <div class="legend-item">
                <div class="legend-color ready"></div>
                <span>En cola de listos</span>
            </div>
            <div class="legend-item">
                <div class="legend-color empty"></div>
                <span>No activo/inactivo</span>
            </div>
        </div>
        
        <div class="summary">
            <h3>Explicación:</h3>
            <p>• <strong>FCFS (First Come First Served)</strong>: Los procesos se ejecutan en orden de llegada.</p>
            <p>• <strong>Bloqueos</strong>: Cada proceso se bloquea solo una vez según su bi (burst de ejecución antes de bloqueo).</p>
            <p>• <strong>Colores</strong>: Verde = ejecución, Rojo = bloqueo, Naranja = en cola de listos, Gris = inactivo.</p>
        </div>
    </div>
    
    <script>
        // Añadir interactividad a los bloques de la línea de tiempo
        document.querySelectorAll('.timeline-block').forEach(block => {
            block.addEventListener('click', function() {
                alert(this.getAttribute('title'));
            });
        });
    </script>
</body>
</html>
`;

// Guardar el HTML en un archivo
const fs = require('fs');
fs.writeFileSync('fcfs_diagram.html', htmlCode);

console.log("=".repeat(80));
console.log("✓ Diagrama HTML generado: fcfs_diagram.html");
console.log("✓ Abre el archivo en tu navegador para ver la gráfica interactiva");
console.log("=".repeat(80));