import { useState, useEffect } from 'react';
import { FileText, X } from 'lucide-react';
import { getHoldBills, removeHoldBill } from '../../storage/Storage';
import toast from 'react-hot-toast';

function HoldBillTabs({ onLoadHoldBill, currentHoldBillId, refreshTrigger }) {
    const [holdBills, setHoldBills] = useState([]);

    useEffect(() => {
        loadHoldBills();
    }, [refreshTrigger]);

    const loadHoldBills = () => {
        const allHoldBills = getHoldBills();
        // Sort by creation date (most recent first) and take only first 5
        const sortedBills = allHoldBills
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        setHoldBills(sortedBills);
    };

    const handleLoadBill = (bill) => {
        if (onLoadHoldBill) {
            onLoadHoldBill(bill);
        }
    };

    const handleDeleteBill = (billId, e) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this hold bill?')) {
            const success = removeHoldBill(billId);
            if (success) {
                loadHoldBills(); // Refresh the list
                toast.success('Hold bill deleted');
                // If the deleted bill was currently loaded, we should clear the current state
                // This will be handled by the parent component
            }
        }
    };

    const formatAmount = (amount) => {
        return `₹${(amount || 0).toFixed(2)}`;
    };

    const formatClientName = (name) => {
        if (!name) return 'Unknown';
        // Limit to 10 characters and add ellipsis if longer
        return name.length > 10 ? `${name.substring(0, 10)}...` : name;
    };

    if (holdBills.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center space-x-3 ml-8">
            <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-gray-600">Hold Bills:</span>
            </div>
            
            <div className="flex space-x-2">
                {holdBills.map((bill) => (
                    <div
                        key={bill.id}
                        className={`relative group cursor-pointer px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                            currentHoldBillId === bill.id
                                ? 'bg-orange-100 border-orange-300 shadow-sm'
                                : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                        }`}
                        onClick={() => handleLoadBill(bill)}
                    >
                        <div className="flex items-center space-x-2">
                            <div className="text-xs">
                                <div className="font-medium text-gray-900">
                                    {formatClientName(bill.clientName)}
                                </div>
                                <div className="text-orange-600 font-semibold">
                                    {formatAmount(bill.purchaseAmount)}
                                </div>
                            </div>
                            
                            <button
                                onClick={(e) => handleDeleteBill(bill.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 transition-all duration-200"
                                title="Delete Hold Bill"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                        
                        {/* Active indicator */}
                        {currentHoldBillId === bill.id && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-600 rounded-full"></div>
                        )}
                    </div>
                ))}
            </div>
            
            {holdBills.length === 5 && (
                <div className="text-xs text-gray-500 italic">
                    (Latest 5 shown)
                </div>
            )}
        </div>
    );
}

export default HoldBillTabs;