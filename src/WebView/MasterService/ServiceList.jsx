import { useState, useEffect, useMemo, useRef } from 'react';
import { Menu, CirclePlus, Pencil, Trash2, Package, MoreVertical, ArrowRight, Users, Repeat, CheckSquare, Square } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchService, deleteService } from '../../constant/Constant';
import toast from 'react-hot-toast';
import AddService from './AddService';
import TransferService from './TransferService';
import BulkTransferService from './BulkTransferService';
import BulkDeleteService from './BulkDeleteService';
import GroupUsageModal from './GroupUsageModal';

function ServiceList({ selectedSubCategory, selectedCategory, selectedGroup }) {
    const [services, setServices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [isBulkTransferOpen, setIsBulkTransferOpen] = useState(false);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [usageData, setUsageData] = useState({ title: '', groups: [] });
    const [editData, setEditData] = useState(null);
    const [transferService, setTransferService] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (selectedSubCategory?._id) {
            fetchServices();
            setSelectedServices([]);
        } else {
            setServices([]);
            setSelectedServices([]);
        }
    }, [selectedSubCategory]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchServices = () => {
        const json = {
            page: 1,
            limit: 100000,
            search: {
                subCategoryId: selectedSubCategory._id,
                groupId: selectedGroup?._id
            },
            populate: [
                { path: 'productId', select: 'productName brand productType productImageUrl mrp sellPrice unit netQuantity' },
                { path: 'serviceParentId', select: 'name variations' },
                { path: 'groupUsing', select: 'name' }
            ]
        };

        HitApi(json, searchService).then((res) => {
            if (res?.data?.docs) {
                setServices(res.data.docs);
            } else {
                setServices([]);
            }
        }).catch((err) => {
            setServices([]);
            toast.error('Error fetching services');
            console.error(err);
        });
    };

    const flattenedServices = useMemo(() => {
        const result = [];
        services.forEach((service) => {
            // For transferred services, use parent's name and variations but local price
            const isTransferred = service.isTransferred && service.serviceParentId;
            const displayName = isTransferred ? service.serviceParentId.name : service.name;
            const displayVariations = isTransferred && service.serviceParentId.variations?.length > 0
                ? service.serviceParentId.variations
                : service.variations;

            if (displayVariations && displayVariations.length > 0) {
                displayVariations.forEach((variation, index) => {
                    result.push({
                        _id: `${service._id}_${variation._id || index}`,
                        serviceId: service._id,
                        variationId: variation._id,
                        name: `${displayName} - ${variation.name}`,
                        serviceName: displayName,
                        variationName: variation.name,
                        price: service.variations?.[index]?.price || variation.price || service.price,
                        memberPrice: service.variations?.[index]?.memberPrice || variation.memberPrice,
                        duration: variation.duration || service.service_time,
                        isVariation: true,
                        parentService: service
                    });
                });
            } else {
                result.push({
                    _id: service._id,
                    serviceId: service._id,
                    name: displayName,
                    price: service.price,
                    memberPrice: service.member_price,
                    duration: service.service_time,
                    isVariation: false,
                    parentService: service
                });
            }
        });
        return result;
    }, [services]);

    const handleAdd = () => {
        setEditData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (service) => {
        setEditData(service);
        setIsModalOpen(true);
        setOpenDropdownId(null);
    };

    const handleDelete = (service) => {
        setOpenDropdownId(null);
        if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
            HitApi({ _id: service._id }, deleteService).then((res) => {
                if (res?.success) {
                    toast.success('Service deleted successfully');
                    fetchServices();
                } else {
                    toast.error(res?.message || 'Failed to delete service');
                }
            }).catch((err) => {
                toast.error('Error deleting service');
                console.error(err);
            });
        }
    };

    const handleTransfer = (service) => {
        setTransferService(service);
        setIsTransferOpen(true);
        setOpenDropdownId(null);
    };

    const toggleDropdown = (e, serviceId) => {
        e.stopPropagation();
        setOpenDropdownId(openDropdownId === serviceId ? null : serviceId);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditData(null);
    };

    const handleTransferClose = () => {
        setIsTransferOpen(false);
        setTransferService(null);
    };

    const handleSuccess = () => {
        fetchServices();
    };

    const handleTransferSuccess = () => {
        fetchServices();
        setSelectedServices([]);
    };

    const toggleServiceSelection = (service) => {
        setSelectedServices(prev => {
            const isSelected = prev.some(s => s._id === service._id);
            if (isSelected) {
                return prev.filter(s => s._id !== service._id);
            } else {
                return [...prev, service];
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectedServices.length === services.length) {
            setSelectedServices([]);
        } else {
            setSelectedServices([...services]);
        }
    };

    const handleBulkTransfer = () => {
        if (selectedServices.length === 0) {
            toast.error('Please select services to transfer');
            return;
        }
        setIsBulkTransferOpen(true);
    };

    const handleBulkTransferClose = () => {
        setIsBulkTransferOpen(false);
    };

    const handleBulkTransferSuccess = () => {
        fetchServices();
        setSelectedServices([]);
    };

    const handleBulkDelete = () => {
        if (selectedServices.length === 0) {
            toast.error('Please select services to delete');
            return;
        }
        setIsBulkDeleteOpen(true);
    };

    const handleBulkDeleteSuccess = () => {
        fetchServices();
        setSelectedServices([]);
    };

    const handleShowUsage = (service) => {
        setUsageData({
            title: service.name,
            groups: service.groupUsing || []
        });
        setIsUsageModalOpen(true);
        setOpenDropdownId(null);
    };

    return (
        <div className="w-1/4 bg-white border rounded-lg overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Services</h2>
                    {selectedSubCategory && (
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-lg text-sm"
                        >
                            <CirclePlus size={14} />
                            Add
                        </button>
                    )}
                </div>
                {selectedSubCategory && services.length > 0 && (
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            {selectedServices.length === services.length ? (
                                <CheckSquare size={16} className="text-blue-600" />
                            ) : (
                                <Square size={16} />
                            )}
                            {selectedServices.length === services.length ? 'Deselect All' : 'Select All'}
                        </button>
                        {selectedServices.length > 0 && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleBulkTransfer}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                                >
                                    <ArrowRight size={14} />
                                    Transfer ({selectedServices.length})
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={14} />
                                    Delete ({selectedServices.length})
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-2 overflow-y-auto h-[calc(100%-60px)]">
                {selectedSubCategory ? (
                    flattenedServices.length > 0 ? (
                        flattenedServices.map((item) => (
                            <div
                                key={item._id}
                                className="group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); toggleServiceSelection(item.parentService); }}
                                        className="flex-shrink-0"
                                    >
                                        {selectedServices.some(s => s._id === item.parentService._id) ? (
                                            <CheckSquare size={16} className="text-blue-600" />
                                        ) : (
                                            <Square size={16} className="text-gray-400 hover:text-gray-600" />
                                        )}
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-gray-900 truncate">{item.name}</span>
                                            {item.parentService?.gender && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                                    item.parentService.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                    item.parentService.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {item.parentService.gender}
                                                </span>
                                            )}
                                            {item.parentService?.productId && (
                                                <span className="flex items-center gap-1 bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs flex-shrink-0">
                                                    <Package size={10} />
                                                    Product
                                                </span>
                                            )}
                                            {item.parentService?.isMultiSession && (
                                                <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs flex-shrink-0">
                                                    <Repeat size={10} />
                                                    {item.parentService.numberOfSessions} Sessions
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {item.price && (
                                                <span className="text-gray-900">₹{item.price}</span>
                                            )}
                                            {item.memberPrice > 0 && (
                                                <span className="text-green-600">(₹{item.memberPrice})</span>
                                            )}
                                            {item.duration && (
                                                <span className="text-gray-400">• {item.duration}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative flex-shrink-0" ref={openDropdownId === item._id ? dropdownRef : null}>
                                    <button
                                        onClick={(e) => toggleDropdown(e, item._id)}
                                        className="p-1.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100"
                                        title="Actions"
                                    >
                                        <MoreVertical size={16} className="text-gray-600" />
                                    </button>

                                    {openDropdownId === item._id && (
                                        <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(item.parentService); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleTransfer(item.parentService); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                                            >
                                                <ArrowRight size={14} />
                                                Transfer
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleShowUsage(item.parentService); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-purple-600 hover:bg-purple-50"
                                            >
                                                <Users size={14} />
                                                Groups Using
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.parentService); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">No services found</div>
                    )
                ) : (
                    <div className="text-center py-8 text-gray-500">Select a subcategory first</div>
                )}
            </div>

            <AddService
                isOpen={isModalOpen}
                onClose={handleModalClose}
                onSuccess={handleSuccess}
                editData={editData}
                subCategoryId={selectedSubCategory?._id}
                categoryId={selectedCategory?._id}
                subCategory={selectedSubCategory}
                groupId={selectedGroup?._id}
            />

            <TransferService
                isOpen={isTransferOpen}
                onClose={handleTransferClose}
                onSuccess={handleTransferSuccess}
                service={transferService}
                currentGroup={selectedGroup}
            />

            <GroupUsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                title={usageData.title}
                groups={usageData.groups}
            />

            <BulkTransferService
                isOpen={isBulkTransferOpen}
                onClose={handleBulkTransferClose}
                onSuccess={handleBulkTransferSuccess}
                services={selectedServices}
                currentGroup={selectedGroup}
            />

            <BulkDeleteService
                isOpen={isBulkDeleteOpen}
                onClose={() => setIsBulkDeleteOpen(false)}
                onSuccess={handleBulkDeleteSuccess}
                services={selectedServices}
            />
        </div>
    );
}

export default ServiceList;
