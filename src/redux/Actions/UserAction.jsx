import { SET_USER_DATA } from "../ActionName/ActionName"

export const setUserData= (data) => {
    return {
        type:SET_USER_DATA ,
        value: data
    }
}
