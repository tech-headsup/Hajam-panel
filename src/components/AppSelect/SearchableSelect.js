import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';

function SearchableSelect({
    title,
    name,
    options = [],
    error = false,
    important = false,
    specification = "",
    icon = null,
    disabled = false,
    searchSlelect,
    onSelect,
    placeholder = "Search and select an option",
    value,
    using,
    productIndex,
    stepIndex,
    serviceIndex,
    defaultValue,
    closing,
    onChange
}) {
    const ApiReducer = useSelector(state => state.ApiReducer);
    const dispatch = useDispatch();

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [selectedOptionCache, setSelectedOptionCache] = useState(null);

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Handle both string values and objects (populated from API)
    const rawValue = ApiReducer.apiJson?.[name] ?? defaultValue ?? '';
    const currentValue = typeof rawValue === 'object' && rawValue !== null && rawValue._id
        ? rawValue._id
        : rawValue;

    const selectedOption = options.find(option => option.value === currentValue) || selectedOptionCache;
    const displayText = value ? value : selectedOption ? selectedOption.label : '';

    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        if (!ApiReducer.apiJson?.[name] && defaultValue) {
            const found = options.find(opt => opt.value === defaultValue);
            if (found) {
                setSelectedOptionCache(found);
            }
        }
    }, [defaultValue, options, ApiReducer.apiJson, name]);


    const handleSelect = (value) => {
        if (onSelect) {
            if (using === 'stockModal') {
                onSelect(value, productIndex, stepIndex, serviceIndex);
            }
            else if (closing) {
                onSelect(value, productIndex);
            }
            else {
                onSelect(value);
            }
        }
        else {
            const selectedOpt = options.find(opt => opt.value === value);

            const updatedApiJson = {
                ...ApiReducer.apiJson,
                [name]: value
            };

            dispatch(setApiJson(updatedApiJson));
            setSelectedOptionCache(selectedOpt);
            setIsOpen(false);
            setSearchTerm('');
            if (searchSlelect) searchSlelect('');
            setHighlightedIndex(-1);
        }
    };

    const handleInputChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (searchSlelect) searchSlelect(term);
        setHighlightedIndex(-1);
        if (!isOpen) setIsOpen(true);
    };

    const handleInputClick = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm('');
            if (searchSlelect) searchSlelect('');
        }
    };

    const handleKeyDown = (e) => {
        if (disabled) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (!isOpen) {
                    setIsOpen(true);
                } else {
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    );
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                if (isOpen) {
                    setHighlightedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredOptions.length - 1
                    );
                }
                break;
            case 'Enter':
                e.preventDefault();
                if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value);
                } else if (!isOpen) {
                    setIsOpen(true);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                if (searchSlelect) searchSlelect('');
                setHighlightedIndex(-1);
                inputRef.current?.blur();
                break;
            case 'Tab':
                setIsOpen(false);
                setSearchTerm('');
                if (searchSlelect) searchSlelect('');
                break;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
                if (searchSlelect) searchSlelect('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [searchSlelect]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
                {title}
                {important && <span className="text-red-500 ml-1">*</span>}
            </label>

            <div className="relative" ref={dropdownRef}>
                {icon && (
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                        {icon}
                    </div>
                )}

                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        className={`w-full h-11 py-2 bg-white border rounded-lg transition-all duration-200 border-slate-300 hover:border-slate-400 focus:border-blue-500 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${icon ? 'pl-11 pr-10' : 'pl-3 pr-10'
                            } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                            }`}
                        value={isOpen ? searchTerm : displayText}
                        onChange={onChange ? onChange : handleInputChange}
                        onClick={handleInputClick}
                        onKeyDown={handleKeyDown}
                        placeholder={displayText || placeholder}
                        disabled={disabled}
                        autoComplete="off"
                    />

                    {/* Dropdown Arrow */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Dropdown */}
                {isOpen && !disabled && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => (
                                <div
                                    key={option.value}
                                    className={`px-3 py-2.5 cursor-pointer transition-colors text-sm ${index === highlightedIndex
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'hover:bg-gray-50 text-gray-900'
                                        } ${currentValue === option.value
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : ''
                                        }`}
                                    onClick={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{option.label}</span>
                                        {currentValue === option.value && (
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2.5 text-sm text-gray-500 text-center">No options found</div>
                        )}
                    </div>
                )}
            </div>

            {error && (
                <p className="mt-1 text-sm text-red-500">{ApiReducer?.apiJsonError?.[name]}</p>
            )}

            {specification && (
                <p className="mt-1 text-xs text-gray-500">{specification}</p>
            )}
        </div>
    );
}

export default SearchableSelect;
