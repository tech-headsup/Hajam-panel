export const UnitValidationSchema = (json, isEditMode) => {
    const MyPromise = new Promise((resolve, reject) => {
        var errorJson = {};

        if (json?.unitName === undefined || json?.unitName === '') {
            Object.assign(errorJson, { unitName: "Unit name cannot be empty *" });
        }
        if (json?.address === undefined || json?.address === '') {
            Object.assign(errorJson, { address: "Address cannot be empty *" });
        }
        if (json?.status === undefined || json?.status === '') {
            Object.assign(errorJson, { status: "Selection of field is required *" });
        }
        if (json?.electricity === undefined || json?.electricity === '') {
            Object.assign(errorJson, { electricity: "field is required *" });
        }
          if (json?.rent === undefined || json?.rent === '') {
            Object.assign(errorJson, { rent: "field is required *" });
        }

        resolve(errorJson);
    })
    return MyPromise;
}