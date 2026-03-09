import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { useDispatch, useSelector } from 'react-redux';
import AppInput from '../../components/AppInput/AppInput';
import AppButton from '../../components/AppButton/AppButton';
import { Button } from 'rizzui';
import { Loader2 } from 'lucide-react';
import { setRolesAndPermission } from '../../redux/Actions/RoleAndPermissionAction/RoleAndPermissionAction';
import { HitApi } from '../../Api/ApiHit';
import { addRole, updateRole, searchRole } from '../../constant/Constant';
import { RoleValidationSchema } from '../../validationscheema/RoleValidation';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import { CheckDropdownValue, SeperAdmiinPermission } from '../../constant/Options';
import { getButtonProps, getCategoryDisplayName, getErrorMsg, hasError } from '../../utils/utils';
import { AllPermissionList } from '../../redux/Reducers/RoleAndPermissionReducer/AllPermissions';
import { getElevateUser } from '../../storage/Storage';
import { CheckSupportPermission } from '../../redux/Reducers/RoleAndPermissionReducer/SupportPermission';

function AddRole({ editMode = false }) {
  const RoleReducer = useSelector((state) => state.RolesAndPermissionReducer);
  const ApiReducer = useSelector((state) => state.ApiReducer);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: urlId } = useParams();
  const loggedInPermission = getElevateUser()?.roleData?.permission;

  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionError, setPermissionError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoadingRoleData, setIsLoadingRoleData] = useState(false);
  const [originalRoleData, setOriginalRoleData] = useState(null);

  // Helper function to check if logged-in user has specific permission
  const hasLoggedInUserPermission = (categoryValue, permissionType, childIndex = null) => {
    if (!loggedInPermission || isSuperAdmin) return true;

    const userPermission = loggedInPermission.find(perm => perm.value === categoryValue);

    if (!userPermission) return false;

    // For child permissions
    if (childIndex !== null && userPermission.child) {
      const childPermission = userPermission.child[childIndex];
      if (!childPermission || !childPermission.permission?.[0]) return false;
      return childPermission.permission[0][permissionType] === true;
    }

    // For parent permissions
    if (!userPermission.permission?.[0]) return false;
    return userPermission.permission[0][permissionType] === true;
  };

  // Helper function to get available permission types for a category
  const getAvailablePermissionTypes = (categoryValue, childIndex = null) => {
    if (isSuperAdmin) return ['read', 'write', 'delete'];

    const availableTypes = [];

    ['read', 'write', 'delete'].forEach(type => {
      if (hasLoggedInUserPermission(categoryValue, type, childIndex)) {
        availableTypes.push(type);
      }
    });

    return availableTypes;
  };

  const hasSelectedPermissions = () => {
    return Object.values(selectedPermissions).some(value => value === true);
  };

  // Update permission error whenever selectedPermissions changes

  // Update permission error whenever selectedPermissions changes
  useEffect(() => {
    // Don't show permission error for SuperAdmin
    if (isSuperAdmin) {
      setPermissionError('');
      return;
    }

    if (Object.keys(selectedPermissions).length > 0) {
      if (!hasSelectedPermissions()) {
        setPermissionError('At least one permission must be selected *');
      } else {
        setPermissionError('');
      }
    }
  }, [selectedPermissions, isSuperAdmin]);
  // Initialize component on mount and cleanup on unmount
  useEffect(() => {
    // Clear previous form data when component mounts (important for add mode)
    if (!editMode && !urlId) {
      dispatch(setApiJson({}));
      dispatch(setApiErrorJson({}));
    }

    // Always initialize with AllPermissionList on mount if not already set
    if (!RoleReducer?.doc || RoleReducer?.doc?.length === 0) {
      setIsSuperAdmin(false)
      dispatch(setRolesAndPermission(AllPermissionList))
    }

    // Cleanup on unmount
    return () => {
      if (!editMode) {
        dispatch(setApiJson({}));
        dispatch(setApiErrorJson({}));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Set SuperAdmin or normal permissions based on roleType
  useEffect(() => {
    if (ApiReducer?.apiJson?.roleType === "SuperAdmin") {
      setIsSuperAdmin(true)
      setPermissionError('');
      const allPermsAcess = SeperAdmiinPermission()

      console.log("allPermsAcess", allPermsAcess);

      dispatch(setRolesAndPermission(allPermsAcess))
    }
    else {
      setIsSuperAdmin(false)
      dispatch(setRolesAndPermission(AllPermissionList))
    }
  }, [ApiReducer?.apiJson?.roleType, dispatch]);

  // Helper function to recreate JSON for edit
  const recreateJsonForEdit = (roleData, defaultPermissions) => {
    if (!roleData?.permission || !defaultPermissions) return defaultPermissions;

    return defaultPermissions.map(defaultItem => {
      const existingItem = roleData.permission.find(p => p.value === defaultItem.value);
      if (!existingItem) return defaultItem;

      return {
        ...defaultItem,
        permission: defaultItem.permission?.map(defaultPerm => {
          const existingPerm = existingItem.permission?.[0];
          return {
            ...defaultPerm,
            read: {
              ...defaultPerm.read,
              allowed: (existingPerm?.read || false) && hasLoggedInUserPermission(defaultItem.value, 'read')
            },
            write: {
              ...defaultPerm.write,
              allowed: (existingPerm?.write || false) && hasLoggedInUserPermission(defaultItem.value, 'write')
            },
            delete: {
              ...defaultPerm.delete,
              allowed: (existingPerm?.delete || false) && hasLoggedInUserPermission(defaultItem.value, 'delete')
            }
          };
        }),
        child: defaultItem.child?.map((defaultChild, childIndex) => {
          const existingChild = existingItem.child?.[childIndex];
          return {
            ...defaultChild,
            permission: defaultChild.permission?.map(defaultChildPerm => {
              const existingChildPerm = existingChild?.permission?.[0];
              return {
                ...defaultChildPerm,
                read: {
                  ...defaultChildPerm.read,
                  allowed: (existingChildPerm?.read || false) && hasLoggedInUserPermission(defaultItem.value, 'read', childIndex)
                },
                write: {
                  ...defaultChildPerm.write,
                  allowed: (existingChildPerm?.write || false) && hasLoggedInUserPermission(defaultItem.value, 'write', childIndex)
                },
                delete: {
                  ...defaultChildPerm.delete,
                  allowed: (existingChildPerm?.delete || false) && hasLoggedInUserPermission(defaultItem.value, 'delete', childIndex)
                }
              };
            })
          };
        })
      };
    });
  };

  // Load role data for editing
  useEffect(() => {
    if (editMode && urlId && ApiReducer?.apiJson?.roleType && !isLoadingRoleData) {
      loadRoleData(urlId);
    }
  }, [editMode, urlId, ApiReducer?.apiJson?.roleType]);

  const loadRoleData = async (roleId) => {
    setIsLoadingRoleData(true);
    try {
      const response = await HitApi({ page: 1, limit: 1, search: { _id: roleId } }, searchRole);

      if (response.statusCode === 200) {
        const roleData = response.data?.docs?.[0];

        const initialPermissions = {};
        const modifiedPermissions = recreateJsonForEdit(roleData, RoleReducer?.doc);

        roleData.permission?.forEach((item) => {
          const categoryValue = item.value;
          if (item.permission?.length > 0) {
            const perm = item.permission[0];
            // Only set if user has permission to manage these
            if (perm.read && hasLoggedInUserPermission(categoryValue, 'read')) {
              initialPermissions[`${categoryValue}_read`] = true;
            }
            if (perm.write && hasLoggedInUserPermission(categoryValue, 'write')) {
              initialPermissions[`${categoryValue}_write`] = true;
            }
            if (perm.delete && hasLoggedInUserPermission(categoryValue, 'delete')) {
              initialPermissions[`${categoryValue}_delete`] = true;
            }
          }

          item.child?.forEach((childItem, childIndex) => {
            if (childItem.permission?.length > 0) {
              const childPerm = childItem.permission[0];
              // Only set if user has permission to manage these
              if (childPerm.read && hasLoggedInUserPermission(categoryValue, 'read', childIndex)) {
                initialPermissions[`${categoryValue}_${childIndex}_read`] = true;
              }
              if (childPerm.write && hasLoggedInUserPermission(categoryValue, 'write', childIndex)) {
                initialPermissions[`${categoryValue}_${childIndex}_write`] = true;
              }
              if (childPerm.delete && hasLoggedInUserPermission(categoryValue, 'delete', childIndex)) {
                initialPermissions[`${categoryValue}_${childIndex}_delete`] = true;
              }
            }
          });
        });

        setSelectedPermissions(initialPermissions);
        setOriginalRoleData(roleData);
        dispatch(setRolesAndPermission(modifiedPermissions));
      } else {
        toast.error('Role not found');
        // navigate('/roles-and-permission');
      }
    } catch (error) {
      console.error("Error loading role data:", error);
      toast.error('Error loading role data. Please try again.');
      navigate('/roles-and-permission');
    } finally {
      setIsLoadingRoleData(false);
    }
  };

  // Helper function to construct final JSON
  const constructFinalJson = async (permissionsData) => {
    return new Promise((resolve) => {
      const allowedEndPoints = [];
      const permission = [];

      permissionsData?.forEach(item => {
        const permissionItem = { value: item.value, permission: [], child: [] };
        let hasAnyPermission = false;

        // Process parent permissions
        if (item.permission?.length > 0) {
          item.permission.forEach(perm => {
            if (perm.read?.allowed && perm.read?.url) allowedEndPoints.push(...perm.read.url);
            if (perm.write?.allowed && perm.write?.url) allowedEndPoints.push(...perm.write.url);
            if (perm.delete?.allowed && perm.delete?.url) allowedEndPoints.push(...perm.delete.url);

            const permObj = {
              read: perm.read?.allowed || false,
              write: perm.write?.allowed || false,
              delete: perm.delete?.allowed || false
            };

            // Check if any permission is true
            if (permObj.read || permObj.write || permObj.delete) {
              hasAnyPermission = true;
            }

            permissionItem.permission.push(permObj);
          });
        }

        // Process child permissions
        if (item.child?.length > 0) {
          item.child.forEach(childItem => {
            const childPermissionItem = { value: childItem.value, permission: [] };
            let childHasPermission = false;

            if (childItem.permission?.length > 0) {
              childItem.permission.forEach(childPerm => {
                if (childPerm.read?.allowed && childPerm.read?.url) allowedEndPoints.push(...childPerm.read.url);
                if (childPerm.write?.allowed && childPerm.write?.url) allowedEndPoints.push(...childPerm.write.url);
                if (childPerm.delete?.allowed && childPerm.delete?.url) allowedEndPoints.push(...childPerm.delete.url);

                const childPermObj = {
                  read: childPerm.read?.allowed || false,
                  write: childPerm.write?.allowed || false,
                  delete: childPerm.delete?.allowed || false
                };

                // Check if any child permission is true
                if (childPermObj.read || childPermObj.write || childPermObj.delete) {
                  childHasPermission = true;
                  hasAnyPermission = true; // Parent also has permission if child has
                }

                childPermissionItem.permission.push(childPermObj);
              });
            }

            // Only add child if it has at least one true permission
            if (childHasPermission) {
              permissionItem.child.push(childPermissionItem);
            }
          });
        }

        // Only add permission item if it has at least one true permission (parent or child)
        if (hasAnyPermission) {
          permission.push(permissionItem);
        }
      });

      resolve({
        allowedEndPoints: [...new Set(allowedEndPoints)],
        permission: permission
      });
    });
  };

  // Handle permission toggle
  const handlePermissionToggle = (categoryValue, permissionType, index, childIndex = null) => {
    // Check if logged-in user has permission to assign this
    if (!hasLoggedInUserPermission(categoryValue, permissionType, childIndex)) {
      toast.error(`You don't have permission to assign ${permissionType} access for ${getCategoryDisplayName(categoryValue)}`);
      return;
    }

    // Disable permission toggle during submission
    if (isSubmitting) return;

    const key = childIndex !== null ? `${categoryValue}_${childIndex}_${permissionType}` : `${categoryValue}_${permissionType}`;

    const newSelectedPermissions = { ...selectedPermissions, [key]: !selectedPermissions[key] };
    setSelectedPermissions(newSelectedPermissions);

    const json = RoleReducer?.doc?.map((item, itemIndex) => {
      if (itemIndex === index) {
        const updatedItem = {
          ...item,
          permission: item.permission?.map(perm => ({
            ...perm,
            read: { ...perm.read },
            write: { ...perm.write },
            delete: perm.delete ? { ...perm.delete } : perm.delete
          })),
          child: item.child?.map(childItem => ({
            ...childItem,
            permission: childItem.permission?.map(perm => ({
              ...perm,
              read: { ...perm.read },
              write: { ...perm.write },
              delete: perm.delete ? { ...perm.delete } : perm.delete
            }))
          }))
        };
        return updatedItem;
      }
      return item;
    });

    const indexedDoc = json?.[index];

    // Handle child permissions
    if (childIndex !== null && indexedDoc?.child?.[childIndex]?.permission?.[0]) {
      const parentPermission = indexedDoc.permission?.[0];
      const childPermission = indexedDoc.child[childIndex].permission[0];
      const currentPerms = childPermission[permissionType];

      if (currentPerms) {
        switch (permissionType) {
          case 'read':
            if (parentPermission?.read?.allowed) {
              currentPerms.allowed = !currentPerms.allowed;
              if (!currentPerms.allowed) {
                if (childPermission.write) childPermission.write.allowed = false;
                if (childPermission.delete) childPermission.delete.allowed = false;
                newSelectedPermissions[`${categoryValue}_${childIndex}_write`] = false;
                newSelectedPermissions[`${categoryValue}_${childIndex}_delete`] = false;
                setSelectedPermissions(newSelectedPermissions);
              }
            } else return;
            break;
          case 'write':
            if (parentPermission?.write?.allowed && childPermission?.read?.allowed) {
              currentPerms.allowed = !currentPerms.allowed;
              if (!currentPerms.allowed) {
                if (childPermission.delete) childPermission.delete.allowed = false;
                newSelectedPermissions[`${categoryValue}_${childIndex}_delete`] = false;
                setSelectedPermissions(newSelectedPermissions);
              }
            } else return;
            break;
          case 'delete':
            if (parentPermission?.delete?.allowed && childPermission?.read?.allowed && childPermission?.write?.allowed) {
              currentPerms.allowed = !currentPerms.allowed;
            } else return;
            break;
        }
      }
    }
    // Handle parent permissions
    else if (childIndex === null && indexedDoc?.permission?.[0]) {
      const permission = indexedDoc.permission[0];
      const currentPerms = permission[permissionType];

      if (currentPerms) {
        switch (permissionType) {
          case 'read':
            currentPerms.allowed = !currentPerms.allowed;
            if (!currentPerms.allowed) {
              if (permission.write) permission.write.allowed = false;
              if (permission.delete) permission.delete.allowed = false;

              indexedDoc.child?.forEach((childItem, cIndex) => {
                if (childItem.permission?.[0]) {
                  const childPerm = childItem.permission[0];
                  childPerm.read.allowed = false;
                  if (childPerm.write) childPerm.write.allowed = false;
                  if (childPerm.delete) childPerm.delete.allowed = false;

                  newSelectedPermissions[`${categoryValue}_${cIndex}_read`] = false;
                  newSelectedPermissions[`${categoryValue}_${cIndex}_write`] = false;
                  newSelectedPermissions[`${categoryValue}_${cIndex}_delete`] = false;
                }
              });

              newSelectedPermissions[`${categoryValue}_write`] = false;
              newSelectedPermissions[`${categoryValue}_delete`] = false;
              setSelectedPermissions(newSelectedPermissions);
            }
            break;
          case 'write':
            if (permission?.read?.allowed) {
              currentPerms.allowed = !currentPerms.allowed;
              if (!currentPerms.allowed) {
                if (permission.delete) permission.delete.allowed = false;

                indexedDoc.child?.forEach((childItem, cIndex) => {
                  if (childItem.permission?.[0]) {
                    const childPerm = childItem.permission[0];
                    if (childPerm.write) childPerm.write.allowed = false;
                    if (childPerm.delete) childPerm.delete.allowed = false;

                    newSelectedPermissions[`${categoryValue}_${cIndex}_write`] = false;
                    newSelectedPermissions[`${categoryValue}_${cIndex}_delete`] = false;
                  }
                });

                newSelectedPermissions[`${categoryValue}_delete`] = false;
                setSelectedPermissions(newSelectedPermissions);
              }
            } else return;
            break;
          case 'delete':
            if (permission?.read?.allowed && permission?.write?.allowed) {
              currentPerms.allowed = !currentPerms.allowed;
              if (!currentPerms.allowed) {
                indexedDoc.child?.forEach((childItem, cIndex) => {
                  if (childItem.permission?.[0]?.delete) {
                    childItem.permission[0].delete.allowed = false;
                    newSelectedPermissions[`${categoryValue}_${cIndex}_delete`] = false;
                  }
                });
                setSelectedPermissions(newSelectedPermissions);
              }
            } else return;
            break;
        }
      }
    }

    dispatch(setRolesAndPermission(json));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const roleName = ApiReducer?.apiJson?.role;

      if (!isSuperAdmin && !editMode && !hasSelectedPermissions()) {
        setPermissionError('At least one permission must be selected *');
        toast.error('Please select at least one permission');
        return;
      } else {
        setPermissionError('');
      }

      const validationErrors = await RoleValidationSchema(ApiReducer?.apiJson);
      if (validationErrors && Object.keys(validationErrors).length > 0) {
        dispatch(setApiErrorJson(validationErrors));
        toast.error('Please fix the validation errors');
        return;
      }

      setIsSubmitting(true);

      let finalJson;
      let endpointsToUse = [];
      let permissionsToUse = [];

      // For SuperAdmin, use all permissions from SeperAdmiinPermission
      if (isSuperAdmin) {
        finalJson = await constructFinalJson(SeperAdmiinPermission());
        endpointsToUse = finalJson?.allowedEndPoints || [];
        permissionsToUse = finalJson?.permission || [];
      } else {
        // For regular roles, construct from selected permissions
        finalJson = await constructFinalJson(RoleReducer?.doc);

        if ((finalJson && finalJson.allowedEndPoints && Array.isArray(finalJson.allowedEndPoints) && finalJson.allowedEndPoints.length > 0) || (editMode && finalJson)) {

          let endpointsToUse = finalJson?.allowedEndPoints || [];
          let permissionsToUse = finalJson?.permission || [];

          if (editMode && endpointsToUse.length === 0 && originalRoleData) {
            endpointsToUse = originalRoleData.allowedEndPoints || [];
            permissionsToUse = originalRoleData.permission || [];
          }

          const formData = {
            roleName,
            allowedEndPoints: endpointsToUse,
            permission: permissionsToUse,
            supportPermission: CheckSupportPermission(permissionsToUse),
            status: "active",
            roleType: ApiReducer?.apiJson?.roleType,

          };


          if (editMode && urlId) formData._id = urlId;




          const apiEndpoint = editMode ? updateRole : addRole;
          const response = await HitApi(formData, apiEndpoint);

          if (response?.statusCode === 200 ||response?.statusCode === 201) {
            toast.success(editMode ? 'Role updated successfully!' : 'Role created successfully!');
            navigate('/roles-and-permission');
            return;
          } else {
            toast.error(response?.message || 'Operation failed');
          }
        } else {
          setPermissionError('Please select at least one permission *');
          toast.error('Please select at least one permission');
          setIsSubmitting(false);
          return;
        }
      }

      const formData = {
        roleName,
        allowedEndPoints: endpointsToUse,
        permission: permissionsToUse,
        status: "active",
        roleType: ApiReducer?.apiJson?.roleType
      };


      if (editMode && urlId) formData._id = urlId;

      const apiEndpoint = editMode ? updateRole : addRole;
      const response = await HitApi(formData, apiEndpoint);

      if (response?.message === "Role created successfully" || response?.message === "Role updated successfully" || response?.success) {
        toast.success(editMode ? 'Role updated successfully!' : 'Role created successfully!');
        navigate('/roles-and-permission');
        return;
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      console.error(`Error ${editMode ? 'updating' : 'creating'} role:`, error);
      toast.error(`Error ${editMode ? 'updating' : 'creating'} role. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render permission buttons with permission-based visibility
  const renderPermissionButtons = (perm, categoryValue, index, childIndex = null) => {
    const availableTypes = getAvailablePermissionTypes(categoryValue, childIndex);

    // If no permissions available for this category, don't render anything
    if (availableTypes.length === 0) {
      return (
        <div className='flex items-center space-x-2 bg-red-50 text-red-600 px-3 py-1 rounded-md'>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636 5.636 18.364" />
          </svg>
          <span className='text-sm font-medium'>No Access</span>
        </div>
      );
    }

    return (
      <div className='flex space-x-3'>
        {availableTypes.map(type => (
          <Button
            key={type}
            onClick={() => handlePermissionToggle(categoryValue, type, index, childIndex)}
            size="sm"
            {...getButtonProps(categoryValue, type, perm[type]?.allowed, index, childIndex, selectedPermissions)}
          >
            <span className='flex items-center space-x-2'>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {type === 'read' && <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>}
                {type === 'write' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                {type === 'delete' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />}
              </svg>
              <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            </span>
          </Button>
        ))}
      </div>
    );
  };

  // Show loading skeleton while role data is being loaded
  if (isLoadingRoleData) {
    return (
      <div className='p-5'>
        <PageHeader
          title={editMode ? 'Edit Role' : 'Add New Role'}
          description={editMode ? 'Update role permissions and settings' : 'Create a new user role and assign permissions'}
        />
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/8 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className='p-5'>
      <PageHeader
        title={editMode ? 'Edit Role' : 'Add New Role'}
        description={editMode ? 'Update role permissions and settings' : 'Create a new user role and assign permissions'}
      />

      <div className='bg-white rounded-xl border border-gray-200 shadow-sm p-6 mt-6'>
        <div className='flex gap-4'>
          <AppInput
            title="Role Name"
            placeholder="Type role name here"
            name="role"
            error={!ApiReducer?.apiJson?.role}
            disabled={isSubmitting}
          />

          <SearchableSelect
            title="Role Type"
            name="roleType"
            options={CheckDropdownValue()}
            important={true}
            error={hasError('roleType', ApiReducer)}
            errormsg={getErrorMsg('roleType', ApiReducer)}
            placeholder="Select a role type"
          />
        </div>
      </div>

      <div className='mt-8'>
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center'>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>Access Permissions</h2>
              <p className='text-sm text-gray-600'>Configure what this role can access and modify</p>
            </div>
          </div>
          {isSubmitting && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}
        </div>

        {/* Permission Error Message */}
        {permissionError && (
          <div className='mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-md'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm font-medium text-red-800'>
                  {permissionError}
                </p>
                <p className='text-xs text-red-600 mt-1'>
                  Please select at least one permission from the categories below to continue.
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin ? (
          <div className='bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 text-center'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg'>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className='text-2xl font-bold text-gray-900 mb-2'>Super Admin Access</h3>
                <p className='text-lg text-gray-600 font-medium'>All permissions have been granted to this user</p>
                <p className='text-sm text-gray-500 mt-2'>This role has unrestricted access to all system features and functionalities</p>
              </div>
              <div className='flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full'>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className='font-semibold text-sm'>Full Access Enabled</span>
              </div>
            </div>
          </div>
        ) : (
          <div className='space-y-2'>
            {RoleReducer?.doc && Array.isArray(RoleReducer.doc) && RoleReducer.doc.length > 0 ? RoleReducer.doc.map((item, index) => {
              // Check if user has any permissions for this category
              const hasAnyPermission = getAvailablePermissionTypes(item.value).length > 0;

              const hasAnyChildPermission = item.child?.some(child =>
                getAvailablePermissionTypes(item.value, item.child.indexOf(child)).length > 0
              );

              // If user doesn't have any permission for this category and its children, don't show it
              if (!hasAnyPermission && !hasAnyChildPermission) {
                return null;
              }

              return (
                <div key={index} className={`bg-white rounded-xl border-gray-200 border hover:shadow-md transition-shadow duration-200 ${isSubmitting ? 'opacity-75' : ''}`}>
                  <div className='p-6'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
                          <span className='text-white font-bold text-sm'>

                            {getCategoryDisplayName(item.value).charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            {getCategoryDisplayName(item.value)}
                          </h3>
                          <p className='text-sm text-gray-500'>
                            Manage {getCategoryDisplayName(item.value).toLowerCase()} permissions
                          </p>
                        </div>
                      </div>

                      {item.permission?.length > 0 && (
                        <div className='flex space-x-3'>
                          {item.permission.map((perm, permIndex) => (
                            <div key={permIndex}>
                              {renderPermissionButtons(perm, item.value, index)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {item.child?.length > 0 && (
                    <div className='border-t border-gray-100'>
                      {item.child.map((childItem, childIndex) => {
                        // Check if user has any permissions for this child
                        const hasChildPermission = getAvailablePermissionTypes(item.value, childIndex).length > 0;

                        // If no permissions, don't show this child
                        if (!hasChildPermission) {
                          return null;
                        }

                        return (
                          <div key={childIndex} className='p-6 border-b border-gray-50 last:border-b-0'>
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center space-x-3 ml-8'>
                                <div className='w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center'>
                                  <span className='text-white font-bold text-xs'>
                                    {getCategoryDisplayName(childItem.value).charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <h4 className='text-md font-medium text-gray-800'>
                                    {getCategoryDisplayName(childItem.value)}
                                  </h4>
                                  <p className='text-xs text-gray-500'>
                                    Manage {getCategoryDisplayName(childItem.value).toLowerCase()} permissions
                                  </p>
                                </div>
                              </div>

                              {childItem.permission?.length > 0 && (
                                <div className='flex space-x-3'>
                                  {childItem.permission.map((childPerm, childPermIndex) => (
                                    <div key={childPermIndex}>
                                      {renderPermissionButtons(childPerm, item.value, index, childIndex)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className='bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center'>
                <p className='text-yellow-800 text-lg'>Loading permissions...</p>
                <p className='text-yellow-600 text-sm mt-2'>If this persists, please refresh the page.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className='mt-5 flex justify-end'>
        <AppButton
          buttontext={isSubmitting ? "Processing..." : (editMode ? "Update Role" : "Create Role")}
          onClick={handleSubmit}
          disabled={isSubmitting}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}

export default AddRole;
