import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import { ChevronDown, X, Check, Search } from 'lucide-react';

function MultiSelect({
  title,
  name,
  options = [],
  error = false,
  important = false,
  specification = "",
  icon = null,
  disabled = false,
  placeholder = "Select options",
  maxDisplayItems = 3,
  searchSelect
}) {
  const ApiReducer = useSelector(state => state.ApiReducer);
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const handleChange = (selectedValues) => {
    const updatedApiJson = {
      ...ApiReducer.apiJson,
      [name]: selectedValues
    };
    dispatch(setApiJson(updatedApiJson));
  };

  // Handle both array of IDs and array of objects (populated from API)
  const rawValue = ApiReducer.apiJson && ApiReducer.apiJson[name]
    ? (Array.isArray(ApiReducer.apiJson[name]) ? ApiReducer.apiJson[name] : [])
    : [];

  // Normalize to array of IDs - handle both string IDs and objects with _id
  const currentValue = rawValue.map(val => {
    if (typeof val === 'object' && val !== null && val._id) {
      return val._id;
    }
    return val;
  });

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        if (searchSelect) searchSelect('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchSelect]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Update highlighted index when filtered options change
  useEffect(() => {
    if (highlightedIndex >= filteredOptions.length) {
      setHighlightedIndex(filteredOptions.length - 1);
    }
  }, [filteredOptions, highlightedIndex]);

  const toggleOption = (optionValue) => {
    const newValues = currentValue.includes(optionValue)
      ? currentValue.filter(val => val !== optionValue)
      : [...currentValue, optionValue];

    handleChange(newValues);
  };

  const removeOption = (optionValue, e) => {
    e.stopPropagation();
    const newValues = currentValue.filter(val => val !== optionValue);
    handleChange(newValues);
  };

  const clearAll = (e) => {
    e.stopPropagation();
    handleChange([]);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (searchSelect) searchSelect(term);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          toggleOption(filteredOptions[highlightedIndex].value);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        if (searchSelect) searchSelect('');
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        if (searchSelect) searchSelect('');
        break;
    }
  };

  const getSelectedLabels = () => {
    return currentValue.map(val => {
      const option = options.find(opt => opt.value === val);
      return option ? option.label : val;
    });
  };

  const renderSelectedItems = () => {
    const selectedLabels = getSelectedLabels();

    if (selectedLabels.length === 0) {
      return <span className="text-slate-400">{placeholder}</span>;
    }

    if (selectedLabels.length <= maxDisplayItems) {
      return (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map((label, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
            >
              {label}
              <button
                type="button"
                onClick={(e) => removeOption(currentValue[index], e)}
                className="ml-1 hover:text-blue-600"
                disabled={disabled}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
          {selectedLabels[0]}
          <button
            type="button"
            onClick={(e) => removeOption(currentValue[0], e)}
            className="ml-1 hover:text-blue-600"
            disabled={disabled}
          >
            <X size={12} />
          </button>
        </span>
        <span className="text-sm text-gray-500">
          +{selectedLabels.length - 1} more
        </span>
      </div>
    );
  };

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

        <div
          className={`w-full min-h-[44px] py-2 bg-white border rounded-lg transition-colors cursor-pointer border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 ${
            icon ? 'pl-11 pr-10' : 'pl-3 pr-10'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${
            error ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20' : ''
          }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between min-h-[28px]">
            <div className="flex-1 flex items-center">
              {renderSelectedItems()}
            </div>

            <div className="flex items-center gap-1">
              {currentValue.length > 0 && !disabled && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  {searchTerm ? `No results for "${searchTerm}"` : 'No options available'}
                </div>
              ) : (
                <div className="py-1">
                  {filteredOptions.map((option, index) => {
                    const isSelected = currentValue.includes(option.value);
                    return (
                      <div
                        key={option.value}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                          index === highlightedIndex
                            ? 'bg-blue-50 text-blue-600'
                            : 'hover:bg-gray-50'
                        } ${
                          isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                        onClick={() => toggleOption(option.value)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <span className="text-sm">{option.label}</span>
                        {isSelected && (
                          <Check size={16} className="text-blue-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Select All / Clear All Actions */}
            {filteredOptions.length > 0 && (
              <div className="border-t border-gray-200 px-3 py-2 flex justify-between bg-gray-50">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    const allFilteredValues = filteredOptions.map(opt => opt.value);
                    const newValues = [...new Set([...currentValue, ...allFilteredValues])];
                    handleChange(newValues);
                  }}
                >
                  Select All Filtered
                </button>
                <button
                  type="button"
                  className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    const filteredValues = filteredOptions.map(opt => opt.value);
                    const newValues = currentValue.filter(val => !filteredValues.includes(val));
                    handleChange(newValues);
                  }}
                >
                  Clear Filtered
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{ApiReducer?.apiJsonError[name]}</p>
      )}

      {specification && (
        <p className="mt-1 text-xs text-gray-500">{specification}</p>
      )}
    </div>
  );
}

export default MultiSelect;
