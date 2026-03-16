import { EMAIL_REGEX, PHONE_REGEX, STRONG_PASSWORD_REGEX } from "../constant/regex";

export const UserValidationScheema = (json, isEditMode) => {


    const MyPromise = new Promise((resolve, reject) => {
        var errorJson = {};

        const safeStringTrim = (value) => {
            if (value === null || value === undefined) return '';
            return typeof value === 'string' ? value.trim() : String(value).trim();
        };

        if (json?.name === undefined || json?.name === '') {

            Object.assign(errorJson, { name: "Full name cannot be empty *" });
        }

        if (json.email === undefined || json?.email === '') {
            Object.assign(errorJson, { email: "Field can't be empty *" });
        }

        if (json?.email?.length > 0) {
            if (!EMAIL_REGEX.test(json.email)) {
                Object.assign(errorJson, { email: "Invalid Email Address *" })
            }
        }
        if (json?.phoneNumber === undefined || json?.phoneNumber === '') {
            Object.assign(errorJson, { phoneNumber: "Field can't be empty *" });
        }
        if (json?.phoneNumber?.length > 0) {
            if (!PHONE_REGEX.test(json.phoneNumber)) {
                Object.assign(errorJson, { phoneNumber: "Invalid contact no *" })
            }
        }
        if (json?.userType === undefined || json?.userType === '') {
            Object.assign(errorJson, { userType: "User type selection is required *" });
        }
        if (json?.roleId === undefined || json?.roleId === '') {
            Object.assign(errorJson, { roleId: "Role selection is required *" });
        }
        if (json?.unitIds === undefined || json?.unitIds === '') {
            Object.assign(errorJson, { unitIds: "Unit selection is required *" });
        }
        if (!json?.unitIds || json.unitIds.length === 0) {
            Object.assign(errorJson, { unitIds: "Unit selection is required *" });
        }
        if (!isEditMode) {
            if (json?.password === undefined || json?.password === '') {
                Object.assign(errorJson, { password: "Password is required *" });
            }
        }

        resolve(errorJson);
    })
    return MyPromise;
}
