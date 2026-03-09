import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Popover } from 'rizzui';
import {
  removeElevateUser,
  removeAcessToken,
  removeSelectedUnit,
  setSelectedUnit,
  getSelectedUnit,
} from '../../storage/Storage';
import { useSelector, useDispatch } from 'react-redux';
import { allReduxClear } from '../../utils/utils';
import { useNavigate } from 'react-router-dom';
import AppDropDown from '../AppDropDown/AppDropDown';

const Header = ({ onToggleCollapse, hideSideBar, isMobile }) => {
  const userData = useSelector((state) => state.UserReducer?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnitState] = useState(null);

  const userInitial = userData?.name ? userData.name.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    if (userData?.unitIds) {
      setUnits(userData.unitIds);
    }
  }, [userData]);

  useEffect(() => {
    const savedUnit = getSelectedUnit();
    if (savedUnit) {
      setSelectedUnitState(savedUnit);
    }
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogout = () => {
    removeElevateUser();
    removeAcessToken();
    removeSelectedUnit();
    allReduxClear(dispatch);
    navigate('/');
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find((u) => u._id === unitId);
    if (unit) {
      setSelectedUnitState(unit);
      setSelectedUnit(unit);
      window.location.reload();
    }
  };

  const unitOptions = units.map((unit) => ({
    label: `${unit.unitName} (${unit.unitCode})`,
    onClick: () => handleUnitChange(unit._id),
  }));

  const getDropdownTitle = () => {
    if (selectedUnit) return selectedUnit.unitName;
    if (units.length > 0) return units[0]?.unitName || 'Select Unit';
    return 'Select Unit';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left: hamburger */}
      <div className="flex items-center">
        {!hideSideBar && (
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* Right: unit dropdown + name + avatar */}
      <div className="flex items-center space-x-3">
        {unitOptions.length > 1 && (
          <div className="hidden md:block">
            <AppDropDown title={getDropdownTitle()} options={unitOptions} />
          </div>
        )}

        <span className="hidden md:block text-gray-900 font-medium text-sm">
          {userData?.name || ''}
        </span>

        <Popover placement="bottom-end">
          <Popover.Trigger>
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors">
              <span className="text-white text-sm font-semibold">{userInitial}</span>
            </div>
          </Popover.Trigger>

          <Popover.Content>
            {({ setOpen }) => (
              <div className="font-sans p-5 w-80 bg-white rounded-xl shadow-xl">
                {/* Avatar + name */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gray-900 flex items-center justify-center ring-2 ring-gray-900 ring-offset-2 flex-shrink-0">
                    <span className="text-white text-lg font-bold">
                      {userData?.name
                        ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                        : 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{userData?.name}</p>
                    <p className="text-sm text-gray-500">@{userData?.username}</p>
                  </div>
                </div>

                {/* Current unit */}
                {selectedUnit && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-600 mb-1">Current Unit:</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedUnit.unitName}</p>
                    <p className="text-xs text-gray-600">{selectedUnit.unitCode}</p>
                  </div>
                )}

                {/* User details */}
                <div className="space-y-3 border-t border-b border-gray-200 py-4 my-4">
                  {[
                    { label: 'Email:', value: userData?.email },
                    { label: 'Contact:', value: userData?.phoneNumber },
                    { label: 'Member since:', value: formatDate(userData?.createdAt) },
                    { label: 'Role Type:', value: userData?.roleData?.roleType },
                    { label: 'User Type:', value: userData?.userType },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">{label}</span>
                      <span className="text-sm text-gray-900 text-right max-w-[55%] break-all">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Logout */}
                <button
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => { setOpen(false); handleLogout(); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </Popover.Content>
        </Popover>
      </div>
    </header>
  );
};

export default Header;
