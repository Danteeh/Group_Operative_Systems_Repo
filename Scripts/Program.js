export const HEADER = 745; // Lo dejamos como una constante global para que se cargue una vez y ya
//Incluimos export para poder importar la clase o la constante en otras clases
export class Program {// Cambiamos la forma en sacar la memoria total el otro metodo no era optimo
    constructor(memoryToUse, sumPileAmount) {
        this.memoryToUse = memoryToUse;
        this.sumPileAmount = sumPileAmount;
    }

    get totalMemory() {//nuevo metodo mejor para su uso asi solo hacemos la suma aca y ahorramos pasos
        return this.memoryToUse + this.sumPileAmount;
    }
}