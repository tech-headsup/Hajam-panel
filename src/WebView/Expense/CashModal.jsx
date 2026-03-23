import { useState, useEffect } from 'react';
import { Wifi, Settings, CheckCircle, AlertCircle, Power } from 'lucide-react';
import { getElevateUser, getSelectedUnit } from '../../storage/Storage';
import { HitApi } from '../../Api/ApiHit';
import { addCashTransaction, searchCashBalance, searchUser } from '../../constant/Constant';
import printerConfig from '../QuickSale/Printer/PrinterConfig';
import toast from 'react-hot-toast';

function CashModal({ 
  isOpen, 
  onClose, 
  selectedUnit, 
  currentBalance,
  currentCounts,
  onTransactionComplete,
  prefilledData = null
}) {
  const [cashInData, setCashInData] = useState({
    note500: '',
    note200: '',
    note100: '',
    note50: '',
    note10: '',
    remarks: '',
    category: 'deposit'
  });
  const [cashOutData, setCashOutData] = useState({
    note500: '',
    note200: '',
    note100: '',
    note50: '',
    note10: '',
    remarks: '',
    category: 'withdrawal'
  });

  // Fetch current cash balance from server
  const fetchCurrentCashBalance = async () => {
    if (!selectedUnit?._id) {
      console.warn('No unit selected, cannot fetch cash balance');
      return;
    }

    setIsLoadingBalance(true);
    try {
      const json = {
        page: 1,
        limit: 1,
        search: {
          unitId: selectedUnit._id
        }
      };

      console.log('Fetching current cash balance for unit:', selectedUnit._id);
      const response = await HitApi(json, searchCashBalance);
      
      if (response?.statusCode === 200 && response?.data?.docs?.length > 0) {
        const balance = response.data.docs[0];
        setServerCashCounts({
          note500: balance.note500 || 0,
          note200: balance.note200 || 0,
          note100: balance.note100 || 0,
          note50: balance.note50 || 0,
          note10: balance.note10 || 0
        });
        
        console.log('Cash balance fetched successfully:', balance);
        toast.success(`Current balance loaded: ₹${balance.totalAmount || 0}`);
      } else {
        console.log('No cash balance found for this unit');
        setServerCashCounts({
          note500: 0,
          note200: 0,
          note100: 0,
          note50: 0,
          note10: 0
        });
        toast('No existing cash balance found for this unit', {
          icon: 'ℹ️',
          style: {
            background: '#3b82f6',
            color: '#fff',
          },
        });
      }
    } catch (error) {
      console.error('Error fetching cash balance:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Network error occurred';
      toast.error(`Failed to fetch current cash balance: ${errorMessage}`);
      
      // Fallback to props data if API fails
      console.log('Falling back to props data:', currentCounts);
      setServerCashCounts(currentCounts || {
        note500: 0,
        note200: 0,
        note100: 0,
        note50: 0,
        note10: 0
      });
      
      toast('Using cached balance data. Click refresh to retry.', {
        icon: 'ℹ️',
        style: {
          background: '#3b82f6',
          color: '#fff',
        },
      });
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch users from API
  const fetchUsers = async () => {
    if (!selectedUnit?._id) {
      console.warn('No unit selected, cannot fetch users');
      return;
    }

    setIsLoadingUsers(true);
    try {
      const json = {
        page: 1,
        limit: 100, // Get first 100 users
        search: {
          unitIds: selectedUnit._id

        }
      };

      console.log('Fetching users for unit:', selectedUnit._id);
      const response = await HitApi(json, searchUser);
      
      if (response?.statusCode === 200 && response?.data?.docs) {
        const userData = response.data.docs;
        setUsers(userData);
        console.log('Users fetched successfully:', userData.length);
        
        // Users loaded successfully - no auto-selection, let user choose manually
      } else {
        console.log('No users found for this unit');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Effect to fetch balance when modal opens
  useEffect(() => {
    if (isOpen && selectedUnit?._id) {
      fetchCurrentCashBalance();
      fetchUsers();
    }
  }, [isOpen, selectedUnit?._id]);

  // Load unit data and check printer configuration when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUnitDataAndConnectPrinter();
    }
  }, [isOpen]);

  // Load unit data and connect to printer
  const loadUnitDataAndConnectPrinter = () => {
    try {
      const unit = getSelectedUnit();
      if (unit) {
        // Check if unit has cash drawer settings first
        const hasCashDrawerSettings = unit.cashDrawerSettings && 
                                     Array.isArray(unit.cashDrawerSettings) && 
                                     unit.cashDrawerSettings.length > 0;
        
        if (!hasCashDrawerSettings) {
          console.log('No cash drawer settings found in unit data. Skipping printer connection.');
          setHasPrinterConfig(false);
          return;
        }
        
        // Check if printer settings exist and have data
        if (unit.printerSetting && unit.printerSetting.length > 0) {
          const printerSetting = unit.printerSetting[0]; // Use first printer setting
          setHasPrinterConfig(true);
          
          // Auto-configure printer settings from unit data
          setPrinterIp(printerSetting.ip);
          setPrinterPort(printerSetting.port.toString());
          setDeviceId('local_printer');
          
          console.log('Cash drawer settings found. Printer configuration loaded from unit:', printerSetting);
          
          // Initialize printer SDK after loading configuration
          const initializePrinter = async () => {
            try {
              await printerConfig.initializeEposSDK();
              
              // Auto-connect if connection status is 'connected'
              if (printerSetting.connectionStatus === 'connected') {
                console.log('Auto-connecting to configured printer...');
                setTimeout(() => {
                  connectToPrinter();
                }, 1000); // Small delay to ensure SDK is ready
              }
            } catch (error) {
              console.error('Failed to initialize printer:', error);
              setLastError('Failed to initialize printer SDK');
            }
          };
          initializePrinter();
        } else {
          setHasPrinterConfig(false);
          console.log('Cash drawer settings found but no printer configuration found in unit data');
        }
      } else {
        setHasPrinterConfig(false);
        console.log('No unit data found in storage');
      }
    } catch (error) {
      console.error('Error loading unit data:', error);
      setHasPrinterConfig(false);
    }
  };

  // Printer connection function
  const connectToPrinter = async () => {
    setPrinterStatus('connecting');
    setLastError('');

    // Get fresh unit data to ensure we have the latest printer configuration
    let currentPrinterIp = printerIp;
    let currentPrinterPort = printerPort;
    let currentDeviceId = deviceId;
    
    try {
      const unit = getSelectedUnit();
      if (unit && unit.printerSetting && unit.printerSetting.length > 0) {
        const printerSetting = unit.printerSetting[0];
        currentPrinterIp = printerSetting.ip;
        currentPrinterPort = printerSetting.port.toString();
        currentDeviceId = 'local_printer';
        
        // Update state with fresh values
        setPrinterIp(currentPrinterIp);
        setPrinterPort(currentPrinterPort);
        setDeviceId(currentDeviceId);
        
        console.log('Using fresh printer configuration from unit:', {
          ip: currentPrinterIp,
          port: currentPrinterPort,
          deviceId: currentDeviceId
        });
      }
    } catch (error) {
      console.warn('Could not get fresh unit data, using current state values:', error);
    }

    try {
      const result = await printerConfig.connectToPrinter({
        printerIp: currentPrinterIp,
        printerPort: currentPrinterPort,
        deviceId: currentDeviceId,
        onConnected: () => {
          console.log('Printer connected successfully');
          setPrinterStatus('connected');
        },
        onError: (error) => {
          console.error('Printer connection error:', error);
          setLastError(error.message);
          setPrinterStatus('error');
        },
        onStatusChange: (status) => {
          console.log('Printer status changed:', status);
        }
      });

      if (result.success) {
        setPrinterStatus('connected');
        console.log('Connected via:', result.method);
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setLastError(error.message);
      setPrinterStatus('error');
    }
  };

  // Get printer status display
  const getStatusDisplay = () => {
    switch (printerStatus) {
      case 'connected':
        return { icon: CheckCircle, color: 'text-green-600', text: 'Connected' };
      case 'connecting':
        return { icon: Power, color: 'text-yellow-600', text: 'Connecting...' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', text: 'Error' };
      default:
        return { icon: Wifi, color: 'text-gray-400', text: 'Disconnected' };
    }
  };

  // Function to open cash drawer
  const openCashDrawer = async () => {
    // Check if unit has cash drawer settings
    const unit = getSelectedUnit();
    const hasCashDrawerSettings = unit?.cashDrawerSettings && 
                                 Array.isArray(unit.cashDrawerSettings) && 
                                 unit.cashDrawerSettings.length > 0;
    
    if (!hasCashDrawerSettings) {
      console.log('No cash drawer settings found in unit. Skipping drawer opening.');
      return false;
    }

    if (printerStatus !== 'connected') {
      console.warn('Printer not connected. Cannot open cash drawer.');
      toast.error('Printer not connected. Cannot open cash drawer.');
      return false;
    }

    try {
      console.log('Opening cash drawer...');
      
      const printer = printerConfig.getPrinter();
      
      if (printer) {
        // Using ePOS SDK method
        console.log('Opening drawer via ePOS SDK...');
        printer.addPulse(printer.DRAWER_1, printer.PULSE_100);
        printer.send();
        
        console.log('Cash drawer command sent via ePOS SDK');
        toast.success('Cash drawer opened');
        return true;
      } else {
        // Using XML API method as fallback
        console.log('Opening drawer via XML API...');
        const { ip, port } = printerConfig.parseIpAndPort(printerIp);
        const printUrl = port === 9100 ? `http://${ip}/epos/print` : `http://${ip}:${port}/epos/print`;
        
        const drawerXml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <pulse drawer="drawer_1" time="pulse_100"/>
</epos-print>`;

        await fetch(printUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
          },
          body: drawerXml,
          mode: 'no-cors'
        });
        
        console.log('Cash drawer command sent via XML API');
        toast.success('Cash drawer opened');
        return true;
      }
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      toast.error('Failed to open cash drawer');
      return false;
    }
  };

  // Effect to handle prefilled data
  useEffect(() => {
    if (prefilledData && isOpen) {
      // Prefill cash in data if provided
      if (prefilledData.cashIn) {
        setCashInData({
          note500: prefilledData.cashIn.note500 || '',
          note200: prefilledData.cashIn.note200 || '',
          note100: prefilledData.cashIn.note100 || '',
          note50: prefilledData.cashIn.note50 || '',
          note10: prefilledData.cashIn.note10 || '',
          remarks: prefilledData.cashIn.remarks || '',
          category: 'deposit'
        });
      }
      
      // Prefill cash out data if provided
      if (prefilledData.cashOut) {
        setCashOutData({
          note500: prefilledData.cashOut.note500 || '',
          note200: prefilledData.cashOut.note200 || '',
          note100: prefilledData.cashOut.note100 || '',
          note50: prefilledData.cashOut.note50 || '',
          note10: prefilledData.cashOut.note10 || '',
          remarks: prefilledData.cashOut.remarks || '',
          category: 'withdrawal'
        });
      }
    }
  }, [prefilledData, isOpen]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [serverCashCounts, setServerCashCounts] = useState({
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note10: 0
  });

  // Printer state management
  const [printerStatus, setPrinterStatus] = useState('disconnected');
  const [printerIp, setPrinterIp] = useState('192.168.1.34');
  const [printerPort, setPrinterPort] = useState('8008');
  const [deviceId, setDeviceId] = useState('local_printer');
  const [lastError, setLastError] = useState('');
  const [hasPrinterConfig, setHasPrinterConfig] = useState(false);

  // Users dropdown state
  const [users, setUsers] = useState([]);
  const [selectedCashInUser, setSelectedCashInUser] = useState(null);
  const [selectedCashOutUser, setSelectedCashOutUser] = useState(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Check if cash in data has values
  const hasCashInData = () => {
    return Object.values(cashInData).some(value => 
      value !== '' && value !== 0 && (typeof value === 'string' ? value.trim() !== '' : true)
    );
  };

  // Check if cash out data has values
  const hasCashOutData = () => {
    return Object.values(cashOutData).some(value => 
      value !== '' && value !== 0 && (typeof value === 'string' ? value.trim() !== '' : true)
    );
  };

  // Create cash transaction record
  const createCashTransaction = async (transactionData) => {
    try {
      console.log('Creating cash transaction:', transactionData);
      const response = await HitApi(transactionData, addCashTransaction);
      
      if (response?.statusCode === 201 || response?.statusCode === 200) {
        console.log('Cash transaction created successfully:', response.data);
        return response.data;
      } else {
        console.error('Failed to create cash transaction:', response?.message);
        toast.error('Failed to record transaction: ' + (response?.message || 'Unknown error'));
        return null;
      }
    } catch (error) {
      console.error('Error creating cash transaction:', error);
      toast.error('Error recording transaction');
      return null;
    }
  };

  // Handle cash in denomination input changes
  const handleCashInChange = (denomination, value) => {
    if (value === '' || value === '0') {
      setCashInData(prev => ({
        ...prev,
        [denomination]: ''
      }));
    } else {
      const newValue = Math.max(0, parseInt(value) || 0);
      setCashInData(prev => ({
        ...prev,
        [denomination]: newValue
      }));
    }
  };

  // Handle cash out denomination input changes
  const handleCashOutChange = (denomination, value) => {
    if (value === '' || value === '0') {
      setCashOutData(prev => ({
        ...prev,
        [denomination]: ''
      }));
    } else {
      const newValue = Math.max(0, parseInt(value) || 0);
      setCashOutData(prev => ({
        ...prev,
        [denomination]: newValue
      }));
    }
  };

  // Calculate cash in totals
  const cashInTotals = {
    note500: (cashInData.note500 || 0) * 500,
    note200: (cashInData.note200 || 0) * 200,
    note100: (cashInData.note100 || 0) * 100,
    note50: (cashInData.note50 || 0) * 50,
    note10: (cashInData.note10 || 0) * 10
  };

  // Calculate cash out totals
  const cashOutTotals = {
    note500: (cashOutData.note500 || 0) * 500,
    note200: (cashOutData.note200 || 0) * 200,
    note100: (cashOutData.note100 || 0) * 100,
    note50: (cashOutData.note50 || 0) * 50,
    note10: (cashOutData.note10 || 0) * 10
  };

  const cashInGrandTotal = Object.values(cashInTotals).reduce((sum, value) => sum + value, 0);
  const cashOutGrandTotal = Object.values(cashOutTotals).reduce((sum, value) => sum + value, 0);
  const netTotal = cashInGrandTotal - cashOutGrandTotal;

  // Handle form submission
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const hasCashIn = hasCashInData() && cashInGrandTotal > 0;
    const hasCashOut = hasCashOutData() && cashOutGrandTotal > 0;

    if (!hasCashIn && !hasCashOut) {
      toast.error('Please enter at least one denomination in either Cash In or Cash Out section');
      return;
    }


    // Validation for cash out using server-fetched counts
    if (hasCashOut) {
      const validationErrors = [];
      const availableCounts = serverCashCounts;
      
      if (parseInt(cashOutData.note500) > (availableCounts.note500 || 0)) {
        validationErrors.push(`Insufficient ₹500 notes (Available: ${availableCounts.note500 || 0}, Requested: ${cashOutData.note500})`);
      }
      if (parseInt(cashOutData.note200) > (availableCounts.note200 || 0)) {
        validationErrors.push(`Insufficient ₹200 notes (Available: ${availableCounts.note200 || 0}, Requested: ${cashOutData.note200})`);
      }
      if (parseInt(cashOutData.note100) > (availableCounts.note100 || 0)) {
        validationErrors.push(`Insufficient ₹100 notes (Available: ${availableCounts.note100 || 0}, Requested: ${cashOutData.note100})`);
      }
      if (parseInt(cashOutData.note50) > (availableCounts.note50 || 0)) {
        validationErrors.push(`Insufficient ₹50 notes (Available: ${availableCounts.note50 || 0}, Requested: ${cashOutData.note50})`);
      }
      if (parseInt(cashOutData.note10) > (availableCounts.note10 || 0)) {
        validationErrors.push(`Insufficient ₹10 notes (Available: ${availableCounts.note10 || 0}, Requested: ${cashOutData.note10})`);
      }

      // Calculate total available balance from server counts
      const serverTotalBalance = (
        (availableCounts.note500 * 500) +
        (availableCounts.note200 * 200) +
        (availableCounts.note100 * 100) +
        (availableCounts.note50 * 50) +
        (availableCounts.note10 * 10)
      );

      if (cashOutGrandTotal > serverTotalBalance) {
        validationErrors.push(`Insufficient total balance (Available: ₹${serverTotalBalance.toLocaleString()}, Requested: ₹${cashOutGrandTotal.toLocaleString()})`);
      }

      if (validationErrors.length > 0) {
        toast.error(`Cannot proceed with cash out:\n${validationErrors.join('\n')}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Get current user for fallback
      const currentUser = getElevateUser();
      const results = [];
      let runningBalance = currentBalance;

      // Process Cash In transaction if data exists
      if (hasCashIn) {
        const cashInTransactionData = {
          transactionType: 'in',
          note500: parseInt(cashInData.note500) || 0,
          note200: parseInt(cashInData.note200) || 0,
          note100: parseInt(cashInData.note100) || 0,
          note50: parseInt(cashInData.note50) || 0,
          note20: 0,
          note10: parseInt(cashInData.note10) || 0,
          coin10: 0,
          coin5: 0,
          coin2: 0,
          coin1: 0,
          totalAmount: cashInGrandTotal,
          unitId: selectedUnit._id,
          category: cashInData.category,
          previousBalance: runningBalance,
          newBalance: runningBalance + cashInGrandTotal,
          recordedBy: currentUser?._id || currentUser?.id || null,
          inAccountTo: selectedCashInUser?._id || null,
          description: cashInData.remarks || `Manual cash in ${selectedCashInUser ? `by ${selectedCashInUser.name}` : ''} - ${new Date().toLocaleString()}`
        };

        const cashInResult = await createCashTransaction(cashInTransactionData);
        if (cashInResult) {
          results.push({ type: 'in', amount: cashInGrandTotal, result: cashInResult });
          runningBalance += cashInGrandTotal;
        } else {
          throw new Error('Cash in transaction failed');
        }
      }

      // Process Cash Out transaction if data exists
      if (hasCashOut) {
        const cashOutTransactionData = {
          transactionType: 'out',
          note500: parseInt(cashOutData.note500) || 0,
          note200: parseInt(cashOutData.note200) || 0,
          note100: parseInt(cashOutData.note100) || 0,
          note50: parseInt(cashOutData.note50) || 0,
          note20: 0,
          note10: parseInt(cashOutData.note10) || 0,
          coin10: 0,
          coin5: 0,
          coin2: 0,
          coin1: 0,
          totalAmount: cashOutGrandTotal,
          unitId: selectedUnit._id,
          category: cashOutData.category,
          previousBalance: runningBalance,
          newBalance: Math.max(0, runningBalance - cashOutGrandTotal),
          recordedBy: currentUser?._id || currentUser?.id || null,
          inAccountTo: selectedCashOutUser?._id || null,
          description: cashOutData.remarks || `Manual cash out ${selectedCashOutUser ? `by ${selectedCashOutUser.name}` : ''} - ${new Date().toLocaleString()}`
        };

        const cashOutResult = await createCashTransaction(cashOutTransactionData);
        if (cashOutResult) {
          results.push({ type: 'out', amount: cashOutGrandTotal, result: cashOutResult });
          runningBalance = Math.max(0, runningBalance - cashOutGrandTotal);
        } else {
          throw new Error('Cash out transaction failed');
        }
      }

      // Open cash drawer after successful transaction
      if (printerStatus === 'connected' && (hasCashIn || hasCashOut)) {
        console.log('Opening cash drawer after successful transaction...');
        await openCashDrawer();
      }

      // Show success message based on what was processed
      if (results.length === 1) {
        const result = results[0];
        toast.success(`Cash ${result.type} successful: ₹${result.amount.toLocaleString()}`);
      } else if (results.length === 2) {
        toast.success(`Cash transactions successful: In ₹${cashInGrandTotal.toLocaleString()}, Out ₹${cashOutGrandTotal.toLocaleString()}, Net: ₹${netTotal.toLocaleString()}`);
      }
      
      // Reset form data
      setCashInData({
        note500: '',
        note200: '',
        note100: '',
        note50: '',
        note10: '',
        remarks: '',
        category: 'deposit'
      });
      setCashOutData({
        note500: '',
        note200: '',
        note100: '',
        note50: '',
        note10: '',
        remarks: '',
        category: 'withdrawal'
      });

      // Notify parent component with combined results
      onTransactionComplete?.({
        transactions: results,
        netAmount: netTotal,
        cashIn: hasCashIn ? {
          amount: cashInGrandTotal,
          denominations: {
            note500: parseInt(cashInData.note500) || 0,
            note200: parseInt(cashInData.note200) || 0,
            note100: parseInt(cashInData.note100) || 0,
            note50: parseInt(cashInData.note50) || 0,
            note10: parseInt(cashInData.note10) || 0
          }
        } : null,
        cashOut: hasCashOut ? {
          amount: cashOutGrandTotal,
          denominations: {
            note500: parseInt(cashOutData.note500) || 0,
            note200: parseInt(cashOutData.note200) || 0,
            note100: parseInt(cashOutData.note100) || 0,
            note50: parseInt(cashOutData.note50) || 0,
            note10: parseInt(cashOutData.note10) || 0
          }
        } : null
      });

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error in cash transaction submission:', error);
      toast.error(`Failed to process cash transaction: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-800">Cash Management</h2>
            {isLoadingBalance && (
              <div className="flex items-center space-x-2 text-blue-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Loading balance...</span>
              </div>
            )}
            <button
              onClick={fetchCurrentCashBalance}
              disabled={isLoadingBalance}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              title="Refresh balance"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            {/* Drawer Status and Balance */}
            {hasPrinterConfig && !isLoadingBalance && (() => {
              const statusDisplay = getStatusDisplay();
              const StatusIcon = statusDisplay.icon;
              return (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                    <span className={`text-sm font-medium ${statusDisplay.color}`}>
                      Drawer: {statusDisplay.text}
                    </span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                    <div className="text-xs text-blue-700 mb-1">Current Drawer Balance</div>
                    <div className="text-sm font-semibold text-blue-900">
                      ₹{(
                        (serverCashCounts.note500 * 500) +
                        (serverCashCounts.note200 * 200) +
                        (serverCashCounts.note100 * 100) +
                        (serverCashCounts.note50 * 50) +
                        (serverCashCounts.note10 * 10)
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })()}
            {!hasPrinterConfig && !isLoadingBalance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <div className="text-xs text-blue-700 mb-1">Current Drawer Balance</div>
                <div className="text-sm font-semibold text-blue-900">
                  ₹{(
                    (serverCashCounts.note500 * 500) +
                    (serverCashCounts.note200 * 200) +
                    (serverCashCounts.note100 * 100) +
                    (serverCashCounts.note50 * 50) +
                    (serverCashCounts.note10 * 10)
                  ).toLocaleString()}
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Cash In Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Cash In
            </h3>
            
            <div className="space-y-3">
              {/* ₹500 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹500</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note500', Math.max(0, (cashInData.note500 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashInData.note500 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note500', (cashInData.note500 || 0) + 1)}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashInData.note500 || 0) * 500).toLocaleString()}</span>
              </div>

              {/* ₹200 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹200</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note200', Math.max(0, (cashInData.note200 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashInData.note200 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note200', (cashInData.note200 || 0) + 1)}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashInData.note200 || 0) * 200).toLocaleString()}</span>
              </div>

              {/* ₹100 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹100</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note100', Math.max(0, (cashInData.note100 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashInData.note100 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note100', (cashInData.note100 || 0) + 1)}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashInData.note100 || 0) * 100).toLocaleString()}</span>
              </div>

              {/* ₹50 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹50</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note50', Math.max(0, (cashInData.note50 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashInData.note50 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note50', (cashInData.note50 || 0) + 1)}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashInData.note50 || 0) * 50).toLocaleString()}</span>
              </div>

              {/* ₹10 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹10</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note10', Math.max(0, (cashInData.note10 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashInData.note10 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashInChange('note10', (cashInData.note10 || 0) + 1)}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashInData.note10 || 0) * 10).toLocaleString()}</span>
              </div>

              {/* Remarks Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={cashInData.remarks}
                  onChange={(e) => setCashInData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter remarks (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-400 focus:border-green-400 text-sm resize-none"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={cashInData.category}
                  onChange={(e) => setCashInData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-400 focus:border-green-400 text-sm"
                >
                  <option value="sale">Sale</option>
                  <option value="deposit">Deposit</option>
                  <option value="transfer">Transfer</option>
                  <option value="refund">Refund</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account To</label>
                <select
                  value={selectedCashInUser?._id || ''}
                  onChange={(e) => {
                    const userId = e.target.value;
                    const user = users.find(u => u._id === userId);
                    setSelectedCashInUser(user || null);
                  }}
                  disabled={isLoadingUsers}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-green-400 focus:border-green-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} {user.email ? `(${user.email})` : ''}
                    </option>
                  ))}
                </select>
                {selectedCashInUser && (
                  <div className="mt-2 p-2 bg-green-100 border border-green-200 rounded text-xs">
                    <div className="font-medium text-green-900">{selectedCashInUser.name}</div>
                    {selectedCashInUser.userType && (
                      <div className="text-green-700">{selectedCashInUser.userType}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Cash Out Section */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-red-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
              </svg>
              Cash Out
              {isLoadingBalance && (
                <span className="ml-2 text-sm text-gray-600">(Loading...)</span>
              )}
            </h3>
            
            <div className="space-y-3">
              {/* ₹500 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹500</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note500', Math.max(0, (cashOutData.note500 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashOutData.note500 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note500', Math.min(serverCashCounts.note500 || 0, (cashOutData.note500 || 0) + 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance || (cashOutData.note500 || 0) >= (serverCashCounts.note500 || 0)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashOutData.note500 || 0) * 500).toLocaleString()}</span>
                <span className="text-xs text-gray-500">(Avl: {isLoadingBalance ? '...' : serverCashCounts.note500 || 0})</span>
              </div>

              {/* ₹200 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹200</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note200', Math.max(0, (cashOutData.note200 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashOutData.note200 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note200', Math.min(serverCashCounts.note200 || 0, (cashOutData.note200 || 0) + 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance || (cashOutData.note200 || 0) >= (serverCashCounts.note200 || 0)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashOutData.note200 || 0) * 200).toLocaleString()}</span>
                <span className="text-xs text-gray-500">(Avl: {isLoadingBalance ? '...' : serverCashCounts.note200 || 0})</span>
              </div>

              {/* ₹100 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹100</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note100', Math.max(0, (cashOutData.note100 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashOutData.note100 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note100', Math.min(serverCashCounts.note100 || 0, (cashOutData.note100 || 0) + 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance || (cashOutData.note100 || 0) >= (serverCashCounts.note100 || 0)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashOutData.note100 || 0) * 100).toLocaleString()}</span>
                <span className="text-xs text-gray-500">(Avl: {isLoadingBalance ? '...' : serverCashCounts.note100 || 0})</span>
              </div>

              {/* ₹50 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹50</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note50', Math.max(0, (cashOutData.note50 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashOutData.note50 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note50', Math.min(serverCashCounts.note50 || 0, (cashOutData.note50 || 0) + 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance || (cashOutData.note50 || 0) >= (serverCashCounts.note50 || 0)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashOutData.note50 || 0) * 50).toLocaleString()}</span>
                <span className="text-xs text-gray-500">(Avl: {isLoadingBalance ? '...' : serverCashCounts.note50 || 0})</span>
              </div>

              {/* ₹10 Input */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 w-16">₹10</label>
                <span className="text-gray-500">×</span>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note10', Math.max(0, (cashOutData.note10 || 0) - 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" />
                    </svg>
                  </button>
                  <span className="px-3 py-2 text-sm font-medium text-gray-800 min-w-[3rem] text-center">
                    {cashOutData.note10 || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCashOutChange('note10', Math.min(serverCashCounts.note10 || 0, (cashOutData.note10 || 0) + 1))}
                    className="px-2 py-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    disabled={isLoadingBalance || (cashOutData.note10 || 0) >= (serverCashCounts.note10 || 0)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                <span className="text-gray-500">=</span>
                <span className="text-sm font-semibold text-gray-800 w-20">₹{((cashOutData.note10 || 0) * 10).toLocaleString()}</span>
                <span className="text-xs text-gray-500">(Avl: {isLoadingBalance ? '...' : serverCashCounts.note10 || 0})</span>
              </div>

              {/* Remarks Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={cashOutData.remarks}
                  onChange={(e) => setCashOutData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter remarks (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-red-400 focus:border-red-400 text-sm resize-none"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={cashOutData.category}
                  onChange={(e) => setCashOutData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-red-400 focus:border-red-400 text-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="transfer">Transfer</option>
                  <option value="refund">Refund</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* User Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account To</label>
                <select
                  value={selectedCashOutUser?._id || ''}
                  onChange={(e) => {
                    const userId = e.target.value;
                    const user = users.find(u => u._id === userId);
                    setSelectedCashOutUser(user || null);
                  }}
                  disabled={isLoadingUsers}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-red-400 focus:border-red-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} {user.email ? `(${user.email})` : ''}
                    </option>
                  ))}
                </select>
                {selectedCashOutUser && (
                  <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
                    <div className="font-medium text-red-900">{selectedCashOutUser.name}</div>
                    {selectedCashOutUser.userType && (
                      <div className="text-red-700">{selectedCashOutUser.userType}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Summary Display */}
        {(cashInGrandTotal > 0 || cashOutGrandTotal > 0) && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Transaction Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cashInGrandTotal > 0 && (
                  <div className="bg-green-100 rounded-lg p-3">
                    <div className="text-sm text-green-700">Cash In</div>
                    <div className="text-lg font-semibold text-green-800">₹{cashInGrandTotal.toLocaleString()}</div>
                  </div>
                )}
                
                {cashOutGrandTotal > 0 && (
                  <div className="bg-red-100 rounded-lg p-3">
                    <div className="text-sm text-red-700">Cash Out</div>
                    <div className="text-lg font-semibold text-red-800">₹{cashOutGrandTotal.toLocaleString()}</div>
                  </div>
                )}
                
                {cashInGrandTotal > 0 && cashOutGrandTotal > 0 && (
                  <div className="bg-blue-100 rounded-lg p-3">
                    <div className="text-sm text-blue-700">Net Change</div>
                    <div className={`text-lg font-semibold ${
                      netTotal >= 0 ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {netTotal >= 0 ? '+' : ''}₹{netTotal.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium border border-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingBalance || (cashInGrandTotal === 0 && cashOutGrandTotal === 0)}
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>
              {isSubmitting 
                ? 'Processing...' 
                : (
                    cashInGrandTotal > 0 && cashOutGrandTotal > 0 
                      ? 'Process Both Transactions'
                      : cashInGrandTotal > 0 
                        ? 'Add to Drawer'
                        : cashOutGrandTotal > 0
                          ? 'Remove from Drawer'
                          : 'Process Transaction'
                  )
              }
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CashModal;