import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getElevateUser } from '../storage/Storage';
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
import StaffDashboard from '../WebView/StaffDashboard/StaffDashboard/StaffDashboard.jsx';
import StaffAttendence from '../WebView/StaffDashboard/StaffAttendence/StaffAttendence.jsx';
import Products from '../WebView/Products/Products.jsx';
import AddProducts from '../WebView/Products/AddProducts.jsx';
import ProductMaster from '../WebView/ProductMaster/ProductMaster.jsx';
import GeneralMaster from '../WebView/GeneralMaster/GeneralMaster.jsx';
import AddGeneralMaster from '../WebView/GeneralMaster/AddGeneralMaster.jsx';
import InventoryManagement from '../WebView/InventoryManagement/InventoryManagement.jsx';
import MasterService from '../WebView/MasterService/MasterService.jsx';
import ServiceDashboard from '../WebView/ServiceDashboard/ServiceDashboard.jsx';
import HairColorServices from '../WebView/HairColorManagement/HairColorServices.jsx';
import HairColorManagement from '../WebView/HairColorManagement/HairColorManagement.jsx';
import QuickSaleMaster from '../WebView/QuickSale/QuickSaleMaster.jsx';
import BillMaster from '../WebView/BillsManagement/BillMaster.jsx';
import BillDetails from '../WebView/BillsManagement/BillDetails.jsx';

const getDefaultRouteForUser = () => {
  const user = getElevateUser();
  const roleType = user?.roleData?.roleType;
  const userType = user?.userType;

  if (roleType === 'Staff' && userType === 'Staff') {
    return '/staffdashboard';
  }

  return '/unit';
};

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
      <Route path="/quicksale" element={<QuickSaleMaster />} />
      <Route path="/bills" element={<BillMaster />} />
      <Route path="/bills/:id" element={<BillDetails />} />
      <Route path="/attendance" element={<AttendanceMaster />} />
      <Route path="/staffdashboard" element={<StaffDashboard />} />
      <Route path="/staffdashboard/attendance" element={<StaffAttendence />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/add" element={<AddProducts />} />
      <Route path="/products/edit/:id" element={<AddProducts />} />
      <Route path="/master-products" element={<ProductMaster />} />
      <Route path="/generalmaster" element={<GeneralMaster />} />
      <Route path="/generalmaster/add" element={<AddGeneralMaster />} />
      <Route path="/generalmaster/edit/:id" element={<AddGeneralMaster />} />
      <Route path="/inventory-management" element={<InventoryManagement />} />
      <Route path="/master-services" element={<MasterService />} />
      <Route path="/service-dashboard" element={<ServiceDashboard />} />
      <Route path="/service-color" element={<HairColorServices />} />
      <Route path="/service-color/add" element={<HairColorManagement />} />
      <Route path="/service-color/edit/:id" element={<HairColorManagement />} />
      <Route path="*" element={<Navigate to={getDefaultRouteForUser()} replace />} />
    </Routes>
  );
}

export default PannelRoutes;
