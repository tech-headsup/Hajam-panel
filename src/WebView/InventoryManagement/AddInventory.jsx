import { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { addInventory, updateInventory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';

function AddInventory({ isOpen, onClose, onSuccess, product, editData }) {
    const [formData, setFormData] = useState({
        qty: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Always start with empty qty field - user enters quantity to add
        setFormData({
            qty: ''
        });
    }, [editData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.qty) {
            toast.error('Quantity is required');
            return;
        }

        setLoading(true);

        const selectedUnit = getSelectedUnit();
        const enteredQty = formData.qty ? Number(formData.qty) : 0;

        const payload = {
            productId: product._id,
            unitIds: selectedUnit?._id || selectedUnit?.[0],
            groupId: selectedUnit?.serviceGroupId
        };

        if (editData?._id) {
            // Update: Add to existing quantity
            payload._id = editData._id;
            payload.qty = (editData.qty || 0) + enteredQty;
            payload.stockIn = (editData.stockIn || 0) + enteredQty;
        } else {
            // New: Set initial quantity
            payload.qty = enteredQty;
            payload.stockIn = enteredQty;
        }

        const api = editData?._id ? updateInventory : addInventory;

        HitApi(payload, api).then((res) => {
            if (res?.success || res?.statusCode === 201 || res?.statusCode === 200) {
                toast.success(editData?._id ? 'Inventory updated successfully' : 'Inventory added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(res?.message || 'Failed to save inventory');
            }
        }).catch((err) => {
            toast.error('Error saving inventory');
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    };

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editData?._id ? 'Edit Inventory' : 'Add Inventory'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        {product.productImageUrl ? (
                            <img
                                src={product.productImageUrl}
                                alt={product.productName}
                                className="w-14 h-14 object-cover rounded"
                            />
                        ) : (
                            <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center">
                                <Package size={24} className="text-gray-400" />
                            </div>
                        )}
                        <div>
                            <p className="font-semibold text-gray-900">{product.productName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                {product.brand && <span>{product.brand}</span>}
                                {product.brand && product.productType && <span>•</span>}
                                {product.productType && <span>{product.productType}</span>}
                            </div>
                            <p className="text-sm text-gray-600">MRP: ₹{product.mrp || 0} | Sell: ₹{product.sellPrice || 0}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Show current stock when editing */}
                    {editData?._id && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-blue-700">Current Stock</span>
                                <span className="text-lg font-bold text-blue-900">{editData.qty || 0}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {editData?._id ? 'Add Quantity' : 'Quantity'} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="qty"
                            value={formData.qty}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder={editData?._id ? 'Enter quantity to add' : 'Enter quantity'}
                            min="1"
                        />
                        {editData?._id && formData.qty && (
                            <p className="text-sm text-green-600 mt-2">
                                New total: <span className="font-bold">{(editData.qty || 0) + Number(formData.qty || 0)}</span>
                            </p>
                        )}
                        {!editData?._id && (
                            <p className="text-xs text-gray-500 mt-1">Initial stock quantity</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (editData?._id ? 'Update' : 'Add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddInventory;
