import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';

/**
 * AppInput - Custom input component using RizzUI
 * @param {string} placeholder - Placeholder text for input
 * @param {boolean} error - Whether the input has an error
 * @param {string} errormsg - Error message to display
 * @param {string} name - Input name (for form data and Redux state)
 * @param {string} title - Label text for input
 * @param {boolean} important - Whether input is required (shows * indicator)
 * @param {string} type - Input type (text, number, password, etc.)
 * @param {string|number} defaultValue - Default value for input
 * @param {string} specification - Additional information about input
 * @param {React.ReactNode} icon - Icon component to display
 * @param {string} prefix - Text prefix (like currency symbols)
 */
function AppInput({
  placeholder = '',
  value,
  error = false,
  name = '',
  title = '',
  important = false,
  type = 'text',
  defaultValue = '',
  specification = '',
  step = undefined,
  min = undefined,
  max = undefined,
  icon = null,
  prefix = '',
  num = false,
  onChangeInput,
  str,
  ...rest
}) {
  const ApiReducer = useSelector((state) => state.ApiReducer);
  const dispatch = useDispatch();

  // Get input value from Redux store or use default
  const inputValue = ApiReducer.apiJson && ApiReducer.apiJson[name] !== undefined
    ? ApiReducer.apiJson[name]
    : defaultValue;

  const handleChange = (e) => {
    let value = e.target.value;

    // Convert to number if input type is number
    if (type === 'number') {
      // Handle empty string or non-numeric values
      if (value === '' || value === null || value === undefined) {
        value = '';
      } else {
        // Convert to number based on step attribute
        if (step && step.includes('.')) {
          // If step has decimal places, convert to float
          const parsedValue = parseFloat(value);
          value = isNaN(parsedValue) ? '' : parsedValue;
        } else {
          // Otherwise convert to integer
          const parsedValue = parseInt(value, 10);
          value = isNaN(parsedValue) ? '' : parsedValue;
        }
      }
    }

    // Update Redux store with the processed value
    const updatedApiJson = {
      ...ApiReducer.apiJson,
      [name]: value
    };

    console.log(`Field: ${name}, Value: ${value}, Type: ${typeof value}`);
    dispatch(setApiJson(updatedApiJson));

    console.log("ApiReducer-----", ApiReducer);

  };

  // Handle key press for numeric inputs
  const handleKeyPress = (e) => {
    if ((name === "price" || name === "member_price" || type === "number") && type !== "number") {
      // Allow only numbers, decimal point, and control keys
      if (!/^\d*\.?\d*$/.test(e.key) &&
        e.key !== "Backspace" &&
        e.key !== "Delete" &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "Tab") {
        e.preventDefault();
      }
    }
    if (num) {
      console.log("e", e);
      // Allow only numbers, decimal point, and control keys when num is true
      if (!/^\d*\.?\d*$/.test(e.key) &&
        e.key !== "Backspace" &&
        e.key !== "Delete" &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "Tab") {
        e.preventDefault();
      }
    }
    if (str) {
      if (/^\d*\.?\d*$/.test(e.key) &&
        e.key !== "Backspace" &&
        e.key !== "Delete" &&
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "Tab") {
        e.preventDefault();
      }
    }

  };



  // Handle blur event to ensure proper number conversion
  const handleBlur = (e) => {
    if (type === 'number' && e.target.value !== '') {
      let value = e.target.value;

      // Final conversion on blur to ensure proper number format
      if (step && step.includes('.')) {
        const parsedValue = parseFloat(value);
        if (!isNaN(parsedValue)) {
          // Apply min/max constraints if provided
          let finalValue = parsedValue;
          if (min !== undefined && finalValue < parseFloat(min)) {
            finalValue = parseFloat(min);
          }
          if (max !== undefined && finalValue > parseFloat(max)) {
            finalValue = parseFloat(max);
          }

          const updatedApiJson = {
            ...ApiReducer.apiJson,
            [name]: finalValue
          };
          dispatch(setApiJson(updatedApiJson));
        }
      } else {
        const parsedValue = parseInt(value, 10);
        if (!isNaN(parsedValue)) {
          // Apply min/max constraints if provided
          let finalValue = parsedValue;
          if (min !== undefined && finalValue < parseInt(min)) {
            finalValue = parseInt(min);
          }
          if (max !== undefined && finalValue > parseInt(max)) {
            finalValue = parseInt(max);
          }

          const updatedApiJson = {
            ...ApiReducer.apiJson,
            [name]: finalValue
          };
          dispatch(setApiJson(updatedApiJson));
        }
      }
    }
  };

  // CSS class to hide number input arrows
  const numberInputClass = type === 'number' ? 'no-spinner' : '';

  return (
    <div className="mb-4">
      {/* CSS styles to hide number input spinners */}
      <style jsx>{`
        .no-spinner::-webkit-outer-spin-button,
        .no-spinner::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .no-spinner[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Label */}
      {title && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {title}
          {important && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container with Icon and Prefix */}
      <div className="relative">
        {/* Left Icon - Fixed positioning */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10 flex items-center justify-center w-5 h-5">
            {icon}
          </div>
        )}

        {/* Prefix (like ₹ symbol) - Positioned after icon */}
        {prefix && (
          <div className={`absolute ${icon ? 'left-11' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none z-10 flex items-center`}>
            <span className="text-sm font-medium">{prefix}</span>
          </div>
        )}

        {/* Custom Input to replace RizzUI Input for better control */}
        <input
          id={name}
          type={type}
          name={name}
          value={value ? value : inputValue}
          onChange={onChangeInput ? onChangeInput : handleChange}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          onWheel={(e) => e.target.blur()}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          className={`w-full h-11 py-2 bg-transparent border rounded-lg transition-colors border-slate-300 hover:border-slate-400 focus:border-blue-500 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 ${numberInputClass} ${icon && prefix ? 'pl-16 pr-3' :
            icon ? 'pl-11 pr-3' :
              prefix ? 'pl-10 pr-3' :
                'pl-3 pr-3'
            }`}
          {...rest}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{ApiReducer.apiJsonError[name]}</p>
      )}

      {/* Specification text */}
      {specification && (
        <p className="mt-1 text-xs text-gray-500">{specification}</p>
      )}
    </div>
  );
}

export default AppInput;
