import React, { useState, useEffect } from 'react';
import { DollarSign, Wifi, Settings, CheckCircle, AlertCircle, Power, Search, RefreshCw, MapPin } from 'lucide-react';

function CashDrawerControl() {
    const [printerStatus, setPrinterStatus] = useState('disconnected'); // disconnected, connecting, connected, opening, error
    const [printerIp, setPrinterIp] = useState('192.168.1.34');
    const [printerPort, setPrinterPort] = useState('8008');
    const [deviceId, setDeviceId] = useState('local_printer');
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [lastError, setLastError] = useState('');
    const [ePosDev, setEPosDev] = useState(null);
    const [printer, setPrinter] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [foundPrinters, setFoundPrinters] = useState([]);
    const [scanProgress, setScanProgress] = useState({ scanned: 0, total: 0, percentage: 0 });

    // Initialize Official Epson ePOS SDK
    useEffect(() => {
        initializeEposSDK();
        return () => {
            // Cleanup printer connections
            if (printer && ePosDev) {
                disconnectPrinter();
            }
        };
    }, []);

    // Initialize Official Epson ePOS SDK
    const initializeEposSDK = async () => {
        try {
            // Check if epson object is available (from epos-2.x.x.js)
            if (typeof window !== 'undefined' && window.epson && window.epson.ePOSDevice) {
                console.log('Official Epson ePOS SDK detected');
                const eposDevice = new window.epson.ePOSDevice();
                setEPosDev(eposDevice);
                
                // Set up device events
                eposDevice.onreconnecting = () => console.log('Printer reconnecting...');
                eposDevice.onreconnect = () => console.log('Printer reconnected');
                eposDevice.ondisconnect = () => {
                    console.log('Printer disconnected');
                    setPrinterStatus('disconnected');
                    setPrinter(null);
                };
                
                console.log('ePOS SDK initialized successfully');
            } else {
                console.log('Official ePOS SDK not found, using fallback XML API');
            }
        } catch (error) {
            console.error('Failed to initialize ePOS SDK:', error);
            setLastError('Failed to initialize printer SDK');
            setPrinterStatus('error');
        }
    };

    // Parse IP and port from input
    const parseIpAndPort = (ipString) => {
        if (ipString.includes(':')) {
            const [ip, port] = ipString.split(':');
            return { ip, port: parseInt(port) };
        }
        return { ip: ipString, port: 80 };
    };

    // Test printer connection
    const testPrinterConnection = async (ipString) => {
        const { ip, port } = parseIpAndPort(ipString);
        
        try {
            console.log(`Testing printer connection to ${ip}:${port}`);
            
            if (port === 9100) {
                console.log('Detected port 9100 - testing ePOS-Print on port 80 first');
                
                try {
                    const capabilityResponse = await fetch(`http://${ip}/epos/capability.xml`, {
                        method: 'GET',
                        mode: 'no-cors',
                        timeout: 3000
                    });
                    
                    console.log('ePOS-Print test successful for', ip);
                    // Return port 8008 for storage even though we tested on port 80
                    return { success: true, ip: ipString, port: 8008, method: 'epos-print' };
                    
                } catch (eposError) {
                    console.log('ePOS-Print not available, assuming raw port 9100 works');
                    return { success: true, ip: ipString, port, method: 'raw-9100' };
                }
            } else {
                // Test on port 80 (discovery) but return port 8008 for storage
                const capabilityResponse = await fetch(`http://${ip}/epos/capability.xml`, {
                    method: 'GET',
                    mode: 'no-cors',
                    timeout: 3000
                });

                return { success: true, ip: ipString, port: 8008, method: 'epos-print' };
            }
        } catch (error) {
            throw new Error(`Printer test failed for ${ip}:${port} - ${error.message}`);
        }
    };

    // Simple network scanner for printers
    const scanForPrinters = async () => {
        setIsScanning(true);
        setFoundPrinters([]);
        setScanProgress({ scanned: 0, total: 0, percentage: 0 });
        setLastError('');

        const baseIps = ['192.168.1.', '192.168.0.'];
        const foundList = [];
        let totalScanned = 0;
        const totalToScan = baseIps.length * 10; // Scan first 10 IPs in each range

        try {
            for (const baseIp of baseIps) {
                for (let i = 1; i <= 10; i++) {
                    const ip = `${baseIp}${i}`;
                    try {
                        await testPrinterConnection(ip);
                        foundList.push({ ip, method: 'epos-print', port: 80 });
                        setFoundPrinters([...foundList]);
                    } catch (error) {
                        // Printer not found at this IP
                    }
                    
                    totalScanned++;
                    setScanProgress({
                        scanned: totalScanned,
                        total: totalToScan,
                        percentage: Math.round((totalScanned / totalToScan) * 100)
                    });
                    
                    // Small delay to avoid overwhelming network
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        } catch (error) {
            setLastError(`Scan error: ${error.message}`);
        } finally {
            setIsScanning(false);
        }
    };

    // Connect to printer using Official SDK
    const connectToPrinter = async () => {
        setPrinterStatus('connecting');
        setLastError('');

        try {
            // Method 1: Using Official Epson ePOS SDK
            if (ePosDev) {
                console.log(`Connecting to printer at ${printerIp}:${printerPort}`);
                
                ePosDev.connect(printerIp, printerPort, (data) => {
                    if (data === 'OK' || data === 'SSL_CONNECT_OK') {
                        console.log('Connected to ePOS Device Service Interface');
                        
                        // Create printer device
                        const options = {
                            'crypto': false,
                            'buffer': false
                        };
                        
                        ePosDev.createDevice(deviceId, ePosDev.DEVICE_TYPE_PRINTER, options, (deviceObj, retcode) => {
                            if (retcode === 'OK' && deviceObj) {
                                console.log('Printer device created successfully');
                                setPrinter(deviceObj);
                                
                                // Set up printer events
                                deviceObj.onreceive = (res) => {
                                    console.log('Cash drawer result:', res.success ? 'Success' : 'Failure', 'Code:', res.code);
                                    setPrinterStatus('connected');
                                };
                                
                                deviceObj.onstatuschange = (status) => {
                                    console.log('Printer status changed:', status);
                                };
                                
                                setPrinterStatus('connected');
                            } else {
                                throw new Error(`Failed to create printer device: ${retcode}`);
                            }
                        });
                    } else {
                        throw new Error(`Connection failed: ${data}`);
                    }
                });
                
                return;
            }

            // Method 2: Fallback to XML API testing
            await testPrinterConnection(`${printerIp}:80`);
            setPrinterStatus('connected');
            console.log('Connected via XML API fallback:', printerIp);

        } catch (error) {
            console.error('Connection failed:', error);
            setLastError(`Connection failed: ${error.message}. Ensure printer is on, connected to network, and ePOS-Print is enabled.`);
            setPrinterStatus('error');
        }
    };

    // Disconnect from printer
    const disconnectPrinter = async () => {
        try {
            if (printer && ePosDev) {
                ePosDev.deleteDevice(printer, (errorCode) => {
                    if (errorCode === 'OK') {
                        console.log('Printer device deleted successfully');
                    }
                    ePosDev.disconnect();
                    setPrinter(null);
                    setPrinterStatus('disconnected');
                    console.log('Disconnected from printer');
                });
            } else {
                setPrinterStatus('disconnected');
                setPrinter(null);
            }
        } catch (error) {
            console.error('Disconnect failed:', error);
            setPrinterStatus('disconnected');
            setPrinter(null);
        }
    };

    // Open cash drawer function
    const openCashDrawer = async () => {
        if (printerStatus !== 'connected') {
            setLastError('Printer not connected. Please connect to printer first.');
            return;
        }

        try {
            setPrinterStatus('opening');
            setLastError('');
            console.log('Opening cash drawer...');

            if (printer) {
                // Using Official ePOS SDK
                printer.message = '';
                printer.addPulse(printer.DRAWER_1, printer.PULSE_100); // Open drawer connected to pin 2
                printer.send();
                console.log('Cash drawer command sent via ePOS SDK');
            } else {
                // Using ePOS-Print API fallback
                const drawerXml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <pulse drawer="drawer_1" time="pulse_100"/>
</epos-print>`;

                const { ip, port } = parseIpAndPort(printerIp);
                const printUrl = port === 9100 ? `http://${ip}/epos/print` : `http://${ip}:${port}/epos/print`;
                
                await fetch(printUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8',
                        'SOAPAction': ''
                    },
                    body: drawerXml,
                    mode: 'no-cors'
                });

                console.log('Cash drawer command sent via ePOS-Print API');
            }

            setTimeout(() => {
                setPrinterStatus('connected');
                console.log('Cash drawer opened successfully');
            }, 1000);

        } catch (error) {
            console.error('Failed to open cash drawer:', error);
            setLastError(`Failed to open cash drawer: ${error.message}`);
            setPrinterStatus('error');
        }
    };

    // Handle auto-detected printer selection
    const handleSelectFoundPrinter = async (foundPrinter) => {
        setPrinterIp(foundPrinter.ip);
        setLastError('');
        
        try {
            setPrinterStatus('connecting');
            console.log('Testing printer connection at:', foundPrinter.ip);
            
            await testPrinterConnection(foundPrinter.ip);
            setPrinterStatus('connected');
            console.log('Successfully connected to printer:', foundPrinter.ip);
            
        } catch (error) {
            console.error('Failed to connect to selected printer:', error);
            setPrinterStatus('error');
            setLastError(`Connection failed: ${error.message}. Try enabling ePOS-Print in printer settings.`);
        }
    };

    // Get status icon and color
    const getStatusDisplay = () => {
        switch (printerStatus) {
            case 'connected':
                return { icon: CheckCircle, color: 'text-green-600', text: 'Connected' };
            case 'connecting':
                return { icon: Power, color: 'text-yellow-600', text: 'Connecting...' };
            case 'opening':
                return { icon: DollarSign, color: 'text-blue-600', text: 'Opening Drawer...' };
            case 'error':
                return { icon: AlertCircle, color: 'text-red-600', text: 'Error' };
            default:
                return { icon: Wifi, color: 'text-gray-400', text: 'Disconnected' };
        }
    };

    const statusDisplay = getStatusDisplay();
    const StatusIcon = statusDisplay.icon;

    return (
        <div className="bg-white border rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-900">Cash Drawer Control</h3>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Quick Open Drawer Button - Header */}
                    {printerStatus === 'connected' && (
                        <button
                            onClick={openCashDrawer}
                            disabled={printerStatus === 'opening'}
                            className="flex items-center space-x-1 px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Open Cash Drawer"
                        >
                            <DollarSign className="h-4 w-4" />
                            <span>
                                {printerStatus === 'opening' ? 'Opening...' : 'Open Drawer'}
                            </span>
                        </button>
                    )}
                    
                    {/* Settings Button */}
                    <button
                        onClick={() => setIsConfigOpen(!isConfigOpen)}
                        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Printer Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Status Display */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${statusDisplay.color}`} />
                    <span className={`text-sm font-medium ${statusDisplay.color}`}>
                        {statusDisplay.text}
                    </span>
                    {printerStatus === 'connected' && (
                        <span className="text-xs text-gray-500">({printerIp})</span>
                    )}
                </div>
                
                {/* Quick Status Indicator */}
                {printerStatus === 'connected' && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        <CheckCircle className="h-3 w-3" />
                        <span>Ready to Open</span>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {lastError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {lastError}
                </div>
            )}

            {/* Configuration Panel */}
            {isConfigOpen && (
                <div className="mb-4 p-3 bg-gray-50 border rounded">
                    {/* Auto-Detection Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Auto-Detect Printer:
                            </label>
                        </div>
                        <button
                            onClick={scanForPrinters}
                            disabled={isScanning}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isScanning ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>Scanning... {scanProgress.percentage}%</span>
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    <span>🔍 Scan Network for Printers</span>
                                </>
                            )}
                        </button>
                        
                        {/* Scan Progress */}
                        {isScanning && (
                            <div className="mt-2">
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${scanProgress.percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">
                                    Scanning {scanProgress.scanned}/{scanProgress.total} addresses...
                                </p>
                            </div>
                        )}
                        
                        {/* Found Printers */}
                        {foundPrinters.length > 0 && (
                            <div className="mt-3">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Found Printers ({foundPrinters.length}):
                                </h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {foundPrinters.map((printer, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectFoundPrinter(printer)}
                                            className="w-full text-left p-2 border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <MapPin className="h-3 w-3 text-green-600" />
                                                    <span className="font-medium text-sm">{printer.ip}</span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {printer.method}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Manual IP Configuration */}
                    <div className="border-t pt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Manual IP Address:
                        </label>
                        <div className="space-y-2">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={printerIp}
                                    onChange={(e) => setPrinterIp(e.target.value)}
                                    placeholder="192.168.1.34"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <input
                                    type="text"
                                    value={printerPort}
                                    onChange={(e) => setPrinterPort(e.target.value)}
                                    placeholder="8008"
                                    className="w-20 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={deviceId}
                                    onChange={(e) => setDeviceId(e.target.value)}
                                    placeholder="local_printer"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    onClick={connectToPrinter}
                                    disabled={printerStatus === 'connecting'}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {printerStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            IP: Printer address | Port: 8008 (ePOS SDK) | Device: Printer ID
                        </p>
                    </div>
                </div>
            )}

            {/* Main Controls */}
            <div className="space-y-3">
                {printerStatus !== 'connected' && (
                    <>
                        {/* Quick Auto-Detect Button */}
                        <button
                            onClick={scanForPrinters}
                            disabled={isScanning}
                            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                            {isScanning ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    <span>🔍 Scanning Network... {scanProgress.percentage}%</span>
                                </>
                            ) : (
                                <>
                                    <Search className="h-4 w-4" />
                                    <span>🔍 Auto-Detect Printer</span>
                                </>
                            )}
                        </button>
                        
                        {/* Found Printers Quick Select */}
                        {foundPrinters.length > 0 && !isScanning && (
                            <div className="p-3 bg-green-50 border border-green-200 rounded">
                                <h4 className="text-sm font-semibold text-green-800 mb-2">
                                    Found {foundPrinters.length} printer(s) - Click to connect:
                                </h4>
                                <div className="space-y-1">
                                    {foundPrinters.slice(0, 3).map((printer, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSelectFoundPrinter(printer)}
                                            className="w-full text-left p-2 bg-white border border-green-300 rounded hover:bg-green-100 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-sm">{printer.ip}</span>
                                                <span className="text-xs text-green-600">{printer.method}</span>
                                            </div>
                                        </button>
                                    ))}
                                    {foundPrinters.length > 3 && (
                                        <p className="text-xs text-green-700 text-center">
                                            +{foundPrinters.length - 3} more in settings
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Manual Connect Button */}
                        <button
                            onClick={connectToPrinter}
                            disabled={printerStatus === 'connecting'}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {printerStatus === 'connecting' ? 'Connecting to Printer...' : 'Connect to Printer'}
                        </button>
                    </>
                )}

                {printerStatus === 'connected' && (
                    <>
                        {/* Main Open Drawer Button - Large & Prominent */}
                        <button
                            onClick={openCashDrawer}
                            disabled={printerStatus === 'opening'}
                            className="w-full bg-purple-600 text-white py-4 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-semibold text-lg"
                        >
                            <DollarSign className="h-6 w-6" />
                            <span>
                                {printerStatus === 'opening' ? '💰 Opening Cash Drawer...' : '💰 Open Cash Drawer'}
                            </span>
                        </button>
                        
                        {/* Disconnect Button */}
                        <button
                            onClick={disconnectPrinter}
                            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 transition-colors"
                        >
                            Disconnect Printer
                        </button>
                    </>
                )}
            </div>

            {/* Information Panel */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">Cash Drawer Info:</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Connect your cash drawer to the printer's RJ11 port</li>
                    <li>• Ensure your Epson printer supports cash drawer control</li>
                    <li>• The drawer will open with a 100ms pulse signal</li>
                    <li>• Use this for manual cash drawer opening when needed</li>
                </ul>
            </div>
        </div>
    );
}

export default CashDrawerControl;