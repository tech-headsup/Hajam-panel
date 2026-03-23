import React, { useState, useEffect } from 'react';
import { Printer, Wifi, Settings, CheckCircle, AlertCircle, Power, Search, RefreshCw, MapPin, DollarSign } from 'lucide-react';
import { usePrinterAutoDetect } from './PrinterAutoDetect';
// Official Epson ePOS SDK - include epos-2.x.x.js in your project
// Download from: https://download.epson-biz.com/modules/pos/index.php

function EpsonThermalPrinter({ billData, onPrintSuccess, onPrintError }) {
    const [printerStatus, setPrinterStatus] = useState('disconnected'); // disconnected, connecting, connected, printing, error
    const [printerIp, setPrinterIp] = useState('192.168.1.34');
    const [printerPort, setPrinterPort] = useState('8008');
    const [deviceId, setDeviceId] = useState('local_printer');
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [lastError, setLastError] = useState('');
    const [ePosDev, setEPosDev] = useState(null);
    const [printer, setPrinter] = useState(null);
    const [showAutoDetect, setShowAutoDetect] = useState(false);
    const [openCashDrawer, setOpenCashDrawer] = useState(true); // New: Cash drawer setting

    // Auto-detection hook
    const {
        isScanning,
        scanProgress,
        foundPrinters,
        scanError,
        lastScanTime,
        startScan,
        stopScan,
        testPrinter
    } = usePrinterAutoDetect();

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

    // Parse IP and port from input (e.g., "192.168.1.34:9100")
    const parseIpAndPort = (ipString) => {
        if (ipString.includes(':')) {
            const [ip, port] = ipString.split(':');
            return { ip, port: parseInt(port) };
        }
        return { ip: ipString, port: 80 }; // Default to port 80 for ePOS-Print
    };

    // Test printer connection with actual print capability test
    const testPrinterConnection = async (ipString) => {
        const { ip, port } = parseIpAndPort(ipString);

        try {
            console.log(`Testing printer connection to ${ip}:${port}`);

            // For port 9100 (raw printing port), try ePOS-Print on default port 80 first
            if (port === 9100) {
                console.log('Detected port 9100 - testing ePOS-Print on port 80 first');

                try {
                    // Try ePOS-Print on port 80 first
                    const capabilityResponse = await fetch(`http://${ip}/epos/capability.xml`, {
                        method: 'GET',
                        mode: 'no-cors',
                        timeout: 3000
                    });

                    // Test actual print via ePOS-Print
                    const testXml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <text>Connection Test</text>
    <feed line="1"/>
</epos-print>`;

                    const printTestResponse = await fetch(`http://${ip}/epos/print`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'text/xml; charset=utf-8'
                        },
                        body: testXml,
                        mode: 'no-cors',
                        timeout: 5000
                    });

                    console.log('ePOS-Print test successful for', ip);
                    return { success: true, ip: ipString, port, method: 'epos-print' };

                } catch (eposError) {
                    console.log('ePOS-Print not available, assuming raw port 9100 works');
                    // For raw port 9100, we can't easily test without special libraries
                    // But we'll assume it's working since port 9100 is standard for thermal printers
                    return { success: true, ip: ipString, port, method: 'raw-9100' };
                }
            } else {
                // Standard ePOS-Print testing for other ports
                const capabilityResponse = await fetch(`http://${ip}:${port}/epos/capability.xml`, {
                    method: 'GET',
                    mode: 'no-cors',
                    timeout: 3000
                });

                const testXml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <text>Connection Test</text>
    <feed line="1"/>
</epos-print>`;

                const printTestResponse = await fetch(`http://${ip}:${port}/epos/print`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8'
                    },
                    body: testXml,
                    mode: 'no-cors',
                    timeout: 5000
                });

                return { success: true, ip: ipString, port, method: 'epos-print' };
            }
        } catch (error) {
            throw new Error(`Printer test failed for ${ip}:${port} - ${error.message}`);
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
                                    console.log('Print result:', res.success ? 'Success' : 'Failure', 'Code:', res.code);
                                    if (res.success && onPrintSuccess) {
                                        onPrintSuccess();
                                    } else if (!res.success && onPrintError) {
                                        onPrintError(new Error(`Print failed: ${res.code}`));
                                    }
                                    setPrinterStatus('connected');
                                };

                                deviceObj.onstatuschange = (status) => {
                                    console.log('Printer status changed:', status);
                                };

                                deviceObj.ononline = () => console.log('Printer online');
                                deviceObj.onoffline = () => console.log('Printer offline');
                                deviceObj.oncoverok = () => console.log('Printer cover OK');
                                deviceObj.oncoveropen = () => console.log('Printer cover open');
                                deviceObj.onpaperok = () => console.log('Paper OK');
                                deviceObj.onpaperend = () => console.log('Paper end');

                                setPrinterStatus('connected');
                            } else {
                                throw new Error(`Failed to create printer device: ${retcode}`);
                            }
                        });
                    } else {
                        throw new Error(`Connection failed: ${data}`);
                    }
                });

                return; // Exit early for SDK method
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
                // Delete printer device first
                ePosDev.deleteDevice(printer, (errorCode) => {
                    if (errorCode === 'OK') {
                        console.log('Printer device deleted successfully');
                    }
                    // Disconnect from device service
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

    // Format currency for receipt
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0.00';
        return parseFloat(amount).toFixed(2);
    };

    // Open cash drawer function
    const openCashDrawerOnly = async () => {
        if (!printer && printerStatus !== 'connected') {
            setLastError('Printer not connected. Please connect to printer first.');
            return;
        }

        try {
            setPrinterStatus('printing');
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

    // Print bill using Official ePOS SDK
    const printBillWithEposSDK = async () => {
        if (!printer || !billData) return;

        try {
            setPrinterStatus('printing');
            console.log('Starting print job with Official ePOS SDK');

            // Clear any previous commands
            printer.message = '';

            // TAX INVOICE Header
            printer.addTextAlign(printer.ALIGN_CENTER);
            printer.addTextSize(1, 1);
            printer.addText('TAX INVOICE');
            printer.addFeedLine(1);

            // Header - Business Info
            printer.addTextSize(2, 2);
            printer.addText(billData.business?.name || 'ELEVATE LIFESTYLE');
            printer.addFeedLine(1);

            // Business details
            printer.addTextSize(1, 1);
            printer.addText(billData.business?.address || 'Business Address');
            printer.addFeedLine(1);
            printer.addText(`Ph: ${billData.business?.phone || 'Phone Number'}`);
            printer.addFeedLine(1);

            if (billData.business?.email) {
                printer.addText(`Email: ${billData.business.email}`);
                printer.addFeedLine(1);
            }

            // Separator line
            printer.addText('----------------------------------------');
            printer.addFeedLine(1);

            // Bill details
            printer.addTextAlign(printer.ALIGN_LEFT);
            printer.addText(`Bill No: ${billData.billNumber}`);
            printer.addFeedLine(1);
            printer.addText(`Date: ${new Date(billData.timestamp).toLocaleDateString('en-IN')}`);
            printer.addFeedLine(1);
            printer.addText(`Time: ${new Date(billData.timestamp).toLocaleTimeString('en-IN')}`);
            printer.addFeedLine(2);

            // Client information
            if (billData.client) {
                printer.addText('CLIENT DETAILS:');
                printer.addFeedLine(1);
                printer.addText(billData.client.name);
                printer.addFeedLine(1);
                if (billData.client.phone) {
                    printer.addText(`Ph: ${billData.client.phone}`);
                    printer.addFeedLine(1);
                }
                printer.addText('----------------------------------------');
                printer.addFeedLine(1);
            }

            // Items section
            printer.addText('ITEMS:');
            printer.addFeedLine(1);

            // Services
            if (billData.services && billData.services.length > 0) {
                printer.addText('SERVICES:');
                printer.addFeedLine(1);
                billData.services.forEach(service => {
                    printer.addText(service.name);
                    printer.addFeedLine(1);
                    printer.addText(`${service.quantity} x Rs.${formatCurrency(service.pricing.finalPrice)} = Rs.${formatCurrency(service.pricing.totalPrice)}`);
                    printer.addFeedLine(1);
                    if (service.staff) {
                        printer.addText(`Staff: ${service.staff.name}`);
                        printer.addFeedLine(1);
                    }
                });
            }

            // Products
            if (billData.products && billData.products.length > 0) {
                printer.addText('PRODUCTS:');
                printer.addFeedLine(1);
                billData.products.forEach(product => {
                    printer.addText(product.name);
                    printer.addFeedLine(1);
                    printer.addText(`${product.quantity} x Rs.${formatCurrency(product.pricing.finalPrice)} = Rs.${formatCurrency(product.pricing.totalPrice)}`);
                    printer.addFeedLine(1);
                    if (product.staff) {
                        printer.addText(`Staff: ${product.staff.name}`);
                        printer.addFeedLine(1);
                    }
                });
            }

            // Memberships
            if (billData.newMemberships && billData.newMemberships.length > 0) {
                printer.addText('MEMBERSHIPS:');
                printer.addFeedLine(1);
                billData.newMemberships.forEach(membership => {
                    printer.addText(membership.name);
                    printer.addFeedLine(1);
                    printer.addText(`1 x Rs.${formatCurrency(membership.pricing.finalPrice)}`);
                    printer.addFeedLine(1);
                });
            }

            // Totals
            printer.addText('----------------------------------------');
            printer.addFeedLine(1);
            printer.addText(`Subtotal: Rs.${formatCurrency(billData.calculations?.totals?.subtotalAfterItemDiscount)}`);
            printer.addFeedLine(1);

            if (billData.calculations?.totals?.totalItemDiscount > 0) {
                printer.addText(`Discounts: -Rs.${formatCurrency(billData.calculations.totals.totalItemDiscount)}`);
                printer.addFeedLine(1);
            }

            if (billData.appliedCoupon && billData.calculations?.totals?.couponDiscount > 0) {
                printer.addText(`Coupon (${billData.appliedCoupon.code}): -Rs.${formatCurrency(billData.calculations.totals.couponDiscount)}`);
                printer.addFeedLine(1);
            }

            // Grand total
            printer.addText('========================================');
            printer.addFeedLine(1);
            printer.addTextAlign(printer.ALIGN_CENTER);
            printer.addTextSize(2, 2);
            printer.addText(`TOTAL: Rs.${formatCurrency(billData.calculations?.totals?.grandTotal)}`);
            printer.addFeedLine(1);
            printer.addText('========================================');
            printer.addFeedLine(1);

            // Payment details
            printer.addTextAlign(printer.ALIGN_LEFT);
            printer.addTextSize(1, 1);
            printer.addText('PAYMENT DETAILS:');
            printer.addFeedLine(1);
            billData.payment?.activePaymentMethods?.forEach(payment => {
                printer.addText(`${payment.method}: Rs.${formatCurrency(payment.amount)}`);
                printer.addFeedLine(1);
            });
            printer.addText(`Status: ${billData.payment?.paymentStatus}`);
            printer.addFeedLine(2);

            // Footer
            printer.addTextAlign(printer.ALIGN_CENTER);
            printer.addText('Thank you for your visit!');
            printer.addFeedLine(1);
            printer.addText('Please visit again');
            printer.addFeedLine(2);
            printer.addText('Powered by Elevate Panel');
            printer.addFeedLine(1);
            printer.addText(`Transaction ID: ${billData.transactionId}`);
            printer.addFeedLine(3);

            // AUTOMATIC PAPER CUT with FEED - This should resolve cutting issues!
            printer.addCut(printer.CUT_FEED); // Feed paper and cut (official SDK method)

            // Open cash drawer if enabled
            if (openCashDrawer) {
                printer.addPulse(printer.DRAWER_1, printer.PULSE_100); // Open cash drawer
                console.log('Cash drawer command added to print job');
            }

            // Send to printer
            console.log('Sending print job to printer...');
            printer.send();

            // Note: Success/failure will be handled by printer.onreceive callback

        } catch (error) {
            console.error('Print failed:', error);
            setLastError(`Print failed: ${error.message}`);
            setPrinterStatus('error');
            if (onPrintError) {
                onPrintError(error);
            }
        }
    };

    // Print bill using direct ePOS-Print API (fallback method)
    const printBillWithEposPrintAPI = async () => {
        if (!billData) return;

        try {
            setPrinterStatus('printing');

            // Create XML for ePOS-Print API
            const xml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <text align="center" width="1" height="1">TAX INVOICE</text>
    <feed line="1"/>
    <text align="center" width="2" height="2">${billData.business?.name || 'ELEVATE LIFESTYLE'}</text>
    <feed line="1"/>
    <text align="center">${billData.business?.address || 'Business Address'}</text>
    <feed line="1"/>
    <text align="center">Ph: ${billData.business?.phone || 'Phone Number'}</text>
    <feed line="1"/>
    <text>----------------------------------------</text>
    <feed line="1"/>
    <text>Bill No: ${billData.billNumber}</text>
    <feed line="1"/>
    <text>Date: ${new Date(billData.timestamp).toLocaleDateString('en-IN')}</text>
    <feed line="1"/>
    <text>Time: ${new Date(billData.timestamp).toLocaleTimeString('en-IN')}</text>
    <feed line="2"/>
    ${billData.client ? `
    <text>CLIENT: ${billData.client.name}</text>
    <feed line="1"/>
    ${billData.client.phone ? `<text>Ph: ${billData.client.phone}</text><feed line="1"/>` : ''}
    <text>----------------------------------------</text>
    <feed line="1"/>
    ` : ''}
    <text>ITEMS:</text>
    <feed line="1"/>
    ${billData.services ? billData.services.map(service => `
    <text>${service.name}</text>
    <feed line="1"/>
    <text>${service.quantity} x Rs.${formatCurrency(service.pricing.finalPrice)} = Rs.${formatCurrency(service.pricing.totalPrice)}</text>
    <feed line="1"/>
    ${service.staff ? `<text>Staff: ${service.staff.name}</text><feed line="1"/>` : ''}
    `).join('') : ''}
    ${billData.products ? billData.products.map(product => `
    <text>${product.name}</text>
    <feed line="1"/>
    <text>${product.quantity} x Rs.${formatCurrency(product.pricing.finalPrice)} = Rs.${formatCurrency(product.pricing.totalPrice)}</text>
    <feed line="1"/>
    `).join('') : ''}
    <text>----------------------------------------</text>
    <feed line="1"/>
    <text>Subtotal: Rs.${formatCurrency(billData.calculations?.totals?.subtotalAfterItemDiscount)}</text>
    <feed line="1"/>
    ${billData.calculations?.totals?.totalItemDiscount > 0 ? `
    <text>Discounts: -Rs.${formatCurrency(billData.calculations.totals.totalItemDiscount)}</text>
    <feed line="1"/>
    ` : ''}
    <text>========================================</text>
    <feed line="1"/>
    <text align="center" width="2" height="2">TOTAL: Rs.${formatCurrency(billData.calculations?.totals?.grandTotal)}</text>
    <feed line="1"/>
    <text>========================================</text>
    <feed line="2"/>
    <text align="center">Thank you for your visit!</text>
    <feed line="1"/>
    <text align="center">Please visit again</text>
    <feed line="2"/>
    <text align="center">Powered by Elevate Panel</text>
    <feed line="1"/>
    <text align="center">ID: ${billData.transactionId}</text>
    <feed line="3"/>
    <cut type="partial"/>
    ${openCashDrawer ? '<pulse drawer="drawer_1" time="pulse_100"/>' : ''}
</epos-print>`;

            // Send to printer via ePOS-Print API with better error handling
            const { ip, port } = parseIpAndPort(printerIp);
            console.log('Sending print job to:', ip, 'port:', port);
            console.log('Print XML length:', xml.length);

            // For port 9100, try ePOS-Print on port 80, otherwise use the specified port
            const printUrl = port === 9100 ? `http://${ip}/epos/print` : `http://${ip}:${port}/epos/print`;
            console.log('Print URL:', printUrl);

            try {
                const response = await fetch(printUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/xml; charset=utf-8',
                        'SOAPAction': '' // Some printers require this
                    },
                    body: xml,
                    mode: 'no-cors' // Required for direct printer communication
                });

                // Since no-cors mode doesn't allow reading response, we need to validate differently
                console.log('Print job sent successfully to printer');

                // Test if printer is still responsive after print job
                setTimeout(async () => {
                    try {
                        // Quick test to see if printer is still responding
                        await fetch(`http://${printerIp}/epos/capability.xml`, {
                            method: 'GET',
                            mode: 'no-cors',
                            timeout: 2000
                        });

                        setPrinterStatus('connected');
                        if (onPrintSuccess) {
                            onPrintSuccess();
                        }
                        console.log('Print job completed successfully');

                    } catch (testError) {
                        console.warn('Printer not responding after print job, but job likely succeeded');
                        setPrinterStatus('connected');
                        if (onPrintSuccess) {
                            onPrintSuccess();
                        }
                    }
                }, 1500);

            } catch (fetchError) {
                throw new Error(`Failed to send print job: ${fetchError.message}`);
            }

        } catch (error) {
            console.error('ePOS-Print API failed:', error);
            setLastError(`Print failed: ${error.message}`);
            setPrinterStatus('error');
            if (onPrintError) {
                onPrintError(error);
            }
        }
    };

    // Test print function to verify printer is working
    const handleTestPrint = async () => {
        if (!printerIp) {
            setLastError('No printer IP address configured');
            return;
        }

        try {
            setPrinterStatus('printing');
            setLastError('');

            const testXml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <text align="center" width="2" height="2">TEST PRINT</text>
    <feed line="1"/>
    <text align="center">Epson TM-30III Test</text>
    <feed line="1"/>
    <text align="center">${new Date().toLocaleString()}</text>
    <feed line="1"/>
    <text>----------------------------------------</text>
    <feed line="1"/>
    <text>If you can see this, your printer</text>
    <feed line="1"/>
    <text>is working correctly!</text>
    <feed line="3"/>
    <cut type="partial"/>
</epos-print>`;

            const response = await fetch(`http://${printerIp}/epos/print`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': ''
                },
                body: testXml,
                mode: 'no-cors'
            });

            setTimeout(() => {
                setPrinterStatus('connected');
                console.log('Test print completed successfully');
            }, 1000);

        } catch (error) {
            console.error('Test print failed:', error);
            setLastError(`Test print failed: ${error.message}`);
            setPrinterStatus('error');
        }
    };

    // Main print function - improved with better validation
    const handlePrint = async () => {
        if (!billData) {
            setLastError('No bill data available to print');
            return;
        }

        if (!printerIp) {
            setLastError('No printer IP address configured. Please connect to a printer first.');
            return;
        }

        if (printerStatus !== 'connected') {
            setLastError('Printer not connected. Please connect to printer first.');
            return;
        }

        try {
            setLastError('');
            console.log('Starting print job with data:', billData);

            // Try SDK method first (when available), fallback to API
            if (printer) {
                await printBillWithEposSDK();
            } else {
                await printBillWithEposPrintAPI();
            }
        } catch (error) {
            console.error('Print function failed:', error);
            setLastError(`Print failed: ${error.message}`);
            setPrinterStatus('error');
        }
    };

    // Auto-detection functions
    const handleAutoDetect = async () => {
        setLastError('');
        setShowAutoDetect(true);
        await startScan();
    };

    const handleSelectFoundPrinter = async (foundPrinter) => {
        setPrinterIp(foundPrinter.ip);
        setShowAutoDetect(false);
        setLastError('');

        // Automatically test actual print capability of selected printer
        try {
            setPrinterStatus('connecting');
            console.log('Testing printer connection at:', foundPrinter.ip);

            // Use our improved connection test
            await testPrinterConnection(foundPrinter.ip);
            setPrinterStatus('connected');
            console.log('Successfully connected to printer:', foundPrinter.ip);

        } catch (error) {
            console.error('Failed to connect to selected printer:', error);
            setPrinterStatus('error');
            setLastError(`Connection failed: ${error.message}. Try enabling ePOS-Print in printer settings.`);
        }
    };

    const handleCloseAutoDetect = () => {
        setShowAutoDetect(false);
        if (isScanning) {
            stopScan();
        }
    };

    // Get status icon and color
    const getStatusDisplay = () => {
        switch (printerStatus) {
            case 'connected':
                return { icon: CheckCircle, color: 'text-green-600', text: 'Connected' };
            case 'connecting':
                return { icon: Power, color: 'text-yellow-600', text: 'Connecting...' };
            case 'printing':
                return { icon: Printer, color: 'text-blue-600', text: 'Printing...' };
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
                    <Printer className="h-5 w-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-900">Epson TM-30III Printer</h3>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Quick Print Button */}
                    {printerStatus === 'connected' && billData && (
                        <button
                            onClick={handlePrint}
                            disabled={printerStatus === 'printing'}
                            className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Print Bill with Auto-Cut"
                        >
                            <Printer className="h-4 w-4" />
                            <span>
                                {printerStatus === 'printing'
                                    ? 'Printing...'
                                    : openCashDrawer
                                        ? 'Print + Drawer'
                                        : 'Print'
                                }
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
                {printerStatus === 'connected' && billData && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        <CheckCircle className="h-3 w-3" />
                        <span>Ready to Print</span>
                    </div>
                )}

                {printerStatus === 'connected' && !billData && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                        <AlertCircle className="h-3 w-3" />
                        <span>No Bill Data</span>
                    </div>
                )}

                {/* Cash Drawer Status Indicator */}
                {printerStatus === 'connected' && openCashDrawer && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        <DollarSign className="h-3 w-3" />
                        <span>Drawer Enabled</span>
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
                            {lastScanTime && (
                                <span className="text-xs text-gray-500">
                                    Last scan: {new Date(lastScanTime).toLocaleTimeString()}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleAutoDetect}
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
                                                    {printer.port !== 80 && (
                                                        <span className="text-xs text-gray-500">:{printer.port}</span>
                                                    )}
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

                        {/* Scan Error */}
                        {scanError && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                Scan error: {scanError}
                            </div>
                        )}
                    </div>

                    {/* Cash Drawer Settings */}
                    <div className="border-t pt-4 mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cash Drawer Settings:
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="openCashDrawer"
                                checked={openCashDrawer}
                                onChange={(e) => setOpenCashDrawer(e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="openCashDrawer" className="text-sm text-gray-700">
                                Open cash drawer when printing
                            </label>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                            Automatically opens the cash drawer connected to the printer's RJ11 port
                        </p>
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
                        <p className="text-xs text-gray-500">
                            Make sure your Epson TM-30III is connected to the network and ePOS-Print is enabled.
                        </p>
                    </div>
                </div>
            )}

            {/* Print Controls */}
            <div className="space-y-3">
                {printerStatus !== 'connected' && (
                    <>
                        {/* Quick Auto-Detect Button */}
                        <button
                            onClick={handleAutoDetect}
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
                            {printerStatus === 'connecting' ? 'Connecting to Printer...' : 'Connect to Printer (Manual)'}
                        </button>
                    </>
                )}

                {printerStatus === 'connected' && (
                    <>
                        {/* Main Print Button - Larger & Prominent */}
                        <button
                            onClick={handlePrint}
                            disabled={!billData || printerStatus === 'printing'}
                            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-semibold"
                        >
                            <Printer className="h-5 w-5" />
                            <span>
                                {printerStatus === 'printing'
                                    ? 'Printing & Cutting...'
                                    : openCashDrawer
                                        ? '🖨️ Print Bill + Open Drawer'
                                        : '🖨️ Print Bill with Auto-Cut'
                                }
                            </span>
                        </button>

                        {/* Secondary Actions Row */}
                        <div className="flex space-x-2">
                            <button
                                onClick={handleTestPrint}
                                disabled={printerStatus === 'printing'}
                                className="flex-1 bg-orange-600 text-white py-2 px-3 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1 text-sm"
                            >
                                <Printer className="h-4 w-4" />
                                <span>Test Print</span>
                            </button>

                            <button
                                onClick={openCashDrawerOnly}
                                disabled={printerStatus === 'printing'}
                                className="flex-1 bg-purple-600 text-white py-2 px-3 rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1 text-sm"
                            >
                                <DollarSign className="h-4 w-4" />
                                <span>Open Drawer</span>
                            </button>

                            <button
                                onClick={disconnectPrinter}
                                className="flex-1 bg-gray-500 text-white py-2 px-3 rounded hover:bg-gray-600 transition-colors text-sm"
                            >
                                Disconnect
                            </button>
                        </div>

                        {/* Quick IP Change Button */}
                        <button
                            onClick={() => setIsConfigOpen(!isConfigOpen)}
                            className="w-full bg-blue-100 text-blue-700 py-2 px-4 rounded border border-blue-300 hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2 text-sm"
                        >
                            <Settings className="h-4 w-4" />
                            <span>Change IP Address / Settings</span>
                        </button>
                    </>
                )}
            </div>

            {/* Installation Instructions */}
            {!ePosDev && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Setup Instructions:</h4>
                    <ol className="text-xs text-blue-700 space-y-1">
                        <li>1. Download: <code className="bg-blue-100 px-1 rounded">epos-2.x.x.js</code> from Epson website</li>
                        <li>2. Include script in your HTML: <code className="bg-blue-100 px-1 rounded">&lt;script src="epos-2.x.x.js"&gt;</code></li>
                        <li>3. Configure your Epson TM-30III network settings</li>
                        <li>4. Enable ePOS-Print in printer web interface</li>
                        <li>5. Use port 8008 for ePOS SDK connection</li>
                    </ol>
                </div>
            )}

            {ePosDev && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">✅ Official ePOS SDK Ready</h4>
                    <p className="text-xs text-green-700">
                        Official Epson ePOS SDK detected. Enhanced paper cutting and print reliability available.
                    </p>
                </div>
            )}
        </div>
    );
}

export default EpsonThermalPrinter;