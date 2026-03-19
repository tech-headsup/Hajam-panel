import { useState, useEffect } from 'react';
import { X, Plus, Trash2, BarChart3, Save, Loader2 } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { updateProduct } from '../../constant/Constant';
import toast from 'react-hot-toast';

function BarcodeModal({ isOpen, onClose, product, onBarcodeUpdate }) {
    const [barcodes, setBarcodes] = useState([]);
    const [newBarcode, setNewBarcode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initialize barcodes when modal opens
    useEffect(() => {
        if (isOpen && product) {
            setBarcodes(product.barcodes || []);
            setNewBarcode('');
        }
    }, [isOpen, product]);

    // Handle adding new barcode
    const handleAddBarcode = () => {
        if (!newBarcode.trim()) {
            toast.error('Please enter a barcode');
            return;
        }

        // Check for duplicates
        if (barcodes.includes(newBarcode.trim())) {
            toast.error('This barcode already exists for this product');
            return;
        }

        setBarcodes([...barcodes, newBarcode.trim()]);
        setNewBarcode('');
        toast.success('Barcode added');
    };

    // Handle removing barcode
    const handleRemoveBarcode = (index) => {
        const updatedBarcodes = barcodes.filter((_, i) => i !== index);
        setBarcodes(updatedBarcodes);
        toast.success('Barcode removed');
    };

    // Handle saving barcodes
    const handleSave = async () => {
        setIsLoading(true);
        try {
            const updateData = {
                _id: product._id,
                barcodes: barcodes
            };

            const response = await HitApi(updateData, updateProduct);

            if (response?.statusCode === 200) {
                toast.success('Barcodes updated successfully');
                onBarcodeUpdate?.(product._id, barcodes);
                onClose();
            } else {
                throw new Error(response?.message || 'Failed to update barcodes');
            }
        } catch (error) {
            console.error('Error updating barcodes:', error);
            toast.error(`Failed to update barcodes: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Enter key press in input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddBarcode();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Manage Barcodes
                            </h2>
                            <p className="text-sm text-gray-500">
                                {product?.productName || 'Product'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    {/* Add New Barcode Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add New Barcode
                        </label>
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={newBarcode}
                                    onChange={(e) => setNewBarcode(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Enter barcode number..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={isLoading}
                                />
                            </div>
                            <button
                                onClick={handleAddBarcode}
                                disabled={isLoading || !newBarcode.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                <Plus className="h-4 w-4" />
                                <span>Add</span>
                            </button>
                        </div>
                    </div>

                    {/* Existing Barcodes List */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-700">
                                Existing Barcodes ({barcodes.length})
                            </h3>
                        </div>

                        {barcodes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">No barcodes added yet</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Add your first barcode using the input above
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {barcodes.map((barcode, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                    >
                                        <div className="flex items-center space-x-3 flex-1">
                                            <BarChart3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <span className="font-mono text-sm text-gray-900 break-all">
                                                {barcode}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveBarcode(index)}
                                            disabled={isLoading}
                                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 p-1"
                                            title="Remove barcode"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tips Section */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• You can add multiple barcodes for the same product</li>
                            <li>• Each barcode must be unique for this product</li>
                            <li>• Press Enter in the input field to quickly add a barcode</li>
                            <li>• Barcodes are automatically saved when you click "Save Changes"</li>
                        </ul>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4" />
                        )}
                        <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BarcodeModal;