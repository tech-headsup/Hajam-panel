import { useState, useEffect } from 'react';
import { Crown, Calendar, Plus } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchClientMembership } from '../../constant/Constant';
import toast from 'react-hot-toast';

function ActiveMemberships({ clientId, onAddMembership, onMembershipSelect, selectedMembership, disabled }) {
    const [memberships, setMemberships] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (clientId) {
            fetchActiveMemberships();
        } else {
            setMemberships([]);
        }
    }, [clientId]);

    const fetchActiveMemberships = async () => {
        setIsLoading(true);
        try {
            const json = {
                page: 1,
                limit: 10,
                search: {
                    clientId: clientId,
                    status: 'active' // lowercase to match schema enum
                }
            };

            const res = await HitApi(json, searchClientMembership);

            if (res?.statusCode === 200) {
                const membershipData = Array.isArray(res?.data?.docs) ? res.data.docs : [];
                setMemberships(membershipData);
            } else {
                setMemberships([]);
            }
        } catch (error) {
            console.error('Error fetching client memberships:', error);
            setMemberships([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        const today = new Date();
        const end = new Date(endDate);
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getStatusColor = (daysRemaining) => {
        if (daysRemaining > 30) return 'text-green-600 bg-green-50 border-green-200';
        if (daysRemaining > 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getMembershipTypeLabel = (type) => {
        const typeLabels = {
            'value_added': 'Value Added',
            'fix_discount': 'Fixed Discount',
            'service_discount': 'Service Discount'
        };
        return typeLabels[type] || type;
    };

    const getMembershipTypeBadgeColor = (type) => {
        const colors = {
            'value_added': 'bg-blue-100 text-blue-600',
            'fix_discount': 'bg-green-100 text-green-600',
            'service_discount': 'bg-purple-100 text-purple-600'
        };
        return colors[type] || 'bg-gray-100 text-gray-600';
    };

    if (!clientId) {
        return null;
    }

    return (
        <div className="bg-white p-3 border rounded-lg mt-2">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <Crown className="h-4 w-4 text-purple-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Memberships</h2>
                </div>
                {memberships.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-600 rounded">
                        {memberships.length}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
            ) : (
                <div className="space-y-3">
                    {/* Add Membership Button - Always visible */}
                    <button
                        onClick={() => !disabled && onAddMembership && onAddMembership(clientId)}
                        disabled={disabled}
                        className="w-full inline-flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-purple-600 hover:border-purple-700"
                    >
                        <Plus className="h-4 w-4" />
                        <span>{memberships.length === 0 ? 'Activate Membership' : 'Add Another Membership'}</span>
                    </button>
                    
                    {/* Existing Memberships List */}
                    {memberships.length === 0 ? (
                        <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                            <Crown className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">No active memberships</p>
                            <p className="text-xs text-gray-400 mt-1">Click the button above to activate your first membership</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                    {memberships.map((membership, index) => {
                        const daysRemaining = getDaysRemaining(membership.endDate);
                        const statusColor = getStatusColor(daysRemaining);

                        const isExpired = daysRemaining <= 0;
                        const isMembershipDisabled = disabled || isExpired;
                        
                        return (
                            <div key={membership._id || index} className="space-y-2">
                                <button
                                    onClick={() => {
                                        if (!isMembershipDisabled && onMembershipSelect) {
                                            // Toggle membership selection
                                            if (selectedMembership?._id === membership._id) {
                                                onMembershipSelect(null); // Unselect current membership
                                            } else {
                                                onMembershipSelect(membership); // Select new membership
                                            }
                                        }
                                    }}
                                    disabled={isMembershipDisabled}
                                    className={`relative w-full text-left p-3 border rounded transition-all group ${
                                        selectedMembership?._id === membership._id
                                            ? 'border-purple-600 bg-purple-50 shadow-sm'
                                            : isExpired
                                            ? 'border-red-200 bg-red-50 cursor-not-allowed opacity-70'
                                            : disabled
                                            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                            : 'border-gray-200 hover:border-purple-300 cursor-pointer'
                                    }`}
                            >
                                {/* Compact Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900 truncate">
                                            {membership.membershipId?.membershipName || membership.membershipId?.name || 'Membership Plan'}
                                        </h3>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            {membership.membershipType && (
                                                <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getMembershipTypeBadgeColor(membership.membershipType)}`}>
                                                    {getMembershipTypeLabel(membership.membershipType)}
                                                </span>
                                            )}
                                            {/* Show discount value/percentage */}
                                            {membership.membershipId?.fixDiscountPercentage && (
                                                <span className="text-xs font-medium text-green-600">
                                                    {membership.membershipId.fixDiscountPercentage}% OFF
                                                </span>
                                            )}
                                            {membership.membershipId?.valueAddedAmount && (
                                                <span className="text-xs font-medium text-blue-600">
                                                    +₹{membership.membershipId.valueAddedAmount}
                                                </span>
                                            )}
                                            {!membership.membershipId?.fixDiscountPercentage && !membership.membershipId?.valueAddedAmount && membership.membershipId?.serviceDiscounts?.length > 0 && (
                                                <span className="text-xs font-medium text-purple-600">
                                                    Service Discounts
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColor}`}>
                                        {daysRemaining}d
                                    </span>
                                </div>

                                {/* Compact Date Info */}
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        {formatDate(membership.endDate)}
                                    </span>
                                    <span className={`font-medium px-1.5 py-0.5 rounded text-xs ${
                                        daysRemaining > 7 
                                            ? 'text-green-600 bg-green-50' 
                                            : daysRemaining > 0 
                                            ? 'text-yellow-600 bg-yellow-50' 
                                            : 'text-red-600 bg-red-50'
                                    }`}>
                                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                                    </span>
                                </div>

                                {/* Selection Indicator */}
                                {selectedMembership?._id === membership._id ? (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : isExpired ? (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    !disabled && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-4 h-4 border-2 border-purple-300 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-purple-300 rounded-full"></div>
                                            </div>
                                        </div>
                                    )
                                )}
                            </button>
                            
                            {/* Activate Again Button for Expired Memberships */}
                            {isExpired && (
                                <button
                                    onClick={() => !disabled && onAddMembership && onAddMembership(membership)}
                                    disabled={disabled}
                                    className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 border-2 border-orange-600 hover:border-orange-700"
                                >
                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    <span>Renew Membership</span>
                                </button>
                            )}
                        </div>
                        );
                    })}
                        </div>
                    )}
                </div>
            )}
            
            {/* Information Messages */}
            {disabled && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                    <div className="flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>Membership features disabled when coupon or wallet discount is used</span>
                    </div>
                </div>
            )}
            
            {/* Expired Memberships Info */}
            {!disabled && memberships.some(m => getDaysRemaining(m.endDate) <= 0) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="flex items-center space-x-1">
                        <span>🔴</span>
                        <span>Expired memberships cannot be selected. Use "Renew Membership" to reactivate.</span>
                    </div>
                </div>
            )}
            
        </div>
    );
}

export default ActiveMemberships;
