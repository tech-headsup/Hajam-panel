import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { deleteClient, searchClient } from '../../constant/Constant';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import { hasPermission } from '../../utils/permissionUtils';

function ClientMaster() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);
    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const canEditClients = hasPermission('client', 'write');
    const canReadClients = hasPermission('client', 'read');
    const canDeleteClients = hasPermission('client', 'delete');
    const canAddClients = hasPermission('client', 'write');

    useEffect(() => {
        if (canReadClients) {
            fetchClients();
        }
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit, canReadClients]);

    const fetchClients = (searchKey, searchValue) => {
        if (!canReadClients) {
            toast.error('You do not have permission to view clients');
            return;
        }

        setIsSearching(true);

        const searchObj = {};

        if (searchKey && searchValue) {
            searchObj[searchKey] = searchValue;
        }

        const json = {
            page: TableDataReducer.pagination.page,
            limit: TableDataReducer.pagination.limit,
            search: searchObj
        };

        HitApi(json, searchClient).then((res) => {
            if (res?.statusCode === 200) {
                const clientData = Array.isArray(res?.data?.docs) ? res?.data?.docs : [];
                dispatch(setApiJson(clientData));

                const paginationData = {
                    total: res?.data?.totalDocs || 0,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit
                };

                dispatch(setPagination(paginationData));
            } else {
                dispatch(setApiJson([]));
                toast.error('Failed to fetch clients. Please try again.');
            }
        }).catch(error => {
            dispatch(setApiJson([]));
            toast.error('Error fetching clients. Please try again.');
        }).finally(() => {
            setIsSearching(false);
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return '₹0';
        return `₹${Number(amount).toFixed(2)}`;
    };

    const handleEdit = (row) => {
        if (!canEditClients) {
            toast.error('You do not have permission to edit clients');
            return;
        }
        navigate(`/client/edit/${row._id}`);
    };

    const handleDelete = (row) => {
        if (!canDeleteClients) {
            toast.error('You do not have permission to delete clients');
            return;
        }
        setDeleteTarget(row);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        const json = { _id: deleteTarget._id };
        HitApi(json, deleteClient).then((res) => {
            if (res?.statusCode === 200) {
                toast.success('Client deleted successfully!');
                fetchClients();
            } else {
                toast.error('Failed to delete client. Please try again.');
            }
        }).catch(error => {
            toast.error('Error occurred while deleting client. Please try again.');
        });
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
    };

    const handleSearch = () => {
        if (!canReadClients) {
            toast.error('You do not have permission to search clients');
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
        fetchClients(optionSelect, valueSearched.trim());
    };

    const options = [
        { label: 'Client Name', value: 'name' },
        { label: 'Email', value: 'email' },
        { label: 'Phone Number', value: 'phoneNumber' },
        { label: 'Address', value: 'address' },
        { label: 'Gender', value: 'gender' },
    ];

    const renderGender = (gender) => {
        if (!gender) return 'N/A';

        const isMale = gender.toLowerCase() === 'male';
        const bgColor = isMale ? "bg-blue-100" : "bg-pink-100";
        const textColor = isMale ? "text-blue-800" : "text-pink-800";

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {gender}
            </span>
        );
    };

    const renderUnpaidStatus = (unpaidAmt) => {
        const amount = Number(unpaidAmt) || 0;
        if (amount === 0) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Clear
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {formatCurrency(amount)}
            </span>
        );
    };

    const renderUnitInfo = (unitIds) => {
        if (!unitIds) {
            return (
                <div className="text-start">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        No Unit
                    </span>
                </div>
            );
        }

        return (
            <div className="text-start">
                <div className="font-medium text-gray-900 text-sm">
                    {unitIds.unitName || 'N/A'}
                </div>
                <div className="text-xs text-gray-500">
                    {unitIds.unitCode || 'N/A'}
                </div>
            </div>
        );
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
            title: "Client Details",
            key: "name",
            render: (value, row) => (
                <div className="flex items-center">
                    {row.img ? (
                        <img
                            src={row.img}
                            alt={value}
                            className="w-10 h-10 rounded-full mr-3 object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-600">
                                {value && value.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    )}
                    <div>
                        <div className="font-medium text-gray-900">{value || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{row.email || 'No email'}</div>
                    </div>
                </div>
            )
        },
        {
            title: "Contact",
            key: "phoneNumber",
            render: (value, row) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">{value || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{renderGender(row.gender)}</div>
                </div>
            )
        },
        {
            title: "Unit",
            key: "unitIds",
            align: "center",
            render: (_, row) => renderUnitInfo(row.unitIds)
        },
        {
            title: "Financial Status",
            key: "financial",
            render: (_, row) => (
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Unpaid:</span>
                        {renderUnpaidStatus(row.unpaidAmt)}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">E-wallet:</span>
                        <span className="text-xs font-medium">{formatCurrency(row.ewalletAmt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Points:</span>
                        <span className="text-xs font-medium">{row.points || 0}</span>
                    </div>
                </div>
            )
        },
        {
            title: "Visit History",
            key: "visits",
            render: (_, row) => (
                <div>
                    <div className="text-sm font-medium text-gray-900">
                        Total: {row.totalVisit || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                        Last: {formatDate(row.lastVisit)}
                    </div>
                </div>
            )
        },
        {
            title: "Address",
            key: "address",
            render: (value) => (
                <div className="max-w-32">
                    <span className="text-sm text-gray-900 truncate" title={value}>
                        {value || 'N/A'}
                    </span>
                </div>
            )
        },
        {
            title: "Actions",
            key: "actions",
            align: "center",
            render: (value, row) => {
                const hasAnyPermission = canEditClients || canDeleteClients;

                if (!hasAnyPermission) {
                    return (
                        <div className="flex justify-center">
                            <span className="text-sm text-gray-400">No actions available</span>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center space-x-2">
                        {canEditClients && (
                            <EditButton
                                onEdit={() => handleEdit(row)}
                                itemName="client"
                                tooltip="Edit Client"
                            />
                        )}

                        {canDeleteClients && (
                            <DeleteButton
                                onDelete={() => handleDelete(row)}
                                itemName="client"
                                tooltip="Delete Client"
                            />
                        )}
                    </div>
                );
            }
        }
    ];

    const shouldShowActionsColumn = canEditClients || canDeleteClients;
    const filteredHeaders = shouldShowActionsColumn
        ? tableHeaders
        : tableHeaders.filter(header => header.key !== 'actions');

    const handleClearSearch = () => {
        if (!canReadClients) {
            toast.error('You do not have permission to access clients');
            return;
        }

        setOptionSelect('');
        setValueSearched('');
        fetchClients();
    };

    if (!canReadClients) {
        return (
            <div className="p-5">
                <PageHeader
                    title={'Client Management'}
                    description={'View and manage system clients and their accounts'}
                />
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Access Denied</h3>
                        <p className="text-gray-600">You don't have permission to view clients.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5">
            <PageHeader
                title={'Client Management'}
                description={'View and manage system clients and their accounts'}
            />

            <AppTable
                TH={filteredHeaders}
                TD={Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : []}
                isLoading={!Array.isArray(ApiReducer.apiJson) || ApiReducer.apiJson.length === 0 || isSearching}
                emptyMessage="No clients found"
                buttonText={canAddClients ? "Add Client" : undefined}
                navigateTo={canAddClients ? "/client/add" : undefined}
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

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-80 text-center">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Client</h3>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete {deleteTarget?.name}?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClientMaster;
