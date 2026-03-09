import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';

function AppSwitch({
  title,
  name,
  error = false,
  errormsg = "",
  important = false,
  specification = "",
  disabled = false,
  activeColor = "#3b82f6", // Default blue color
  inactiveColor = "#e5e7eb" // Default gray color
}) {
  const ApiReducer = useSelector(state => state.ApiReducer);
  const dispatch = useDispatch();

  // Get the current value from Redux state - ensure boolean type
  const isChecked = ApiReducer.apiJson && name in ApiReducer.apiJson
    ? Boolean(ApiReducer.apiJson[name])
    : false;

  const handleChange = () => {
    if (disabled) return;

    // Toggle the current value as a boolean
    const newValue = !isChecked;

    const updatedApiJson = {
      ...ApiReducer.apiJson,
      [name]: newValue
    };

    dispatch(setApiJson(updatedApiJson));
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        {/* Custom Switch */}
        <div
          className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{ backgroundColor: isChecked ? activeColor : inactiveColor }}
          onClick={handleChange}
        >
          <span
            className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full shadow transform transition-transform duration-200 ease-in-out ${
              isChecked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>

        <label
          className={`block text-sm font-medium text-gray-700 ml-3 ${!disabled && 'cursor-pointer'}`}
          onClick={!disabled ? handleChange : undefined}
        >
          {title}
          {important && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {specification && (
        <div className="mt-1 text-xs text-gray-500">{specification}</div>
      )}

      {error && errormsg && (
        <div className="mt-1 text-xs text-red-500">{errormsg}</div>
      )}
    </div>
  );
}

export default AppSwitch;
