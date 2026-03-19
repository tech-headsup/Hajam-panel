import { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchGroup, transferCategory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';

function TransferCategory({ isOpen, onClose, onSuccess, category, currentGroup }) {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [transferring, setTransferring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
            setSelectedGroup('');
        }
    }, [isOpen]);

    const fetchGroups = () => {
        setLoadingGroups(true);
        const json = {
            page: 1,
            limit: 100,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
        };

        HitApi(json, searchGroup).then((res) => {
            if (res?.data?.docs) {
                setGroups(res.data.docs);
            } else {
                setGroups([]);
            }
        }).catch((err) => {
            console.error(err);
            setGroups([]);
        }).finally(() => {
            setLoadingGroups(false);
        });
    };

    const handleTransfer = () => {
        if (!selectedGroup) {
            toast.error('Please select a group');
            return;
        }

        setTransferring(true);

        const payload = {
            categoryId: category._id,
            groupId: selectedGroup
        };

        HitApi(payload, transferCategory).then((res) => {
            if (res?.success || res?.statusCode === 201) {
                toast.success('Category transferred successfully');
                onSuccess?.();
                onClose();
            } else {
                toast.error(res?.message || 'Failed to transfer category');
            }
        }).catch((err) => {
            toast.error('Error transferring category');
            console.error(err);
        }).finally(() => {
            setTransferring(false);
        });
    };

    if (!isOpen || !category) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <ArrowRight size={20} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Transfer Category</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Current Category Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500 mb-1">Transferring Category:</p>
                        <p className="font-semibold text-gray-900">{category.name}</p>
                        {category.description && (
                            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        )}
                        {category.gender && (
                            <span className={`inline-block mt-1 text-xs px-1.5 py-0.5 rounded ${
                                category.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                category.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {category.gender}
                            </span>
                        )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> This will transfer the category along with all its subcategories and services to the selected group.
                        </p>
                    </div>

                    {/* Select Group */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Group <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            disabled={loadingGroups}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Select Group</option>
                            {groups
                                .filter((group) => group._id !== currentGroup?._id)
                                .map((group) => (
                                    <option key={group._id} value={group._id}>
                                        {group.name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTransfer}
                            disabled={transferring || !selectedGroup}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {transferring ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Transferring...
                                </>
                            ) : (
                                <>
                                    <ArrowRight size={16} />
                                    Transfer
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TransferCategory;
