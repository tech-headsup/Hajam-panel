import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Textarea } from 'rizzui';
import { setApiJson } from '../../redux/Actions/ApiAction';

/**
 * TextArea - Custom textarea component using RizzUI
 * @param {string} placeholder - Placeholder text for textarea
 * @param {boolean} error - Whether the textarea has an error
 * @param {string} errormsg - Error message to display
 * @param {string} name - Textarea name (for form data and Redux state)
 * @param {string} title - Label text for textarea
 * @param {boolean} important - Whether textarea is required (shows * indicator)
 * @param {string} defaultValue - Default value for textarea
 * @param {string} specification - Additional information about textarea
 * @param {number} rows - Number of rows to display
 */
function TextArea({
  placeholder = '',
  error = false,
  errormsg = '',
  name = '',
  title = '',
  important = false,
  defaultValue = '',
  specification = '',
  rows = 4,
  ...rest
}) {
  const ApiReducer = useSelector((state) => state.ApiReducer);
  const dispatch = useDispatch();
  
  const handleChange = (e) => {
    // Create a new object to avoid mutating state directly
    const updatedApiJson = {
      ...ApiReducer.apiJson,
      [name]: e.target.value
    };
    
    dispatch(setApiJson(updatedApiJson));
  };
  
  // Determine the initial value
  const initialValue = ApiReducer.apiJson && ApiReducer.apiJson[name] !== undefined
    ? ApiReducer.apiJson[name]
    : defaultValue;

  return (
    <div className="mb-4">
      {/* Custom label */}
      {title && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {title}
          {important && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* RizzUI Textarea with custom styling */}
      <Textarea
        id={name}
        name={name}
        value={initialValue}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        variant="active"
        labelClassName="hidden" // Hide RizzUI's label since we're using our own
        className="w-full"
        textareaClassName={`w-full px-3 py-2 mt-2 bg-transparent border rounded-lg ${
          error ? 'border-red-500' : 'border-slate-300'
        } placeholder:text-slate-400/70 hover:border-slate-400 focus:border-primary`}
        {...rest}
      />
      
      {/* Error message */}
      {error  && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      
      {/* Specification text */}
      {specification && (
        <p className="mt-1 text-xs text-gray-500">{specification}</p>
      )}
    </div>
  );
}

export default TextArea;