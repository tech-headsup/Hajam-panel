import { store } from '../redux/store';
import { setApiJson, setApiErrorJson } from '../redux/Actions/ApiAction';
import { setUserData } from '../redux/Actions/UserAction';
import { setPagination } from '../redux/Actions/TableAction';

// Helper function to check if a field has an error
export const hasError = (fieldName, ApiReducer) => {
  return ApiReducer.apiJsonError && ApiReducer.apiJsonError[fieldName];
};

// Helper function to get error message
export const getErrorMsg = (fieldName, ApiReducer) => {
  return ApiReducer.apiJsonError ? ApiReducer.apiJsonError[fieldName] : "";
};


export const getCategoryDisplayName = (value) => {
  const displayNames = {
    'dashboard': "Dashboard",
    'user': 'User Management',
    "staff": "Staff Dashboard",
    'unit': 'Unit Management',
    'client': 'Client Management',
    'seat': 'Seat Management',
    'vendor': 'Vendor Management',
    'attendance': 'Attendance Management',
    'inventory': 'Inventory Management',
    'product': 'Product Management',
    'membership': 'Membership Management',
    'services': 'Services',
    'parent': 'Parent Services',
    'child': 'Child Services',
    'floor': 'Floor Management',
    "task": "Task Managemen",
    "ngb": "NGB",
  };
  return displayNames[value.toLowerCase()] || value.charAt(0).toUpperCase() + value.slice(1);
};


export const getButtonProps = (categoryValue, permissionType, originalAllowed, index, childIndex = null, selectedPermissions) => {
  const key = childIndex !== null ? `${categoryValue}_${childIndex}_${permissionType}` : `${categoryValue}_${permissionType}`;
  const isSelected = selectedPermissions[key];

  const readKey = childIndex !== null ? `${categoryValue}_${childIndex}_read` : `${categoryValue}_read`;
  const writeKey = childIndex !== null ? `${categoryValue}_${childIndex}_write` : `${categoryValue}_write`;

  const isReadSelected = selectedPermissions[readKey];
  const isWriteSelected = selectedPermissions[writeKey];

  let isDisabled = false;

  if (childIndex !== null) {
    const parentReadKey = `${categoryValue}_read`;
    const parentWriteKey = `${categoryValue}_write`;
    const parentDeleteKey = `${categoryValue}_delete`;

    const isParentReadSelected = selectedPermissions[parentReadKey];
    const isParentWriteSelected = selectedPermissions[parentWriteKey];
    const isParentDeleteSelected = selectedPermissions[parentDeleteKey];

    if (permissionType === 'read' && !isParentReadSelected) isDisabled = true;
    if (permissionType === 'write' && (!isParentWriteSelected || !isReadSelected)) isDisabled = true;
    if (permissionType === 'delete' && (!isParentDeleteSelected || !isReadSelected || !isWriteSelected)) isDisabled = true;
  } else {
    if (permissionType === 'write' && !isReadSelected) isDisabled = true;
    if (permissionType === 'delete' && (!isReadSelected || !isWriteSelected)) isDisabled = true;
  }

  // Also disable during submission
  isDisabled = isDisabled;

  const baseClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 px-4 py-2 font-medium'
    : 'px-4 py-2 font-medium transition-all duration-200';

  if (isDisabled) return { className: baseClasses, variant: 'outline', disabled: true };

  const colors = {
    read: isSelected ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm' : originalAllowed ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : '',
    write: isSelected ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm' : originalAllowed ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' : '',
    delete: isSelected ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-500 shadow-sm' : originalAllowed ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' : ''
  };

  return {
    className: `${baseClasses} ${colors[permissionType] || 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'}`,
    variant: isSelected ? 'solid' : 'outline'
  };
};


export const allReduxClear = (dispatch) => {
  dispatch(setApiJson({}));
  dispatch(setApiErrorJson({}));
  dispatch(setUserData(null));
  dispatch(setPagination({ page: 1, limit: 10, total: 0 }));
};

export const getNavigationPath = (module) => {
  const pathMap = {
    'dashboard': '/',
    'user': '/users',
    'rolesAndPermissions': '/roles-and-permission',
  };
  return pathMap[module] || '/';
};

const generateDeviceFingerprint = () => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      navigator.platform,
      `${window.screen.width}x${window.screen.height}`,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
      canvas.toDataURL().slice(-50),
    ].join('|');

    let hash = 0;
    for (let i = 0; i < fingerprint.length; i += 1) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash;
    }

    return `DEV_${Math.abs(hash).toString(16).toUpperCase()}`;
  } catch (error) {
    return `DEV_${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2).toUpperCase()}`;
  }
};

const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  return 'Unknown';
};

const getDeviceType = () => {
  const userAgent = navigator.userAgent;

  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'Mobile';
  }
  return 'Desktop';
};

const getOperatingSystem = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  if (/Win/.test(platform)) return 'Windows';
  if (/Mac/.test(platform)) return 'macOS';
  if (/Linux/.test(platform)) return 'Linux';
  if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
  if (/Android/.test(userAgent)) return 'Android';
  return 'Unknown';
};

const getHardwareInfo = () => ({
  cores: navigator.hardwareConcurrency || 'unknown',
  memory: navigator.deviceMemory || 'unknown',
  screen: `${window.screen.width}x${window.screen.height}`,
  colorDepth: window.screen.colorDepth,
  pixelRatio: window.devicePixelRatio || 1,
  availableScreenSize: `${window.screen.availWidth}x${window.screen.availHeight}`,
});

const getBrowserCapabilities = () => ({
  webGL: !!window.WebGLRenderingContext,
  touchSupport: 'ontouchstart' in window,
  cookieEnabled: navigator.cookieEnabled,
  localStorage: !!window.localStorage,
  sessionStorage: !!window.sessionStorage,
  indexedDB: !!window.indexedDB,
  webWorkers: !!window.Worker,
  serviceWorker: 'serviceWorker' in navigator,
});

export const getDeviceInfo = () => {
  const deviceFingerprint = generateDeviceFingerprint();

  return [{
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    deviceType: getDeviceType(),
    operatingSystem: getOperatingSystem(),
    deviceFingerprint,
    deviceId: deviceFingerprint,
    deviceMacAddress: deviceFingerprint,
    hardwareInfo: getHardwareInfo(),
    browserCapabilities: getBrowserCapabilities(),
  }];
};

export const perMinuteSalary = (userData) => {
  const monthlySalary = Number(userData?.salary) || 0;
  const dailyWorkingHours = parseInt(userData?.workingHours, 10) || 0;

  if (!monthlySalary || !dailyWorkingHours) {
    return 0;
  }

  const workingDaysPerMonth = 26;
  const totalWorkingMinutes = workingDaysPerMonth * dailyWorkingHours * 60;

  if (!totalWorkingMinutes) {
    return 0;
  }

  return monthlySalary / totalWorkingMinutes;
};
