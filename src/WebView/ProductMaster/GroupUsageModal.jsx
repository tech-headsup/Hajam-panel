import { X, Users } from 'lucide-react';

function GroupUsageModal({ isOpen, onClose, title, groups }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Groups Using</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4">
                    <p className="text-sm text-gray-500 mb-3">{title}</p>

                    {groups && groups.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {groups.map((group, index) => (
                                <div
                                    key={group._id || index}
                                    className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                                >
                                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                        {group.name?.charAt(0)?.toUpperCase() || 'G'}
                                    </div>
                                    <span className="text-gray-900 font-medium">
                                        {group.name || 'Unknown Group'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-gray-500">
                            Not used by any other group
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

export default GroupUsageModal;
