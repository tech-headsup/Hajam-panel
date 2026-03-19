import { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2, Trash2, Package } from 'lucide-react';
import { HitApi, HitApiFormData } from '../../Api/ApiHit';
import { addService, updateService, uploadSingleNew, projectKey, secretKey } from '../../constant/Constant';
import { getAcessToken } from '../../storage/Storage';
import toast from 'react-hot-toast';

function AddService({ isOpen, onClose, onSuccess, editData, subCategoryId, categoryId, subCategory, groupId }) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        img: '',
        price: '',
        memberPrice: '',
        duration: '',
        incentive: '',
        gender: 'Unisex',
        serviceFor: 'Both',
        serviceType: 'Salon',
        isMultiSession: false,
        numberOfSessions: 1
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
                price: editData.price || '',
                memberPrice: editData.member_price || '',
                duration: editData.service_time || '',
                incentive: editData.incentive || '',
                gender: editData.gender || 'Unisex',
                serviceFor: editData.serviceFor || 'Both',
                serviceType: editData.serviceType || 'Salon',
                isMultiSession: editData.isMultiSession || false,
                numberOfSessions: editData.numberOfSessions || 1
            });
        } else {
            // For new service, pick gender and serviceFor from subcategory
            setFormData({
                name: '',
                description: '',
                img: '',
                price: '',
                memberPrice: '',
                duration: '',
                incentive: '',
                gender: subCategory?.gender || 'Unisex',
                serviceFor: subCategory?.serviceFor || 'Both',
                serviceType: 'Salon',
                isMultiSession: false,
                numberOfSessions: 1
            });
        }
    }, [editData, isOpen, subCategory]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
            toast.error('Service name is required');
            return;
        }

        if (!subCategoryId) {
            toast.error('Please select a subcategory first');
            return;
        }

        setLoading(true);

        const payload = {
            name: formData.name,
            description: formData.description || '',
            img: formData.img || '',
            price: formData.price ? Number(formData.price) : 0,
            member_price: formData.memberPrice ? Number(formData.memberPrice) : 0,
            service_time: formData.duration || '',
            incentive: formData.incentive ? Number(formData.incentive) : 0,
            gender: formData.gender,
            serviceFor: formData.serviceFor,
            serviceType: formData.serviceType,
            isMultiSession: formData.isMultiSession,
            numberOfSessions: formData.isMultiSession ? Number(formData.numberOfSessions) : 1,
            subCategoryId: subCategoryId,
            categoryId: categoryId,
            groupId: groupId
        };

        if (editData?._id) {
            payload._id = editData._id;
        }

        const api = editData?._id ? updateService : addService;

        HitApi(payload, api).then((res) => {
            if (res?.success || res?.statusCode === 201 || res?.statusCode === 200) {
                toast.success(editData?._id ? 'Service updated successfully' : 'Service added successfully');
                onSuccess();
                onClose();
            } else {
                toast.error(res?.message || 'Failed to save service');
            }
        }).catch((err) => {
            toast.error('Error saving service');
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {editData?._id ? 'Edit Service' : 'Add Service'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Linked Product Details */}
                    {editData?.productId && (
                        <div className="border rounded-lg p-4 bg-purple-50">
                            <div className="flex items-center gap-3">
                                {editData.productId?.productImageUrl ? (
                                    <img
                                        src={editData.productId.productImageUrl}
                                        alt={editData.productId.productName}
                                        className="w-14 h-14 object-cover rounded-lg"
                                    />
                                ) : (
                                    <div className="w-14 h-14 bg-purple-200 rounded-lg flex items-center justify-center">
                                        <Package size={24} className="text-purple-500" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded font-medium">Linked Product</span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mt-1">
                                        {editData.productId?.productName || 'Product'}
                                    </h4>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-0.5">
                                        {editData.productId?.brand && (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{editData.productId.brand}</span>
                                        )}
                                        {editData.productId?.productType && (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{editData.productId.productType}</span>
                                        )}
                                        {editData.productId?.netQuantity && editData.productId?.unit && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">
                                                {editData.productId.netQuantity} {editData.productId.unit}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm">
                                        {editData.productId?.mrp && (
                                            <span className="text-gray-500">MRP: <span className="text-gray-900 font-medium">₹{editData.productId.mrp}</span></span>
                                        )}
                                        {editData.productId?.sellPrice && (
                                            <span className="text-gray-500">Sell: <span className="text-green-600 font-medium">₹{editData.productId.sellPrice}</span></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Name <span className="text-red-500">*</span>
                            {editData?.isTransferred && (
                                <span className="text-xs text-orange-600 ml-2">(Cannot edit - Transferred service)</span>
                            )}
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            disabled={editData?.isTransferred}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                                editData?.isTransferred ? 'bg-gray-100 cursor-not-allowed' : ''
                            }`}
                            placeholder="Enter service name"
                        />
                    </div>

                    {/* Description */}
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

                    {/* Price, Member Price, Duration */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Price (₹)
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Member Price (₹)
                            </label>
                            <input
                                type="number"
                                name="memberPrice"
                                value={formData.memberPrice}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="0"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration
                            </label>
                            <input
                                type="text"
                                name="duration"
                                value={formData.duration}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                placeholder="e.g. 30 mins"
                            />
                        </div>
                    </div>

                    {/* Incentive */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Incentive (₹)
                        </label>
                        <input
                            type="number"
                            name="incentive"
                            value={formData.incentive}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            placeholder="0"
                        />
                    </div>

                    {/* Gender, Service For, Service Type */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender
                            </label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                disabled={true}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 cursor-not-allowed"
                            >
                                <option value="Unisex">Unisex</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service For
                            </label>
                            <select
                                name="serviceFor"
                                value={formData.serviceFor}
                                onChange={handleChange}
                                disabled={true}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-gray-100 cursor-not-allowed"
                            >
                                <option value="Both">Both</option>
                                <option value="Adult">Adult</option>
                                <option value="Child">Child</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Type
                            </label>
                            <select
                                name="serviceType"
                                value={formData.serviceType}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                            >
                                <option value="Salon">Salon</option>
                                <option value="Wellness">Wellness</option>
                            </select>
                        </div>
                    </div>

                    {/* Multi-Session */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isMultiSession"
                                name="isMultiSession"
                                checked={formData.isMultiSession}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    isMultiSession: e.target.checked,
                                    numberOfSessions: e.target.checked ? prev.numberOfSessions : 1
                                }))}
                                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                            />
                            <label htmlFor="isMultiSession" className="text-sm font-medium text-gray-700">
                                Multi-Session Service
                            </label>
                        </div>
                        {formData.isMultiSession && (
                            <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Number of Sessions
                                </label>
                                <input
                                    type="number"
                                    name="numberOfSessions"
                                    value={formData.numberOfSessions}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="1"
                                />
                            </div>
                        )}
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Image
                        </label>

                        {formData.img ? (
                            <div className="relative border rounded-lg overflow-hidden">
                                <img
                                    src={formData.img}
                                    alt="Service"
                                    className="w-full h-32 object-cover"
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
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"
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
                                        <Loader2 size={20} className="text-gray-400 animate-spin" />
                                        <span className="text-sm text-gray-500 mt-1">Uploading...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <Upload size={20} className="text-gray-400" />
                                        <span className="text-sm text-gray-500 mt-1">Click to upload image</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submit Buttons */}
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
                            disabled={loading || uploading}
                            className="px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : (editData?._id ? 'Update Service' : 'Add Service')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddService;
