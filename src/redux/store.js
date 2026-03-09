import { configureStore } from '@reduxjs/toolkit'
import ApiReducer from './Reducers/ApiReducer'
import UserReducer from './Reducers/UserReducer'
import TableReducer from './Reducers/TableReducer'
import RolesAndPermissionReducer from './Reducers/RoleAndPermissionReducer/RoleAndPermissionReducer'

export const store = configureStore({
  reducer: {
    ApiReducer: ApiReducer,
    UserReducer: UserReducer,
    TableReducer: TableReducer,
    RolesAndPermissionReducer: RolesAndPermissionReducer,
  },
})
