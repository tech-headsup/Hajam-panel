import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { deleteUser, searchUser } from '../../constant/Constant';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import { getElevateUser, getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import { hasPermission } from '../../utils/permissionUtils';

function UserMaster() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);
    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const getUnit = getSelectedUnit();

    // Get user permissions using the utils
    const canEditUsers = hasPermission('user', 'write');
    const canReadUsers = hasPermission('user', 'read');
    const canDeleteUsers = hasPermission('user', 'delete');
    const canAddUsers = hasPermission('user', 'write');

    console.log({ canEditUsers, canReadUsers, canDeleteUsers, canAddUsers });

    useEffect(() => {
        // Only fetch users if user has read permission
        if (canReadUsers) {
            getUsers();
        }
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit, canReadUsers]);

    const getUsers = (searchKey, searchValue) => {
        if (!canReadUsers) {
            toast.error('You do not have permission to view users');
            return;
        }

        setIsSearching(true);

        const searchObj = {
            unitIds: getSelectedUnit()?._id
        };
        if (getElevateUser()?.roleData?.roleType !== "SuperAdmin") {

            searchObj.createdBy = getElevateUser()?._id;
        }

        if (searchKey && searchValue) {

            searchObj[searchKey] = searchValue;
        }

        const json = {
            page: TableDataReducer.pagination.page,
            limit: TableDataReducer.pagination.limit,
            search: searchObj
        };

        HitApi(json, searchUser).then((res) => {
            if (res?.statusCode === 200) {
                dispatch(setApiJson(res?.data?.docs));

                const paginationData = {
                    total: res?.data?.totalDocs || 0,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit,
                };

                dispatch(setPagination(paginationData));
            }
        }).catch(error => {
            toast.error("Error fetching users. Please try again.");
        }).finally(() => {
            setIsSearching(false);
        });
    };



    const handleEdit = (row) => {
        if (!canEditUsers) {
            toast.error('You do not have permission to edit users');
            return;
        }

        navigate(`/users/edit/${row._id}`);
    };

    const handleDelete = (row) => {
        if (!canDeleteUsers) {
            toast.error('You do not have permission to delete users');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
            const json = {
                _id: row?._id
            };
            HitApi(json, deleteUser).then((res) => {
                if (res?.message === 'User deleted successfully') {
                    toast.success('User deleted successfully!');
                    getUsers();
                } else {
                    toast.error('Failed to delete user. Please try again.');
                }
            }).catch(error => {
                toast.error("Error deleting user. Please try again.");
            });
        }
    };



    const baseIndex = (TableDataReducer.pagination.page - 1) * TableDataReducer.pagination.limit;

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
            title: "Name",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center">
                    {row.img ? (
                        <img
                            src={row.img}
                            alt={value}
                            className="w-8 h-8 rounded-full mr-2 object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            <span className="text-sm font-medium text-gray-600">
                                {value && value.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <span>{value || 'N/A'}</span>
                </div>
            )
        },
        {
            title: "Username",
            key: "username",
            render: (value) => value || 'N/A'
        },
        {
            title: "Email",
            key: "email",
            render: (value) => value || 'N/A'
        },
        {
            title: "Phone Number",
            key: "phoneNumber",
            render: (value, row) => {
                const phone = value || row.contact;
                return phone || 'N/A';
            }
        },
        {
            title: "Gender",
            key: "gender",
            render: (value) => value || 'N/A'
        },
        {
            title: "User Type",
            key: "userType",
            render: (value) => value || 'N/A'
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (value, row) => {
                // Check if user has any action permissions
                const hasAnyPermission = canEditUsers || canDeleteUsers;

                if (!hasAnyPermission) {
                    return (
                        <div className="flex justify-center">
                            <span className="text-sm text-gray-400">No actions available</span>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center space-x-2">
                        {canEditUsers && (
                            <EditButton
                                onEdit={() => handleEdit(row)}
                                itemName="user"
                                tooltip="Edit User"
                            />
                        )}

                        {canDeleteUsers && (
                            <DeleteButton
                                onDelete={() => handleDelete(row)}
                                itemName="user"
                                tooltip="Delete User"
                            />
                        )}
                    </div>
                );
            }
        }
    ];

    // Only show actions column if user has any action permissions
    const shouldShowActionsColumn = canEditUsers || canDeleteUsers;
    const filteredHeaders = shouldShowActionsColumn
        ? tableHeaders
        : tableHeaders.filter(header => header.key !== 'actions');

    const handleRowClick = (row) => {
        // Navigate to user details page if needed
        // navigate(`/user-details/${row._id}`);
    };

    const options = [
        { label: 'Name', value: 'name' },
        { label: 'Username', value: 'username' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phoneNumber' },
    ];

    const handleSearch = () => {
        if (!canReadUsers) {
            toast.error('You do not have permission to search users');
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
        getUsers(optionSelect, valueSearched.trim());
    };

    const handleClearSearch = () => {
        if (!canReadUsers) {
            toast.error('You do not have permission to access users');
            return;
        }

        setOptionSelect('');
        setValueSearched('');
        getUsers();
    };

    // Show access denied message if user doesn't have read permission
    if (!canReadUsers) {
        return (
            <div className="p-5">
                <PageHeader
                    title={'User Management'}
                    description={'View and manage system users and their accounts'}
                />
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Access Denied</h3>
                        <p className="text-gray-600">You don't have permission to view users.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5">
            <PageHeader
                title={'User Management'}
                description={'View and manage system users and their accounts'}
            />

            <div>
                <AppTable
                    TH={filteredHeaders}
                    TD={ApiReducer.apiJson || []}
                    onRowClick={handleRowClick}
                    isLoading={!ApiReducer.apiJson?.length || isSearching}
                    emptyMessage="No users found"
                    buttonText={canAddUsers ? "Add User" : undefined}
                    navigateTo={canAddUsers ? "/users/add" : undefined}
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

export default UserMaster;
