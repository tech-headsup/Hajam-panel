import { SET_API_JSON, SET_API_JSON_ERROR } from "../ActionName/ActionName";


const initialState = {
    apiJson: {},
    apiJsonError: {},
    pagination: { page: 1, limit: 10, search: {} },
    timestamp: Date.now()
}

const ApiReducer = (state = initialState, action) => {

    switch (action.type) {
        case SET_API_JSON:
            return ({ ...state, apiJson: action.value, timestamp: Date.now() })
        case SET_API_JSON_ERROR:
            return ({ ...state, apiJsonError: action.value, timestamp: Date.now() })
        default:
            return state;
    }
}

export default ApiReducer;
