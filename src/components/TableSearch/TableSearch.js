import { useState } from 'react';
import AppButton from '../AppButton/AppButton';

function TableSearch({
    options,
    optionSelect,
    setOptionSelect,
    setValueSearched,
    onClick,
    onClear,
    valueSearched,
    children,
    enableDateSearch = true
}) {
    const [activeTab, setActiveTab] = useState('text'); // 'text' or 'date'

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        // Clear all fields when switching tabs
        if (onClear) {
            onClear();
        }
    };

    return (
        <div className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3">
            {/* Tabs - only show if children (DateSearch) is provided */}
            {children && enableDateSearch && (
                <div className="inline-flex rounded-lg bg-gray-100 p-1 gap-1 flex-shrink-0">
                    <button
                        onClick={() => handleTabChange('text')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                            activeTab === 'text'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Text Search
                    </button>
                    <button
                        onClick={() => handleTabChange('date')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                            activeTab === 'date'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        Date Range
                    </button>
                </div>
            )}

            {/* Tab Content */}
            <div className="flex-1">
                {/* Text Search Tab Content */}
                {activeTab === 'text' && (
                    <div className='flex items-center gap-3 flex-wrap'>
                        <select
                            id="search-select"
                            value={optionSelect || ''}
                            onChange={(e) => setOptionSelect(e.target.value)}
                            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Choose an option...</option>
                            {options.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* Input with clear button inside */}
                        <div className="relative w-64">
                            <input
                                placeholder='Search...'
                                value={valueSearched || ''}
                                onChange={(e) => setValueSearched(e.target.value)}
                                className="block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />

                            {/* Clear Button inside input - only show when there's text */}
                            {valueSearched && (
                                <button
                                    onClick={onClear}
                                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 h-full text-gray-400 hover:text-red-500 transition-colors duration-200"
                                    title="Clear search"
                                    type="button"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <AppButton
                            buttontext={"Search"}
                            onClick={onClick}
                            disabled={!optionSelect || !valueSearched}
                        />
                    </div>
                )}

                {/* Date Search Tab Content */}
                {activeTab === 'date' && children}
            </div>
        </div>
    )
}

export default TableSearch
