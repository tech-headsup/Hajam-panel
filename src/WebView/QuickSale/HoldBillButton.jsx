import { Clock } from 'lucide-react';

function HoldBillButton({ onClick, disabled = false }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            <Clock className="h-4 w-4" />
            <span>Hold Bill</span>
        </button>
    );
}

export default HoldBillButton;