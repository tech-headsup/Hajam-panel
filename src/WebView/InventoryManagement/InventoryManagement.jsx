import { useState, useEffect, useRef } from 'react';
import { Search, X, Package, Loader2, Pencil, Trash2, History, Settings } from 'lucide-react';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { searchProduct, searchInventory, deleteInventory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import AddInventory from './AddInventory';
import TransactionHistory from './TransactionHistory';
import ManageServices from './ManageServices';
import toast from 'react-hot-toast';

function InventoryManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inventoryList, setInventoryList] = useState([]);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [editData, setEditData] = useState(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedInventory, setSelectedInventory] = useState(null);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const [servicesInventory, setServicesInventory] = useState(null);
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (searchQuery.trim().length < 2) {
            setProducts([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(() => {
            fetchProducts(searchQuery);
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [searchQuery]);

    const fetchInventory = () => {
        setInventoryLoading(true);
        const json = {
            page: 1,
            limit: 100,
            search: {
                unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
            },
            populate: [
                { path: 'productId', select: 'productName brand productType vendor productImageUrl mrp sellPrice unit netQuantity' },
                {
                    path: 'serviceIds',
                    select: 'name price variations categoryId subCategoryId gender serviceFor member_price service_time description productId',
                    populate: {
                        path: 'productId',
                        select: 'productName brand productType productImageUrl mrp sellPrice unit netQuantity'
                    }
                }
            ]
        };

        HitApi(json, searchInventory).then((res) => {
            if (res?.data?.docs) {
                setInventoryList(res.data.docs);
            } else {
                setInventoryList([]);
            }
        }).catch((err) => {
            console.error(err);
            setInventoryList([]);
        }).finally(() => {
            setInventoryLoading(false);
        });
    };

    const fetchProducts = (query) => {
        setLoading(true);
        const json = {
            page: 1,
            limit: 10,
            search: {
                productName: { $regex: query, $options: 'i' }
            },
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
        };

        HitApi(json, searchProduct).then((res) => {
            if (res?.data?.docs) {
                setProducts(res.data.docs);
                setShowDropdown(true);
            } else {
                setProducts([]);
            }
        }).catch((err) => {
            console.error(err);
            setProducts([]);
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setSearchQuery('');
        setShowDropdown(false);
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setProducts([]);
        setShowDropdown(false);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
        setEditData(null);
    };

    const handleSuccess = () => {
        setSelectedProduct(null);
        setEditData(null);
        fetchInventory();
    };

    const handleEdit = (inventory) => {
        setSelectedProduct(inventory.productId);
        setEditData(inventory);
        setIsModalOpen(true);
    };

    const handleDelete = (inventory) => {
        const productName = inventory.productId?.productName || 'this inventory';
        if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
            HitApi({ _id: inventory._id }, deleteInventory).then((res) => {
                if (res?.success || res?.statusCode === 200) {
                    toast.success('Inventory deleted successfully');
                    fetchInventory();
                } else {
                    toast.error(res?.message || 'Failed to delete inventory');
                }
            }).catch((err) => {
                toast.error('Error deleting inventory');
                console.error(err);
            });
        }
    };

    const handleViewHistory = (inventory) => {
        setSelectedInventory(inventory);
        setIsHistoryOpen(true);
    };

    const handleHistoryClose = () => {
        setIsHistoryOpen(false);
        setSelectedInventory(null);
    };

    const handleManageServices = (inventory) => {
        setServicesInventory(inventory);
        setIsServicesOpen(true);
    };

    const handleServicesClose = () => {
        setIsServicesOpen(false);
        setServicesInventory(null);
    };

    const handleServicesSuccess = () => {
        fetchInventory();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
                <PageHeader title={'Inventory Management'} description={'Manage your inventory'} />
            </div>

            <div className="bg-white rounded-lg p-6 shadow mb-6">
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Product to Inventory
                    </label>
                    <div className="relative" ref={searchRef}>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => searchQuery.length >= 2 && products.length > 0 && setShowDropdown(true)}
                                placeholder="Search by product name to add..."
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            />
                            {loading && (
                                <Loader2 size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin" />
                            )}
                            {!loading && searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {showDropdown && products.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                                {products.map((product) => (
                                    <div
                                        key={product._id}
                                        onClick={() => handleSelectProduct(product)}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                    >
                                        {product.productImageUrl ? (
                                            <img
                                                src={product.productImageUrl}
                                                alt={product.productName}
                                                className="w-10 h-10 object-cover rounded"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                <Package size={20} className="text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{product.productName}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                {product.brand && <span>{product.brand}</span>}
                                                {product.brand && product.productType && <span>•</span>}
                                                {product.productType && <span>{product.productType}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900">₹{product.sellPrice || product.mrp || 0}</p>
                                            <p className="text-xs text-gray-500">Stock: {product.inStockQuantity || 0}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {showDropdown && searchQuery.length >= 2 && products.length === 0 && !loading && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                                No products found
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Inventory List</h2>
                </div>

                {inventoryLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 size={32} className="text-gray-400 animate-spin" />
                    </div>
                ) : inventoryList.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Product</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Brand</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Type</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Vendor</th>
                                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Quantity</th>
                                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Sell Price</th>
                                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Services</th>
                                    <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventoryList.map((inventory) => (
                                    <tr key={inventory._id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {inventory.productId?.productImageUrl ? (
                                                    <img
                                                        src={inventory.productId.productImageUrl}
                                                        alt={inventory.productId.productName}
                                                        className="w-10 h-10 object-cover rounded"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                                        <Package size={20} className="text-gray-400" />
                                                    </div>
                                                )}
                                                <span className="font-medium text-gray-900">
                                                    {inventory.productId?.productName || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {inventory.productId?.brand || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {inventory.productId?.productType ? (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
                                                    {inventory.productId.productType}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {inventory.productId?.vendor ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm">
                                                    {inventory.productId.vendor}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`font-semibold ${inventory.qty <= 10 ? 'text-red-600' : 'text-green-600'}`}>
                                                {inventory.qty || 0}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                            ₹{inventory.productId?.sellPrice || 0}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {inventory.serviceIds?.length > 0 ? (
                                                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-sm font-medium">
                                                    {inventory.serviceIds.length}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleManageServices(inventory)}
                                                    className="p-1.5 hover:bg-purple-100 rounded"
                                                    title="Manage Services"
                                                >
                                                    <Settings size={16} className="text-purple-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewHistory(inventory)}
                                                    className="p-1.5 hover:bg-blue-100 rounded"
                                                    title="View Transaction History"
                                                >
                                                    <History size={16} className="text-blue-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(inventory)}
                                                    className="p-1.5 hover:bg-gray-200 rounded"
                                                    title="Edit Inventory"
                                                >
                                                    <Pencil size={16} className="text-gray-600" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(inventory)}
                                                    className="p-1.5 hover:bg-red-100 rounded"
                                                    title="Delete Inventory"
                                                >
                                                    <Trash2 size={16} className="text-red-600" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p>No inventory found</p>
                        <p className="text-sm">Search and add products to inventory</p>
                    </div>
                )}
            </div>

            <AddInventory
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                product={selectedProduct}
                editData={editData}
            />

            <TransactionHistory
                isOpen={isHistoryOpen}
                onClose={handleHistoryClose}
                inventory={selectedInventory}
            />

            <ManageServices
                isOpen={isServicesOpen}
                onClose={handleServicesClose}
                inventory={servicesInventory}
                onSuccess={handleServicesSuccess}
            />
        </div>
    );
}

export default InventoryManagement;
