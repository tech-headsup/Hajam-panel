import { useState, useEffect } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, Users, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchSubCategory, deleteSubCategory, searchService } from '../../constant/Constant';
import toast from 'react-hot-toast';
import AddSubCategory from './AddSubCategory';
import GroupUsageModal from './GroupUsageModal';
import TransferSubCategory from './TransferSubCategory';
import BulkTransferSubCategory from './BulkTransferSubCategory';
import BulkDeleteSubCategory from './BulkDeleteSubCategory';

function SubCategoryList({ selectedCategory, selectedSubCategory, onSubCategoryClick, selectedGroup }) {
    const [subCategories, setSubCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageData, setUsageData] = useState({ title: '', groups: [] });
    const [editData, setEditData] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferData, setTransferData] = useState(null);
    const [selectedSubCategories, setSelectedSubCategories] = useState([]);
    const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    useEffect(() => {
        if (selectedCategory?._id) {
            fetchSubCategories();
            setSelectedSubCategories([]);
        } else {
            setSubCategories([]);
            setSelectedSubCategories([]);
        }
    }, [selectedCategory]);

    const fetchSubCategories = () => {
        const json = {
            page: 1,
            limit: 100000,
            categoryId: selectedCategory._id,
            populate: [{ path: 'groupUsing', select: 'name' }]
        };

        HitApi(json, searchSubCategory).then((res) => {
            if (res?.data?.docs) {
                setSubCategories(res.data.docs);
            } else {
                setSubCategories([]);
            }
        }).catch((err) => {
            setSubCategories([]);
            toast.error('Error fetching subcategories');
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
        // Check if services exist under this subcategory
        try {
            const serviceRes = await HitApi({
                page: 1,
                limit: 1,
                search: { subCategoryId: subCategory._id }
            }, searchService);

            if (serviceRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete subcategory. Please delete all services first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${subCategory.name}"?`)) {
                HitApi({ _id: subCategory._id }, deleteSubCategory).then((res) => {
                    if (res?.success) {
                        toast.success('SubCategory deleted successfully');
                        fetchSubCategories();
                    } else {
                        toast.error(res?.message || 'Failed to delete subcategory');
                    }
                }).catch((err) => {
                    toast.error('Error deleting subcategory');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking services');
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchSubCategories();
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

    const toggleSubCategorySelection = (subCategory) => {
        setSelectedSubCategories(prev => {
            const isSelected = prev.some(s => s._id === subCategory._id);
            if (isSelected) {
                return prev.filter(s => s._id !== subCategory._id);
            } else {
                return [...prev, subCategory];
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedSubCategories.length === subCategories.length) {
            setSelectedSubCategories([]);
        } else {
            setSelectedSubCategories([...subCategories]);
        }
    };

    const handleBulkTransfer = () => {
        if (selectedSubCategories.length === 0) {
            toast.error('Please select subcategories to transfer');
            return;
        }
        setIsBulkTransferOpen(true);
    };

    const handleBulkTransferSuccess = () => {
        fetchSubCategories();
        setSelectedSubCategories([]);
    };

    const handleBulkDelete = () => {
        if (selectedSubCategories.length === 0) {
            toast.error('Please select subcategories to delete');
            return;
        }
        setIsBulkDeleteOpen(true);
    };

    const handleBulkDeleteSuccess = () => {
        fetchSubCategories();
        setSelectedSubCategories([]);
    };

    return (
        <div className="w-1/4 bg-white border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">SubCategories</h2>
                    {selectedCategory && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <CirclePlus size={14} />
                            Add
                        </button>
                    )}
                </div>
                {selectedCategory && subCategories.length > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            {selectedSubCategories.length === subCategories.length ? (
                                <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                                <Square size={16} />
                            )}
                            {selectedSubCategories.length === subCategories.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedSubCategories.length > 0 && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBulkTransfer}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <ArrowRight size={14} />
                                    Transfer ({selectedSubCategories.length})
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={14} />
                                    Delete ({selectedSubCategories.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-60px)]">
                {selectedCategory ? (
                    subCategories.length > 0 ? (
                        subCategories.map((subCategory) => (
                            <div
                                key={subCategory._id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedSubCategory?._id === subCategory._id
                                        ? 'bg-green-50 border-l-4 border-green-600'
                                        : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onSubCategoryClick(subCategory)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleSubCategorySelection(subCategory); }}
                                        className="flex-shrink-0"
                                    >
                                        {selectedSubCategories.some(s => s._id === subCategory._id) ? (
                                            <CheckSquare size={16} className="text-blue-600" />
                                        ) : (
                                            <Square size={16} className="text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">{subCategory.name}</span>
                                        </div>
                                        {subCategory.gender && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                subCategory.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                subCategory.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {subCategory.gender}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
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
                        <div className="text-center py-8 text-gray-500">No subcategories found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a category first</div>
                )}
            </div>

            <AddSubCategory
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                categoryId={selectedCategory?._id}
                groupId={selectedGroup?._id}
            />

            <GroupUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                title={usageData.title}
                groups={usageData.groups}
            />

            <TransferSubCategory
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onSuccess={handleSuccess}
                subCategory={transferData}
                currentGroup={selectedGroup}
            />

            <BulkTransferSubCategory
                isOpen={isBulkTransferOpen}
                onClose={() => setIsBulkTransferOpen(false)}
                onSuccess={handleBulkTransferSuccess}
                subCategories={selectedSubCategories}
                currentGroup={selectedGroup}
            />

            <BulkDeleteSubCategory
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onSuccess={handleBulkDeleteSuccess}
                subCategories={selectedSubCategories}
            />
        </div>
    );
}

export default SubCategoryList;
