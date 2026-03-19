import { useState } from 'react';
import { X, Trash2, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { deleteCategory, searchSubCategory } from '../../constant/Constant';
import toast from 'react-hot-toast';

function BulkDeleteCategory({ isOpen, onClose, onSuccess, categories }) {
    const [deleting, setDeleting] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState([]);

    const handleBulkDelete = async () => {
        setDeleting(true);
        setProgress({ current: 0, total: categories.length });
        setResults([]);

        const deleteResults = [];

        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            setProgress({ current: i + 1, total: categories.length });

            try {
                // Check for subcategories first
                const subCatRes = await HitApi({
                    page: 1,
                    limit: 1,
                    categoryId: category._id
                }, searchSubCategory);

                if (subCatRes?.data?.docs?.length > 0) {
                    deleteResults.push({
                        name: category.name,
                        success: false,
                        error: 'Has subcategories'
                    });
                    setResults([...deleteResults]);
                    continue;
                }

                const res = await HitApi({ _id: category._id }, deleteCategory);

                if (res?.success || res?.statusCode === 200) {
                    deleteResults.push({ name: category.name, success: true });
                } else {
                    deleteResults.push({ name: category.name, success: false, error: res?.message || 'Failed' });
                }
            } catch (err) {
                deleteResults.push({ name: category.name, success: false, error: 'Error occurred' });
            }

            setResults([...deleteResults]);
        }

        const successCount = deleteResults.filter(r => r.success).length;
        const failCount = deleteResults.filter(r => !r.success).length;

        if (successCount > 0) {
            toast.success(`${successCount} category(s) deleted successfully`);
        }
        if (failCount > 0) {
            toast.error(`${failCount} category(s) failed to delete`);
        }

        setDeleting(false);

        if (successCount > 0) {
            onSuccess?.();
        }
    };

    const handleClose = () => {
        if (!deleting) {
            setProgress({ current: 0, total: 0 });
            setResults([]);
            onClose();
        }
    };

    if (!isOpen || !categories?.length) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Trash2 size={20} className="text-red-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Bulk Delete Categories</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={deleting}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Warning */}
                    {results.length === 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Warning: This action cannot be undone!</p>
                                <p className="text-sm text-red-700 mt-1">
                                    Categories with subcategories will be skipped.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Selected Categories */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500 mb-2">Categories to delete ({categories.length}):</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                            {categories.map((category, idx) => {
                                const result = results[idx];
                                return (
                                    <div key={category._id} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 truncate">
                                            <span className="text-gray-900 truncate">{category.name}</span>
                                            {result && !result.success && result.error === 'Has subcategories' && (
                                                <span className="text-xs text-amber-600">(has children)</span>
                                            )}
                                        </div>
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

                    {/* Progress */}
                    {deleting && (
                        <div className="bg-red-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <Loader2 size={16} className="animate-spin text-red-600" />
                                <span className="text-sm text-red-800">
                                    Processing {progress.current} of {progress.total}...
                                </span>
                            </div>
                            <div className="w-full bg-red-200 rounded-full h-2">
                                <div
                                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Results Summary */}
                    {results.length > 0 && !deleting && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900 mb-2">Deletion Complete</p>
                            <div className="flex gap-4 text-sm">
                                <span className="text-green-600">
                                    Deleted: {results.filter(r => r.success).length}
                                </span>
                                <span className="text-red-600">
                                    Failed/Skipped: {results.filter(r => !r.success).length}
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
                        disabled={deleting}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                        {results.length > 0 ? 'Close' : 'Cancel'}
                    </button>
                    {results.length === 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} />
                                    Delete All
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BulkDeleteCategory;
