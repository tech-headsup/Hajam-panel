// utils/permissionUtils.js
import { getElevateUser } from '../storage/Storage';

/**
 * Check if user has permission for a specific module and action
 * @param {string} module - The module name (e.g., 'user', 'client', 'services', 'cashManagement', 'bills', 'closing', 'expense', 'ngb', 'paymentReports', 'cashRegister')
 * @param {string} action - The action type ('read', 'write', 'delete')
 * @param {string} childType - Optional child type for nested permissions (e.g., 'parent', 'child')
 * @returns {boolean} - True if user has permission, false otherwise
 */
export const hasPermission = (module, action = 'read', childType = null) => {
  const userData = getElevateUser();
  const userPermissions = userData?.roleData?.permission;



  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  if (childType) {
    // Check child permissions (for nested permissions like services -> parent/child)
    return checkChildPermission(userPermissions, module, childType, action);
  } else {
    // Check regular module permissions
    return checkModulePermission(userPermissions, module, action);
  }
};



/**
 * Check regular module permissions
 * @param {Array} userPermissions - User's permission array
 * @param {string} module - Module name
 * @param {string} action - Action type
 * @returns {boolean}
 */
const checkModulePermission = (userPermissions, module, action) => {
  // First, check if module exists at top level
  const modulePermission = userPermissions.find(perm => perm.value === module);

  if (modulePermission) {
    const permission = modulePermission.permission[0];
    return permission && permission[action] === true;
  }

  // If not found at top level, search in child arrays of all modules
  for (const parentPerm of userPermissions) {
    if (parentPerm.child && Array.isArray(parentPerm.child)) {
      const childPermission = parentPerm.child.find(child => child.value === module);
      if (childPermission) {
        const permission = childPermission.permission[0];
        return permission && permission[action] === true;
      }
    }
  }

  return false;
};

/**
 * Check child permissions for nested modules
 * @param {Array} userPermissions - User's permission array
 * @param {string} parentModule - Parent module name
 * @param {string} childType - Child type
 * @param {string} action - Action type
 * @returns {boolean}
 */
const checkChildPermission = (userPermissions, parentModule, childType, action) => {
  const parentPermission = userPermissions.find(perm => perm.value === parentModule);

  if (!parentPermission || !parentPermission.child) {
    return false;
  }

  const childPermission = parentPermission.child.find(child => child.value === childType);

  if (!childPermission) {
    return false;
  }

  const permission = childPermission.permission[0];
  return permission && permission[action] === true;
};

/**
 * Check if user has any of the specified permissions
 * @param {Array} permissionChecks - Array of permission objects {module, action, childType}
 * @returns {boolean}
 */
export const hasAnyPermission = (permissionChecks) => {
  return permissionChecks.some(check =>
    hasPermission(check.module, check.action, check.childType)
  );
};

/**
 * Check if user has all of the specified permissions
 * @param {Array} permissionChecks - Array of permission objects {module, action, childType}
 * @returns {boolean}
 */
export const hasAllPermissions = (permissionChecks) => {
  return permissionChecks.every(check =>
    hasPermission(check.module, check.action, check.childType)
  );
};

/**
 * Get user's permissions for a specific module
 * @param {string} module - Module name
 * @returns {Object} - Object with read, write, delete boolean properties
 */
export const getModulePermissions = (module) => {
  return {
    read: hasPermission(module, 'read'),
    write: hasPermission(module, 'write'),
    delete: hasPermission(module, 'delete')
  };
};

/**
 * Check endpoint-specific permissions (for API endpoints)
 * @param {string} endpoint - API endpoint path
 * @returns {boolean}
 */
export const hasEndpointPermission = (endpoint) => {
  const userData = getElevateUser();
  const userPermissions = userData?.roleData?.permission;

  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }

  // Map endpoints to module permissions
  const endpointPermissionMap = {
    '/userservice/updateUser': { module: 'user', action: 'write' },
    '/userservice/deleteUser': { module: 'user', action: 'delete' },
    '/userservice/createUser': { module: 'user', action: 'write' },
    '/clientservice/updateClient': { module: 'client', action: 'write' },
    '/clientservice/deleteClient': { module: 'client', action: 'delete' },
    '/staffservice/updateStaff': { module: 'staff', action: 'write' },
    '/staffservice/deleteStaff': { module: 'staff', action: 'delete' },
    // Add more endpoint mappings as needed
  };

  const permissionCheck = endpointPermissionMap[endpoint];
  if (!permissionCheck) {
    return false;
  }

  return hasPermission(permissionCheck.module, permissionCheck.action);
};

/**
 * Hook for checking permissions in React components
 * @param {string} module - Module name
 * @param {string} action - Action type
 * @param {string} childType - Optional child type
 * @returns {Object} - Object with permission status and loading state
 */
export const usePermissionCheck = (module, action = 'read', childType = null) => {
  const userData = getElevateUser();
  const loading = !userData;
  const hasAccess = hasPermission(module, action, childType);

  return {
    hasAccess,
    loading,
    canRead: hasPermission(module, 'read', childType),
    canWrite: hasPermission(module, 'write', childType),
    canDelete: hasPermission(module, 'delete', childType)
  };
};

/**
 * Higher-order component for permission-based rendering
 * @param {Object} props - Component props
 * @param {string} props.module - Module name
 * @param {string} props.action - Action type
 * @param {string} props.childType - Optional child type
 * @param {React.Component} props.children - Child components
 * @param {React.Component} props.fallback - Fallback component when no permission
 * @returns {React.Component}
 */
export const PermissionWrapper = ({
  module,
  action = 'read',
  childType = null,
  children,
  fallback = null
}) => {
  const hasAccess = hasPermission(module, action, childType);

  if (!hasAccess) {
    return fallback;
  }

  return children;
};

/**
 * Utility to show/hide action buttons based on permissions
 * @param {string} module - Module name
 * @returns {Object} - Object with boolean flags for each action
 */
export const getActionPermissions = (module) => {
  return {
    canView: hasPermission(module, 'read'),
    canEdit: hasPermission(module, 'write'),
    canDelete: hasPermission(module, 'delete'),
    canAdd: hasPermission(module, 'write')
  };
};
