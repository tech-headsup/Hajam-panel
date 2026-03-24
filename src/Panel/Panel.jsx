import React, { useState, useEffect } from 'react';
import Sidebar from '../components/SideBar/SideBar';
import Header from '../components/Header/Header';
import PannelRoutes from '../navigations/PannelRoutes';

function Panel() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
        setShowMobileSidebar(false);
      } else {
        setShowMobileSidebar(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const handleMobileSidebarClose = () => {
    if (isMobile) {
      setShowMobileSidebar(false);
    }
  };

  const shouldShowSidebar = () => {
    return !hideSideBar;
  };

  return (
    <div className="flex h-screen relative">
      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleMobileSidebarClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed left-0 top-0 h-full z-50
        transform transition-transform duration-300 ease-in-out
        ${!shouldShowSidebar() ? '-translate-x-full' : ''}
        ${isMobile ? (showMobileSidebar ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        ${hideSideBar ? 'hidden' : 'block'}
      `}>
        <Sidebar
          setHideSideBar={setHideSideBar}
          isCollapsed={isMobile ? false : isCollapsed}
          onToggleCollapse={handleSidebarToggle}
          onMobileClose={handleMobileSidebarClose}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <div
        className={`
          flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out
          ${!isMobile && !hideSideBar ? (isCollapsed ? 'ml-16' : 'ml-64') : ''}
        `}
      >
        <Header
          hideSideBar={hideSideBar}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleSidebarToggle}
          isMobile={isMobile}
          showMobileSidebar={showMobileSidebar}
        />
        <div className={`${hideSideBar ? "p-0" : "p-5"} flex-1 overflow-y-auto overflow-x-hidden`}>
          <PannelRoutes />
        </div>
      </div>
    </div>
  );
}

export default Panel;
