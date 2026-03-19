import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Trash2 } from 'lucide-react';
import { HitApi, HitApiFormData } from '../../Api/ApiHit';
import { addProductSubCategory, updateProductSubCategory, uploadSingleNew, projectKey, secretKey } from '../../constant/Constant';
import { getAcessToken } from '../../storage/Storage';
import toast from 'react-hot-toast';

function AddProductSubCategory({ isOpen, onClose, onSuccess, editData, productCategoryId, productGroupId }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        img: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (editData) {
            setFormData({
                name: editData.name || '',
                description: editData.description || '',
                img: editData.img || '',
                isActive: editData.isActive !== false
            });
        } else {
            setFormData({
                name: '',
                description: '',
                img: '',
                isActive: true
            });
        }
    }, [editData, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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
                    img: response.file.s3Url
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
            img: ''
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error('Product subcategory name is required');
            return;
        }

        if (!productCategoryId) {
            toast.error('Please select a product category first');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            productCategoryId: productCategoryId,
            productGroupId: productGroupId
        };

        if (editData?._id) {
            payload._id = editData._id;
        }

        const api = editData?._id ? updateProductSubCategory : addProductSubCategory;

        HitApi(payload, api).then((res) => {
            if (res?.success || res?.statusCode === 201 || res?.statusCode === 200) {
                toast.success(editData?._id ? 'Product subcategory updated successfully' : 'Product subcategory added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(res?.message || 'Failed to save product subcategory');
            }
        }).catch((err) => {
            toast.error('Error saving product subcategory');
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editData?._id ? 'Edit Product SubCategory' : 'Add Product SubCategory'}
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
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Enter product subcategory name"
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
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="Enter description"
                        />
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="w-4 h-4 text-black rounded"
                            />
                            <span className="text-sm font-medium text-gray-700">Active</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image
                        </label>

                        {formData.img ? (
                            <div className="relative border rounded-lg overflow-hidden">
                                <img
                                    src={formData.img}
                                    alt="Product SubCategory"
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

export default AddProductSubCategory;
