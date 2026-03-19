import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import { searchHairColorService, deleteHairColorService } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';

function HairColorServices() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');

    useEffect(() => {
        if (!Array.isArray(ApiReducer.apiJson)) {
            dispatch(setApiJson([]));
        }
    }, []);

    const getHairColorServices = useCallback(async (searchKey, searchValue) => {
        setIsLoading(true);
        setError(null);

        try {
            const json = {
                page: TableDataReducer.pagination.page,
                limit: TableDataReducer.pagination.limit,
                unitIds: getSelectedUnit()?._id
            };

            if (searchKey && searchValue) {
                json.search = searchValue;
            }

            const res = await HitApi(json, searchHairColorService);

            if (res?.statusCode === 200) {
                const data = res?.data?.docs || [];
                const totalCount = res?.data?.totalDocs || 0;

                dispatch(setApiJson(data));
                dispatch(setPagination({
                    total: totalCount,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit
                }));
            } else {
                setError(res?.message || 'Failed to fetch hair color services');
                dispatch(setApiJson([]));
                toast.error('Failed to fetch hair color services.');
            }
        } catch (error) {
            console.error("Error fetching hair color services:", error);
            setError('Failed to fetch hair color services.');
            dispatch(setApiJson([]));
            toast.error('Error fetching hair color services.');
        } finally {
            setIsLoading(false);
        }
    }, [dispatch, TableDataReducer.pagination.page, TableDataReducer.pagination.limit]);

    useEffect(() => {
        getHairColorServices();
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit]);

    const handleSearch = () => {
        if (!optionSelect) {
            toast.error('Please select a search option');
            return;
        }
        if (!valueSearched || valueSearched.trim() === '') {
            toast.error('Please enter a search value');
            return;
        }
        getHairColorServices(optionSelect, valueSearched.trim());
    };

    const handleClearSearch = () => {
        setOptionSelect('');
        setValueSearched('');
        getHairColorServices();
    };

    const handleEdit = useCallback((row) => {
        const id = row?._id || row?.id;
        if (id) {
            navigate(`/service-color/edit/${id}`);
        } else {
            toast.error('Unable to edit: ID not found');
        }
    }, [navigate]);

    const handleDelete = useCallback(async (row) => {
        const id = row?._id || row?.id;
        if (!id) {
            toast.error('Unable to delete: ID not found');
            return;
        }

        setIsLoading(true);
        try {
            const res = await HitApi({ _id: id }, deleteHairColorService);
            if (res?.success || res?.statusCode === 200) {
                toast.success('Hair color service deleted successfully!');
                await getHairColorServices();
            } else {
                toast.error(res?.message || 'Failed to delete hair color service');
            }
        } catch (error) {
            console.error("Error deleting:", error);
            toast.error('Failed to delete hair color service');
        } finally {
            setIsLoading(false);
        }
    }, [getHairColorServices]);

    const options = [
        { label: 'Service Name', value: 'serviceName' },
        { label: 'Category', value: 'category' },
        { label: 'Gender', value: 'gender' },
    ];

    const baseIndex = (TableDataReducer.pagination.page - 1) * TableDataReducer.pagination.limit;

    const tableHeaders = [
        {
            title: "S.No",
            key: "serialNumber",
            width: "60px",
            priority: 1,
            render: (_, row, index) => (
                <div className="text-center">
                    <span className="text-sm font-medium text-gray-900">{baseIndex + index + 1}</span>
                </div>
            )
        },
        {
            title: "Service",
            key: "serviceName",
            priority: 1,
            render: (value, row) => (
                <div className="flex items-start">
                    {row.img ? (
                        <img
                            src={row.img}
                            alt={value || 'Service'}
                            className="w-10 h-10 rounded-lg mr-3 object-cover flex-shrink-0"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0"
                        style={{ display: row.img ? 'none' : 'flex' }}>
                        <span className="text-lg">✂️</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate" title={value}>
                            {value || 'Unnamed Service'}
                        </div>
                        {row.description && (
                            <div className="text-xs text-gray-500 truncate" title={row.description}>
                                {row.description}
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: "Category",
            key: "category",
            priority: 2,
            render: (value) => (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                    {value ? value.replace(/_/g, ' ') : 'N/A'}
                </span>
            )
        },
        {
            title: "Gender",
            key: "gender",
            priority: 3,
            render: (value) => (
                <span className="text-sm text-gray-700">
                    {value || 'Unisex'}
                </span>
            )
        },
        {
            title: "Duration",
            key: "duration",
            priority: 3,
            render: (value) => (
                <span className="text-sm text-gray-700">
                    {value ? `${value} min` : 'N/A'}
                </span>
            )
        },
        {
            title: "Price (S/M/L)",
            key: "pricing",
            priority: 2,
            render: (value) => (
                <div className="text-sm">
                    <span className="text-gray-700">
                        ₹{value?.short || 0} / ₹{value?.medium || 0} / ₹{value?.long || 0}
                    </span>
                </div>
            )
        },
        {
            title: "Products / Brand",
            key: "ratios",
            priority: 2,
            render: (value) => {
                if (!value || value.length === 0) return <span className="text-gray-400">N/A</span>;
                return (
                    <div className="text-xs space-y-1.5">
                        {value.map((r, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-black text-white text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                <span className="font-medium text-gray-800">{r.productName || r.colorName}</span>
                                {r.brand && <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500">{r.brand}</span>}
                                <span className="text-gray-500">· {r.percentage}%</span>
                                {r.developer > 0 && <span className="text-gray-400">· {r.developer}%</span>}
                            </div>
                        ))}
                    </div>
                );
            }
        },
        {
            title: "Status",
            key: "isActive",
            priority: 2,
            render: (value) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {value ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            title: "Actions",
            key: "actions",
            align: "start",
            priority: 1,
            render: (_, row) => (
                <div className="flex justify-start space-x-2">
                    <EditButton
                        onEdit={() => handleEdit(row)}
                        itemName="hair color service"
                        disabled={isLoading}
                    />
                    <DeleteButton
                        onDelete={() => handleDelete(row)}
                        itemName="hair color service"
                        disabled={isLoading}
                    />
                </div>
            )
        }
    ];

    const servicesData = Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : [];

    return (
        <div className="p-5">
            <PageHeader
                title="Hair Color Services"
                description="View and manage your hair color services"
            />

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Error Loading Services</h4>
                            <p className="mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => getHairColorServices()}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Retry'}
                        </button>
                    </div>
                </div>
            )}

            <AppTable
                TH={tableHeaders}
                TD={servicesData}
                isLoading={isLoading}
                emptyMessage="No hair color services found. Click 'Add Service' to get started."
                buttonText="Add Service"
                navigateTo="/service-color/add"
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
    );
}

export default HairColorServices;
