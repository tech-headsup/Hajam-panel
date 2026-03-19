import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Trash2 } from 'lucide-react';
import { HitApi, HitApiFormData } from '../../Api/ApiHit';
import { addProduct, updateProduct, uploadSingleNew, projectKey, secretKey } from '../../constant/Constant';
import { getSelectedUnit, getAcessToken } from '../../storage/Storage';
import toast from 'react-hot-toast';

const unitOptions = [
    { value: 'ml', label: 'ml' },
    { value: 'L', label: 'L' },
    { value: 'g', label: 'g' },
    { value: 'kg', label: 'kg' },
    { value: 'pcs', label: 'pcs' },
    { value: 'pack', label: 'pack' },
    { value: 'box', label: 'box' },
    { value: 'bottle', label: 'bottle' },
    { value: 'tube', label: 'tube' },
    { value: 'sachet', label: 'sachet' }
];

function AddProduct({ isOpen, onClose, onSuccess, editData, productBrandId, productSubCategoryId, productCategoryId, productGroupId }) {
    const [formData, setFormData] = useState({
        productName: '',
        description: '',
        mrp: '',
        costPrice: '',
        sellPrice: '',
        unit: '',
        netQuantity: '',
        productImageUrl: ''
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                productName: editData.productName || '',
                description: editData.description || '',
                mrp: editData.mrp || '',
                costPrice: editData.costPrice || '',
                sellPrice: editData.sellPrice || '',
                unit: editData.unit || '',
                netQuantity: editData.netQuantity || '',
                productImageUrl: editData.productImageUrl || ''
            });
        } else {
            setFormData({
                productName: '',
                description: '',
                mrp: '',
                costPrice: '',
                sellPrice: '',
                unit: '',
                netQuantity: '',
                productImageUrl: ''
            });
        }
    }, [editData, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-set selling price when MRP changes
        if (name === 'mrp' && !editData) {
            setFormData(prev => ({
                ...prev,
                mrp: value,
                sellPrice: value
            }));
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        setUploading(true);

        try {
            const token = getAcessToken();
            const uploadData = {
                file: file,
                userId: secretKey,
                projectKey: projectKey
            };

            const response = await HitApiFormData(
                uploadData,
                uploadSingleNew,
                'POST',
                { 'Authorization': `Bearer ${token}` }
            );

            if (response?.success && response?.file?.s3Url) {
                setFormData(prev => ({
                    ...prev,
                    productImageUrl: response.file.s3Url
                }));
                toast.success('Image uploaded successfully');
            } else {
                toast.error('Failed to upload image');
            }
        } catch (err) {
            toast.error('Error uploading image');
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            productImageUrl: ''
        }));
    };

    // Convert to Title Case
    const toTitleCase = (text) => {
        if (!text) return "";
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleProductNameChange = (e) => {
        const value = toTitleCase(e.target.value);
        setFormData(prev => ({
            ...prev,
            productName: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.productName.trim()) {
            toast.error('Product name is required');
            return;
        }

        if (!formData.mrp) {
            toast.error('MRP is required');
            return;
        }

        if (!formData.sellPrice) {
            toast.error('Selling price is required');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            mrp: parseFloat(formData.mrp) || 0,
            costPrice: parseFloat(formData.costPrice) || 0,
            sellPrice: parseFloat(formData.sellPrice) || 0,
            netQuantity: formData.netQuantity ? parseFloat(formData.netQuantity) : undefined,
            unitIds: getSelectedUnit()?._id || getSelectedUnit()?.[0],
            // Always include all hierarchy IDs
            productGroupId: productGroupId || (editData?.productGroupId?._id || editData?.productGroupId),
            productCategoryId: productCategoryId || (editData?.productCategoryId?._id || editData?.productCategoryId),
            productSubCategoryId: productSubCategoryId || (editData?.productSubCategoryId?._id || editData?.productSubCategoryId),
            productBrandId: productBrandId || (editData?.productBrandId?._id || editData?.productBrandId)
        };

        if (editData?._id) {
            payload._id = editData._id;
            payload.id = editData._id;
        }

        // Log payload for debugging
        console.log('Product payload with all hierarchy IDs:', {
            productGroupId: payload.productGroupId,
            productCategoryId: payload.productCategoryId,
            productSubCategoryId: payload.productSubCategoryId,
            productBrandId: payload.productBrandId
        });

        const api = editData?._id ? updateProduct : addProduct;

        HitApi(payload, api).then((res) => {
            if (res?.success || res?.statusCode === 201 || res?.statusCode === 200) {
                toast.success(editData?._id ? 'Product updated successfully' : 'Product added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(res?.message || 'Failed to save product');
            }
        }).catch((err) => {
            toast.error('Error saving product');
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editData?._id ? 'Edit Product' : 'Add Product'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleProductNameChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Enter product name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Enter description"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                MRP <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="mrp"
                                    value={formData.mrp}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost Price
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="costPrice"
                                    value={formData.costPrice}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sell Price <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    name="sellPrice"
                                    value={formData.sellPrice}
                                    onChange={handleChange}
                                    step="0.01"
                                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Unit
                            </label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="">Select Unit</option>
                                {unitOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Net Quantity
                            </label>
                            <input
                                type="number"
                                name="netQuantity"
                                value={formData.netQuantity}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="Enter quantity"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product Image
                        </label>

                        {formData.productImageUrl ? (
                            <div className="relative border rounded-lg overflow-hidden">
                                <img
                                    src={formData.productImageUrl}
                                    alt="Product"
                                    className="w-full h-40 object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full shadow"
                                >
                                    <Trash2 size={16} className="text-red-500" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={24} className="text-gray-400 animate-spin" />
                                        <span className="text-sm text-gray-500 mt-2">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload size={24} className="text-gray-400" />
                                        <span className="text-sm text-gray-500 mt-2">Click to upload image</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || uploading}
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

export default AddProduct;
