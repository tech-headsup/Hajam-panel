import { useState, useEffect } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, Users, ArrowRight, Search } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchProductCategory, deleteProductCategory, searchProductSubCategory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import AddProductCategory from './AddProductCategory';
import GroupUsageModal from './GroupUsageModal';
import TransferProductCategory from './TransferProductCategory';

function ProductCategoryList({ selectedProductGroup, selectedProductCategory, onProductCategoryClick }) {
    const [productCategories, setProductCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageData, setUsageData] = useState({ title: '', groups: [] });
    const [editData, setEditData] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferData, setTransferData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedProductGroup?._id) {
            fetchProductCategories();
        } else {
            setProductCategories([]);
        }
    }, [selectedProductGroup]);

    useEffect(() => {
        if (selectedProductGroup?._id) {
            const delaySearch = setTimeout(() => {
                fetchProductCategories();
            }, 300);
            return () => clearTimeout(delaySearch);
        }
    }, [searchTerm]);

    const fetchProductCategories = () => {
        const json = {
            page: 1,
            limit: 100000,
            search: searchTerm,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0],
            productGroupId: selectedProductGroup._id,
            populate: [{ path: 'groupUsing', select: 'name' }]
        };

        HitApi(json, searchProductCategory).then((res) => {
            if (res?.data?.docs) {
                setProductCategories(res.data.docs);
            } else {
                setProductCategories([]);
            }
        }).catch((err) => {
            setProductCategories([]);
            toast.error('Error fetching product categories');
            console.error(err);
        });
    };

    const handleAdd = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category) => {
        setEditData(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (category) => {
        // Check if product subcategories exist under this category
        try {
            const subCatRes = await HitApi({
                page: 1,
                limit: 1,
                productCategoryId: category._id,
                productGroupId: selectedProductGroup?._id
            }, searchProductSubCategory);

            if (subCatRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete product category. Please delete all product subcategories first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
                HitApi({ _id: category._id }, deleteProductCategory).then((res) => {
                    if (res?.success) {
                        toast.success('Product category deleted successfully');
                        fetchProductCategories();
                    } else {
                        toast.error(res?.message || 'Failed to delete product category');
                    }
                }).catch((err) => {
                    toast.error('Error deleting product category');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking product subcategories');
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchProductCategories();
    };

    const handleShowUsage = (category) => {
        setUsageData({
            title: category.name,
            groups: category.groupUsing || []
        });
        setIsUsageModalOpen(true);
    };

    const handleTransfer = (category) => {
        setTransferData(category);
        setIsTransferModalOpen(true);
    };

    return (
        <div className="min-w-[320px] w-[320px] bg-white border rounded-lg overflow-hidden flex-shrink-0">
            <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
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
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-110px)]">
                {selectedProductGroup ? (
                    productCategories.length > 0 ? (
                        productCategories.map((category) => (
                            <div
                                key={category._id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedProductCategory?._id === category._id
                                        ? 'bg-blue-50 border-l-4 border-blue-600'
                                        : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onProductCategoryClick(category)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Menu size={16} className="text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">{category.name}</span>
                                            {category.isTransferred && (
                                                <span
                                                    className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-xs font-semibold flex-shrink-0 cursor-help"
                                                    title="Transferred"
                                                >
                                                    T
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                    {!category.isTransferred && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTransfer(category); }}
                                                className="p-1.5 hover:bg-blue-100 rounded"
                                                title="Transfer to Group"
                                            >
                                                <ArrowRight size={14} className="text-blue-600" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleShowUsage(category); }}
                                                className="p-1.5 hover:bg-purple-100 rounded"
                                                title="Groups Using"
                                            >
                                                <Users size={14} className="text-purple-600" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                                                className="p-1.5 hover:bg-gray-200 rounded"
                                            >
                                                <Pencil size={14} className="text-gray-600" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(category); }}
                                        className="p-1.5 hover:bg-red-100 rounded"
                                    >
                                        <Trash2 size={14} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">No product categories found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a product group first</div>
                )}
            </div>

            <AddProductCategory
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                productGroupId={selectedProductGroup?._id}
            />

            <GroupUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                title={usageData.title}
                groups={usageData.groups}
            />

            <TransferProductCategory
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onSuccess={handleSuccess}
                productCategory={transferData}
                currentProductGroup={selectedProductGroup}
            />
        </div>
    );
}

export default ProductCategoryList;
