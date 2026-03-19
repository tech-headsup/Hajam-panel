import { useState, useEffect, useRef } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, MoreVertical, ArrowRight, Users, Search } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchProductBrand, deleteProductBrand, searchProduct } from '../../constant/Constant';
import toast from 'react-hot-toast';
import AddProductBrand from './AddProductBrand';
import TransferProductBrand from './TransferProductBrand';
import GroupUsageModal from './GroupUsageModal';

function ProductBrandList({ selectedProductGroup, selectedProductBrand, onProductBrandClick }) {
    const [productBrands, setProductBrands] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageData, setUsageData] = useState({ title: '', groups: [] });
    const [editData, setEditData] = useState(null);
    const [transferBrand, setTransferBrand] = useState(null);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Brands belong to ProductGroup only (shared across all categories/subcategories)
    useEffect(() => {
        if (selectedProductGroup?._id) {
            fetchProductBrands();
        } else {
            setProductBrands([]);
        }
    }, [selectedProductGroup]);

    useEffect(() => {
        if (selectedProductGroup?._id) {
            const delaySearch = setTimeout(() => {
                fetchProductBrands();
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

    const fetchProductBrands = () => {
        // Brands are fetched by productGroupId only (common across all categories/subcategories)
        const json = {
            page: 1,
            limit: 100000,
            search: searchTerm,
            productGroupId: selectedProductGroup._id,
            populate: [
                { path: 'groupUsing', select: 'name' }
            ]
        };

        HitApi(json, searchProductBrand).then((res) => {
            if (res?.data?.docs) {
                setProductBrands(res.data.docs);
            } else {
                setProductBrands([]);
            }
        }).catch((err) => {
            setProductBrands([]);
            toast.error('Error fetching product brands');
            console.error(err);
        });
    };

    const handleAdd = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (brand) => {
        setEditData(brand);
        setIsModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleDelete = async (brand) => {
        setOpenDropdownId(null);

        // Check if products exist under this brand (within the group)
        try {
            const productRes = await HitApi({
                page: 1,
                limit: 1,
                search: {
                    productBrandId: brand._id,
                    productGroupId: selectedProductGroup?._id
                }
            }, searchProduct);

            if (productRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete product brand. Please delete all products first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
                HitApi({ _id: brand._id }, deleteProductBrand).then((res) => {
                    if (res?.success) {
                        toast.success('Product brand deleted successfully');
                        fetchProductBrands();
                    } else {
                        toast.error(res?.message || 'Failed to delete product brand');
                    }
                }).catch((err) => {
                    toast.error('Error deleting product brand');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking products');
            console.error(err);
        }
    };

    const handleTransfer = (brand) => {
        setTransferBrand(brand);
        setIsTransferOpen(true);
        setOpenDropdownId(null);
    };

    const toggleDropdown = (e, brandId) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === brandId ? null : brandId);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleTransferClose = () => {
        setIsTransferOpen(false);
        setTransferBrand(null);
    };

    const handleSuccess = () => {
        fetchProductBrands();
    };

    const handleTransferSuccess = () => {
        fetchProductBrands();
    };

    const handleShowUsage = (brand) => {
        setUsageData({
            title: brand.name,
            groups: brand.groupUsing || []
        });
        setIsUsageModalOpen(true);
        setOpenDropdownId(null);
    };

    return (
        <div className="min-w-[320px] w-[320px] bg-white border rounded-lg overflow-hidden flex-shrink-0">
            <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-900">Brands</h2>
                    {selectedProductGroup && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <CirclePlus size={14} />
                            Add
                        </button>
                    )}
                </div>
                {selectedProductGroup && (
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search brands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-110px)]">
                {selectedProductGroup ? (
                    productBrands.length > 0 ? (
                        productBrands.map((brand) => (
                            <div
                                key={brand._id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedProductBrand?._id === brand._id
                                        ? 'bg-orange-50 border-l-4 border-orange-600'
                                        : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onProductBrandClick?.(brand)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Menu size={16} className="text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 truncate">{brand.name}</span>
                                            {brand.isTransferred && (
                                                <span
                                                    className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 cursor-help"
                                                    title="Transferred"
                                                >
                                                    T
                                                </span>
                                            )}
                                        </div>
                                        {brand.description && (
                                            <p className="text-sm text-gray-500 truncate">{brand.description}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="relative flex-shrink-0" ref={openDropdownId === brand._id ? dropdownRef : null}>
                                    <button
                                        onClick={(e) => toggleDropdown(e, brand._id)}
                                        className="p-1.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
                                        title="Actions"
                                    >
                                        <MoreVertical size={16} className="text-gray-600" />
                                    </button>

                                    {openDropdownId === brand._id && (
                                        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(brand); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>
                                            {!brand.isTransferred && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleTransfer(brand); }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                                    >
                                                        <ArrowRight size={14} />
                                                        Transfer
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleShowUsage(brand); }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50"
                                                    >
                                                        <Users size={14} />
                                                        Groups Using
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(brand); }}
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
                        <div className="text-center py-8 text-gray-500">No product brands found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a product group first</div>
                )}
            </div>

            <AddProductBrand
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                productGroupId={selectedProductGroup?._id}
            />

            <TransferProductBrand
                isOpen={isTransferOpen}
                onClose={handleTransferClose}
                onSuccess={handleTransferSuccess}
                productBrand={transferBrand}
                currentProductGroup={selectedProductGroup}
            />

            <GroupUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                title={usageData.title}
                groups={usageData.groups}
            />
        </div>
    );
}

export default ProductBrandList;
