import { Paginacion, NumeroPaginas_Programa, insertarPrograma } from "../Script_Condiciones.js"
import { Program } from "../Program.js"
const conf = Paginacion(16, 4);
const total_paginas = conf.numeroPaginas;

let paginasUsadas = [];
let tablaPaginas = document.querySelector("#tablaPaginas tbody");
console.log(tablaPaginas);
let ramDiv = document.getElementById("ram-horizontal");

const so = new Program("Sistema Operativo", 4, 4, 4, 4);

function initRam() {
    ramDiv.innerHTML = "";
    paginasUsadas = new Array(total_paginas).fill(null);
    for (let i = 0; i < total_paginas; i++) {
        const bloque = document.createElement("div");
        bloque.classList.add("bloque-pagina");
        bloque.style.flex = "1";
        bloque.style.backgroundColor = "#bcd3d8";
        bloque.textContent = "";
        ramDiv.appendChild(bloque);
    }
}



function pintarPrograma(nombre, color, paginas, inicio) {

    for (let i = 0; i < paginas; i++) {
        const marco = inicio + i;
        if (marco < total_paginas) {
        const bloque = ramDiv.children[marco];
        bloque.style.backgroundColor= color;
        bloque.textContent = nombre;
        paginasUsadas[marco]= nombre;
        }
    }
}

//Formulario

const form = 
document.getElementById("program-form");
form.addEventListener("submit", (e) => {
    e.preventDefault();


    const programa = {
        nombre: document.getElementById("prog-name").value , 
        textSize:
        parseInt(document.getElementById("text-size").value),
        dataSize:
        parseInt(document.getElementById("data-size").value),
        stackSize:
        parseInt(document.getElementById("stack-size").value),
        heapSize:
        parseInt(document.getElementById("heap-size").value),
    };

    const paginasPorSeg = NumeroPaginas_Programa(programa);
    const totalProgPaginas = paginasPorSeg.reduce((a, b) => a + b, 0);
    const inicio = paginasUsadas.findIndex(p => p === null);

    if(inicio === -1 || inicio + totalProgPaginas > total_paginas){
        alert("No hay sudiciente espacio en la RAM.")
        return;
    }


    const colores = ["#004d63", "#006989", "#00a8b5", "#3ccfcf", "#5cd2c6"];
    const color = colores[Math.floor(Math.random() * colores.length)];
    pintarPrograma(programa.nombre, color, totalProgPaginas, inicio);

    //Llenar tabla
    let numPag = 0;
    ["text", "data", "stack", "heap"].forEach((seg, i) => {
        for (let p = 0; p < paginasPorSeg[i]; p++){
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${programa.nombre}</td>
                <td>${numPag++}</td>
                <td>${inicio + p}</td>
                <td>4</td>
            `;

        tablaPaginas.appendChild(fila);
        }
    });

    form.reset();
});

document.getElementById("reset-btn").addEventListener("click",() => {
    tablaPaginas.innerHTML = "";
    initRam();
});

function agregarSO() {
    const paginasPorSeg = NumeroPaginas_Programa(so);
    const paginasSO = paginasPorSeg(so).reduce((a, b) => a + b, 0);
    pintarPrograma(so.nombre, "#ff5733", paginasSO, 0);

    let numPag = 0;
    ["text", "data", "stack", "heap"].forEach((seg, i) => {
        for (let p = 0; p < paginasPorSeg[i]; p++){
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${so.nombre}</td>
                <td>${numPag++}</td>
                <td>${p}</td>
                <td>4</td>
            `;
        tablaPaginas.appendChild(fila);
        }
    });
}


initRam();
agregarSO();

