import { useState } from 'react';
import { CreditCard, Smartphone, Banknote, CheckCircle } from 'lucide-react';

function PaymentMethod({ onPaymentSelect, selectedMethod }) {
    const [internalSelectedMethod, setInternalSelectedMethod] = useState(selectedMethod || null);

    const paymentMethods = [
        {
            id: 'CASH',
            name: 'Cash',
            icon: Banknote,
            color: 'green',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            hoverBorderColor: 'hover:border-green-400',
            selectedBorderColor: 'border-green-600',
            selectedBgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            textColor: 'text-green-700'
        },
        {
            id: 'CARD',
            name: 'Card',
            icon: CreditCard,
            color: 'blue',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            hoverBorderColor: 'hover:border-blue-400',
            selectedBorderColor: 'border-blue-600',
            selectedBgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-700'
        },
        {
            id: 'UPI',
            name: 'UPI',
            icon: Smartphone,
            color: 'purple',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            hoverBorderColor: 'hover:border-purple-400',
            selectedBorderColor: 'border-purple-600',
            selectedBgColor: 'bg-purple-50',
            iconColor: 'text-purple-600',
            textColor: 'text-purple-700'
        }
    ];

    const handleSelectMethod = (method) => {
        setInternalSelectedMethod(method.id);
        if (onPaymentSelect) {
            onPaymentSelect(method.id);
        }
    };

    const currentSelectedMethod = selectedMethod || internalSelectedMethod;

    return (
        <div className="bg-white p-4 border rounded-lg">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h2>

            <div className="flex gap-2">
                {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = currentSelectedMethod === method.id;

                    return (
                        <button
                            key={method.id}
                            onClick={() => handleSelectMethod(method)}
                            className={`relative flex-1 p-2 rounded-lg border-2 transition-all ${
                                isSelected
                                    ? `${method.selectedBorderColor} ${method.selectedBgColor} shadow-sm`
                                    : `${method.borderColor} ${method.bgColor} ${method.hoverBorderColor} hover:shadow-sm`
                            }`}
                        >
                            <div className="flex flex-col items-center space-y-1">
                                <div className={`w-8 h-8 rounded-full ${method.bgColor} flex items-center justify-center`}>
                                    <Icon className={`h-4 w-4 ${method.iconColor}`} />
                                </div>
                                <span className={`text-xs font-medium ${method.textColor}`}>
                                    {method.name}
                                </span>
                            </div>

                            {isSelected && (
                                <div className="absolute top-1 right-1">
                                    <CheckCircle className={`h-3 w-3 ${method.iconColor}`} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default PaymentMethod;
