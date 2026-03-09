// Constant for localStorage keys
export const ELEVATE_USER = 'ELEVATE_USER';
export const ECESS_TOKEN = 'ECESS_TOKEN';
export const UNIT_SELECTED = 'UNIT_SELECTED';
export const CURRENT_PUNCH_STATUS = 'CURRENT_PUNCH_STATUS';
export const CURRENT_ATTENDANCE_ID = 'CURRENT_ATTENDANCE_ID';
export const PUNCH_IN_TIME = 'PUNCH_IN_TIME';
export const PUNCH_RECORDS = 'PUNCH_RECORDS';
export const HOLD_BILLS = 'HOLD_BILLS';


/**
 * Sets user data in localStorage
 * @param {Object} data - User data to store
 */
export const setElevateUser = (data) => {
  localStorage.setItem(ELEVATE_USER, JSON.stringify(data));
};

export const setAcessToken = (data) => {
  localStorage.setItem(ECESS_TOKEN, data);
};

/**
 * Sets selected unit data in localStorage
 * @param {Object} data - Unit data to store
 */
export const setSelectedUnit = (data) => {
  localStorage.setItem(UNIT_SELECTED, JSON.stringify(data));
};

/**
 * Gets user data from localStorage
 * @returns {Object|null} - Parsed user data or null if not found
 */
export const getElevateUser = () => {
  const data = localStorage.getItem(ELEVATE_USER);
  return data ? JSON.parse(data) : null;
};

export const getAcessToken = () => {
  return localStorage.getItem(ECESS_TOKEN);
};

/**
 * Gets selected unit data from localStorage
 * @returns {Object|null} - Parsed unit data or null if not found
 */
export const getSelectedUnit = () => {
  const data = localStorage.getItem(UNIT_SELECTED);
  return data ? JSON.parse(data) : null;
};

/**
 * Removes user data from localStorage
 * @returns {boolean} - True if data was removed, false if it didn't exist
 */
export const removeElevateUser = () => {
  if (localStorage.getItem(ELEVATE_USER)) {
    localStorage.removeItem(ELEVATE_USER);
    return true;
  }
  return false;
};

export const removeAcessToken = () => {
  if (localStorage.getItem(ECESS_TOKEN)) {
    localStorage.removeItem(ECESS_TOKEN);
    return true;
  }
  return false;
};

/**
 * Removes selected unit data from localStorage
 * @returns {boolean} - True if data was removed, false if it didn't exist
 */
export const removeSelectedUnit = () => {
  if (localStorage.getItem(UNIT_SELECTED)) {
    localStorage.removeItem(UNIT_SELECTED);
    return true;
  }
  return false;
};

export const setPunchStatus = (status) => {
  localStorage.setItem(CURRENT_PUNCH_STATUS, status);
};

export const getPunchStatus = () => {
  return localStorage.getItem(CURRENT_PUNCH_STATUS) || 'out';
};

export const setAttendanceId = (attendanceId) => {
  localStorage.setItem(CURRENT_ATTENDANCE_ID, attendanceId);
};

export const getAttendanceId = () => {
  return localStorage.getItem(CURRENT_ATTENDANCE_ID);
};

export const setPunchInTime = (timestamp) => {
  localStorage.setItem(PUNCH_IN_TIME, timestamp.toString());
};

export const getPunchInTime = () => {
  const time = localStorage.getItem(PUNCH_IN_TIME);
  return time ? parseInt(time) : null;
};

export const addPunchRecord = (record) => {
  const allRecords = JSON.parse(localStorage.getItem(PUNCH_RECORDS) || '[]');
  allRecords.push(record);
  localStorage.setItem(PUNCH_RECORDS, JSON.stringify(allRecords));
};

export const getPunchRecords = () => {
  return JSON.parse(localStorage.getItem(PUNCH_RECORDS) || '[]');
};

export const clearAttendanceData = () => {
  localStorage.removeItem(CURRENT_PUNCH_STATUS);
  localStorage.removeItem(CURRENT_ATTENDANCE_ID);
  localStorage.removeItem(PUNCH_IN_TIME);
  localStorage.removeItem(PUNCH_RECORDS);
};

export const removeAttendanceId = () => {
  localStorage.removeItem(CURRENT_ATTENDANCE_ID);
};

export const removePunchInTime = () => {
  localStorage.removeItem(PUNCH_IN_TIME);
};

export const saveHoldBill = (billData) => {
  try {
    const holdBills = getHoldBills();
    const billId = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const holdBill = {
      id: billId,
      clientId: billData.clientId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...billData
    };

    holdBills.push(holdBill);
    localStorage.setItem(HOLD_BILLS, JSON.stringify(holdBills));

    return billId;
  } catch (error) {
    console.error('Error saving hold bill:', error);
    throw new Error('Failed to save hold bill');
  }
};

export const getHoldBills = () => {
  try {
    return JSON.parse(localStorage.getItem(HOLD_BILLS) || '[]');
  } catch (error) {
    console.error('Error getting hold bills:', error);
    return [];
  }
};

export const getClientHoldBills = (clientId) => {
  try {
    const allHoldBills = getHoldBills();
    return allHoldBills.filter(bill => bill.clientId === clientId);
  } catch (error) {
    console.error('Error getting client hold bills:', error);
    return [];
  }
};

export const removeHoldBill = (billId) => {
  try {
    const holdBills = getHoldBills();
    const updatedBills = holdBills.filter(bill => bill.id !== billId);
    localStorage.setItem(HOLD_BILLS, JSON.stringify(updatedBills));
    return true;
  } catch (error) {
    console.error('Error removing hold bill:', error);
    return false;
  }
};

export const updateHoldBill = (billId, updatedData) => {
  try {
    const holdBills = getHoldBills();
    const billIndex = holdBills.findIndex(bill => bill.id === billId);

    if (billIndex === -1) {
      return false;
    }

    holdBills[billIndex] = {
      ...holdBills[billIndex],
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(HOLD_BILLS, JSON.stringify(holdBills));
    return true;
  } catch (error) {
    console.error('Error updating hold bill:', error);
    return false;
  }
};

export const getHoldBillById = (billId) => {
  try {
    const holdBills = getHoldBills();
    return holdBills.find(bill => bill.id === billId) || null;
  } catch (error) {
    console.error('Error getting hold bill by ID:', error);
    return null;
  }
};

export const clearAllHoldBills = () => {
  try {
    localStorage.removeItem(HOLD_BILLS);
    return true;
  } catch (error) {
    console.error('Error clearing hold bills:', error);
    return false;
  }
};

export const getUnitCashDrawerStatus = () => {
  try {
    const unit = getSelectedUnit();

    if (!unit) {
      return {
        hasDrawer: false,
        unit: null,
        reason: 'No unit selected'
      };
    }

    const hasDrawerSettings = unit.cashDrawerSettings &&
                             Array.isArray(unit.cashDrawerSettings) &&
                             unit.cashDrawerSettings.length > 0;

    const hasDrawerEnabled = unit.cashDrawerEnabled === true;

    const hasDrawer = hasDrawerSettings || hasDrawerEnabled;

    return {
      hasDrawer,
      unit,
      drawerSettings: unit.cashDrawerSettings || [],
      drawerEnabled: hasDrawerEnabled,
      reason: hasDrawer ? 'Cash drawer available' : 'Cash drawer not configured'
    };
  } catch (error) {
    console.error('Error checking unit cash drawer status:', error);
    return {
      hasDrawer: false,
      unit: null,
      reason: 'Error checking cash drawer status'
    };
  }
};
