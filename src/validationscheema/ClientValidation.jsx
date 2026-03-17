import { EMAIL_REGEX, PHONE_REGEX } from "../constant/regex";

export const ClientValidationScheema = (json, isEditMode) => {

    const MyPromise = new Promise((resolve, reject) => {
        var errorJson = {};

        if (json?.name === undefined || json?.name === '') {
            Object.assign(errorJson, { name: "Full name cannot be empty *" });
        }

        if (json?.customerType === undefined || json?.customerType === '') {
            Object.assign(errorJson, { customerType: "Field cannot be empty *" });
        }

        if (json?.phoneNumber === undefined || json?.phoneNumber === '') {
            Object.assign(errorJson, { phoneNumber: "Field can't be empty *" });
        }
        if (json?.phoneNumber?.length > 0) {
            if (!PHONE_REGEX.test(json.phoneNumber)) {
                Object.assign(errorJson, { phoneNumber: "Invalid contact no *" })
            }
        }

        if (json?.email?.length > 0) {
            if (!EMAIL_REGEX.test(json.email)) {
                Object.assign(errorJson, { email: "Invalid Email Address *" })
            }
        }
        resolve(errorJson);
    })
    return MyPromise;
}
