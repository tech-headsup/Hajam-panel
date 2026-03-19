import { useState, useEffect } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, Users, ArrowRight, Search } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchProductSubCategory, deleteProductSubCategory, searchProductBrand } from '../../constant/Constant';
import toast from 'react-hot-toast';
import AddProductSubCategory from './AddProductSubCategory';
import GroupUsageModal from './GroupUsageModal';
import TransferProductSubCategory from './TransferProductSubCategory';

function ProductSubCategoryList({ selectedProductCategory, selectedProductSubCategory, onProductSubCategoryClick, selectedProductGroup }) {
    const [productSubCategories, setProductSubCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageData, setUsageData] = useState({ title: '', groups: [] });
    const [editData, setEditData] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferData, setTransferData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedProductCategory?._id) {
            fetchProductSubCategories();
        } else {
            setProductSubCategories([]);
        }
    }, [selectedProductCategory]);

    useEffect(() => {
        if (selectedProductCategory?._id) {
            const delaySearch = setTimeout(() => {
                fetchProductSubCategories();
            }, 300);
            return () => clearTimeout(delaySearch);
        }
    }, [searchTerm]);

    const fetchProductSubCategories = () => {
        const json = {
            page: 1,
            limit: 100000,
            search: searchTerm,
            productCategoryId: selectedProductCategory._id,
            productGroupId: selectedProductGroup?._id,
            populate: [{ path: 'groupUsing', select: 'name' }]
        };

        HitApi(json, searchProductSubCategory).then((res) => {
            if (res?.data?.docs) {
                setProductSubCategories(res.data.docs);
            } else {
                setProductSubCategories([]);
            }
        }).catch((err) => {
            setProductSubCategories([]);
            toast.error('Error fetching product subcategories');
            console.error(err);
        });
    };

    const handleAdd = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (subCategory) => {
        setEditData(subCategory);
        setIsModalOpen(true);
    };

    const handleDelete = async (subCategory) => {
        // Check if product brands exist under this subcategory
        try {
            const brandRes = await HitApi({
                page: 1,
                limit: 1,
                productSubCategoryId: subCategory._id,
                productCategoryId: selectedProductCategory?._id,
                productGroupId: selectedProductGroup?._id
            }, searchProductBrand);

            if (brandRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete product subcategory. Please delete all product brands first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${subCategory.name}"?`)) {
                HitApi({ _id: subCategory._id }, deleteProductSubCategory).then((res) => {
                    if (res?.success) {
                        toast.success('Product subcategory deleted successfully');
                        fetchProductSubCategories();
                    } else {
                        toast.error(res?.message || 'Failed to delete product subcategory');
                    }
                }).catch((err) => {
                    toast.error('Error deleting product subcategory');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking product brands');
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchProductSubCategories();
    };

    const handleShowUsage = (subCategory) => {
        setUsageData({
            title: subCategory.name,
            groups: subCategory.groupUsing || []
        });
        setIsUsageModalOpen(true);
    };

    const handleTransfer = (subCategory) => {
        setTransferData(subCategory);
        setIsTransferModalOpen(true);
    };

    return (
        <div className="min-w-[320px] w-[320px] bg-white border rounded-lg overflow-hidden flex-shrink-0">
            <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-900">SubCategories</h2>
                    {selectedProductCategory && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <CirclePlus size={14} />
                            Add
                        </button>
                    )}
                </div>
                {selectedProductCategory && (
                    <div className="relative">
                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search subcategories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                        />
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-110px)]">
                {selectedProductCategory ? (
                    productSubCategories.length > 0 ? (
                        productSubCategories.map((subCategory) => (
                            <div
                                key={subCategory._id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedProductSubCategory?._id === subCategory._id
                                        ? 'bg-green-50 border-l-4 border-green-600'
                                        : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onProductSubCategoryClick(subCategory)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <Menu size={16} className="text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">{subCategory.name}</span>
                                            {subCategory.isTransferred && (
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
                                    {!subCategory.isTransferred && (
                                        <>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTransfer(subCategory); }}
                                                className="p-1.5 hover:bg-blue-100 rounded"
                                                title="Transfer to Group"
                                            >
                                                <ArrowRight size={14} className="text-blue-600" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleShowUsage(subCategory); }}
                                                className="p-1.5 hover:bg-purple-100 rounded"
                                                title="Groups Using"
                                            >
                                                <Users size={14} className="text-purple-600" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(subCategory); }}
                                                className="p-1.5 hover:bg-gray-200 rounded"
                                            >
                                                <Pencil size={14} className="text-gray-600" />
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(subCategory); }}
                                        className="p-1.5 hover:bg-red-100 rounded"
                                    >
                                        <Trash2 size={14} className="text-red-600" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">No product subcategories found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a product category first</div>
                )}
            </div>

            <AddProductSubCategory
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                productCategoryId={selectedProductCategory?._id}
                productGroupId={selectedProductGroup?._id}
            />

            <GroupUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                title={usageData.title}
                groups={usageData.groups}
            />

            <TransferProductSubCategory
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onSuccess={handleSuccess}
                productSubCategory={transferData}
                currentProductGroup={selectedProductGroup}
            />
        </div>
    );
}

export default ProductSubCategoryList;
