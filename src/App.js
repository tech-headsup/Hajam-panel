import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Accounts/Login/Login';
import RoleMaster from './WebView/RoleManagement/RoleMaster';
import AddRole from './WebView/RoleManagement/AddRole';
import EditRole from './WebView/RoleManagement/EditRole';
import UserMaster from './WebView/UsersManagement/UserMaster';
import AddUser from './WebView/UsersManagement/AddUser';
import UnitMaster from './WebView/UnitManagement/UnitMaster';
import AddUnit from './WebView/UnitManagement/AddUnit';
import SideBar from './components/SideBar/SideBar';
import Header from './components/Header/Header';
import { getElevateUser } from './storage/Storage';

function PrivateLayout() {
  const user = getElevateUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hideSideBar, setHideSideBar] = useState(false);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {!hideSideBar && (
        <SideBar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          setHideSideBar={setHideSideBar}
          onMobileClose={() => {}}
          isMobile={false}
        />
      )}

      {/* Main area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top header */}
        <Header
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          hideSideBar={hideSideBar}
          isMobile={false}
          showMobileSidebar={false}
        />

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/roles-and-permission" element={<RoleMaster />} />
            <Route path="/roles-and-permission/add" element={<AddRole />} />
            <Route path="/roles-and-permission/edit/:id" element={<EditRole />} />
            <Route path="/users" element={<UserMaster />} />
            <Route path="/users/add" element={<AddUser />} />
            <Route path="/users/edit/:id" element={<AddUser />} />
            <Route path="/unit" element={<UnitMaster />} />
            <Route path="/unit/add" element={<AddUnit />} />
            <Route path="/unit/edit/:id" element={<AddUnit />} />
            <Route path="*" element={<Navigate to="/roles-and-permission" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  const user = getElevateUser();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/roles-and-permission" replace /> : <Login />} />
      <Route path="/*" element={<PrivateLayout />} />
    </Routes>
  );
}

export default App;
