import { CheckCircle, Receipt, User, DollarSign, X } from 'lucide-react';
import AppButton from '../../components/AppButton/AppButton';

function ThankYouPage({ isOpen, onClose, billData }) {

    if (!isOpen) return null;

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0.00';
        return `₹${parseFloat(amount).toFixed(2)}`;
    };


    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center text-white">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-10 w-10 text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
                        <p className="text-green-100">Your bill has been generated successfully</p>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        {billData && (
                            <div className="space-y-4">
                                {/* Bill Summary */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Receipt className="h-5 w-5 text-gray-600" />
                                        <h3 className="font-semibold text-gray-900">Bill Summary</h3>
                                    </div>
                                    
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bill Number:</span>
                                            <span className="font-medium">{billData.billNumber}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Amount:</span>
                                            <span className="font-bold text-green-600">
                                                {formatCurrency(billData.calculations?.totals?.grandTotal)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Status:</span>
                                            <span className="font-medium text-green-600">
                                                {billData.payment?.paymentStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Client Info */}
                                {billData.client && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <User className="h-5 w-5 text-blue-600" />
                                            <h3 className="font-semibold text-gray-900">Client</h3>
                                        </div>
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{billData.client.name}</p>
                                            {billData.client.phone && (
                                                <p className="text-gray-600">{billData.client.phone}</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Items Summary */}
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <DollarSign className="h-5 w-5 text-purple-600" />
                                        <h3 className="font-semibold text-gray-900">Items</h3>
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {billData.calculations?.items?.services?.count > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Services:</span>
                                                <span className="font-medium">
                                                    {billData.calculations.items.services.count} items
                                                </span>
                                            </div>
                                        )}
                                        {billData.calculations?.items?.products?.count > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Products:</span>
                                                <span className="font-medium">
                                                    {billData.calculations.items.products.count} items
                                                </span>
                                            </div>
                                        )}
                                        {billData.calculations?.items?.memberships?.count > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Memberships:</span>
                                                <span className="font-medium">
                                                    {billData.calculations.items.memberships.count} items
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Savings */}
                                {billData.calculations?.totals?.totalSavings > 0 && (
                                    <div className="bg-green-50 rounded-lg p-4 text-center">
                                        <h3 className="font-semibold text-green-800 mb-1">You Saved!</h3>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatCurrency(billData.calculations.totals.totalSavings)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4">
                        {/* Action Buttons Row */}
                        <div className="flex justify-between space-x-3">
                            <AppButton
                                buttontext="Close"
                                onClick={onClose}
                                backgroundColor="#6b7280"
                                useCustomColors={true}
                                className="flex-1"
                            />
                            <AppButton
                                buttontext="New Sale"
                                onClick={onClose}
                                className="flex-1"
                            />
                        </div>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </div>
            
        </div>
    );
}

export default ThankYouPage;