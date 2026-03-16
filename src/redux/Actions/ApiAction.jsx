import { SET_API_JSON, SET_API_JSON_ERROR } from "../ActionName/ActionName"

export const setApiJson = (data) => {
    return {
        type: SET_API_JSON,
        value: data
    }
}

export const setApiErrorJson = (data) => {
    return {
        type: SET_API_JSON_ERROR,
        value: data
    }
}


// export const setUserData = (data) => {
//     return {
//         type: SET_USER_DATA,
//         value: data
//     }
// }
