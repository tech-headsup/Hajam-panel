import { useState, useEffect } from 'react';
import { X, Crown, Loader2, Package, Tag, Calendar, DollarSign } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchMembership } from '../../constant/Constant';
import AppButton from '../../components/AppButton/AppButton';
import toast from 'react-hot-toast';

function AddMembershipModal({ isOpen, onClose, onMembershipAdded }) {
    const [memberships, setMemberships] = useState([]);
    const [isLoadingMemberships, setIsLoadingMemberships] = useState(false);
    const [selectedMembership, setSelectedMembership] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadMemberships();
            setSelectedMembership(null);
        }
    }, [isOpen]);

    const loadMemberships = async () => {
        setIsLoadingMemberships(true);
        try {
            const json = {
                page: 1,
                limit: 100,
                search: {
                    "isActive": true
                }
            };

            const res = await HitApi(json, searchMembership);

            if (res?.statusCode === 200) {
                const membershipData = Array.isArray(res?.data?.docs) ? res.data.docs : [];
                setMemberships(membershipData);
            } else {
                setMemberships([]);
                toast.error('Failed to load memberships');
            }
        } catch (error) {
            console.error('Error loading memberships:', error);
            setMemberships([]);
            toast.error('Error loading memberships');
        } finally {
            setIsLoadingMemberships(false);
        }
    };

    const handleSelectMembership = (membership) => {
        setSelectedMembership(membership);
    };

    const handleSubmit = () => {
        if (!selectedMembership) {
            toast.error('Please select a membership');
            return;
        }

        // Pass membership data to parent for adding to billing
        const membershipForBilling = {
            _id: selectedMembership._id,
            membershipId: selectedMembership._id,
            name: selectedMembership.name,
            membershipName: selectedMembership.name,
            membershipType: selectedMembership.membershipType,
            price: selectedMembership.price || 0,
            basePrice: selectedMembership.price || 0,
            purchaseAmount: selectedMembership.price || 0,
            duration: selectedMembership.duration,
            description: selectedMembership.description,
            valueAddedAmount: selectedMembership.valueAddedAmount,
            fixDiscountPercentage: selectedMembership.fixDiscountPercentage,
            excludedServices: selectedMembership.excludedServices || [],
            serviceDiscounts: selectedMembership.serviceDiscounts || [],
            unitIds: selectedMembership.unitIds || [],
            quantity: 1,
            discountType: 'fixed',
            discountValue: 0,
            staff: null
        };

        if (onMembershipAdded) {
            onMembershipAdded(membershipForBilling);
        }

        toast.success('Membership added to billing!');
        setSelectedMembership(null);
        onClose();
    };

    const handleClose = () => {
        setSelectedMembership(null);
        onClose();
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0.00';
        return `₹${parseFloat(amount).toFixed(2)}`;
    };

    const formatDuration = (duration) => {
        if (!duration || !duration.value || !duration.unit) return 'N/A';
        return `${duration.value} ${duration.unit}`;
    };

    const getMembershipTypeBadgeColor = (type) => {
        const colors = {
            'value_added': 'bg-blue-100 text-blue-600',
            'fix_discount': 'bg-green-100 text-green-600',
            'service_discount': 'bg-purple-100 text-purple-600'
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    };

    const getMembershipTypeLabel = (type) => {
        const labels = {
            'value_added': 'Value Added',
            'fix_discount': 'Fixed Discount',
            'service_discount': 'Service Discount'
        };
        return labels[type] || type;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                                <Crown className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Activate Membership</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Assign a membership plan to client</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                        {isLoadingMemberships ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                            </div>
                        ) : memberships.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-sm text-gray-500">No memberships available</p>
                                <p className="text-xs text-gray-400 mt-1">Create memberships from Membership Master first</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {memberships.map((membership) => (
                                    <button
                                        key={membership._id}
                                        onClick={() => handleSelectMembership(membership)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                                            selectedMembership?._id === membership._id
                                                ? 'border-purple-600 bg-purple-50 shadow-md'
                                                : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {membership.name}
                                                    </h3>
                                                    {membership.membershipType && (
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMembershipTypeBadgeColor(membership.membershipType)}`}>
                                                            {getMembershipTypeLabel(membership.membershipType)}
                                                        </span>
                                                    )}
                                                </div>
                                                {membership.description && (
                                                    <p className="text-xs text-gray-600 mt-1">{membership.description}</p>
                                                )}
                                            </div>
                                            {selectedMembership?._id === membership._id && (
                                                <div className="ml-3 text-purple-600">
                                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="flex items-center text-gray-500 mb-1">
                                                    <DollarSign className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Price</span>
                                                </div>
                                                <p className="font-semibold text-green-600">{formatCurrency(membership.price)}</p>
                                            </div>

                                            <div>
                                                <div className="flex items-center text-gray-500 mb-1">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Duration</span>
                                                </div>
                                                <p className="font-medium text-gray-900">{formatDuration(membership.duration)}</p>
                                            </div>

                                            <div>
                                                <div className="flex items-center text-gray-500 mb-1">
                                                    <Tag className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Benefit</span>
                                                </div>
                                                {membership.membershipType === 'value_added' && membership.valueAddedAmount ? (
                                                    <p className="font-medium text-blue-600">+{formatCurrency(membership.valueAddedAmount)}</p>
                                                ) : membership.membershipType === 'fix_discount' && membership.fixDiscountPercentage ? (
                                                    <p className="font-medium text-green-600">{membership.fixDiscountPercentage}% off</p>
                                                ) : (
                                                    <p className="text-gray-400 text-xs">N/A</p>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <AppButton
                            buttontext="Add to Billing"
                            onClick={handleSubmit}
                            disabled={!selectedMembership}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddMembershipModal;
