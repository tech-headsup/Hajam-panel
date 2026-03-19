import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import AppPagination from '../../components/Pagination/AppPagination';
import { setPagination } from '../../redux/Actions/TableAction';
import DeleteButton from '../../components/Delete/DeleteButton';
import EditButton from '../../components/Edit/EditButton';
import { deleteProduct, ProductBulkUpload, searchProduct } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import QRGridSizeSelector from '../../components/GenrateQr/genrateQr';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import { hasPermission } from '../../utils/permissionUtils';
import BarcodeManager from './BarcodeManager';

function Products() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);

    // Local state for loading and error handling
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Search state variables
    const [optionSelect, setOptionSelect] = useState('');
    const [valueSearched, setValueSearched] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Permission checks
    const canEditProducts = hasPermission('product', 'write');
    const canReadProducts = hasPermission('product', 'read');
    const canDeleteProducts = hasPermission('product', 'delete');
    const canAddProducts = hasPermission('product', 'write');

    console.log({ canEditProducts, canReadProducts, canDeleteProducts, canAddProducts });

    // Initialize with empty array to prevent map errors
    useEffect(() => {
        // Ensure ApiReducer.apiJson is always an array
        if (!Array.isArray(ApiReducer.apiJson)) {
            dispatch(setApiJson([]));
        }
    }, []);

    // Memoized function to prevent unnecessary re-renders
    const getProducts = useCallback(async (searchKey, searchValue) => {
        setIsLoading(true);
        setIsSearching(true);
        setError(null);

        try {
            const searchObj = {
                unitIds: getSelectedUnit()?._id
            };

            // Only add search key/value if both are provided
            if (searchKey && searchValue) {
                // Convert price fields to numbers for exact matching
                const priceFields = ['costPrice', 'sellPrice', 'mrp'];
                
                if (priceFields.includes(searchKey)) {
                    // For price fields, use exact numeric match
                    searchObj[searchKey] = searchValue;
                } else {
                    // For text fields, use regex for partial matching (case-insensitive)
                    searchObj[searchKey] = {
                        $regex: searchValue,
                        $options: 'i'
                    };
                }
            }

            const json = {
                page: TableDataReducer.pagination.page,
                limit: TableDataReducer.pagination.limit,
                search: searchObj
            };

            const res = await HitApi(json, searchProduct);

            // Handle different possible response structures
            let productsData = [];
            let totalCount = 0;

            if (res?.statusCode === 200) {
                // Try different possible data paths
                productsData = res?.data?.docs || res?.products || res?.result || [];
                totalCount = res?.data?.totalDocs || 0;

                // Ensure we have an array
                if (!Array.isArray(productsData)) {
                    console.warn("API returned non-array data:", productsData);
                    productsData = [];
                }

                dispatch(setApiJson(productsData));

                // Update pagination data in Redux
                const paginationData = {
                    total: totalCount,
                    page: TableDataReducer.pagination.page,
                    limit: TableDataReducer.pagination.limit
                };

                dispatch(setPagination(paginationData));
            } else {
                const errorMessage = res?.message || res?.error || 'Failed to fetch products';
                console.error("API Error:", errorMessage);
                setError(errorMessage);
                dispatch(setApiJson([]));
                toast.error('Failed to fetch products. Please try again.');
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setError('Failed to fetch products. Please check your connection and try again.');
            dispatch(setApiJson([]));
            toast.error('Error fetching products. Please try again.');
        } finally {
            setIsLoading(false);
            setIsSearching(false);
        }
    }, [dispatch, TableDataReducer.pagination.page, TableDataReducer.pagination.limit]);

    useEffect(() => {
        if (canReadProducts) {
            getProducts();
        }

    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit, canReadProducts]);

    // Search functionality
    const handleSearch = () => {
        if (!optionSelect) {
            toast.error('Please select a search option');
            return;
        }
        if (!valueSearched || valueSearched.trim() === '') {
            toast.error('Please enter a search value');
            return;
        }

        let searchValue = valueSearched.trim();

        // Convert price fields to numbers
        const priceFields = ['costPrice', 'sellPrice', 'mrp'];
        if (priceFields.includes(optionSelect)) {
            const numericValue = parseFloat(searchValue);
            if (isNaN(numericValue)) {
                toast.error('Please enter a valid number for price fields');
                return;
            }
            searchValue = numericValue;
        }

        getProducts(optionSelect, searchValue);
    };

    // Search options based on table keys
    const options = [
        { label: 'Product Name', value: 'productName' },
        { label: 'Brand', value: 'brand' },
        { label: 'Product Type', value: 'productType' },
        { label: 'Usage Type', value: 'vendor' },
        { label: 'Cost Price', value: 'costPrice' },
        { label: 'Sell Price', value: 'sellPrice' },
        { label: 'MRP', value: 'mrp' },
    ];

    // Handle product actions
    const handleEdit = useCallback((row) => {
        if (!canEditProducts) {
            toast.error('You do not have permission to edit products');
            return;
        }

        if (row?._id || row?.id) {
            const productId = row._id || row.id;
            navigate(`/products/edit/${productId}`);
        } else {
            console.error('Product ID not found in row:', row);
            toast.error('Unable to edit product: ID not found');
        }
    }, [navigate, canEditProducts]);

    const handleDelete = useCallback(async (row) => {
        if (!canDeleteProducts) {
            toast.error('You do not have permission to delete products');
            return;
        }

        const productId = row?._id || row?.id;
        if (!productId) {
            console.error('Product ID not found in row:', row);
            toast.error('Unable to delete product: ID not found');
            return;
        }

        const productName = row.productName || row.name || 'this product';
        const confirmMessage = `Are you sure you want to delete "${productName}"? This action cannot be undone.`;

        if (window.confirm(confirmMessage)) {
            setIsLoading(true);
            try {
                const json = { _id: productId, id: productId };
                const res = await HitApi(json, deleteProduct);

                if (res?.success || res?.message?.includes('deleted') || res?.message?.includes('success')) {
                    toast.success('Product deleted successfully!');
                    await getProducts();
                } else {
                    throw new Error(res?.message || res?.error || 'Failed to delete product');
                }
            } catch (error) {
                console.error("Error deleting product:", error);
                toast.error(`Failed to delete product: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    }, [getProducts, canDeleteProducts]);

    // Format currency with proper validation
    const formatCurrency = useCallback((amount) => {
        if (amount === null || amount === undefined || amount === '' || isNaN(amount)) {
            return '₹0.00';
        }
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return '₹0.00';
        return `₹${numAmount.toFixed(2)}`;
    }, []);

    const baseIndex = (TableDataReducer.pagination.page - 1) * TableDataReducer.pagination.limit;

    // Define base table headers without Actions column
    const baseTableHeaders = [
        {
            title: "S.No",
            key: "serialNumber",
            width: "60px",
            align: "start",
            priority: 1,
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
            title: "Product",
            key: "productName",
            priority: 1,
            render: (value, row) => (
                <div className="flex items-start">
                    {row.productImageUrl ? (
                        <img
                            src={row.productImageUrl}
                            alt={value || 'Product'}
                            className="w-10 h-10 rounded-lg mr-3 object-cover flex-shrink-0"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                    ) : null}
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0"
                        style={{ display: row.productImageUrl ? 'none' : 'flex' }}>
                        <span className="text-lg">📦</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate" title={value}>
                            {value || 'Unnamed Product'}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                            {row.brand && (
                                <div className="text-sm text-gray-500 truncate" title={row.brand}>
                                    {row.brand}
                                </div>
                            )}
                            {barcodeManager.createBarcodeIndicator(row, { variant: 'minimal' })}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Brand",
            key: "brand",
            align: "start",
            priority: 3,
            render: (value) => (
                <span className="text-sm font-medium text-gray-700">
                    {value || 'N/A'}
                </span>
            )
        },
        {
            title: "Cost Price",
            key: "costPrice",
            align: "start",
            priority: 4,
            render: (value) => (
                <span className="font-medium">{formatCurrency(value)}</span>
            )
        },
        {
            title: "Sell Price",
            key: "sellPrice",
            align: "start",
            priority: 2,
            render: (value) => (
                <span className="font-medium text-green-600">{formatCurrency(value)}</span>
            )
        },
        {
            title: "MRP",
            key: "mrp",
            align: "start",
            priority: 4,
            render: (value) => (
                <span className="font-medium">{formatCurrency(value)}</span>
            )
        },
        {
            title: "Type",
            key: "productType",
            priority: 3,
            render: (value) => (
                <span className="capitalize">
                    {value ? value.replace(/[-_]/g, ' ') : 'N/A'}
                </span>
            )
        },
        {
            title: "Usage Type",
            key: "vendor",
            priority: 4,
            render: (value) => (
                <span className="capitalize" title={value}>
                    {value || 'N/A'}
                </span>
            )
        },
        {
            title: "Barcode",
            key: "vendor",
            priority: 4,
            render: (value, row) => (
                <div className="flex gap-2" title={value}>
                    {barcodeManager.createBarcodeButton(row, { variant: 'compact', disabled: isLoading })}

                        {/* <QRGridSizeSelector
                            barcode={row._id}
                            name={row.productName}
                        /> */}
                </div>
            )
        },

    ];
    const hasAnyPermission = canEditProducts || canDeleteProducts || canReadProducts;
    // Always add Actions column since QR should always be shown
    const tableHeaders = [
        ...baseTableHeaders,
        {
            title: "Actions",
            key: "actions",
            align: "start",
            priority: 1,
            render: (value, row) => {

                if (!hasAnyPermission) {
                    return (
                        <div className="flex justify-center">
                            <span className="text-sm text-gray-500">Loading...</span>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-start space-x-2">
                        {canEditProducts &&
                            <EditButton
                                onEdit={() => handleEdit(row)}
                                itemName="product"
                                disabled={isLoading}
                            />
                        }
                        {canDeleteProducts &&
                            <DeleteButton
                                onDelete={() => handleDelete(row)}
                                itemName="product"
                                disabled={isLoading}
                            />
                        }

                    </div>
                );
            }
        }
    ];





    const productsData = Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : [];

    const handleClearSearch = () => {
        setOptionSelect('');
        setValueSearched('');
        getProducts();
    };

    const handleBarcodeUpdate = useCallback((productId, newBarcodes) => {
        // Update the product in the local state
        const updatedProducts = Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson.map(product =>
            product._id === productId
                ? { ...product, barcodes: newBarcodes }
                : product
        ) : [];
        dispatch(setApiJson(updatedProducts));
    }, [ApiReducer.apiJson, dispatch]);

    // Initialize Barcode Manager after handleBarcodeUpdate is defined
    const barcodeManager = BarcodeManager({ onBarcodeUpdate: handleBarcodeUpdate });

    return (
        <div className="p-5">
            <PageHeader
                title="Products Management"
                description="View and manage your product inventory and catalogue"
            />

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Error Loading Products</h4>
                            <p className="mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => getProducts()}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Retry'}
                        </button>
                    </div>
                </div>
            )}

            {!hasAnyPermission ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg">Loading permissions...</div>
                </div>
            ) : (
                <AppTable
                    TH={tableHeaders}
                    TD={productsData} // This is now guaranteed to be an array
                    isLoading={isLoading || isSearching}
                    emptyMessage={error ? "Failed to load products. Please try again." : "No products found. Click 'Add Product' to get started."}
                    buttonText={canAddProducts && "Add Product"}
                    navigateTo={canAddProducts && "/products/add"}
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

            <barcodeManager.ModalComponent />
        </div>
    );
}

export default Products;
