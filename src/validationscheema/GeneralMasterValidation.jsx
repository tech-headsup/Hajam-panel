export const GeneralMasterValidationSchema = (json) => {
    const MyPromise = new Promise((resolve, reject) => {
      var errorJson = {};
  
      // Helper function to safely handle string operations
      const safeStringTrim = (value) => {
        if (value === null || value === undefined) return '';
        return typeof value === 'string' ? value.trim() : String(value).trim();
      };
  
      // Validate label field
      if (!json?.label || safeStringTrim(json.label) === "") {
        Object.assign(errorJson, { label: "Label can't be empty *" });
      }
  
      if (!json?.value || safeStringTrim(json.value) === "") {
        Object.assign(errorJson, { value: "Value can't be empty *" });
      }
  
      if (!json?.usedBy || safeStringTrim(json.usedBy) === "") {
        Object.assign(errorJson, { usedBy: "Used by selection is required *" });
      }
  
  
      resolve(errorJson);
    });
  
    return MyPromise;
  };