import React, { useState, useEffect } from 'react';
import { Menu, ArrowLeft, ArrowRight } from 'lucide-react';
import { Popover, Button, Avatar, Text } from "rizzui";
import { removeElevateUser, setSelectedUnit, getSelectedUnit, removeAcessToken, removeSelectedUnit } from '../../storage/Storage';
import { useSelector, useDispatch } from 'react-redux';
import AppDropDown from '../../components/AppDropDown/AppDropDown';
import { useNavigate } from 'react-router-dom';
import { allReduxClear } from '../../utils/utils';

const Header = ({ isCollapsed, onToggleCollapse, hideSideBar, isMobile, showMobileSidebar }) => {

  const userData = useSelector(state => state.UserReducer?.user);

  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnitState] = useState(null);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const userInitial = userData?.username ? userData.username.charAt(0).toUpperCase() : 'U';

  useEffect(() => {
    setSelectedUnitState(userData?.unitIds)
    setUnits(userData?.unitIds)
  }, [])

  useEffect(() => {
    const savedUnit = getSelectedUnit();
    if (savedUnit) {
      setSelectedUnitState(savedUnit);
    }
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      removeElevateUser();
      removeAcessToken();
      removeSelectedUnit();
      allReduxClear(dispatch);
      window.location.href = '/login';
    }
  };

  const handleUnitChange = (unitId) => {
    const selectedUnitData = units.find(unit => unit._id === unitId);
    if (selectedUnitData) {
      setSelectedUnitState(selectedUnitData);
      setSelectedUnit(selectedUnitData);
      window.location.reload()
    }
  };

  const getDropdownTitle = () => {
    if (loadingUnits) return "Loading...";
    if (selectedUnit) {
      return selectedUnit.unitName;
    }
    return "Select Unit";
  };

  const unitOptions = units.map(unit => ({
    label: `${unit.unitName} (${unit.unitCode})`,
    onClick: () => handleUnitChange(unit._id)
  }));

  const handleBack = () => {
    navigate(-1);
  };
  const handleForward = () => {
    navigate(1);
  };

  return (
    <header className={`bg-white border-b border-gray-200 ${hideSideBar ? "px-2 md:px-4" : "md:px-6"} py-4 md:px-5 px-3 flex items-center justify-between `}>
      <div className="flex items-center ">
        {hideSideBar ?
          <div className='flex gap-2 items-center'>
            <div className='w-full flex items-center'>
              <span className="text-black font-bold text-lg">Hajam Panel</span>
            </div>
            <div className='cursor-pointer hover:bg-gray-100 hover:rounded-full p-2' onClick={handleBack}>
              <ArrowLeft />
            </div>
            <div className='cursor-pointer hover:bg-gray-100 hover:rounded-full p-2' onClick={handleForward}>
              <ArrowRight />
            </div>
          </div>
          :
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCollapse}
              aria-label={isMobile ? "Toggle mobile menu" : "Toggle sidebar"}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors duration-200"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {isMobile && !showMobileSidebar && (
              <div className='flex items-center'>
                <span className="text-black font-bold text-lg">Hajam Panel</span>
              </div>
            )}
          </div>
        }
      </div>

      <div className="flex items-center space-x-3 ">
        <div className='md:flex hidden'>
          {unitOptions.length > 1 && (
            <AppDropDown
              title={getDropdownTitle()}
              options={unitOptions}
            />
          )}
        </div>

        <span className="text-gray-900 font-medium text-sm md:flex hidden">
          {userData?.name || 'Loading...'}
        </span>

        <Popover enableOverlay>
          <Popover.Trigger>
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-500 transition-colors duration-200">
              <span className="text-white text-sm font-semibold">
                {userInitial}
              </span>
            </div>
          </Popover.Trigger>

          <Popover.Content className="!bg-white !border !border-gray-800 !rounded-xl !shadow-xl !p-0">
            {({ setOpen }) => (
              <div className="font-sans p-4 w-80">
                <div className="mb-4 flex items-center gap-3">
                  <Avatar
                    name={userData?.name}
                    src=""
                    color={'black'}
                    className="ring-2 ring-gray-900 ring-offset-2 bg-gray-900 text-white"
                    size="lg"
                  />
                  <div>
                    <Text className="text-base font-semibold text-gray-900">
                      {userData?.name}
                    </Text>
                    <Text className="text-sm text-gray-500">@{userData?.username}</Text>
                  </div>
                </div>

                {selectedUnit && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Text className="text-xs font-medium text-blue-600 mb-1">Current Unit:</Text>
                    <Text className="text-sm font-semibold text-gray-900">{selectedUnit.unitName}</Text>
                    <Text className="text-xs text-gray-600">{selectedUnit.unitCode}</Text>
                  </div>
                )}

                {isMobile && unitOptions.length > 1 && (
                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <Text className="text-xs font-medium text-gray-600 mb-2">Switch Unit:</Text>
                    <select
                      value={selectedUnit?._id || ''}
                      onChange={(e) => handleUnitChange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    >
                      {units.map(unit => (
                        <option key={unit._id} value={unit._id}>
                          {unit.unitName} ({unit.unitCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3 border-t border-b border-gray-200 py-4 my-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Email:</span>
                    <span className="text-sm text-gray-900">{userData?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Contact:</span>
                    <span className="text-sm text-gray-900">{userData?.phoneNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Member since:</span>
                    <span className="text-sm text-gray-900">{formatDate(userData?.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Role Type:</span>
                    <span className="text-sm text-gray-900">{userData?.roleData?.roleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">User Type:</span>
                    <span className="text-sm text-gray-900">{userData?.userType}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setOpen(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                      <polyline points="16 17 21 12 16 7"></polyline>
                      <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </Popover.Content>
        </Popover>
      </div>
    </header>
  );
};

export default Header;
