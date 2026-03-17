import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RoleMaster from '../WebView/RoleManagement/RoleMaster';
import AddRole from '../WebView/RoleManagement/AddRole';
import EditRole from '../WebView/RoleManagement/EditRole';
import UserMaster from '../WebView/UsersManagement/UserMaster';
import AddUser from '../WebView/UsersManagement/AddUser';
import UnitMaster from '../WebView/UnitManagement/UnitMaster';
import AddUnit from '../WebView/UnitManagement/AddUnit';
import ClientMaster from '../WebView/ClientManagement/ClientMaster';
import AddClient from '../WebView/ClientManagement/AddClient';
import AttendanceMaster from '../WebView/AttendanceManagement/AttendanceMaster';

function PannelRoutes() {
  return (
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
      <Route path="/client" element={<ClientMaster />} />
      <Route path="/client/add" element={<AddClient />} />
      <Route path="/client/edit/:id" element={<AddClient />} />
      <Route path="/attendance" element={<AttendanceMaster />} />
      <Route path="*" element={<Navigate to="/unit" replace />} />
    </Routes>
  );
}

export default PannelRoutes;
