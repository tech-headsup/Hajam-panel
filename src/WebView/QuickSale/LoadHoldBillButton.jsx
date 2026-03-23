import { useState, useEffect } from 'react';
import { FileText, Clock, Trash2 } from 'lucide-react';
import { getClientHoldBills, removeHoldBill } from '../../storage/Storage';
import toast from 'react-hot-toast';

function LoadHoldBillButton({ selectedClient, onLoadHoldBill }) {
    const [holdBills, setHoldBills] = useState([]);

    useEffect(() => {
        if (selectedClient) {
            loadClientHoldBills();
        } else {
            setHoldBills([]);
        }
    }, [selectedClient]);

    const loadClientHoldBills = () => {
        if (!selectedClient) return;
        const clientHoldBills = getClientHoldBills(selectedClient._id);
        // Sort by creation date (most recent first)
        const sortedBills = clientHoldBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setHoldBills(sortedBills);
    };

    const handleLoadBill = (bill) => {
        if (onLoadHoldBill) {
            onLoadHoldBill(bill);
            toast.success('Hold bill loaded successfully!');
        }
    };

    const handleDeleteBill = (billId, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this hold bill?')) {
            const success = removeHoldBill(billId);
            if (success) {
                loadClientHoldBills(); // Refresh the list
                toast.success('Hold bill deleted');
            }
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid Date';
        }
    };

    const formatAmount = (amount) => {
        return `₹${(amount || 0).toFixed(2)}`;
    };

    if (!selectedClient) {
        return null;
    }

    return (
        <div className="bg-white p-3 border rounded-lg mt-2">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Hold Bills</h2>
                </div>
                {holdBills.length > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded">
                        {holdBills.length}
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {holdBills.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No hold bills found</p>
                        <p className="text-xs text-gray-400 mt-1">Hold bills will appear here when saved</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {holdBills.map((bill) => (
                            <div
                                key={bill.id}
                                className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors cursor-pointer"
                                onClick={() => handleLoadBill(bill)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                {formatDate(bill.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-1">
                                            {bill.services && bill.services.length > 0 && (
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-medium">{bill.services.length}</span> service{bill.services.length !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                            
                                            {bill.products && bill.products.length > 0 && (
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-medium">{bill.products.length}</span> product{bill.products.length !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                            
                                            {bill.memberships && bill.memberships.length > 0 && (
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-medium">{bill.memberships.length}</span> membership{bill.memberships.length !== 1 ? 's' : ''}
                                                </div>
                                            )}
                                            
                                            {bill.selectedMembership && (
                                                <div className="text-xs text-purple-600">
                                                    Membership: {bill.selectedMembership.membershipId?.name || 'Selected'}
                                                </div>
                                            )}
                                            
                                            {bill.appliedCoupon && (
                                                <div className="text-xs text-orange-600">
                                                    Coupon: {bill.appliedCoupon.code}
                                                </div>
                                            )}
                                            
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatAmount(bill.purchaseAmount)}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteBill(bill.id, e)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-3"
                                        title="Delete Hold Bill"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoadHoldBillButton;