import { useState, useEffect } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, RefreshCw, Loader2, Package } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchInventoryTransaction } from '../../constant/Constant';

function TransactionHistory({ isOpen, onClose, inventory }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && inventory?._id) {
            fetchTransactions();
        }
    }, [isOpen, inventory]);

    const fetchTransactions = () => {
        setLoading(true);
        const json = {
            page: 1,
            limit: 100,
            search: {
                inventoryId: inventory._id
            },
            sort: { createdAt: -1 },
            populate: [
                { path: 'productId', select: 'productName brand' },
                { path: 'createdBy', select: 'name email' }
            ]
        };

        HitApi(json, searchInventoryTransaction).then((res) => {
            if (res?.data?.docs) {
                setTransactions(res.data.docs);
            } else {
                setTransactions([]);
            }
        }).catch((err) => {
            console.error(err);
            setTransactions([]);
        }).finally(() => {
            setLoading(false);
        });
    };

    const getTransactionIcon = (type) => {
        switch (type) {
            case 'IN':
                return <ArrowDownCircle size={18} className="text-green-600" />;
            case 'OUT':
                return <ArrowUpCircle size={18} className="text-red-600" />;
            case 'ADJUSTMENT':
                return <RefreshCw size={18} className="text-blue-600" />;
            default:
                return null;
        }
    };

    const getTransactionColor = (type) => {
        switch (type) {
            case 'IN':
                return 'text-green-600 bg-green-50';
            case 'OUT':
                return 'text-red-600 bg-red-50';
            case 'ADJUSTMENT':
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Transaction History
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {inventory && (
                    <div className="p-4 border-b bg-gray-50">
                        <div className="flex items-center gap-3">
                            {inventory.productId?.productImageUrl ? (
                                <img
                                    src={inventory.productId.productImageUrl}
                                    alt={inventory.productId.productName}
                                    className="w-12 h-12 object-cover rounded"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                    <Package size={20} className="text-gray-400" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-gray-900">{inventory.productId?.productName || 'N/A'}</p>
                                <p className="text-sm text-gray-500">
                                    Current Stock: <span className="font-medium text-gray-900">{inventory.qty || 0}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={32} className="text-gray-400 animate-spin" />
                        </div>
                    ) : transactions.length > 0 ? (
                        <div className="space-y-3">
                            {transactions.map((transaction) => (
                                <div
                                    key={transaction._id}
                                    className="border rounded-lg p-3 hover:bg-gray-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {getTransactionIcon(transaction.transactionType)}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTransactionColor(transaction.transactionType)}`}>
                                                        {transaction.transactionType}
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {transaction.transactionType === 'OUT' ? '-' : '+'}{transaction.qty}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {transaction.reason || 'No reason provided'}
                                                </p>
                                                {transaction.referenceType && (
                                                    <span className="text-xs text-gray-400">
                                                        Type: {transaction.referenceType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                {formatDate(transaction.createdAt)}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {transaction.previousQty} → {transaction.newQty}
                                            </p>
                                            {transaction.createdBy && (
                                                <p className="text-xs text-gray-400">
                                                    by {transaction.createdBy.name || transaction.createdBy.email}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <RefreshCw size={48} className="mx-auto text-gray-300 mb-3" />
                            <p>No transactions found</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t">
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

export default TransactionHistory;
