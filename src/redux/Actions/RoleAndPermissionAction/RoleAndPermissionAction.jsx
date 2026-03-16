export const SET_ROLES_AND_PERMISSION = 'SET_ROLES_AND_PERMISSION'
export const SET_ROLES_AND_PERMISSION_API_JSON = 'SET_ROLES_AND_PERMISSION_API_JSON'
export const SET_ROLES_AND_PERMISSION_SEARCH_JSON = 'SET_ROLES_AND_PERMISSION_SEARCH_JSON'
export const SET_ROLES_AND_PERMISSION_MAIN_DATA = 'SET_ROLES_AND_PERMISSION_MAIN_DATA'


export const setRolesAndPermission= (data) => ({ type: SET_ROLES_AND_PERMISSION, value: data });
export const setRolesAndPermissionMainData= (data) => ({ type: SET_ROLES_AND_PERMISSION_MAIN_DATA, value: data });
export const setRolesAndPermissionApiJson= (data) => ({ type: SET_ROLES_AND_PERMISSION_API_JSON, value: data });
export const setRolesAndPermissionSearchJson= (data) => ({ type: SET_ROLES_AND_PERMISSION_SEARCH_JSON, value: data });
