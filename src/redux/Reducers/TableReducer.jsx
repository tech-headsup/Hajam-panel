import { SET_PAGINATION } from "../ActionName/ActionName";

const initialState = {
    pagination: { page: 1, limit: 10, total: 0 },
    timestamp: Date.now()
}

const TableReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_PAGINATION:
            return ({
                ...state,
                pagination: {
                    ...initialState.pagination,
                    ...(action.value || {})
                },
                timestamp: Date.now()
            })
        default:
            return state;
    }
}
export default TableReducer;
