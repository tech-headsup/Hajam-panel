import { useEffect, useState } from 'react';
import { getElevateUser, getSelectedUnit } from '../storage/Storage';
import { HitApi } from '../Api/ApiHit';
import {searchRole  as SearchYourRole} from '../constant/Constant'
import { addAttendance, addChild, addClient, addGeneralMaster, addInventory, addOrder, addParent, addProduct, addRole, addSeat, addStaff, addUnit, addUser, addVendor, deleteAttendance, deleteChild, deleteClient, deleteFile, deleteGeneralMaster, deleteInventory, deleteOrder, deleteParent, deleteProduct, deleteRole, deleteSeat, deleteStaff, deleteUnit, deleteUser, deleteVendor, ParentBulkUpload, searchAttendance, searchChild, searchClient, searchFiles, searchGeneralMaster, searchInventory, searchOrder, searchParent, searchProduct, searchRole, searchSeat, searchStaff, searchUnit, searchUser, searchVendor, updateAttendance, updateChild, updateClient, updateGeneralMaster, updateInventory, updateOrder, updateParent, updateProduct, updateRole, updateSeat, updateStaff, updateUnit, updateUser, updateVendor, uploadSingle } from '../redux/Reducers/RoleAndPermissionReducer/Endpoints';

// Custom hook for permissions
export const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getElevateUser();
  const getUnit = getSelectedUnit()

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = () => {
    if (!user?.roleId) {
      setLoading(false);
      return;
    }

    let json = {
      page: 1,
      limit: 10,
      search: {
        _id: user?.roleId || '',
      }
    };

    HitApi(json, SearchYourRole)
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          const permissions = res.data[0];
          setUserPermissions(permissions);
        } else if (res && res.length > 0) {
          const permissions = res[0];
          setUserPermissions(permissions);
        }
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  };

  const hasEndpointAccess = (endpoint) => {
    if (!endpoint) {
      return false;
    }

    if (!userPermissions?.allowedEndPoints) {
      return false;
    }

    const hasAccess = userPermissions.allowedEndPoints.includes(endpoint);
    return hasAccess;
  };

  return { userPermissions, loading, hasEndpointAccess };
};

// Protected Route Component
export const ProtectedRoute = ({ children, endpoint, fallback = null }) => {
  const { hasEndpointAccess, loading } = usePermissions();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '16px' }}>Loading...</div>
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (endpoint && !hasEndpointAccess(endpoint)) {
    return fallback || (
      <div style={{
        padding: '60px 40px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '12px',
        margin: '40px auto',
        maxWidth: '600px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#dc3545', marginBottom: '16px', fontWeight: '600' }}>
          Access Restricted
        </h2>
        <p style={{ color: '#6c757d', marginBottom: '20px', fontSize: '16px' }}>
          You don't have the necessary permissions to access this page.
        </p>
        <div style={{
          backgroundColor: '#fff',
          padding: '12px',
          borderRadius: '6px',
          border: '1px solid #e9ecef'
        }}>
          <small style={{ color: '#6c757d', fontFamily: 'monospace' }}>
            Required: {endpoint}
          </small>
        </div>
      </div>
    );
  }

  return children;
};

// Component for conditional rendering based on permissions
export const PermissionWrapper = ({
  children,
  endpoint,
  fallback = null,
  loadingComponent = null
}) => {
  const { hasEndpointAccess, loading } = usePermissions();

  if (loading) {
    return loadingComponent || <div>Loading...</div>;
  }

  if (!hasEndpointAccess(endpoint)) {
    return fallback;
  }

  return children;
};

// Utility function to check permissions
export const checkPermission = (endpoint, userPermissions) => {
  if (!userPermissions?.allowedEndPoints) {
    return false;
  }

  const hasAccess = userPermissions.allowedEndPoints.includes(endpoint);
  return hasAccess;
};

// Button component with permission check
export const PermissionButton = ({
  endpoint,
  children,
  onClick,
  className = '',
  disabled = false,
  ...props
}) => {
  const { hasEndpointAccess, loading } = usePermissions();

  if (loading) {
    return (
      <button
        className={`${className} opacity-50 cursor-not-allowed`}
        disabled={true}
        {...props}
      >
        Loading...
      </button>
    );
  }

  if (!hasEndpointAccess(endpoint)) {
    return null;
  }

  const handleClick = (e) => {
    if (onClick) onClick(e);
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Link component with permission check
export const PermissionLink = ({
  endpoint,
  children,
  to,
  className = '',
  ...props
}) => {
  const { hasEndpointAccess, loading } = usePermissions();

  if (loading || !hasEndpointAccess(endpoint)) {
    return null;
  }

  return (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  );
};

// Higher Order Component for restricting components
export const withRestriction = (WrappedComponent, requiredEndpoint) => {
  return function RestrictedComponent(props) {
    const { hasEndpointAccess, loading } = usePermissions();

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px'
        }}>
          Loading permissions...
        </div>
      );
    }

    if (!requiredEndpoint) {
      return <WrappedComponent {...props} />;
    }

    if (!hasEndpointAccess(requiredEndpoint)) {
      return (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '8px',
          margin: '20px'
        }}>
          <h3 style={{ color: '#dc3545', marginBottom: '16px' }}>Access Denied</h3>
          <p style={{ color: '#6c757d', marginBottom: '0' }}>
            You don't have permission to access this feature.
          </p>
          <small style={{ color: '#6c757d' }}>
            Required endpoint: {requiredEndpoint}
          </small>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
};

// Available endpoints list
export const AVAILABLE_ENDPOINTS = [
  // User Management
  addUser, searchUser, updateUser, deleteUser,

  // Client Management
  addClient, searchClient, updateClient, deleteClient,

  //Unit Management
  addUnit, searchUnit, updateUnit, deleteUnit,

  //Vendor Management
  addVendor, searchVendor, updateVendor, deleteVendor,

  //Seat Management
  addSeat, searchSeat, updateSeat, deleteSeat,

  //Attendance Management
  addAttendance, searchAttendance, updateAttendance, deleteAttendance,

  //Inventory Management,
  addInventory, searchInventory, updateInventory, deleteInventory,

  //Order Management,
  addOrder, searchOrder, updateOrder, deleteOrder,

  //Service Management
  addParent, searchParent, updateParent, deleteParent, ParentBulkUpload, addChild, searchChild, updateChild, deleteChild,

  //Product Management
  addProduct, searchProduct, updateProduct, deleteProduct,

  //Staff management
  addStaff, updateStaff, searchStaff, deleteStaff,

  //General Master
  addGeneralMaster,updateGeneralMaster,deleteGeneralMaster,searchGeneralMaster,

  //Document Center
  uploadSingle,searchFiles,deleteFile,

  //Roles and Permissions
  addRole ,updateRole,searchRole,deleteRole,

  // Package Management
  "/packageservice/searchPackage",
  "/packageservice/addPackage",
  "/packageservice/updatePackage",
  "/packageservice/deletePackage",

  // Membership Management
  "/membershipservice/searchMembership",
  "/membershipservice/addMembership",
  "/membershipservice/updateMembership",
  "/membershipservice/deleteMembership",
  "/membershipservice/bulk-upload",

  // Cart Services
  "/cartservices/searchCart",
  "/cartservices/addCart",
  "/cartservices/deleteCart",

  // Booking Services
  "/bookingservices/searchBooking",
  "/bookingservices/addBooking",

  // Advertisement Management
  "/advertisementservice/searchAdvertisement",
  "/advertisementservice/addAdvertisement",
  "/advertisementservice/updateAdvertisement",
  "/advertisementservice/deleteAdvertisement",

  // Media Management
  "/mediaservice/searchMedia",
  "/mediaservice/addMedia",
  "/mediaservice/updateMedia",
  "/mediaservice/deleteMedia",

  // Specialists
  "/specialists/searchSpecialists",

  // Cash Management
  "/cashmanagement/searchBills",
  "/cashmanagement/addBill",
  "/cashmanagement/updateBill",
  "/cashmanagement/deleteBill",
  "/cashmanagement/searchExpense",
  "/cashmanagement/addExpense",
  "/cashmanagement/updateExpense",
  "/cashmanagement/deleteExpense",
  "/cashmanagement/searchClosingDays",
  "/cashmanagement/addClosingDay",
  "/cashmanagement/updateClosingDay",
  "/cashmanagement/deleteClosingDay",
  "/cashmanagement/paymentReports",
  "/cashmanagement/cashRegister",
  "/cashmanagement/noGstBills"
];

export default {
  usePermissions,
  withRestriction,
  ProtectedRoute,
  PermissionWrapper,
  PermissionButton,
  PermissionLink,
  checkPermission,
  AVAILABLE_ENDPOINTS
};