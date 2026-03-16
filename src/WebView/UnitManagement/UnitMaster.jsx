import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { deleteUnit, searchUnit } from '../../constant/Constant';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import { hasPermission } from '../../utils/permissionUtils';
import AppTable from '../../components/AppTable/AppTable';

function UnitMaster() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);

    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const canEditUnit = hasPermission('unit', 'write');
    const canReadUnit = hasPermission('unit', 'read');
    const canDeleteUnit = hasPermission('unit', 'delete');
    const canAddUnit = hasPermission('unit', 'write');

    useEffect(() => {
        if (canReadUnit) {
            fetchUnit();
        }
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit, canReadUnit]);

    const fetchUnit = (searchKey, searchValue) => {
        if (!canReadUnit) {
            toast.error('You do not have permission to view units');
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

        HitApi(json, searchUnit).then((res) => {
            if (res?.statusCode === 200) {
                const unitData = Array.isArray(res?.data?.docs) ? res?.data?.docs : [];
                dispatch(setApiJson(unitData));

                const paginationData = {
                    total: res?.data?.totalDocs || 0,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit
                };

                dispatch(setPagination(paginationData));
            } else {
                dispatch(setApiJson([]));
                toast.error('Failed to fetch units. Please try again.');
            }
        }).catch(error => {
            dispatch(setApiJson([]));
            toast.error('Error fetching units. Please try again.');
        }).finally(() => {
            setIsSearching(false);
        });
    };

    const handleSearch = () => {
        if (!optionSelect) {
            toast.error('Please select a search option');
            return;
        }
        if (!valueSearched || valueSearched.trim() === '') {
            toast.error('Please enter a search value');
            return;
        }
        fetchUnit(optionSelect, valueSearched.trim());
    };

    const handleClearSearch = () => {
        setOptionSelect('');
        setValueSearched('');
        fetchUnit();
    };

    const options = [
        { label: 'Unit Name', value: 'unitName' },
        { label: 'Unit Code', value: 'unitCode' },
        { label: 'Address', value: 'address' },
        { label: 'Status', value: 'status' },
    ];

    const handleEdit = (row) => {
        if (!canEditUnit) {
            toast.error('You do not have permission to edit units');
            return;
        }
        navigate(`/unit/edit/${row._id}`);
    };

    const handleDelete = (row) => {
        if (!canDeleteUnit) {
            toast.error('You do not have permission to delete units');
            return;
        }

        if (window.confirm(`Are you sure you want to delete unit "${row.unitName}"?`)) {
            const deletePayload = { _id: row?._id };

            HitApi(deletePayload, deleteUnit).then((res) => {
                if (res?.statusCode === 200) {
                    toast.success('Unit deleted successfully!');
                    fetchUnit();
                } else {
                    toast.error(res?.message || 'Failed to delete unit.');
                }
            }).catch(error => {
                toast.error('Error occurred while deleting unit.');
            });
        }
    };

    const renderStatus = (status) => {
        if (status === undefined || status === null) return null;
        const isActive = status === "Active";
        const bgColor = isActive ? "bg-green-100" : "bg-red-100";
        const textColor = isActive ? "text-green-800" : "text-red-800";
        const label = isActive ? "Active" : "Inactive";

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {label}
            </span>
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
            title: "Unit Name",
            key: "unitName",
            render: (value) => (
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center mr-2">
                        <span className="text-sm font-medium text-blue-600">
                            {value && value.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <span className="font-medium">{value || 'N/A'}</span>
                </div>
            )
        },
        {
            title: "Unit Code",
            key: "unitCode",
            render: (value) => (
                <span className="text-gray-700 font-medium">{value || 'N/A'}</span>
            )
        },
        {
            title: "Address",
            key: "address",
            render: (value) => (
                <span className="text-gray-700">{value || 'N/A'}</span>
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
                const hasAnyPermission = canEditUnit || canDeleteUnit;

                if (!hasAnyPermission) {
                    return (
                        <div className="flex justify-center">
                            <span className="text-sm text-gray-400">No actions available</span>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center space-x-2">
                        {canEditUnit && (
                            <EditButton
                                onEdit={() => handleEdit(row)}
                                itemName="unit"
                                tooltip="Edit Unit"
                            />
                        )}
                        {canDeleteUnit && (
                            <DeleteButton
                                onDelete={() => handleDelete(row)}
                                itemName="unit"
                                tooltip="Delete Unit"
                            />
                        )}
                    </div>
                );
            }
        }
    ];

    const shouldShowActionsColumn = canEditUnit || canDeleteUnit;
    const filteredHeaders = shouldShowActionsColumn
        ? tableHeaders
        : tableHeaders.filter(header => header.key !== 'actions');

    if (!canReadUnit) {
        return (
            <div className="p-5">
                <PageHeader
                    title={'Unit Management'}
                    description={'View and manage organizational units'}
                />
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Access Denied</h3>
                        <p className="text-gray-600">You don't have permission to view units.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='p-5'>
            <PageHeader
                title={'Unit Management'}
                description={'View and manage organizational units'}
            />

            <div>
                <AppTable
                    TH={filteredHeaders}
                    TD={Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : []}
                    isLoading={!Array.isArray(ApiReducer.apiJson) || ApiReducer.apiJson.length === 0 || isSearching}
                    emptyMessage="No units found"
                    buttonText={canAddUnit ? "Add Unit" : undefined}
                    navigateTo={canAddUnit ? "/unit/add" : undefined}
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

export default UnitMaster;
