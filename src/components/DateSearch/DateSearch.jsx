import { useState, useEffect } from 'react';
import AppButton from '../AppButton/AppButton';
import toast from 'react-hot-toast';

function DateSearch({ onSearch, onClear }) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateError, setDateError] = useState('');

    // Validate date range (max 3 months)
    const validateDateRange = (start, end) => {
        if (!start || !end) return false;

        const startDateObj = new Date(start);
        const endDateObj = new Date(end);

        // Check if end date is before start date
        if (endDateObj < startDateObj) {
            setDateError('End date must be after start date');
            return false;
        }

        // Calculate difference in months
        const monthsDiff = (endDateObj.getFullYear() - startDateObj.getFullYear()) * 12
                          + (endDateObj.getMonth() - startDateObj.getMonth());

        // Check if difference exceeds 3 months
        if (monthsDiff > 3) {
            setDateError('Date range cannot exceed 3 months');
            return false;
        }

        // Additional check for days to handle edge cases
        const daysDiff = Math.floor((endDateObj - startDateObj) / (1000 * 60 * 60 * 24));
        if (daysDiff > 90) {
            setDateError('Date range cannot exceed 3 months (90 days)');
            return false;
        }

        setDateError('');
        return true;
    };

    // Clear date error when dates change
    useEffect(() => {
        if (startDate && endDate) {
            validateDateRange(startDate, endDate);
        } else {
            setDateError('');
        }
    }, [startDate, endDate]);

    const handleSearch = () => {
        if (!startDate || !endDate) {
            toast.error('Please select both start and end dates');
            return;
        }

        if (!validateDateRange(startDate, endDate)) {
            toast.error(dateError);
            return;
        }

        if (onSearch) {
            onSearch(startDate, endDate);
        }
    };

    const handleClear = () => {
        setStartDate('');
        setEndDate('');
        setDateError('');
        if (onClear) {
            onClear();
        }
    };

    // Get today's date in YYYY-MM-DD format for max attribute
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">From:</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={today}
                    className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
            </div>

            <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">To:</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    max={today}
                    min={startDate}
                    className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
            </div>

            {/* Show date range error inline */}
            {dateError && (
                <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                    {dateError}
                </span>
            )}

            <div className="flex items-center gap-2">
                <AppButton
                    buttontext="Search"
                    onClick={handleSearch}
                    disabled={!startDate || !endDate || !!dateError}
                />

                {(startDate || endDate) && (
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded-md hover:border-red-300 transition-all duration-200"
                        title="Clear dates"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>
    );
}

export default DateSearch;
