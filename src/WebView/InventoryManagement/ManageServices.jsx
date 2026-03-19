import { useState, useEffect, useRef } from 'react';
import { X, Package, Plus, Trash2, Pencil } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchCategory, searchSubCategory, addService, updateService, deleteService, updateInventory } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';

function ManageServices({ isOpen, onClose, inventory, onSuccess }) {
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [creatingService, setCreatingService] = useState(false);
    const [linkedServices, setLinkedServices] = useState([]);
    const [editingService, setEditingService] = useState(null);
    const [serviceData, setServiceData] = useState({
        name: '',
        price: '',
        memberPrice: '',
        duration: '',
        gender: 'Unisex',
        serviceFor: 'Both',
        description: '',
        productQty: 1,
        reduceInventoryOnBilling: true
    });
    const [showAddForm, setShowAddForm] = useState(false);
    const wasOpenRef = useRef(false);

    useEffect(() => {
        if (isOpen && !wasOpenRef.current) {
            // Only reset on first open
            fetchCategories();
            setLinkedServices(inventory?.serviceIds || []);
            resetForm();
            wasOpenRef.current = true;
        } else if (isOpen) {
            // Update linked services on inventory change, but don't reset form
            setLinkedServices(inventory?.serviceIds || []);
        }

        if (!isOpen) {
            wasOpenRef.current = false;
        }
    }, [isOpen, inventory]);

    useEffect(() => {
        if (isOpen && inventory?.productId && !editingService) {
            const productUnit = inventory.productId.unit?.toLowerCase() || '';
            const isPcs = productUnit === 'pcs' || productUnit === 'piece' || productUnit === 'pieces';

            setServiceData(prev => ({
                ...prev,
                name: inventory.productId.productName || '',
                price: inventory.productId.sellPrice || inventory.productId.mrp || '',
                reduceInventoryOnBilling: isPcs
            }));
        }
    }, [isOpen, inventory, editingService]);

    const resetForm = (preserveSelection = false) => {
        if (!preserveSelection) {
            setSelectedCategory('');
            setSelectedSubCategory('');
            setSubCategories([]);
        }

        const productUnit = inventory?.productId?.unit?.toLowerCase() || '';
        const isPcs = productUnit === 'pcs' || productUnit === 'piece' || productUnit === 'pieces';

        // Get gender/serviceFor from selected subcategory if preserving selection
        const selectedSubCat = preserveSelection ? subCategories.find(sc => sc._id === selectedSubCategory) : null;

        setServiceData({
            name: '',
            price: '',
            memberPrice: '',
            duration: '',
            gender: selectedSubCat?.gender || 'Unisex',
            serviceFor: selectedSubCat?.serviceFor || 'Both',
            description: '',
            productQty: 1,
            reduceInventoryOnBilling: isPcs
        });
        if (!preserveSelection) {
            setShowAddForm(false);
        }
        setEditingService(null);
    };

    const handleAddService = async () => {
        // Check if there are existing linked services to auto-select category/subcategory
        if (linkedServices.length > 0) {
            const lastService = linkedServices[linkedServices.length - 1];
            const catId = typeof lastService.categoryId === 'object' ? lastService.categoryId._id : lastService.categoryId;
            const subCatId = typeof lastService.subCategoryId === 'object' ? lastService.subCategoryId._id : lastService.subCategoryId;

            if (catId) {
                setSelectedCategory(catId);

                // Fetch subcategories and then set the selected one
                const selectedUnit = getSelectedUnit();
                const json = {
                    page: 1,
                    limit: 100,
                    categoryId: catId,
                    groupId: selectedUnit?.serviceGroupId
                };

                try {
                    const res = await HitApi(json, searchSubCategory);
                    if (res?.data?.docs) {
                        setSubCategories(res.data.docs);

                        if (subCatId) {
                            setSelectedSubCategory(subCatId);
                            const subCat = res.data.docs.find(sc => sc._id === subCatId);
                            if (subCat) {
                                setServiceData(prev => ({
                                    ...prev,
                                    gender: subCat.gender || 'Unisex',
                                    serviceFor: subCat.serviceFor || 'Both'
                                }));
                            }
                        }
                    }
                } catch (err) {
                    console.error(err);
                }
            }
        }
        setShowAddForm(true);
    };

    const fetchCategories = () => {
        setLoadingCategories(true);
        const selectedUnit = getSelectedUnit();
        const json = {
            page: 1,
            limit: 100,
            unitIds: selectedUnit?._id || selectedUnit?.[0],
            groupId: selectedUnit?.serviceGroupId
        };

        HitApi(json, searchCategory).then((res) => {
            if (res?.data?.docs) {
                setCategories(res.data.docs);
            } else {
                setCategories([]);
            }
        }).catch((err) => {
            console.error(err);
            setCategories([]);
        }).finally(() => {
            setLoadingCategories(false);
        });
    };

    const fetchSubCategories = (categoryId) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }

        setLoadingSubCategories(true);
        const selectedUnit = getSelectedUnit();
        const json = {
            page: 1,
            limit: 100,
            categoryId: categoryId,
            groupId: selectedUnit?.serviceGroupId
        };

        HitApi(json, searchSubCategory).then((res) => {
            if (res?.data?.docs) {
                setSubCategories(res.data.docs);
            } else {
                setSubCategories([]);
            }
        }).catch((err) => {
            console.error(err);
            setSubCategories([]);
        }).finally(() => {
            setLoadingSubCategories(false);
        });
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedCategory(value);
        setSelectedSubCategory('');
        fetchSubCategories(value);
    };

    const handleSubCategoryChange = (e) => {
        const value = e.target.value;
        setSelectedSubCategory(value);

        const selectedSubCat = subCategories.find(sc => sc._id === value);
        if (selectedSubCat) {
            setServiceData(prev => ({
                ...prev,
                gender: selectedSubCat.gender || 'Unisex',
                serviceFor: selectedSubCat.serviceFor || 'Both'
            }));
        }
    };

    const handleServiceDataChange = (e) => {
        const { name, value } = e.target;
        setServiceData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEditService = (service) => {
        setEditingService(service);
        setShowAddForm(true);
        setServiceData({
            name: service.name || '',
            price: service.price || '',
            memberPrice: service.member_price || '',
            duration: service.service_time || '',
            gender: service.gender || 'Unisex',
            serviceFor: service.serviceFor || 'Both',
            description: service.description || '',
            productQty: service.productQty || 1,
            reduceInventoryOnBilling: service.reduceInventoryOnBilling !== false
        });

        if (service.categoryId) {
            const catId = typeof service.categoryId === 'object' ? service.categoryId._id : service.categoryId;
            setSelectedCategory(catId);
            fetchSubCategories(catId);
            setTimeout(() => {
                const subCatId = typeof service.subCategoryId === 'object' ? service.subCategoryId._id : service.subCategoryId;
                setSelectedSubCategory(subCatId || '');
            }, 500);
        }
    };

    const handleDeleteService = (service) => {
        const serviceName = service.name || 'this service';
        if (!window.confirm(`Are you sure you want to delete "${serviceName}"?`)) {
            return;
        }

        const serviceId = service._id;

        HitApi({ _id: serviceId }, deleteService).then((res) => {
            if (res?.success || res?.statusCode === 200) {
                // Remove from linked services
                setLinkedServices(prev => prev.filter(s => s._id !== serviceId));

                // Update inventory to remove serviceId
                const existingServiceIds = (inventory.serviceIds || []).map(s => typeof s === 'object' ? s._id : s);
                const updatedServiceIds = existingServiceIds.filter(id => id !== serviceId);

                HitApi({
                    _id: inventory._id,
                    serviceIds: updatedServiceIds
                }, updateInventory).then(() => {
                    toast.success('Service deleted successfully');
                    if (onSuccess) onSuccess();
                }).catch(console.error);
            } else {
                toast.error(res?.message || 'Failed to delete service');
            }
        }).catch((err) => {
            toast.error('Error deleting service');
            console.error(err);
        });
    };

    const handleCreateService = () => {
        if (!selectedCategory || !selectedSubCategory) {
            toast.error('Please select category and subcategory');
            return;
        }

        if (!serviceData.name) {
            toast.error('Service name is required');
            return;
        }

        setCreatingService(true);

        const product = inventory.productId;
        const selectedUnit = getSelectedUnit();

        const servicePayload = {
            name: serviceData.name,
            description: serviceData.description || '',
            img: product?.productImageUrl || '',
            price: Number(serviceData.price) || 0,
            member_price: Number(serviceData.memberPrice) || 0,
            service_time: serviceData.duration || '',
            categoryId: selectedCategory,
            subCategoryId: selectedSubCategory,
            gender: serviceData.gender,
            serviceFor: serviceData.serviceFor,
            isProductRequired: true,
            productId: product?._id,
            inventoryId: inventory?._id,
            productQty: Number(serviceData.productQty) || 1,
            reduceInventoryOnBilling: serviceData.reduceInventoryOnBilling,
            incentive: 0,
            groupId: selectedUnit?.serviceGroupId
        };

        // If editing, add _id and use updateService
        if (editingService) {
            servicePayload._id = editingService._id;

            HitApi(servicePayload, updateService).then((res) => {
                if (res?.success || res?.statusCode === 200) {
                    toast.success('Service updated successfully');

                    // Update linked services list
                    setLinkedServices(prev => prev.map(s =>
                        s._id === editingService._id
                            ? { ...s, name: serviceData.name, price: Number(serviceData.price) || 0 }
                            : s
                    ));

                    if (onSuccess) onSuccess();
                    resetForm(true);
                    setServiceData(prev => ({
                        ...prev,
                        name: inventory.productId?.productName || '',
                        price: inventory.productId?.sellPrice || inventory.productId?.mrp || ''
                    }));
                } else {
                    toast.error(res?.message || 'Failed to update service');
                }
            }).catch((err) => {
                toast.error('Error updating service');
                console.error(err);
            }).finally(() => {
                setCreatingService(false);
            });
        } else {
            // Create new service
            HitApi(servicePayload, addService).then((res) => {
                if (res?.success || res?.statusCode === 201 || res?.statusCode === 200) {
                    const newService = res?.data;
                    toast.success('Service created successfully');

                    if (inventory?._id && newService?._id) {
                        const existingServiceIds = (inventory.serviceIds || []).map(s => typeof s === 'object' ? s._id : s);
                        const updatedServiceIds = [...existingServiceIds, newService._id];

                        HitApi({
                            _id: inventory._id,
                            serviceIds: updatedServiceIds
                        }, updateInventory).then(() => {
                            setLinkedServices(prev => [...prev, {
                                _id: newService._id,
                                name: newService.name,
                                price: newService.price,
                                categoryId: newService.categoryId || selectedCategory,
                                subCategoryId: newService.subCategoryId || selectedSubCategory
                            }]);
                            if (onSuccess) onSuccess();
                            resetForm(true);
                            setServiceData(prev => ({
                                ...prev,
                                name: inventory.productId?.productName || '',
                                price: inventory.productId?.sellPrice || inventory.productId?.mrp || ''
                            }));
                        }).catch((err) => {
                            console.error('Error updating inventory:', err);
                        });
                    } else {
                        if (onSuccess) onSuccess();
                        resetForm(true);
                    }
                } else {
                    toast.error(res?.message || 'Failed to create service');
                }
            }).catch((err) => {
                toast.error('Error creating service');
                console.error(err);
            }).finally(() => {
                setCreatingService(false);
            });
        }
    };

    if (!isOpen || !inventory) return null;

    const product = inventory.productId;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">Manage Services</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        {product?.productImageUrl ? (
                            <img
                                src={product.productImageUrl}
                                alt={product.productName}
                                className="w-16 h-16 object-cover rounded-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Package size={28} className="text-gray-400" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{product?.productName || 'N/A'}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                {product?.brand && <span className="bg-gray-100 px-2 py-0.5 rounded">{product.brand}</span>}
                                {product?.productType && <span className="bg-gray-100 px-2 py-0.5 rounded">{product.productType}</span>}
                                {product?.netQuantity && product?.unit && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{product.netQuantity} {product.unit}</span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="text-gray-600">MRP: <span className="font-medium text-gray-900">₹{product?.mrp || 0}</span></span>
                                <span className="text-gray-600">Sell Price: <span className="font-medium text-green-600">₹{product?.sellPrice || 0}</span></span>
                                <span className="text-gray-600">Stock: <span className={`font-medium ${inventory.qty <= 10 ? 'text-red-600' : 'text-green-600'}`}>{inventory.qty || 0}</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Linked Services Section */}
                    <div className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Linked Services ({linkedServices.length})</h4>
                            {!showAddForm && (
                                <button
                                    type="button"
                                    onClick={handleAddService}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                                >
                                    <Plus size={14} />
                                    Add Service
                                </button>
                            )}
                        </div>

                        {linkedServices.length > 0 ? (
                            <div className="space-y-2">
                                {linkedServices.map((service) => (
                                    <div key={service._id} className={`bg-white border rounded-lg p-3 ${editingService?._id === service._id ? 'border-blue-500 ring-1 ring-blue-500' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h5 className="font-medium text-gray-900">{service.name}</h5>
                                                    {service.gender && (
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                            service.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                            service.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                            {service.gender}
                                                        </span>
                                                    )}
                                                    {service.productId && (
                                                        <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs">
                                                            <Package size={10} />
                                                            Product
                                                        </span>
                                                    )}
                                                </div>
                                                {(service.categoryId || service.subCategoryId) && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        {service.categoryId?.name || ''}{service.categoryId?.name && service.subCategoryId?.name ? ' › ' : ''}{service.subCategoryId?.name || ''}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 mt-1 text-sm">
                                                    <span className="text-gray-900 font-medium">₹{service.price || 0}</span>
                                                </div>
                                                {service.productId && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            {service.productId.productImageUrl ? (
                                                                <img
                                                                    src={service.productId.productImageUrl}
                                                                    alt={service.productId.productName}
                                                                    className="w-8 h-8 object-cover rounded"
                                                                />
                                                            ) : (
                                                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                                                                    <Package size={14} className="text-gray-400" />
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-900 truncate">{service.productId.productName}</p>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    {service.productId.brand && <span>{service.productId.brand}</span>}
                                                                    {service.productId.netQuantity && service.productId.unit && (
                                                                        <span className="text-blue-600">{service.productId.netQuantity} {service.productId.unit}</span>
                                                                    )}
                                                                    <span>₹{service.productId.sellPrice || service.productId.mrp || 0}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1 ml-2">
                                                {editingService?._id === service._id ? (
                                                    <span className="text-xs text-blue-600 font-medium px-2">Editing</span>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditService(service)}
                                                            className="p-1.5 hover:bg-gray-100 rounded"
                                                            title="Edit Service"
                                                        >
                                                            <Pencil size={14} className="text-gray-600" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteService(service)}
                                                            className="p-1.5 hover:bg-red-100 rounded"
                                                            title="Delete Service"
                                                        >
                                                            <Trash2 size={14} className="text-red-600" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-500">
                                <p>No services linked to this inventory</p>
                                <p className="text-sm mt-1">Click "Add Service" to create one</p>
                            </div>
                        )}
                    </div>

                    {/* Add/Edit Service Form */}
                    {showAddForm && (
                        <div className="border rounded-lg p-4 bg-blue-50 space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-gray-900">
                                    {editingService ? 'Edit Service' : 'Add New Service'}
                                </h4>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={handleCategoryChange}
                                        disabled={loadingCategories}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((category) => (
                                            <option key={category._id} value={category._id}>
                                                {category.name} {category.gender ? `(${category.gender})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sub Category
                                    </label>
                                    <select
                                        value={selectedSubCategory}
                                        onChange={handleSubCategoryChange}
                                        disabled={!selectedCategory || loadingSubCategories}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100"
                                    >
                                        <option value="">Select SubCategory</option>
                                        {subCategories.map((subCategory) => (
                                            <option key={subCategory._id} value={subCategory._id}>
                                                {subCategory.name} {subCategory.gender ? `(${subCategory.gender})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {(selectedSubCategory || editingService) && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Service Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={serviceData.name}
                                            onChange={handleServiceDataChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            placeholder="Enter service name"
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Price
                                            </label>
                                            <input
                                                type="number"
                                                name="price"
                                                value={serviceData.price}
                                                onChange={handleServiceDataChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                                placeholder="₹0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Member Price
                                            </label>
                                            <input
                                                type="number"
                                                name="memberPrice"
                                                value={serviceData.memberPrice}
                                                onChange={handleServiceDataChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                                placeholder="₹0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Duration
                                            </label>
                                            <input
                                                type="text"
                                                name="duration"
                                                value={serviceData.duration}
                                                onChange={handleServiceDataChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                                placeholder="e.g. 30 mins"
                                            />
                                        </div>
                                    </div>

                                    {/* Product Qty & Inventory Settings */}
                                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Product Qty Used (per service)
                                            </label>
                                            <input
                                                type="number"
                                                name="productQty"
                                                value={serviceData.productQty}
                                                onChange={handleServiceDataChange}
                                                min="1"
                                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                                                placeholder="1"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Quantity of product consumed when this service is performed
                                            </p>
                                        </div>
                                        {(() => {
                                            const productUnit = inventory?.productId?.unit?.toLowerCase() || '';
                                            const isPcs = productUnit === 'pcs' || productUnit === 'piece' || productUnit === 'pieces';
                                            return (
                                                <>
                                                    <div className="flex items-center gap-3 pt-2 border-t">
                                                        <input
                                                            type="checkbox"
                                                            id="reduceInventoryOnBilling"
                                                            name="reduceInventoryOnBilling"
                                                            checked={serviceData.reduceInventoryOnBilling}
                                                            onChange={(e) => setServiceData(prev => ({
                                                                ...prev,
                                                                reduceInventoryOnBilling: e.target.checked
                                                            }))}
                                                            disabled={!isPcs}
                                                            className={`w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${!isPcs ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        />
                                                        <label htmlFor="reduceInventoryOnBilling" className={`text-sm font-medium ${!isPcs ? 'text-gray-400' : 'text-gray-700'}`}>
                                                            Reduce inventory on billing
                                                        </label>
                                                        {!isPcs && (
                                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                                                Unit: {inventory?.productId?.unit || 'N/A'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {isPcs
                                                            ? 'When enabled, product quantity will be automatically reduced from inventory when this service is billed'
                                                            : 'Auto-reduce is disabled for non-pcs units (ml, grams, etc.)'
                                                        }
                                                    </p>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Gender
                                            </label>
                                            <select
                                                name="gender"
                                                value={serviceData.gender}
                                                onChange={handleServiceDataChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                                                value={serviceData.serviceFor}
                                                onChange={handleServiceDataChange}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            >
                                                <option value="Both">Both</option>
                                                <option value="Adult">Adult</option>
                                                <option value="Child">Child</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={serviceData.description}
                                            onChange={handleServiceDataChange}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                            placeholder="Enter service description"
                                        />
                                    </div>

                                    {/* Create/Update Service Button */}
                                    <div className="border-t pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCreateService}
                                            disabled={creatingService}
                                            className="w-full px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                        >
                                            {creatingService
                                                ? (editingService ? 'Updating Service...' : 'Creating Service...')
                                                : (editingService ? 'Update Service' : 'Create Service')
                                            }
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ManageServices;
