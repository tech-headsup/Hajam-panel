import { store } from '../redux/store';
import { setApiJson, setApiErrorJson } from '../redux/Actions/ApiAction';
import { setUserData } from '../redux/Actions/UserAction';
import { setPagination } from '../redux/Actions/TableAction';

// Helper function to check if a field has an error
export const hasError = (fieldName, ApiReducer) => {
  return ApiReducer.apiJsonError && ApiReducer.apiJsonError[fieldName];
};

// Helper function to get error message
export const getErrorMsg = (fieldName, ApiReducer) => {
  return ApiReducer.apiJsonError ? ApiReducer.apiJsonError[fieldName] : "";
};


export const getCategoryDisplayName = (value) => {
  const displayNames = {
    'dashboard': "Dashboard",
    'user': 'User Management',
    "staff": "Staff Dashboard",
    'unit': 'Unit Management',
    'client': 'Client Management',
    'seat': 'Seat Management',
    'vendor': 'Vendor Management',
    'attendance': 'Attendance Management',
    'inventory': 'Inventory Management',
    'product': 'Product Management',
    'membership': 'Membership Management',
    'services': 'Services',
    'parent': 'Parent Services',
    'child': 'Child Services',
    'floor': 'Floor Management',
    "task": "Task Managemen",
    "ngb": "NGB",
  };
  return displayNames[value.toLowerCase()] || value.charAt(0).toUpperCase() + value.slice(1);
};


export const getButtonProps = (categoryValue, permissionType, originalAllowed, index, childIndex = null, selectedPermissions) => {
  const key = childIndex !== null ? `${categoryValue}_${childIndex}_${permissionType}` : `${categoryValue}_${permissionType}`;
  const isSelected = selectedPermissions[key];

  const readKey = childIndex !== null ? `${categoryValue}_${childIndex}_read` : `${categoryValue}_read`;
  const writeKey = childIndex !== null ? `${categoryValue}_${childIndex}_write` : `${categoryValue}_write`;

  const isReadSelected = selectedPermissions[readKey];
  const isWriteSelected = selectedPermissions[writeKey];

  let isDisabled = false;

  if (childIndex !== null) {
    const parentReadKey = `${categoryValue}_read`;
    const parentWriteKey = `${categoryValue}_write`;
    const parentDeleteKey = `${categoryValue}_delete`;

    const isParentReadSelected = selectedPermissions[parentReadKey];
    const isParentWriteSelected = selectedPermissions[parentWriteKey];
    const isParentDeleteSelected = selectedPermissions[parentDeleteKey];

    if (permissionType === 'read' && !isParentReadSelected) isDisabled = true;
    if (permissionType === 'write' && (!isParentWriteSelected || !isReadSelected)) isDisabled = true;
    if (permissionType === 'delete' && (!isParentDeleteSelected || !isReadSelected || !isWriteSelected)) isDisabled = true;
  } else {
    if (permissionType === 'write' && !isReadSelected) isDisabled = true;
    if (permissionType === 'delete' && (!isReadSelected || !isWriteSelected)) isDisabled = true;
  }

  // Also disable during submission
  isDisabled = isDisabled;

  const baseClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 px-4 py-2 font-medium'
    : 'px-4 py-2 font-medium transition-all duration-200';

  if (isDisabled) return { className: baseClasses, variant: 'outline', disabled: true };

  const colors = {
    read: isSelected ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm' : originalAllowed ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : '',
    write: isSelected ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm' : originalAllowed ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : '',
    delete: isSelected ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-sm' : originalAllowed ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : ''
  };

  return {
    className: `${baseClasses} ${colors[permissionType] || 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'}`,
    variant: isSelected ? 'solid' : 'outline'
  };
};


export const allReduxClear = (dispatch) => {
  dispatch(setApiJson({}));
  dispatch(setApiErrorJson({}));
  dispatch(setUserData(null));
  dispatch(setPagination({ page: 1, limit: 10, total: 0 }));
};

export const getNavigationPath = (module) => {
  const pathMap = {
    'dashboard': '/',
    'user': '/users',
    'rolesAndPermissions': '/roles-and-permission',
  };
  return pathMap[module] || '/';
};
