import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  MapPin,
  UserCheck,
  Clock,
  X,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { hasPermission } from '../../utils/permissionUtils';
import { setPagination } from '../../redux/Actions/TableAction';

const SideBar = ({ isCollapsed, onToggleCollapse, setHideSideBar, onMobileClose, isMobile }) => {
  const dispatch = useDispatch();
  const [expandedItem, setExpandedItem] = useState(null);

  const navigationItems = [
    {
      icon: <MapPin className="w-5 h-5" />,
      label: 'Unit Management',
      to: '/unit',
      module: 'unit',
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Role And Permission',
      to: '/roles-and-permission',
      module: 'rolesAndPermissions',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'User Management',
      to: '/users',
      module: 'user',
    },
    {
      icon: <UserCheck className="w-5 h-5" />,
      label: 'Client Management',
      to: '/client',
      module: 'client',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Staff Dashboard',
      to: '/staffdashboard',
      module: 'staff',
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Attendance Management',
      to: '/attendance',
      module: 'staff',
    },

  ];

  const getVisibleNavigationItems = () => {
    return navigationItems.filter((item) => {
      if (!item.module) return true;
      if (!hasPermission(item.module, 'read')) return false;
      if (item.children) {
        const visibleChildren = item.children.filter((child) =>
          !child.module ? true : hasPermission(child.module, 'read')
        );
        if (visibleChildren.length > 0) {
          item.children = visibleChildren;
          return true;
        }
        return false;
      }
      return true;
    });
  };

  const visibleNavigationItems = getVisibleNavigationItems();

  useEffect(() => {
    setHideSideBar(visibleNavigationItems.length <= 1);
  }, [visibleNavigationItems.length, setHideSideBar]);

  const handleNavClick = () => {
    if (isMobile && onMobileClose) onMobileClose();
    dispatch(setPagination({}));
  };

  return (
    <div
      className={`h-full bg-black text-white flex flex-col flex-shrink-0 ${isCollapsed && !isMobile ? 'w-16' : 'w-64'
        }`}
    >
      {/* Header: Logo + Collapse button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        {(!isCollapsed || isMobile) && (
          <span className="text-white font-bold text-lg">Hajam Panel</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-700 rounded-full transition-colors"
        >
          {isMobile ? (
            <X className="w-5 h-5" />
          ) : isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-2 flex-1 overflow-hidden">
        <ul className="space-y-1 px-2 h-full overflow-y-auto pb-4">
          {visibleNavigationItems.map((item) => (
            <li key={item.label}>
              {isCollapsed && !isMobile ? (
                <NavLink
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center justify-center p-2 rounded-lg hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700' : ''
                    }`
                  }
                >
                  {item.icon}
                </NavLink>
              ) : (
                <NavLink
                  to={item.to}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700' : ''
                    }`
                  }
                >
                  {item.icon}
                  <span className="ml-3 text-sm">{item.label}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
