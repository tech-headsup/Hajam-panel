import { useState, useEffect } from 'react';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchProductGroup, transferProductBrand } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';

function TransferProductBrand({ isOpen, onClose, onSuccess, productBrand, currentProductGroup }) {
    const [productGroups, setProductGroups] = useState([]);
    const [selectedProductGroup, setSelectedProductGroup] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [transferring, setTransferring] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProductGroups();
            setSelectedProductGroup('');
        }
    }, [isOpen]);

    const fetchProductGroups = () => {
        setLoadingGroups(true);
        const json = {
            page: 1,
            limit: 100,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0]
        };

        HitApi(json, searchProductGroup).then((res) => {
            if (res?.data?.docs) {
                setProductGroups(res.data.docs);
            } else {
                setProductGroups([]);
            }
        }).catch((err) => {
            console.error(err);
            setProductGroups([]);
        }).finally(() => {
            setLoadingGroups(false);
        });
    };

    const handleTransfer = () => {
        if (!selectedProductGroup) {
            toast.error('Please select a product group');
            return;
        }

        setTransferring(true);

        const payload = {
            productBrandId: productBrand._id,
            productGroupId: selectedProductGroup
        };

        HitApi(payload, transferProductBrand).then((res) => {
            if (res?.success || res?.statusCode === 201) {
                toast.success('Product brand transferred successfully');
                onSuccess?.();
                onClose();
            } else {
                toast.error(res?.message || 'Failed to transfer product brand');
            }
        }).catch((err) => {
            toast.error('Error transferring product brand');
            console.error(err);
        }).finally(() => {
            setTransferring(false);
        });
    };

    if (!isOpen || !productBrand) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <ArrowRight size={20} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Transfer Product Brand</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Current Product Brand Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500 mb-1">Transferring Product Brand:</p>
                        <p className="font-semibold text-gray-900">{productBrand.name}</p>
                        {productBrand.productSubCategoryId?.name && (
                            <p className="text-sm text-gray-600 mt-1">SubCategory: {productBrand.productSubCategoryId.name}</p>
                        )}
                        {productBrand.description && (
                            <p className="text-sm text-gray-600 mt-1">{productBrand.description}</p>
                        )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                            <strong>Note:</strong> This will transfer the product brand along with all its products to the selected product group. If the parent category and subcategory don't exist in the target group, they will be created automatically.
                        </p>
                    </div>

                    {/* Select Product Group */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Product Group <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProductGroup}
                            onChange={(e) => setSelectedProductGroup(e.target.value)}
                            disabled={loadingGroups}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="">Select Product Group</option>
                            {productGroups
                                .filter((group) => group._id !== currentProductGroup?._id)
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
                            disabled={transferring || !selectedProductGroup}
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

export default TransferProductBrand;
