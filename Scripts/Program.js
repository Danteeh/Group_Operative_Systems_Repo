class program {
    Header = 745
    Memory_to_use
    Total_Memory
    constructor(Memory_to_use,Sum_Pile_Amount){
         this.Memory_to_use = Memory_to_use
         this.Sum_Pile_Amount = Sum_Pile_Amount
         this.Total_Memory = Memory_to_use+Sum_Pile_Amount

    }
    getTotalMemory(){
        return this.Total_Memory
    }

}