import { useState, useRef, useCallback, useEffect } from 'react';
import { Wifi, Settings, CheckCircle, AlertCircle, Power, X, Scissors } from 'lucide-react';
import ClientSearch from './ClientSearch';
import ActiveMemberships from './ActiveMemberships';
import AddServices from './AddServices';
import AddMembershipModal from './AddMembershipModal';
import ApplyCoupon from './ApplyCoupon';
import HoldBillButton from './HoldBillButton';
import LoadHoldBillButton from './LoadHoldBillButton';
import HoldBillTabs from './HoldBillTabs';
import printerConfig from './Printer/PrinterConfig';
import { getSelectedUnit, getUnitCashDrawerStatus, saveHoldBill, removeHoldBill, updateHoldBill } from '../../storage/Storage';
import CashModal from '../Expense/CashModal';
import { HitApi } from '../../Api/ApiHit';
import { updateClient } from '../../constant/Constant';
import toast from 'react-hot-toast';

function QuickSaleMaster() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [reactivateMembership, setReactivateMembership] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [services, setServices] = useState([]);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [discountStatus, setDiscountStatus] = useState({
    hasMembershipDiscount: false,
    hasCouponDiscount: false,
    hasWalletPayment: false
  });
  const [currentHoldBillId, setCurrentHoldBillId] = useState(null);
  const [refreshTabs, setRefreshTabs] = useState(0);
  const addServicesRef = useRef(null);

  // Printer state management
  const [printerStatus, setPrinterStatus] = useState('disconnected');
  const [printerIp, setPrinterIp] = useState('192.168.1.34');
  const [printerPort, setPrinterPort] = useState('8008');
  const [deviceId, setDeviceId] = useState('local_printer');
  const [lastError, setLastError] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [hasPrinterConfig, setHasPrinterConfig] = useState(false);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  
  // Cash management states
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashTransactionData, setCashTransactionData] = useState(null);
  const [unitCashDrawerInfo, setUnitCashDrawerInfo] = useState(null);
  const [cashCounts, setCashCounts] = useState({
    note500: 0,
    note200: 0,
    note100: 0,
    note50: 0,
    note10: 0
  });
  
  // Change return states
  const [changeReturnData, setChangeReturnData] = useState(null);
  const [showChangeModal, setShowChangeModal] = useState(false);

  // Function to create wallet for client
  const createWalletForClient = async (client) => {
    try {
      console.log('Creating wallet for client:', client._id);
      
      const updatePayload = {
        _id: client._id
      };

      const response = await HitApi(updatePayload, updateClient);
      
      if (response?.statusCode === 200) {
        console.log('Wallet created successfully for client:', client._id);
        
        // Return updated client with wallet information
        return {
          ...client,
          walletId: {
            _id: response.data?._id || 'generated_wallet_id',
            balance: 0,
            totalCredits: 0,
            totalDebits: 0,
            isActive: true,
            isFrozen: false
          }
        };
      } else {
        console.error('Failed to create wallet:', response);
        toast.error('Failed to create wallet for client');
        return client;
      }
    } catch (error) {
      console.error('Error creating wallet for client:', error);
      toast.error('Error creating wallet for client');
      return client;
    }
  };

  const handleClientSelect = async (client) => {
    // Check if client has walletId
    if (!client.walletId) {
      console.log('Client does not have wallet, creating one...');
      toast.loading('Setting up wallet for client...', { id: 'wallet-creation' });
      
      // Create wallet for client
      const updatedClient = await createWalletForClient(client);
      toast.dismiss('wallet-creation');
      
      if (updatedClient.walletId) {
        toast.success('Wallet created for client');
      }
      
      setSelectedClient(updatedClient);
    } else {
      console.log('Client already has wallet:', client.walletId);
      setSelectedClient(client);
    }
  };

  const handleClearClient = () => {
    setSelectedClient(null);
    setSelectedMembership(null);
    setAppliedCoupon(null);
  };

  const handleMembershipSelect = (membership) => {
    // If membership is null, it means unselect
    if (membership === null) {
      setSelectedMembership(null);
      // Remove any existing membership discounts from services
      if (addServicesRef.current && addServicesRef.current.removeMembershipDiscount) {
        addServicesRef.current.removeMembershipDiscount();
      }
      return;
    }
    
    // Check discount status before applying membership
    const status = addServicesRef.current?.getDiscountStatus?.() || {};
    if (status.hasWalletPayment) {
      return; // AddServices will show the error
    }
    
    setSelectedMembership(membership);
    // Notify AddServices component about membership selection
    if (addServicesRef.current && addServicesRef.current.applyMembershipDiscount) {
      const success = addServicesRef.current.applyMembershipDiscount(membership);
      if (success === false) {
        setSelectedMembership(null); // Reset if failed
      }
    }
  };

  const handleAddMembership = (membershipToReactivate = null) => {
    setReactivateMembership(membershipToReactivate);
    setIsMembershipModalOpen(true);
  };

  const handleMembershipAdded = (membershipData) => {
    // Pass membership to AddServices component for billing
    if (addServicesRef.current && addServicesRef.current.addMembership) {
      addServicesRef.current.addMembership(membershipData);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handleCouponApply = (couponData) => {
    // Check discount status before applying coupon
    const status = addServicesRef.current?.getDiscountStatus?.() || {};
    if (status.hasWalletPayment) {
      return; // AddServices will show the error
    }
    
    setAppliedCoupon(couponData);
    // Notify AddServices component about coupon application
    if (addServicesRef.current && addServicesRef.current.applyCoupon) {
      const success = addServicesRef.current.applyCoupon(couponData);
      if (!success) {
        setAppliedCoupon(null); // Reset if failed
      }
    }
  };

  const handleCouponRemove = () => {
    setAppliedCoupon(null);
    // Notify AddServices component about coupon removal
    if (addServicesRef.current && addServicesRef.current.removeCoupon) {
      addServicesRef.current.removeCoupon();
    }
  };

  const handleServicesUpdate = (updatedServices) => {
    setServices(updatedServices);
  };

  const handlePurchaseAmountUpdate = (amount) => {
    setPurchaseAmount(amount);
  };

  const handleDiscountStatusUpdate = useCallback((status) => {
    setDiscountStatus(status);
    
    // Clear membership selection if wallet is used
    if (status.hasWalletPayment && selectedMembership) {
      setSelectedMembership(null);
    }
    
    // Clear coupon if wallet is used
    if (status.hasWalletPayment && appliedCoupon) {
      setAppliedCoupon(null);
      if (addServicesRef.current?.removeCoupon) {
        addServicesRef.current.removeCoupon();
      }
    }
  }, [selectedMembership, appliedCoupon]);

  // Handle hold bill save
  const handleHoldBill = useCallback(() => {
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }

    if (!addServicesRef.current) {
      toast.error('No services data available');
      return;
    }

    try {
      // Get current bill data from AddServices component
      const billData = addServicesRef.current.getBillData();
      
      if (!billData) {
        toast.error('No bill data to save');
        return;
      }

      // Add additional metadata
      const holdBillData = {
        ...billData,
        clientId: selectedClient._id,
        clientName: selectedClient.name,
        clientData: selectedClient, // Store full client object for restore
        selectedMembership,
        appliedCoupon,
        services,
        purchaseAmount
      };

      // Check if we're updating an existing hold bill or creating a new one
      if (currentHoldBillId) {
        // Update existing hold bill
        const success = updateHoldBill(currentHoldBillId, holdBillData);
        if (success) {
          toast.success('Hold bill updated successfully! Ready for new sale.');
        } else {
          toast.error('Failed to update hold bill');
          return;
        }
      } else {
        // Create new hold bill
        const billId = saveHoldBill(holdBillData);
        toast.success('Bill saved successfully! Ready for new sale.');
      }

      // Refresh tabs to show the new/updated hold bill
      setRefreshTabs(prev => prev + 1);
      
      // Clear current bill data from AddServices component
      if (addServicesRef.current.clearBill) {
        addServicesRef.current.clearBill();
      }
      
      // Reset all states completely for new sale
      setSelectedClient(null);
      setSelectedMembership(null);
      setAppliedCoupon(null);
      setServices([]);
      setPurchaseAmount(0);
      setCurrentHoldBillId(null);
      setSelectedPaymentMethod(null);
      setDiscountStatus({
        hasMembershipDiscount: false,
        hasCouponDiscount: false,
        hasWalletPayment: false
      });
      
    } catch (error) {
      console.error('Error saving hold bill:', error);
      toast.error('Failed to save bill');
    }
  }, [selectedClient, selectedMembership, appliedCoupon, services, purchaseAmount]);

  // Handle load hold bill
  const handleLoadHoldBill = useCallback(async (holdBill) => {
    try {
      if (!holdBill) {
        toast.error('Invalid hold bill data');
        return;
      }

      console.log('Loading hold bill:', holdBill);

      // Load client data first if available using the proper client selection flow
      if (holdBill.clientData) {
        console.log('Loading client from clientData:', holdBill.clientData);
        await handleClientSelect(holdBill.clientData);
      } else if (holdBill.clientId && holdBill.clientName) {
        // Fallback for older hold bills that don't have full clientData
        // Create a minimal client object
        const fallbackClient = {
          _id: holdBill.clientId,
          name: holdBill.clientName,
          // Add any other fields from holdBill if available
          phoneNumber: holdBill.phoneNumber || null,
          customerType: holdBill.customerType || null,
          ageGroup: holdBill.ageGroup || null,
          gender: holdBill.gender || null,
          walletId: holdBill.walletId || null
        };
        console.log('Loading client from fallback data:', fallbackClient);
        await handleClientSelect(fallbackClient);
      } else {
        console.log('No client data found in hold bill');
      }

      // Load bill data into AddServices component
      if (addServicesRef.current && addServicesRef.current.loadBillData) {
        addServicesRef.current.loadBillData(holdBill);
      }

      // Set state from hold bill
      if (holdBill.selectedMembership) {
        setSelectedMembership(holdBill.selectedMembership);
      }
      
      if (holdBill.appliedCoupon) {
        setAppliedCoupon(holdBill.appliedCoupon);
      }

      if (holdBill.services) {
        setServices(holdBill.services);
      }

      if (holdBill.purchaseAmount) {
        setPurchaseAmount(holdBill.purchaseAmount);
      }

      // Track the loaded hold bill ID so we can remove it when bill is generated
      setCurrentHoldBillId(holdBill.id);

      toast.success('Hold bill loaded successfully!');
    } catch (error) {
      console.error('Error loading hold bill:', error);
      toast.error('Failed to load hold bill');
    }
  }, []);

  // Load unit data and check printer configuration on component mount
  useEffect(() => {
    const loadUnitData = () => {
      try {
        const unit = getSelectedUnit();
        if (unit) {
          
          // Check if printer settings exist and have data
          if (unit.printerSetting && unit.printerSetting.length > 0) {
            const printerSetting = unit.printerSetting[0]; // Use first printer setting
            setHasPrinterConfig(true);
            
            // Auto-configure printer settings from unit data
            setPrinterIp(printerSetting.ip);
            setPrinterPort(printerSetting.port.toString());
            setDeviceId('local_printer');
            
            console.log('Printer configuration loaded from unit:', printerSetting);
            
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
            console.log('No printer configuration found in unit data');
          }

          // Check cash drawer configuration
          const cashDrawerInfo = getUnitCashDrawerStatus();
          setUnitCashDrawerInfo(cashDrawerInfo);
          console.log('Cash drawer info:', cashDrawerInfo);
        } else {
          setHasPrinterConfig(false);
          console.log('No unit data found in storage');
        }
      } catch (error) {
        console.error('Error loading unit data:', error);
        setHasPrinterConfig(false);
      }
    };
    
    loadUnitData();
  }, []);

  // Printer connection functions
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

  const disconnectPrinter = async () => {
    try {
      await printerConfig.disconnectPrinter();
      setPrinterStatus('disconnected');
      setLastError('');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Get status display
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

  const handleBillGenerated = useCallback((billData = null) => {
    // If bill data is provided and printer is connected, offer to print
    if (billData && printerStatus === 'connected') {
      handlePrintBill(billData);
    }
    
    // Check if cash is involved in the payment and cash drawer is available
    const cashAmount = billData?.payment?.methods?.cash || 0;
    const cardAmount = billData?.payment?.methods?.card || 0;
    const upiAmount = billData?.payment?.methods?.upi || 0;
    const walletAmount = billData?.payment?.methods?.wallet || 0;
    const billTotal = billData?.calculations?.totals?.grandTotal || 0;
    const totalPaid = cashAmount + cardAmount + upiAmount + walletAmount;
    const hasCashPayment = cashAmount > 0;
    const hasCashDrawer = unitCashDrawerInfo?.hasDrawer;
    
    // Calculate change return only if total payment exceeds bill total
    // This handles cases where customer overpays with cash to get change
    const changeAmount = totalPaid > billTotal ? totalPaid - billTotal : 0;
    
    console.log('=== PAYMENT ANALYSIS ===');
    console.log('Cash:', cashAmount, 'Card:', cardAmount, 'UPI:', upiAmount, 'Wallet:', walletAmount);
    console.log('Bill total:', billTotal, 'Total paid:', totalPaid, 'Change needed:', changeAmount);
    console.log('Has cash payment:', hasCashPayment, 'Has cash drawer:', hasCashDrawer);
    console.log('========================');
    
    // If cash is involved and cash drawer is available, show cash management modal
    if (hasCashPayment && hasCashDrawer) {
      const transactionData = {
        billData,
        cashAmount,
        cardAmount,
        upiAmount, 
        walletAmount,
        billTotal,
        totalPaid,
        changeAmount,
        transactionId: billData?.billNumber || billData?._id,
        timestamp: new Date().toISOString()
      };
      
      setCashTransactionData(transactionData);
      
      console.log('Cash management decision:', {
        hasCashPayment,
        hasCashDrawer,
        changeAmount,
        cashAmount,
        totalPaid,
        billTotal
      });
      
      // If there's change to return, show change modal first
      if (changeAmount > 0) {
        setChangeReturnData({
          billData,
          cashAmount,
          totalPaid,
          billTotal,
          changeAmount,
          customerName: billData?.client?.name || 'Walk-in Customer',
          paymentBreakdown: {
            cash: cashAmount,
            card: cardAmount,
            upi: upiAmount,
            wallet: walletAmount
          }
        });
        
        setTimeout(() => {
          setShowChangeModal(true);
        }, 1500);
      } else {
        // No change, but still need to manage cash portion
        console.log('No change - showing cash management modal directly');
        setTimeout(() => {
          setShowCashModal(true);
        }, 1500);
      }
    } else {
      console.log('Skipping cash management:', { hasCashPayment, hasCashDrawer });
    }
    
    // If this bill was loaded from a hold bill, remove it from localStorage
    if (currentHoldBillId) {
      try {
        const success = removeHoldBill(currentHoldBillId);
        if (success) {
          console.log('Hold bill removed from localStorage:', currentHoldBillId);
          toast.success('Hold bill completed and removed');
          // Refresh tabs to remove the completed hold bill
          setRefreshTabs(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error removing hold bill:', error);
      }
    }
    
    // Clear all parent component states
    setSelectedClient(null);
    setSelectedMembership(null);
    setAppliedCoupon(null);
    setSelectedPaymentMethod(null);
    setServices([]);
    setPurchaseAmount(0);
    setCurrentHoldBillId(null); // Reset hold bill ID
    setDiscountStatus({
      hasMembershipDiscount: false,
      hasCouponDiscount: false,
      hasWalletPayment: false
    });
    
    // Reset any refs
    if (addServicesRef.current) {
      // The AddServices component will clear its own state
    }
  }, [printerStatus, unitCashDrawerInfo, currentHoldBillId]);

  // Separate function to handle bill printing
  const handlePrintBill = async (billData) => {
    if (!billData) {
      console.error('No bill data provided for printing');
      return;
    }

    if (printerStatus !== 'connected') {
      console.warn('Printer not connected. Cannot print bill.');
      return;
    }

    // Check if cash is involved in the payment
    const cashAmount = billData?.payment?.methods?.cash || 0;
    const shouldOpenDrawer = cashAmount > 0;

    try {
      // Get unit data from localStorage and merge with bill data
      const unit = getSelectedUnit();
      const enhancedBillData = {
        ...billData,
        unit: unit ? {
          _id: unit._id,
          unitName: unit.unitName,
          unitCode: unit.unitCode,
          address: unit.address,
          status: unit.status,
          rent: unit.rent,
          electricity: unit.electricity,
          gst: unit.gst,
          email: unit.email,
          phone: unit.phone,
          gstPercentage: unit.gstPercentage,
          priceAreInclusiveTaxes: unit.priceAreInclusiveTaxes
        } : null
      };

      console.log('Printing bill with unit data...', enhancedBillData);
      console.log(`Cash amount: ₹${cashAmount}, Opening drawer: ${shouldOpenDrawer}`);
      
      await printerConfig.printBill(
        enhancedBillData,
        printerIp,
        shouldOpenDrawer, // Open cash drawer only if cash is involved
        (result) => {
          console.log('Print success:', result);
          if (shouldOpenDrawer) {
            console.log('Cash drawer opened for cash payment');
          } else {
            console.log('Cash drawer not opened - no cash payment');
          }
          // You can add toast notification here if needed
        },
        (error) => {
          console.error('Print failed:', error);
          // You can add toast notification here if needed
        }
      );
    } catch (error) {
      console.error('Error printing bill:', error);
    }
  };

  // Handle cash transaction completion
  const handleCashTransactionComplete = (transactionData) => {
    console.log('Cash transaction completed:', transactionData);
    
    // Update local cash counts based on the new transaction structure
    setCashCounts(prev => {
      let newCounts = { ...prev };
      
      // Process cash in transaction if present
      if (transactionData.cashIn) {
        const cashIn = transactionData.cashIn.denominations;
        newCounts = {
          note500: (newCounts.note500 || 0) + (cashIn.note500 || 0),
          note200: (newCounts.note200 || 0) + (cashIn.note200 || 0),
          note100: (newCounts.note100 || 0) + (cashIn.note100 || 0),
          note50: (newCounts.note50 || 0) + (cashIn.note50 || 0),
          note10: (newCounts.note10 || 0) + (cashIn.note10 || 0)
        };
      }
      
      // Process cash out transaction if present
      if (transactionData.cashOut) {
        const cashOut = transactionData.cashOut.denominations;
        newCounts = {
          note500: Math.max(0, (newCounts.note500 || 0) - (cashOut.note500 || 0)),
          note200: Math.max(0, (newCounts.note200 || 0) - (cashOut.note200 || 0)),
          note100: Math.max(0, (newCounts.note100 || 0) - (cashOut.note100 || 0)),
          note50: Math.max(0, (newCounts.note50 || 0) - (cashOut.note50 || 0)),
          note10: Math.max(0, (newCounts.note10 || 0) - (cashOut.note10 || 0))
        };
      }
      
      return newCounts;
    });
    
    // Close the cash modal
    setShowCashModal(false);
    setCashTransactionData(null);
  };
  
  // Handle change return process
  const handleChangeReturn = () => {
    setShowChangeModal(false);
    setChangeReturnData(null);
    
    // Show cash management modal for handling the cash transaction
    setTimeout(() => {
      setShowCashModal(true);
    }, 500);
  };
  
  // Handle change return completion
  const handleChangeReturnComplete = () => {
    setShowChangeModal(false);
    setChangeReturnData(null);
    setCashTransactionData(null);
  };

  // Calculate current balance
  const getCurrentBalance = () => {
    return (
      (cashCounts.note500 || 0) * 500 +
      (cashCounts.note200 || 0) * 200 +
      (cashCounts.note100 || 0) * 100 +
      (cashCounts.note50 || 0) * 50 +
      (cashCounts.note10 || 0) * 10
    );
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <div className="p-5 relative">
      {/* Quick Sale Header with Hold Bill Tabs */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="h-6 w-6 text-blue-600" />
            Quick Sale Express
          </h1>
          
          {/* Hold Bill Tabs */}
          <HoldBillTabs 
            onLoadHoldBill={handleLoadHoldBill}
            currentHoldBillId={currentHoldBillId}
            refreshTrigger={refreshTabs}
          />
        </div>
      </div>

      {/* Top Right Printer Status - Only when connected */}
      {/* {hasPrinterConfig && printerStatus === 'connected' && (
        <div className="absolute top-16 right-5 z-10">
          <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-full px-3 py-1 shadow-sm">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium text-green-700">Printer</span>
            <button
              onClick={() => setShowPrinterModal(true)}
              className="p-0.5 text-green-600 hover:text-green-700 transition-colors"
              title="Printer Details"
            >
              <Settings className="h-3 w-3" />
            </button>
          </div>
        </div>
      )} */}

      {/* Printer Status - Only when NOT connected */}
      {hasPrinterConfig && printerStatus !== 'connected' && (
        <div className="mb-3">
          <div className="bg-white border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                <span className={`text-sm font-medium ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {printerStatus === 'disconnected' && (
                  <button
                    onClick={connectToPrinter}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Connect
                  </button>
                )}
                <button
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Printer Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {lastError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {lastError}
              </div>
            )}

            {/* Configuration Panel */}
            {isConfigOpen && (
              <div className="mt-3 p-3 bg-gray-50 border rounded">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                    <input
                      type="text"
                      value={printerIp}
                      onChange={(e) => setPrinterIp(e.target.value)}
                      placeholder="192.168.1.34"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
                    <input
                      type="text"
                      value={printerPort}
                      onChange={(e) => setPrinterPort(e.target.value)}
                      placeholder="8008"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      placeholder="local_printer"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={connectToPrinter}
                    disabled={printerStatus === 'connecting'}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {printerStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Client Section - 30% width */}
        <div className="w-[30%]">
          <div className="bg-white p-5 border rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-900">Client Information</h2>
            </div>
            <ClientSearch
              onClientSelect={handleClientSelect}
              selectedClient={selectedClient}
              onClear={handleClearClient}
            />
          </div>

          {/* Active Memberships Section */}
          <ActiveMemberships
            clientId={selectedClient?._id}
            onAddMembership={handleAddMembership}
            onMembershipSelect={handleMembershipSelect}
            selectedMembership={selectedMembership}
            disabled={discountStatus.hasCouponDiscount || discountStatus.hasWalletPayment || appliedCoupon !== null}
          />

          {/* Apply Coupon Section */}
          <div className="mt-2">
            <ApplyCoupon
              selectedClient={selectedClient}
              onCouponApply={handleCouponApply}
              appliedCoupon={appliedCoupon}
              onCouponRemove={handleCouponRemove}
              services={services}
              purchaseAmount={purchaseAmount}
              disabled={discountStatus.hasProductsInBilling || discountStatus.hasMembershipInBilling || discountStatus.hasMembershipDiscount || discountStatus.hasWalletPayment || selectedMembership !== null}
            />

            {/* Load Hold Bill Section */}
            <div className="mt-3">
              <LoadHoldBillButton
                selectedClient={selectedClient}
                onLoadHoldBill={handleLoadHoldBill}
              />
            </div>

          </div>
        </div>

        {/* Right Section - 70% width (for future content) */}
        <div className="w-[70%]">
          <div className="bg-white p-5 border rounded-xl">
            {/* Right Section - Add Services (70% width) */}
                <AddServices
                  ref={addServicesRef}
                  selectedClient={selectedClient}
                  selectedPaymentMethod={selectedPaymentMethod}
                  selectedMembership={selectedMembership}
                  appliedCoupon={appliedCoupon}
                  onPaymentMethodSelect={handlePaymentMethodSelect}
                  onServicesUpdate={handleServicesUpdate}
                  onPurchaseAmountUpdate={handlePurchaseAmountUpdate}
                  onDiscountStatusUpdate={handleDiscountStatusUpdate}
                  onBillGenerated={handleBillGenerated}
                  onHoldBill={handleHoldBill}
                />
          </div>
        </div>
      </div>

      {/* Add Membership Modal */}
      <AddMembershipModal
        isOpen={isMembershipModalOpen}
        onClose={() => {
          setIsMembershipModalOpen(false);
          setReactivateMembership(null);
        }}
        onMembershipAdded={handleMembershipAdded}
        reactivateMembership={reactivateMembership}
      />

      {/* Printer Details Modal */}
      {showPrinterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 max-w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Printer Details</h3>
              <button
                onClick={() => setShowPrinterModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Connection Status */}
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">Connected</span>
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                {/* Printer Information */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">IP Address:</span>
                    <span className="text-sm font-medium text-gray-900">{printerIp}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Port:</span>
                    <span className="text-sm font-medium text-gray-900">{printerPort}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Device ID:</span>
                    <span className="text-sm font-medium text-gray-900">{deviceId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Connection Method:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {printerConfig.getEPosDev() ? 'ePOS SDK' : 'XML API'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => {
                      setShowPrinterModal(false);
                      setIsConfigOpen(true);
                    }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Configure
                  </button>
                  <button
                    onClick={() => {
                      setShowPrinterModal(false);
                      disconnectPrinter();
                    }}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Return Modal */}
      {showChangeModal && changeReturnData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              {/* Header */}
              <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Change Return Required</h2>
              <p className="text-gray-600 mb-6">Customer needs change back</p>
              
              {/* Transaction Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{changeReturnData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bill Total:</span>
                    <span className="font-medium">₹{changeReturnData.billTotal.toLocaleString()}</span>
                  </div>
                  
                  {/* Payment Breakdown */}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="text-xs text-gray-500 mb-1">Payment Breakdown:</div>
                    {changeReturnData.paymentBreakdown?.cash > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cash:</span>
                        <span className="font-medium">₹{changeReturnData.paymentBreakdown.cash.toLocaleString()}</span>
                      </div>
                    )}
                    {changeReturnData.paymentBreakdown?.card > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Card:</span>
                        <span className="font-medium">₹{changeReturnData.paymentBreakdown.card.toLocaleString()}</span>
                      </div>
                    )}
                    {changeReturnData.paymentBreakdown?.upi > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">UPI:</span>
                        <span className="font-medium">₹{changeReturnData.paymentBreakdown.upi.toLocaleString()}</span>
                      </div>
                    )}
                    {changeReturnData.paymentBreakdown?.wallet > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Wallet:</span>
                        <span className="font-medium">₹{changeReturnData.paymentBreakdown.wallet.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between border-t border-gray-300 pt-2">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-medium">₹{changeReturnData.totalPaid.toLocaleString()}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Change to Return:</span>
                    <span className="font-bold text-lg text-red-600">₹{changeReturnData.changeAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleChangeReturnComplete}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleChangeReturn}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium"
                >
                  Manage Change
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cash Management Modal */}
      {showCashModal && unitCashDrawerInfo?.hasDrawer && (
        <CashModal
          isOpen={showCashModal}
          onClose={() => {
            setShowCashModal(false);
            setCashTransactionData(null);
          }}
          selectedUnit={unitCashDrawerInfo.unit}
          currentBalance={getCurrentBalance()}
          currentCounts={cashCounts}
          onTransactionComplete={handleCashTransactionComplete}
          prefilledData={cashTransactionData ? (() => {
            const isMixedPayment = (cashTransactionData.cardAmount > 0 || cashTransactionData.upiAmount > 0 || cashTransactionData.walletAmount > 0);
            const paymentSuffix = isMixedPayment ? ' (Mixed Payment)' : '';
            
            // For mixed payments, calculate net cash flow
            // Cash received minus any change to be returned
            const netCashIn = cashTransactionData.cashAmount;
            const netCashOut = cashTransactionData.changeAmount > 0 ? cashTransactionData.changeAmount : 0;
            
            console.log('Cash Modal Prefill:', {
              cashAmount: cashTransactionData.cashAmount,
              billTotal: cashTransactionData.billTotal,
              totalPaid: cashTransactionData.totalPaid,
              changeAmount: cashTransactionData.changeAmount,
              isMixedPayment,
              netCashIn,
              netCashOut
            });
            
            return {
              cashIn: {
                amount: netCashIn,
                note500: Math.floor(netCashIn / 500),
                note200: Math.floor((netCashIn % 500) / 200),
                note100: Math.floor(((netCashIn % 500) % 200) / 100),
                note50: Math.floor((((netCashIn % 500) % 200) % 100) / 50),
                note10: Math.floor(((((netCashIn % 500) % 200) % 100) % 50) / 10),
                remarks: `Cash received for Bill #${cashTransactionData.transactionId}${paymentSuffix}${isMixedPayment ? ` - Cash portion: ₹${netCashIn}` : ''}`
              },
              cashOut: netCashOut > 0 ? {
                amount: netCashOut,
                note500: Math.floor(netCashOut / 500),
                note200: Math.floor((netCashOut % 500) / 200),
                note100: Math.floor(((netCashOut % 500) % 200) / 100),
                note50: Math.floor((((netCashOut % 500) % 200) % 100) / 50),
                note10: Math.floor(((((netCashOut % 500) % 200) % 100) % 50) / 10),
                remarks: `Change returned for Bill #${cashTransactionData.transactionId}${paymentSuffix}`
              } : null
            };
          })() : null}
        />
      )}
    </div>
  );
}

export default QuickSaleMaster;
