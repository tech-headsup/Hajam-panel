import { SET_USER_DATA } from "../ActionName/ActionName";


const initialState = {
    user: null,
    pagination: { page: 1, limit: 10, search: {} },
    timestamp: Date.now()
}

const UserReducer = (state = initialState, action) => {

    switch (action.type) {
        case SET_USER_DATA:
            return ({ ...state, user: action.value, timestamp: Date.now() })

        default:
            return state;
    }
}

export default UserReducer;
