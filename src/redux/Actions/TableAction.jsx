import { SET_PAGINATION } from "../ActionName/ActionName"

export const setPagination= (data) => {
    return {
        type:SET_PAGINATION ,
        value: data
    }
}
