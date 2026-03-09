import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';

function AppSelect({
  title,
  name,
  options = [],
  error = false,
  important = false,
  specification = "",
  icon = null,
  disabled = false,
  placeholder = "Select an option",
  size = "md" // new prop
}) {
  const ApiReducer = useSelector(state => state.ApiReducer);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const value = e.target.value;
    const updatedApiJson = {
      ...ApiReducer.apiJson,
      [name]: value
    };
    dispatch(setApiJson(updatedApiJson));
  };

  // Handle both string values and objects (populated from API)
  const rawValue = ApiReducer.apiJson?.[name] || '';
  const currentValue = typeof rawValue === 'object' && rawValue !== null && rawValue._id
    ? rawValue._id
    : rawValue;

  // Size classes
  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-base",
    lg: "h-12 text-lg",
    xl: "h-14 text-xl"
  };

  return (
    <div className="mb-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title}
        {important && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Select Wrapper */}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {icon}
          </div>
        )}

        <select
          className={`w-full bg-transparent border rounded-lg transition-colors border-slate-300 hover:border-slate-400 focus:border-blue-500 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20
            ${sizeClasses[size] || sizeClasses.md}
            ${icon ? 'pl-11 pr-3' : 'pl-3 pr-3'}
            ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{ApiReducer?.apiJsonError?.[name]}</p>
      )}

      {/* Specification */}
      {specification && (
        <p className="mt-1 text-xs text-gray-500">{specification}</p>
      )}
    </div>
  );
}

export default AppSelect;
