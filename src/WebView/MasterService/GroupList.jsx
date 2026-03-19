import { useState, useEffect } from 'react';
import { Menu, CirclePlus, Pencil, Trash2 } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchGroup, deleteGroup, searchCategory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import AddGroup from './AddGroup';

function GroupList({ selectedGroup, onGroupClick }) {
    const [groups, setGroups] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = () => {
        const json = {
            page: 1,
            limit: 100000,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
        };

        HitApi(json, searchGroup).then((res) => {
            if (res?.data?.docs) {
                setGroups(res.data.docs);
            } else {
                setGroups([]);
            }
        }).catch((err) => {
            setGroups([]);
            toast.error('Error fetching groups');
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
        // Check if categories exist under this group
        try {
            const catRes = await HitApi({
                page: 1,
                limit: 1,
                groupId: group._id
            }, searchCategory);

            if (catRes?.data?.docs?.length > 0) {
                toast.error('Cannot delete group. Please delete all categories first.');
                return;
            }

            if (window.confirm(`Are you sure you want to delete "${group.name}"?`)) {
                HitApi({ _id: group._id }, deleteGroup).then((res) => {
                    if (res?.success) {
                        toast.success('Group deleted successfully');
                        fetchGroups();
                    } else {
                        toast.error(res?.message || 'Failed to delete group');
                    }
                }).catch((err) => {
                    toast.error('Error deleting group');
                    console.error(err);
                });
            }
        } catch (err) {
            toast.error('Error checking categories');
            console.error(err);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleSuccess = () => {
        fetchGroups();
    };

    return (
        <div className="w-1/4 bg-white border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Groups</h2>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                >
                    <CirclePlus size={14} />
                    Add
                </button>
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-60px)]">
                {groups.length > 0 ? (
                    groups.map((group) => (
                        <div
                            key={group._id}
                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedGroup?._id === group._id
                                    ? 'bg-purple-50 border-l-4 border-purple-600'
                                    : 'hover:bg-gray-50'
                            }`}
                            onClick={() => onGroupClick(group)}
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
                    <div className="text-center py-8 text-gray-500">No groups found</div>
                )}
            </div>

            <AddGroup
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
            />
        </div>
    );
}

export default GroupList;
