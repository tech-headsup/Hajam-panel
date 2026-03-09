import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'rizzui';

function AppDropDown({ title, options = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleItemClick = (item) => {
        setIsOpen(false);
        if (item.onClick) item.onClick();
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                variant="outline"
            >
                {title}
                <svg
                    className={`ml-2 h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </Button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-gray-200 z-50 border border-gray-200">
                    <div className="py-1">
                        {options.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => handleItemClick(item)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AppDropDown;
