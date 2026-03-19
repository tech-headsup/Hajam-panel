import { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchGroup, transferSubCategory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';

function BulkTransferSubCategory({ isOpen, onClose, onSuccess, subCategories, currentGroup }) {
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
            setSelectedGroup('');
            setProgress({ current: 0, total: 0 });
            setResults([]);
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

    const handleBulkTransfer = async () => {
        if (!selectedGroup) {
            toast.error('Please select a group');
            return;
        }

        setTransferring(true);
        setProgress({ current: 0, total: subCategories.length });
        setResults([]);

        const transferResults = [];

        for (let i = 0; i < subCategories.length; i++) {
            const subCategory = subCategories[i];
            setProgress({ current: i + 1, total: subCategories.length });

            try {
                const payload = {
                    subCategoryId: subCategory._id,
                    groupId: selectedGroup
                };

                const res = await HitApi(payload, transferSubCategory);

                if (res?.success || res?.statusCode === 201) {
                    transferResults.push({ name: subCategory.name, success: true });
                } else {
                    transferResults.push({ name: subCategory.name, success: false, error: res?.message || 'Failed' });
                }
            } catch (err) {
                transferResults.push({ name: subCategory.name, success: false, error: 'Error occurred' });
            }

            setResults([...transferResults]);
        }

        const successCount = transferResults.filter(r => r.success).length;
        const failCount = transferResults.filter(r => !r.success).length;

        if (successCount > 0) {
            toast.success(`${successCount} subcategory(s) transferred successfully`);
        }
        if (failCount > 0) {
            toast.error(`${failCount} subcategory(s) failed to transfer`);
        }

        setTransferring(false);

        if (successCount > 0) {
            onSuccess?.();
        }
    };

    const handleClose = () => {
        if (!transferring) {
            onClose();
        }
    };

    if (!isOpen || !subCategories?.length) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <ArrowRight size={20} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Bulk Transfer SubCategories</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={transferring}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Selected SubCategories */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500 mb-2">Selected SubCategories ({subCategories.length}):</p>
                        <div className="max-h-32 overflow-y-auto space-y-1">
                            {subCategories.map((subCategory, idx) => {
                                const result = results[idx];
                                return (
                                    <div key={subCategory._id} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-900 truncate">{subCategory.name}</span>
                                        {result && (
                                            result.success ? (
                                                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                            ) : (
                                                <XCircle size={16} className="text-red-500 flex-shrink-0" />
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Warning Note */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> Each subcategory will be transferred along with all its services to the selected group.
                        </p>
                    </div>

                    {/* Progress */}
                    {transferring && (
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Loader2 size={16} className="animate-spin text-blue-600" />
                                <span className="text-sm text-blue-800">
                                    Transferring {progress.current} of {progress.total}...
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Select Group */}
                    {!transferring && results.length === 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Target Group <span className="text-red-500">*</span>
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
                    )}

                    {/* Results Summary */}
                    {results.length > 0 && !transferring && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900 mb-2">Transfer Complete</p>
                            <div className="flex gap-4 text-sm">
                                <span className="text-green-600">
                                    Success: {results.filter(r => r.success).length}
                                </span>
                                <span className="text-red-600">
                                    Failed: {results.filter(r => !r.success).length}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 p-4 border-t">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={transferring}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        {results.length > 0 ? 'Close' : 'Cancel'}
                    </button>
                    {results.length === 0 && (
                        <button
                            onClick={handleBulkTransfer}
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
                                    Transfer All
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BulkTransferSubCategory;
