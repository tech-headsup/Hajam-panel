import { useState, useEffect } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, Users, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchCategory, deleteCategory, searchSubCategory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import AddCategory from './AddCategory';
import GroupUsageModal from './GroupUsageModal';
import TransferCategory from './TransferCategory';
import BulkTransferCategory from './BulkTransferCategory';
import BulkDeleteCategory from './BulkDeleteCategory';

function CategoryList({ selectedGroup, selectedCategory, onCategoryClick }) {
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageData, setUsageData] = useState({ title: '', groups: [] });
    const [editData, setEditData] = useState(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferData, setTransferData] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

    useEffect(() => {
        if (selectedGroup?._id) {
            fetchCategories();
            setSelectedCategories([]);
        } else {
            setCategories([]);
            setSelectedCategories([]);
        }
    }, [selectedGroup]);

    const fetchCategories = () => {
        const json = {
            page: 1,
            limit: 100000,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0],
            groupId: selectedGroup._id,
            populate: [{ path: 'groupUsing', select: 'name' }]
        };

        HitApi(json, searchCategory).then((res) => {
            if (res?.data?.docs) {
                setCategories(res.data.docs);
            } else {
                setCategories([]);
            }
        }).catch((err) => {
            setCategories([]);
            toast.error('Error fetching categories');
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
        // Check if subcategories exist under this category
        try {
            const subCatRes = await HitApi({
                page: 1,
                limit: 1,
                categoryId: category._id
            }, searchSubCategory);

            if (subCatRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete category. Please delete all subcategories first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
                HitApi({ _id: category._id }, deleteCategory).then((res) => {
                    if (res?.success) {
                        toast.success('Category deleted successfully');
                        fetchCategories();
                    } else {
                        toast.error(res?.message || 'Failed to delete category');
                    }
                }).catch((err) => {
                    toast.error('Error deleting category');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking subcategories');
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchCategories();
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

    const toggleCategorySelection = (category) => {
        setSelectedCategories(prev => {
            const isSelected = prev.some(c => c._id === category._id);
            if (isSelected) {
                return prev.filter(c => c._id !== category._id);
            } else {
                return [...prev, category];
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedCategories.length === categories.length) {
            setSelectedCategories([]);
        } else {
            setSelectedCategories([...categories]);
        }
    };

    const handleBulkTransfer = () => {
        if (selectedCategories.length === 0) {
            toast.error('Please select categories to transfer');
            return;
        }
        setIsBulkTransferOpen(true);
    };

    const handleBulkTransferSuccess = () => {
        fetchCategories();
        setSelectedCategories([]);
    };

    const handleBulkDelete = () => {
        if (selectedCategories.length === 0) {
            toast.error('Please select categories to delete');
            return;
        }
        setIsBulkDeleteOpen(true);
    };

    const handleBulkDeleteSuccess = () => {
        fetchCategories();
        setSelectedCategories([]);
    };

    return (
        <div className="w-1/4 bg-white border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Categories</h2>
                    {selectedGroup && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <CirclePlus size={14} />
                            Add
                        </button>
                    )}
                </div>
                {selectedGroup && categories.length > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            {selectedCategories.length === categories.length ? (
                                <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                                <Square size={16} />
                            )}
                            {selectedCategories.length === categories.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedCategories.length > 0 && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBulkTransfer}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <ArrowRight size={14} />
                                    Transfer ({selectedCategories.length})
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={14} />
                                    Delete ({selectedCategories.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-60px)]">
                {selectedGroup ? (
                    categories.length > 0 ? (
                        categories.map((category) => (
                            <div
                                key={category._id}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    selectedCategory?._id === category._id
                                        ? 'bg-blue-50 border-l-4 border-blue-600'
                                        : 'hover:bg-gray-50'
                                }`}
                                onClick={() => onCategoryClick(category)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleCategorySelection(category); }}
                                        className="flex-shrink-0"
                                    >
                                        {selectedCategories.some(c => c._id === category._id) ? (
                                            <CheckSquare size={16} className="text-blue-600" />
                                        ) : (
                                            <Square size={16} className="text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 truncate">{category.name}</span>
                                        </div>
                                        {category.gender && (
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                category.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                category.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {category.gender}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
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
                        <div className="text-center py-8 text-gray-500">No categories found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a group first</div>
                )}
            </div>

            <AddCategory
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                groupId={selectedGroup?._id}
            />

            <GroupUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                title={usageData.title}
                groups={usageData.groups}
            />

            <TransferCategory
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                onSuccess={handleSuccess}
                category={transferData}
                currentGroup={selectedGroup}
            />

            <BulkTransferCategory
                isOpen={isBulkTransferOpen}
                onClose={() => setIsBulkTransferOpen(false)}
                onSuccess={handleBulkTransferSuccess}
                categories={selectedCategories}
                currentGroup={selectedGroup}
            />

            <BulkDeleteCategory
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onSuccess={handleBulkDeleteSuccess}
                categories={selectedCategories}
            />
        </div>
    );
}

export default CategoryList;
