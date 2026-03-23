import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { searchRole, deleteRole, searchUser } from '../../constant/Constant';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import { CheckDropdownValue, getUserType, userTypeOptions } from '../../constant/Options';
import { hasPermission, getActionPermissions } from '../../utils/permissionUtils';

function RoleMaster() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);
    const RoleReducer = useSelector((state) => state.RolesAndPermissionReducer);

    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Get role permissions using the utils
    const canReadRoles = hasPermission('rolesAndPermissions', 'read');
    const canEditRoles = hasPermission('rolesAndPermissions', 'write');
    const canDeleteRoles = hasPermission('rolesAndPermissions', 'delete');
    const canAddRoles = hasPermission('rolesAndPermissions', 'write');

    console.log({ canReadRoles, canEditRoles, canDeleteRoles, canAddRoles });

    useEffect(() => {
        // Only fetch roles if user has read permission
        if (canReadRoles) {
            fetchRole();
        }
        console.log("getuser type", getUserType('Staff'));
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit, canReadRoles]);

    const fetchRole = (searchKey, searchValue) => {
        const roleTypeOptions = CheckDropdownValue();

        if (!canReadRoles) {
            toast.error('You do not have permission to view roles');
            return;
        }

        setIsSearching(true);

        const searchObj = {
            roleType: roleTypeOptions.map(option => option.value)
        };

        // Only add search key/value if both are provided
        if (searchKey && searchValue) {
            searchObj[searchKey] = searchValue;
        }

        const json = {
            page: TableDataReducer.pagination.page,
            limit: TableDataReducer.pagination.limit,
            search: searchObj
        };



        HitApi(json, searchRole).then((res) => {
            if (res?.statusCode === 200) {
                // Ensure we always set an array
                const roleData = Array.isArray(res?.data?.docs) ? res?.data?.docs : [];
                dispatch(setApiJson(roleData));
                console.log("res____",res);
                // Update pagination data in Redux
                const paginationData = {
                    total: res?.data?.totalDocs || 0,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit
                };

                dispatch(setPagination(paginationData));
            } else {
                dispatch(setApiJson([]));
                toast.error('Failed to fetch roles. Please try again.');
            }
        }).catch(error => {
            console.error("Error fetching roles:", error);
            dispatch(setApiJson([]));
            toast.error('Error fetching roles. Please try again.');
        }).finally(() => {
            setIsSearching(false);
        });
    };

    // Search functionality
    const handleSearch = () => {
        if (!canReadRoles) {
            toast.error('You do not have permission to search roles');
            return;
        }

        if (!optionSelect) {
            toast.error('Please select a search option');
            return;
        }
        if (!valueSearched || valueSearched.trim() === '') {
            toast.error('Please enter a search value');
            return;
        }
        fetchRole(optionSelect, valueSearched.trim());
    };

    // Clear search functionality
    const handleClearSearch = () => {
        if (!canReadRoles) {
            toast.error('You do not have permission to access roles');
            return;
        }

        setOptionSelect('');
        setValueSearched('');
        fetchRole();
    };

    // Search options based on table keys
    const options = [
        { label: 'Role Name', value: 'roleName' },
        { label: 'Status', value: 'status' },
    ];

    // Handle role actions with permission checks
    const handleEdit = (row) => {
        if (!canEditRoles) {
            toast.error('You do not have permission to edit roles');
            return;
        }

        navigate(`/roles-and-permission/edit/${row._id}`);
    };




    const handleDelete = (row) => {
        if (!canDeleteRoles) {
            toast.error('You do not have permission to delete roles');
            return;
        }

        // First, check if role is assigned to any users
        const searchPayload = {
            page: 1,
            limit: 1,
            search: {
                roleId: row?._id
            }

        }

        HitApi(searchPayload, searchUser).then((searchRes) => {
            // Check if the response has data (users assigned to this role)
            if (searchRes?.data && searchRes.data.length > 0) {
                // Role is assigned to users, prevent deletion
                toast.error('This role is assigned to users, you can\'t delete it');
                return;
            }

            // No users assigned to this role, proceed with deletion
            const deletePayload = {
                _id: row?._id
            };

            HitApi(deletePayload, deleteRole).then((deleteRes) => {
                if (deleteRes?.statusCode === 200) {
                    toast.success('Role deleted successfully!');
                    fetchRole();
                } else {
                    toast.error(deleteRes?.message || 'Failed to delete role. Please try again.');
                }
            }).catch(error => {
                console.error("Error deleting role:", error);
                toast.error('Error occurred while deleting role. Please try again.');
            });

        }).catch(error => {
            console.error("Error checking role assignment:", error);
            toast.error('Error occurred while checking role assignment. Please try again.');
        });
    };
    const renderStatus = (status) => {
        if (status === undefined || status === null) return null;

        const isActive = status === "active";
        const bgColor = isActive ? "bg-green-100" : "bg-red-100";
        const textColor = isActive ? "text-green-800" : "text-red-800";
        const label = isActive ? "Active" : "Inactive";

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {label}
            </span>
        );
    };

    // Render permissions summary
    const renderPermissions = (permissions) => {
        if (!permissions || !Array.isArray(permissions)) return 'N/A';

        const activePermissions = permissions.filter(perm => {
            const hasReadAccess = perm.permission?.[0]?.read;
            const hasWriteAccess = perm.permission?.[0]?.write;
            const hasDeleteAccess = perm.permission?.[0]?.delete;
            return hasReadAccess || hasWriteAccess || hasDeleteAccess;
        });

        return (
            <div className="flex flex-wrap gap-1">
                {activePermissions.map((perm, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {perm.value}
                    </span>
                ))}
                {activePermissions.length === 0 && (
                    <span className="text-gray-500 text-xs">No permissions</span>
                )}
            </div>
        );
    };

    // Render allowed endpoints summary
    const renderEndpoints = (endpoints) => {
        if (!endpoints || !Array.isArray(endpoints)) return 'N/A';

        if (endpoints.length === 0) return 'No endpoints';

        return (
            <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">{endpoints.length} endpoints</span>
                <div className="text-xs text-gray-600">
                    {endpoints.slice(0, 2).map((endpoint, index) => (
                        <div key={index}>{endpoint}</div>
                    ))}
                    {endpoints.length > 2 && (
                        <div>... and {endpoints.length - 2} more</div>
                    )}
                </div>
            </div>
        );
    };

    // Get base index for serial numbers
    const baseIndex = (TableDataReducer.pagination.page - 1) * TableDataReducer.pagination.limit;

    // Define table headers
    const tableHeaders = [
        {
            title: "S.No",
            key: "serialNumber",
            width: "60px",
            align: "center",
            render: (_, row, index) => {
                const serialNumber = baseIndex + index + 1;
                return (
                    <div className="text-center">
                        <span className="text-sm font-medium text-gray-900">{serialNumber}</span>
                    </div>
                );
            }
        },
        {
            title: "Role Name",
            key: "roleName",
            render: (value) => (
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center mr-2">
                        <span className="text-sm font-medium text-purple-600">
                            {value && value.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <span className="font-medium">{value || 'N/A'}</span>
                </div>
            )
        },
        {
            title: "Permissions",
            key: "permission",
            render: renderPermissions
        },
        {
            title: "Allowed Endpoints",
            key: "allowedEndPoints",
            render: renderEndpoints
        },
        {
            title: "Role Type",
            key: "roleType",
            render: (value) => (
                <span className="text-gray-700 font-medium">{value || 'N/A'}</span>
            )
        },
        {
            title: "Status",
            key: "status",
            render: renderStatus
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (value, row) => {
                // Check if user has any action permissions
                const hasAnyPermission = canEditRoles || canDeleteRoles;

                if (!hasAnyPermission) {
                    return (
                        <div className="flex justify-center">
                            <span className="text-sm text-gray-400">No actions available</span>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center space-x-2">
                        {canEditRoles && (
                            <EditButton
                                onEdit={() => handleEdit(row)}
                                itemName="role"
                                tooltip="Edit Role"
                            />
                        )}

                        {canDeleteRoles && (
                            <DeleteButton
                                onDelete={() => handleDelete(row)}
                                itemName="role"
                                tooltip="Delete Role"
                            />
                        )}
                    </div>
                );
            }
        }
    ];

    // Only show actions column if user has any action permissions
    const shouldShowActionsColumn = canEditRoles || canDeleteRoles;
    const filteredHeaders = shouldShowActionsColumn
        ? tableHeaders
        : tableHeaders.filter(header => header.key !== 'actions');

    // Handle row click to view role details
    const handleRowClick = (row) => {
        // Navigate to role details page if needed
        // navigate(`/role-details/${row._id}`);
    };

    // Show access denied message if user doesn't have read permission
    if (!canReadRoles) {
        return (
            <div className="p-5">
                <PageHeader
                    title={'Role Management'}
                    description={'View and manage user roles and permissions'}
                />
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Access Denied</h3>
                        <p className="text-gray-600">You don't have permission to view roles.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='p-5'>
            <PageHeader
                title={'Role Management'}
                description={'View and manage user roles and permissions'}
            />

            <div>
                <AppTable
                    TH={filteredHeaders}
                    TD={Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : []}
                    onRowClick={handleRowClick}
                    isLoading={!Array.isArray(ApiReducer.apiJson) || ApiReducer.apiJson.length === 0 || isSearching}
                    emptyMessage="No roles found"
                    buttonText={canAddRoles ? "Add Role" : undefined}
                    navigateTo={canAddRoles ? "/roles-and-permission/add" : undefined}
                    TableSearch={
                        <TableSearch
                            options={options}
                            onClick={handleSearch}
                            optionSelect={optionSelect}
                            setOptionSelect={setOptionSelect}
                            setValueSearched={setValueSearched}
                            valueSearched={valueSearched}
                            onClear={handleClearSearch}
                        />
                    }
                />


            </div>
        </div>
    );
}

export default RoleMaster;
