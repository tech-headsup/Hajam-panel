import { useState, useEffect } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, Search } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchProductGroup, deleteProductGroup, searchProductCategory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import AddProductGroup from './AddProductGroup';

function ProductGroupList({ selectedProductGroup, onProductGroupClick }) {
    const [productGroups, setProductGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProductGroups();
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchProductGroups();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const fetchProductGroups = () => {
        const json = {
            page: 1,
            limit: 100000,
            search: searchTerm,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
        };

        HitApi(json, searchProductGroup).then((res) => {
            if (res?.data?.docs) {
                setProductGroups(res.data.docs);
            } else {
                setProductGroups([]);
            }
        }).catch((err) => {
            setProductGroups([]);
            toast.error('Error fetching product groups');
            console.error(err);
        });
    };

    const handleAdd = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group) => {
        setEditData(group);
        setIsModalOpen(true);
    };

    const handleDelete = async (group) => {
        // Check if product categories exist under this group
        try {
            const catRes = await HitApi({
                page: 1,
                limit: 1,
                productGroupId: group._id
            }, searchProductCategory);

            if (catRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete product group. Please delete all product categories first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
                HitApi({ _id: group._id }, deleteProductGroup).then((res) => {
                    if (res?.success) {
                        toast.success('Product group deleted successfully');
                        fetchProductGroups();
                    } else {
                        toast.error(res?.message || 'Failed to delete product group');
                    }
                }).catch((err) => {
                    toast.error('Error deleting product group');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking product categories');
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchProductGroups();
    };

    return (
        <div className="min-w-[320px] w-[320px] bg-white border rounded-lg overflow-hidden flex-shrink-0">
            <div className="p-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-900">Groups</h2>
                    <button
                        onClick={handleAdd}
                        className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                    >
                        <CirclePlus size={14} />
                        Add
                    </button>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                    />
                </div>
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-110px)]">
                {productGroups.length > 0 ? (
                    productGroups.map((group) => (
                        <div
                            key={group._id}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedProductGroup?._id === group._id
                                    ? 'bg-purple-50 border-l-4 border-purple-600'
                                    : 'hover:bg-gray-50'
                            }`}
                            onClick={() => onProductGroupClick(group)}
                        >
                            <div className="flex items-center gap-3">
                                <Menu size={16} className="text-gray-400" />
                                <span className="font-medium text-gray-900">{group.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleEdit(group); }}
                                    className="p-1.5 hover:bg-gray-200 rounded"
                                >
                                    <Pencil size={14} className="text-gray-600" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(group); }}
                                    className="p-1.5 hover:bg-red-100 rounded"
                                >
                                    <Trash2 size={14} className="text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-500">No product groups found</div>
                )}
            </div>

            <AddProductGroup
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
            />
        </div>
    );
}

export default ProductGroupList;
