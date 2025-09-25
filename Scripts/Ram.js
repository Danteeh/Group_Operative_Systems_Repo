class ram {
    
    capacidad = 16 //16 megabits
    particiones = [] // arreglo de la partciones




    constructor(particiones){
         this.particiones = particiones

    }
    
    insertarPrograma(program, indx){
        this.particiones[indx] = program

    }
    
    borrarPrograma(program, indx){
        this.particiones[indx] = null
        
    }
    


}