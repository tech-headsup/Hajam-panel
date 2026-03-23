import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  MapPin,
  UserCheck,
  Clock,
  Wrench,
  Palette,
  Package,
  Settings2,
  Warehouse,
  IndianRupee,
  ReceiptText,
  X,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { hasPermission } from '../../utils/permissionUtils';
import { setPagination } from '../../redux/Actions/TableAction';
import { Tooltip } from 'rizzui';

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
      icon: <IndianRupee className="w-5 h-5" />,
      label: 'Quick Bill',
      to: '/quicksale',
      module: 'quicksale',
    },
    {
      icon: <ReceiptText className="w-5 h-5" />,
      label: 'Bill Management',
      to: '/bills',
      module: 'bills',
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
      module: 'attendance',
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: 'Products',
      module: 'product',
      children: [
        {
          icon: <Package className="w-4 h-4" />,
          label: 'All Products',
          to: '/products',
          module: 'product',
        },
        {
          icon: <Package className="w-4 h-4" />,
          label: 'Master Products',
          to: '/master-products',
          module: 'product',
        },
      ],
    },
    {
      icon: <Wrench className="w-5 h-5" />,
      label: 'Services',
      module: 'services',
      children: [
        {
          icon: <Wrench className="w-4 h-4" />,
          label: 'Master Services',
          to: '/master-services',
          module: 'services',
        },
        {
          icon: <Wrench className="w-4 h-4" />,
          label: 'Service Dashboard',
          to: '/service-dashboard',
          module: 'services',
        },
        {
          icon: <Palette className="w-4 h-4" />,
          label: 'Color Service',
          to: '/service-color',
          module: 'services',
        },
      ],
    },
    {
      icon: <Settings2 className="w-5 h-5" />,
      label: 'General Service',
      to: '/generalmaster',
      module: 'generalMaster',
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: 'Inventory Management',
      module: 'inventory',
      children: [
        {
          icon: <Warehouse className="w-4 h-4" />,
          label: 'Inventory',
          to: '/inventory-management',
          module: 'inventory',
        },
      ],
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

  const toggleExpand = (label) => {
    setExpandedItem(expandedItem === label ? null : label);
  };

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
              <div className="flex flex-col">
                {item.children ? (
                  isCollapsed && !isMobile ? (
                    <Tooltip content={item.label} placement="right">
                      <div
                        className="flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                        onClick={() => toggleExpand(item.label)}
                      >
                        {item.icon}
                      </div>
                    </Tooltip>//
                  ) : (
                    <div
                      className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                      onClick={() => toggleExpand(item.label)}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3 text-sm">{item.label}</span>
                      </div>
                      <div className="ml-2">
                        {expandedItem === item.label ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  isCollapsed && !isMobile ? (
                    <Tooltip content={item.label} placement="right">
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
                    </Tooltip>
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
                  )
                )}

                {(!isCollapsed || isMobile) && item.children && expandedItem === item.label && (
                  <ul className="ml-4 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <NavLink
                          to={child.to}
                          onClick={handleNavClick}
                          className={({ isActive }) =>
                            `flex items-center p-2 text-sm text-gray-300 rounded-lg hover:bg-gray-700 transition-colors ${isActive ? 'bg-gray-700 text-white' : ''
                            }`
                          }
                        >
                          {child.icon}
                          <span className="ml-3">{child.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SideBar;
