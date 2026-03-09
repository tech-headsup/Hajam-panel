import { SET_ROLES_AND_PERMISSION, SET_ROLES_AND_PERMISSION_API_JSON, SET_ROLES_AND_PERMISSION_MAIN_DATA, SET_ROLES_AND_PERMISSION_SEARCH_JSON } from "../../Actions/RoleAndPermissionAction/RoleAndPermissionAction"
import { AllPermissionList } from "./AllPermissions"

const initialState = {
  mainData: null,
  doc: AllPermissionList,
  apiJson: {},
  searchJson: { page: 1, limit: 10, search: {} },
  timestamp: Date.now()
}

const RolesAndPermissionReducer = (state = initialState, action) => {

  switch (action.type) {
    case SET_ROLES_AND_PERMISSION:
      return ({ ...state, doc: action.value, timestamp: Date.now() })
    case SET_ROLES_AND_PERMISSION_MAIN_DATA:
      return ({ ...state, mainData: action.value, timestamp: Date.now() })
    case SET_ROLES_AND_PERMISSION_API_JSON:
      return ({ ...state, apiJson: action.value, timestamp: Date.now() })
    case SET_ROLES_AND_PERMISSION_SEARCH_JSON:
      return ({ ...state, searchJson: action.value, timestamp: Date.now() })
    default:
      return state;
  }
}

export default RolesAndPermissionReducer;
