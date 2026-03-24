import { useState, useEffect, useRef } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, MoreVertical, Package, Search } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchProduct, deleteProduct } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import AddProduct from './AddProduct';

function ProductList({ selectedProductBrand, selectedProductSubCategory, selectedProductCategory, selectedProductGroup }) {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (selectedProductBrand?._id) {
            fetchProducts();
        } else {
            setProducts([]);
        }
    }, [selectedProductBrand]);

    useEffect(() => {
        if (selectedProductBrand?._id) {
            const delaySearch = setTimeout(() => {
                fetchProducts();
            }, 300);
            return () => clearTimeout(delaySearch);
        }
    }, [searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchProducts = () => {
        const searchQuery = {
            productBrandId: selectedProductBrand._id,
            productSubCategoryId: selectedProductSubCategory?._id,
            productCategoryId: selectedProductCategory?._id,
            productGroupId: selectedProductGroup?._id,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
        };

        if (searchTerm) {
            searchQuery.productName = { $regex: searchTerm, $options: 'i' };
        }

        const json = {
            page: 1,
            limit: 100000,
            search: searchQuery
        };

        HitApi(json, searchProduct).then((res) => {
            if (res?.data?.docs) {
                setProducts(res.data.docs);
            } else {
                setProducts([]);
            }
        }).catch((err) => {
            setProducts([]);
            toast.error('Error fetching products');
            console.error(err);
        });
    };

    const handleAdd = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (product) => {
        setEditData(product);
        setIsModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleDelete = (product) => {
        setOpenDropdownId(null);
        if (window.confirm(`Are you sure you want to delete "${product.productName}"?`)) {
            HitApi({ _id: product._id }, deleteProduct).then((res) => {
                if (res?.success) {
                    toast.success('Product deleted successfully');
                    fetchProducts();
                } else {
                    toast.error(res?.message || 'Failed to delete product');
                }
            }).catch((err) => {
                toast.error('Error deleting product');
                console.error(err);
            });
        }
    };

    const toggleDropdown = (e, productId) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === productId ? null : productId);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchProducts();
    };

    return (
        <div className="w-[420px] min-w-[420px] bg-white border rounded-lg overflow-hidden flex-shrink-0">
            <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-900">Products</h2>
                    {selectedProductBrand && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <CirclePlus size={14} />
                            Add
                        </button>
                    )}
                </div>
                {selectedProductBrand && (
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-110px)]">
                {selectedProductBrand ? (
                    products.length > 0 ? (
                        products.map((product) => (
                            <div
                                key={product._id}
                                className="group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {product.productImageUrl ? (
                                        <img
                                            src={product.productImageUrl}
                                            alt={product.productName}
                                            className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Package size={16} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 truncate">{product.productName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {product.sellPrice && (
                                                <span className="text-gray-900">₹{product.sellPrice}</span>
                                            )}
                                            {product.mrp && product.mrp !== product.sellPrice && (
                                                <span className="text-gray-400 line-through text-xs">₹{product.mrp}</span>
                                            )}
                                            {product.netQuantity && product.unit && (
                                                <span className="text-gray-400">• {product.netQuantity} {product.unit}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative flex-shrink-0" ref={openDropdownId === product._id ? dropdownRef : null}>
                                    <button
                                        onClick={(e) => toggleDropdown(e, product._id)}
                                        className="p-1.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
                                        title="Actions"
                                    >
                                        <MoreVertical size={16} className="text-gray-600" />
                                    </button>

                                    {openDropdownId === product._id && (
                                        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(product); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">No products found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a product brand first</div>
                )}
            </div>

            <AddProduct
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                productBrandId={selectedProductBrand?._id}
                productSubCategoryId={selectedProductSubCategory?._id}
                productCategoryId={selectedProductCategory?._id}
                productGroupId={selectedProductGroup?._id}
            />
        </div>
    );
}

export default ProductList;
