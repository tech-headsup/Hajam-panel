import { Clock, Trash2, FileText, Calendar } from 'lucide-react';

function DraftBills({ clientId, draftBills, onLoadDraft, onDeleteDraft }) {
    const clientDrafts = draftBills.filter(bill => bill.clientId === clientId);

    if (!clientId || clientDrafts.length === 0) {
        return null;
    }

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

    return (
        <div className="mt-2">
            <div className="bg-white border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-purple-600" />
                        <h3 className="text-sm font-semibold text-gray-900">Draft Bills</h3>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs font-medium rounded">
                            {clientDrafts.length}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    {clientDrafts.map((draft) => (
                        <div
                            key={draft.id}
                            className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Clock className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">
                                            {formatDate(draft.createdAt)}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        {draft.services && draft.services.length > 0 && (
                                            <div className="text-xs text-gray-600">
                                                <span className="font-medium">{draft.services.length}</span> service{draft.services.length !== 1 ? 's' : ''}
                                            </div>
                                        )}
                                        
                                        {draft.selectedMembership && (
                                            <div className="text-xs text-purple-600">
                                                Membership: {draft.selectedMembership.membershipId?.name || 'Selected'}
                                            </div>
                                        )}
                                        
                                        {draft.appliedCoupon && (
                                            <div className="text-xs text-orange-600">
                                                Coupon: {draft.appliedCoupon.code}
                                            </div>
                                        )}
                                        
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatAmount(draft.purchaseAmount)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-1 ml-3">
                                    <button
                                        onClick={() => onLoadDraft(draft)}
                                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                        title="Load Draft"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => onDeleteDraft(draft.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete Draft"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                        Draft bills are saved locally and will be lost if you clear browser data
                    </p>
                </div>
            </div>
        </div>
    );
}

export default DraftBills;