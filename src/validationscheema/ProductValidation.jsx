export const ProductValidation = (json) => {
    const MyPromiss = new Promise((resolve, reject) => {
        var errorJson = {};
        
        // Helper function to safely handle string operations
        const safeStringTrim = (value) => {
            if (value === null || value === undefined) return '';
            return typeof value === 'string' ? value.trim() : String(value).trim();
        };
        
        // Product name validation
        if (!json?.productName || safeStringTrim(json.productName) === "") {
            Object.assign(errorJson, { productName: "Product name cannot be empty *" });
        } else if (safeStringTrim(json.productName).length < 2) {
            Object.assign(errorJson, { productName: "Product name must be at least 2 characters *" });
        }
           if (json?.netQuantity === undefined || json?.netQuantity === '') {
            Object.assign(errorJson, { netQuantity: "Field can't be empty *" });
        }
        
        // MRP validation (changed from fullPrice)
        if (!json?.mrp || safeStringTrim(json.mrp) === "") {
            Object.assign(errorJson, { mrp: "MRP cannot be empty *" });
        } else {
            const mrpValue = parseFloat(json.mrp);
            if (isNaN(mrpValue) || mrpValue <= 0) {
                Object.assign(errorJson, { mrp: "MRP must be a valid positive number *" });
            } else if (mrpValue > 999999) {
                Object.assign(errorJson, { mrp: "MRP cannot exceed 999,999 *" });
            }
        }
        
        // Cost Price validation
        if (!json?.costPrice || safeStringTrim(json.costPrice) === "") {
            Object.assign(errorJson, { costPrice: "Cost price cannot be empty *" });
        } else {
            const costPriceValue = parseFloat(json.costPrice);
            if (isNaN(costPriceValue) || costPriceValue <= 0) {
                Object.assign(errorJson, { costPrice: "Cost price must be a valid positive number *" });
            } else if (costPriceValue > 999999) {
                Object.assign(errorJson, { costPrice: "Cost price cannot exceed 999,999 *" });
            }
        }
        
        // Sell Price validation
        if (!json?.sellPrice || safeStringTrim(json.sellPrice) === "") {
            Object.assign(errorJson, { sellPrice: "Sell price cannot be empty *" });
        } else {
            const sellPriceValue = parseFloat(json.sellPrice);
            if (isNaN(sellPriceValue) || sellPriceValue <= 0) {
                Object.assign(errorJson, { sellPrice: "Sell price must be a valid positive number *" });
            } else if (sellPriceValue > 999999) {
                Object.assign(errorJson, { sellPrice: "Sell price cannot exceed 999,999 *" });
            }
        }
        
   
     
        
        // Price logic validation - Cost and Sell prices should be <= MRP
        if (json?.costPrice && json?.mrp && json?.sellPrice) {
            const costPrice = parseFloat(json.costPrice);
            const mrpValue = parseFloat(json.mrp);
            const sellPrice = parseFloat(json.sellPrice);
            
            if (!isNaN(costPrice) && !isNaN(mrpValue) && costPrice > mrpValue) {
                Object.assign(errorJson, { costPrice: "Cost price cannot be greater than MRP *" });
            }
            
            if (!isNaN(sellPrice) && !isNaN(mrpValue) && sellPrice > mrpValue) {
                Object.assign(errorJson, { sellPrice: "Sell price cannot be greater than MRP *" });
            }
            
            // Optional: Warn if sell price is less than cost price (negative profit)
            if (!isNaN(costPrice) && !isNaN(sellPrice) && sellPrice < costPrice) {
                Object.assign(errorJson, { sellPrice: "Warning: Sell price is less than cost price (negative profit) *" });
            }
        }
        
      
        
    
        
      
        
     
        resolve(errorJson);
    });
    
    return MyPromiss;
};