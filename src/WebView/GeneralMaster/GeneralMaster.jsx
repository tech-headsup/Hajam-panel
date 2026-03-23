import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import { usePermissions } from '../../navigations/Ristrictions';
import { deleteGeneralMaster, searchGeneralMaster } from '../../constant/Constant';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import { hasPermission } from '../../utils/permissionUtils';

function GeneralManagement() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);
    const { hasEndpointAccess, loading: permissionsLoading } = usePermissions();

    // Search state variables
    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchTimeout, setSearchTimeout] = useState(null);



    const canEditGeneral = hasPermission('generalMaster', 'write');
    const canReadGeneral = hasPermission('generalMaster', 'read');
    const canAddGeneral = hasPermission('generalMaster', 'delete');
    const canDeleteGeneral = hasPermission('generalMaster', 'write');


    useEffect(() => {
        getGenerals();
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit]);

    const getGenerals = (searchKey, searchValue, page = TableDataReducer.pagination.page, limit = TableDataReducer.pagination.limit) => {
        setIsSearching(true);

        const searchObj = {};

        // Only add search key/value if both are provided
        if (searchKey && searchValue && searchValue.trim()) {
            // Use $regex for partial, case-insensitive search
            searchObj[searchKey] = {
                $regex: searchValue.trim(),
                $options: 'i'
            };
        }

        const json = {
            page: page,
            limit: limit,
            search: searchObj
        };

        HitApi(json, searchGeneralMaster).then((res) => {
            if (res?.statusCode === 200) {
                dispatch(setApiJson(res?.data?.docs));

                // Update pagination data in Redux
                const paginationData = {
                    total: res?.data?.totalDocs || 0,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit
                };

                dispatch(setPagination(paginationData));
            } else {
                dispatch(setApiJson([]));
                toast.error('Failed to fetch general items. Please try again.');
            }
        }).catch(error => {
            console.error("Error fetching generals:", error);
            dispatch(setApiJson([]));
            toast.error('Error fetching general items. Please try again.');
        }).finally(() => {
            setIsSearching(false);
        });
    };

    // Debounced search function
    const debouncedSearch = (searchKey, searchValue) => {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            getGenerals(searchKey, searchValue, 1); // Reset to page 1 when searching
        }, 300);

        setSearchTimeout(timeout);
    };

    // Real-time search effect
    useEffect(() => {
        if (optionSelect && valueSearched && valueSearched.trim()) {
            debouncedSearch(optionSelect, valueSearched);
        }
    }, [optionSelect, valueSearched]);

    // Manual search functionality (for search button)
    const handleSearch = () => {
        if (!optionSelect) {
            toast.error('Please select a search option');
            return;
        }
        if (!valueSearched || valueSearched.trim() === '') {
            toast.error('Please enter a search value');
            return;
        }
        // Clear any pending debounced search
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            setSearchTimeout(null);
        }
        getGenerals(optionSelect, valueSearched.trim(), 1); // Reset to page 1 when manually searching
    };

    // Search options based on table keys
    const options = [
        { label: 'Label', value: 'label' },
        { label: 'Value', value: 'value' },
        { label: 'Used By', value: 'usedBy' },
    ];


    // Handle general actions
    const handleEdit = (row) => {
        if (!canEditGeneral) {
            toast.error('You do not have permission to edit general items');
            return;
        }

        if (row?._id) {
            navigate(`/generalmaster/edit/${row._id}`);
        } else {
            toast.error('Unable to edit: General ID not found');
        }
    };

    const handleDelete = (row) => {
        if (!canDeleteGeneral) {
            toast.error('You do not have permission to delete general items');
            return;
        }

        const json = {
            _id: row?._id
        };
        HitApi(json, deleteGeneralMaster).then((res) => {
            if (res?.statusCode === 200) {
                toast.success('General item deleted successfully!');
                getGenerals();
            } else {
                toast.error(res?.message || 'Failed to delete general item');
            }
        }).catch(error => {
            console.error("Error deleting general:", error);
            toast.error('Error occurred while deleting general item. Please try again.');
        });
    };


    const renderUsedBy = (usedBy) => {
        if (!usedBy) return 'N/A';

        let bgColor = "bg-blue-100";
        let textColor = "text-blue-800";

        switch (usedBy.toLowerCase()) {
            case 'gender':
                bgColor = "bg-pink-100";
                textColor = "text-pink-800";
                break;
            case 'other':
                bgColor = "bg-gray-100";
                textColor = "text-gray-800";
                break;
            case 'category':
                bgColor = "bg-purple-100";
                textColor = "text-purple-800";
                break;
            default:
                bgColor = "bg-blue-100";
                textColor = "text-blue-800";
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {usedBy}
            </span>
        );
    };

    // Get base index for serial numbers
    const baseIndex = (TableDataReducer.pagination.page - 1) * TableDataReducer.pagination.limit;

    // Define base table headers without Actions column
    const baseTableHeaders = [
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
            title: "Label",
            key: "label",
            render: (value) => (
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center mr-2">
                        <span className="text-sm font-medium text-indigo-600">
                            {value && value.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <span className="font-medium text-gray-900">{value || 'N/A'}</span>
                    </div>
                </div>
            )
        },
        {
            title: "Value",
            key: "value",
            render: (value) => (
                <span className="text-gray-700 font-medium">{value || 'N/A'}</span>
            )
        },
        {
            title: "Used By",
            key: "usedBy",
            render: renderUsedBy
        }
    ];

    const tableHeaders = [
        ...baseTableHeaders,
        ...(canEditGeneral || canDeleteGeneral ? [{
            title: "Actions",
            key: "actions",
            align: "center",
            render: (value, row) => {
                if (permissionsLoading) {
                    return (
                        <div className="flex justify-center">
                            <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center space-x-2">
                        {canEditGeneral &&
                            <EditButton
                                onEdit={() => handleEdit(row)}
                                itemName="general"
                            />
                        }
                        {canDeleteGeneral &&
                            <DeleteButton
                                onDelete={() => handleDelete(row)}
                                itemName="general"
                            />
                        }
                    </div>
                );
            }
        }] : [])
    ];


    const handleClearSearch = () => {
        // Clear any pending debounced search
        if (searchTimeout) {
            clearTimeout(searchTimeout);
            setSearchTimeout(null);
        }
        setOptionSelect('');
        setValueSearched('');
        getGenerals(); // Load all data without search
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, [searchTimeout]);

    return (
        <div className="p-5">
            <PageHeader
                title={'General Management'}
                description={'View and manage general configuration items'}
            />

            {permissionsLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading permissions...</div>
                </div>
            ) : (
                <AppTable
                    TH={tableHeaders}
                    TD={ApiReducer.apiJson || []}
                    isLoading={!ApiReducer.apiJson?.length || isSearching}
                    emptyMessage="No general items found"
                    buttonText={canAddGeneral && "Add General"}
                    navigateTo={canAddGeneral && "/generalmaster/add"}
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
            )}
        </div>
    );
}

export default GeneralManagement;
