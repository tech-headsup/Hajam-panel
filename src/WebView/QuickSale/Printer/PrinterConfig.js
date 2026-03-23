class PrinterConfig {
    constructor() {
        this.ePosDev = null;
        this.printer = null;
        this.isInitialized = false;
    }

    async initializeEposSDK() {
        try {
            if (typeof window !== 'undefined' && window.epson && window.epson.ePOSDevice) {
                console.log('Official Epson ePOS SDK detected');
                const eposDevice = new window.epson.ePOSDevice();
                this.ePosDev = eposDevice;

                eposDevice.onreconnecting = () => console.log('Printer reconnecting...');
                eposDevice.onreconnect = () => console.log('Printer reconnected');
                eposDevice.ondisconnect = () => {
                    console.log('Printer disconnected');
                    this.printer = null;
                };

                this.isInitialized = true;
                console.log('ePOS SDK initialized successfully');
                return { success: true, method: 'epos-sdk' };
            } else {
                console.log('Official ePOS SDK not found, using fallback XML API');
                this.isInitialized = true;
                return { success: true, method: 'xml-api' };
            }
        } catch (error) {
            console.error('Failed to initialize ePOS SDK:', error);
            throw new Error(`Failed to initialize printer SDK: ${error.message}`);
        }
    }

    parseIpAndPort(ipString) {
        if (ipString.includes(':')) {
            const [ip, port] = ipString.split(':');
            return { ip, port: parseInt(port) };
        }
        return { ip: ipString, port: 80 };
    }

    async testPrinterConnection(ipString) {
        const { ip, port } = this.parseIpAndPort(ipString);

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
                    return { success: true, ip: ipString, port, method: 'raw-9100' };
                }
            } else {
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
    }

    async connectToPrinter({
        printerIp,
        printerPort = '8008',
        deviceId = 'local_printer',
        onStatusChange = null,
        onConnected = null,
        onError = null,
        onPrintReceive = null
    }) {
        try {
            if (!this.isInitialized) {
                await this.initializeEposSDK();
            }

            console.log(`Connecting to printer at ${printerIp}:${printerPort}`);

            if (this.ePosDev) {
                return new Promise((resolve, reject) => {
                    this.ePosDev.connect(printerIp, printerPort, (data) => {
                        if (data === 'OK' || data === 'SSL_CONNECT_OK') {
                            console.log('Connected to ePOS Device Service Interface');

                            const options = {
                                'crypto': false,
                                'buffer': false
                            };

                            this.ePosDev.createDevice(deviceId, this.ePosDev.DEVICE_TYPE_PRINTER, options, (deviceObj, retcode) => {
                                if (retcode === 'OK' && deviceObj) {
                                    console.log('Printer device created successfully');
                                    this.printer = deviceObj;

                                    deviceObj.onreceive = (res) => {
                                        console.log('Print result:', res.success ? 'Success' : 'Failure', 'Code:', res.code);
                                        if (onPrintReceive) {
                                            onPrintReceive(res);
                                        }
                                    };

                                    deviceObj.onstatuschange = (status) => {
                                        console.log('Printer status changed:', status);
                                        if (onStatusChange) {
                                            onStatusChange(status);
                                        }
                                    };

                                    deviceObj.ononline = () => console.log('Printer online');
                                    deviceObj.onoffline = () => console.log('Printer offline');
                                    deviceObj.oncoverok = () => console.log('Printer cover OK');
                                    deviceObj.oncoveropen = () => console.log('Printer cover open');
                                    deviceObj.onpaperok = () => console.log('Paper OK');
                                    deviceObj.onpaperend = () => console.log('Paper end');

                                    if (onConnected) {
                                        onConnected(deviceObj);
                                    }

                                    resolve({
                                        success: true,
                                        method: 'epos-sdk',
                                        printer: deviceObj,
                                        ip: printerIp,
                                        port: printerPort
                                    });
                                } else {
                                    const error = new Error(`Failed to create printer device: ${retcode}`);
                                    if (onError) {
                                        onError(error);
                                    }
                                    reject(error);
                                }
                            });
                        } else {
                            const error = new Error(`Connection failed: ${data}`);
                            if (onError) {
                                onError(error);
                            }
                            reject(error);
                        }
                    });
                });
            } else {
                await this.testPrinterConnection(`${printerIp}:80`);
                console.log('Connected via XML API fallback:', printerIp);
                
                if (onConnected) {
                    onConnected(null);
                }

                return {
                    success: true,
                    method: 'xml-api',
                    printer: null,
                    ip: printerIp,
                    port: printerPort
                };
            }

        } catch (error) {
            console.error('Connection failed:', error);
            const errorMessage = `Connection failed: ${error.message}. Ensure printer is on, connected to network, and ePOS-Print is enabled.`;
            
            if (onError) {
                onError(new Error(errorMessage));
            }
            
            throw new Error(errorMessage);
        }
    }

    async disconnectPrinter() {
        try {
            if (this.printer && this.ePosDev) {
                return new Promise((resolve) => {
                    this.ePosDev.deleteDevice(this.printer, (errorCode) => {
                        if (errorCode === 'OK') {
                            console.log('Printer device deleted successfully');
                        }
                        this.ePosDev.disconnect();
                        this.printer = null;
                        console.log('Disconnected from printer');
                        resolve(true);
                    });
                });
            } else {
                this.printer = null;
                console.log('Printer disconnected');
                return true;
            }
        } catch (error) {
            console.error('Disconnect failed:', error);
            this.printer = null;
            throw error;
        }
    }

    getPrinter() {
        return this.printer;
    }

    isConnected() {
        return this.printer !== null;
    }

    getEPosDev() {
        return this.ePosDev;
    }

    // Format currency for receipt
    formatCurrency(amount) {
        if (!amount && amount !== 0) return '0.00';
        return parseFloat(amount).toFixed(2);
    }

    // Format phone number with masking
    formatMaskedPhone(phone) {
        if (!phone) return 'N/A';
        
        // Remove any non-digit characters
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Handle different phone number formats
        if (cleanPhone.length >= 10) {
            // For Indian numbers (10 digits) or international (more than 10)
            if (cleanPhone.length === 10) {
                // Indian mobile: +919717XXX455
                return `+91${cleanPhone.substring(0, 4)}XXX${cleanPhone.substring(7)}`;
            } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
                // Already has country code: 919717XXX455
                return `+${cleanPhone.substring(0, 6)}XXX${cleanPhone.substring(9)}`;
            } else if (cleanPhone.length > 10) {
                // Other international formats
                const start = cleanPhone.substring(0, Math.min(6, cleanPhone.length - 3));
                const end = cleanPhone.substring(cleanPhone.length - 2);
                return `+${start}XXX${end}`;
            }
        }
        
        // Fallback for shorter numbers
        if (cleanPhone.length >= 6) {
            const start = cleanPhone.substring(0, 3);
            const end = cleanPhone.substring(cleanPhone.length - 2);
            return `${start}XXX${end}`;
        }
        
        return phone; // Return as-is if too short to mask
    }

    async printBillWithEposSDK(billData, openCashDrawer = true, onPrintSuccess = null, onPrintError = null) {
        if (!this.printer || !billData) {
            const error = new Error('Printer not connected or no bill data provided');
            if (onPrintError) onPrintError(error);
            throw error;
        }

        try {
            console.log('Starting print job with Official ePOS SDK');

            // Clear any previous commands
            this.printer.message = '';

            // TAX INVOICE Header
            this.printer.addTextAlign(this.printer.ALIGN_CENTER);
            this.printer.addTextSize(1, 1);
            this.printer.addText('TAX INVOICE');
            this.printer.addFeedLine(1);

            // Header - Business Info
            this.printer.addTextSize(2, 2);
            this.printer.addText(billData.unit?.unitName || billData.business?.name || 'ELEVATE LIFESTYLE');
            this.printer.addFeedLine(1);

            // Business details
            this.printer.addTextSize(1, 1);
            this.printer.addText(billData.unit?.address || billData.business?.address || 'Business Address');
            this.printer.addFeedLine(1);
            
            // Unit Code
            this.printer.addText(`Unit Code: ${billData.unit?.unitCode || 'N/A'}`);
            this.printer.addFeedLine(1);
            
            // Phone - prefer unit phone, fallback to business phone
            const phoneNumber = billData.unit?.phone || billData.business?.phone || 'Phone Number';
            this.printer.addText(`Ph: ${phoneNumber}`);
            this.printer.addFeedLine(1);

            // Email - prefer unit email, fallback to business email
            const emailAddress = billData.unit?.email || billData.business?.email;
            if (emailAddress) {
                this.printer.addText(`Email: ${emailAddress}`);
                this.printer.addFeedLine(1);
            }
            
            // GST Number
            if (billData.unit?.gst) {
                this.printer.addText(`GST: ${billData.unit.gst}`);
                this.printer.addFeedLine(1);
            }

            // Separator line
            this.printer.addText('----------------------------------------');
            this.printer.addFeedLine(1);

            // Bill details
            this.printer.addTextAlign(this.printer.ALIGN_LEFT);
            this.printer.addText(`Bill No: ${billData.billNumber}`);
            this.printer.addFeedLine(1);
            this.printer.addText(`Date: ${new Date(billData.timestamp).toLocaleDateString('en-IN')}`);
            this.printer.addFeedLine(1);
            this.printer.addText(`Time: ${new Date(billData.timestamp).toLocaleTimeString('en-IN')}`);
            this.printer.addFeedLine(2);

            // Client information
            if (billData.client) {
                console.log('Client data for printing:', billData.client);
                console.log('Client phone:', billData.client.phoneNumber);
                console.log('Client wallet balance:', billData.client.walletId?.balance);
                
                this.printer.addText('CLIENT DETAILS:');
                this.printer.addFeedLine(1);
                this.printer.addText(billData.client.name || 'N/A');
                this.printer.addFeedLine(1);
                
                // Masked phone number - check both phoneNumber and phone fields
                const clientPhone = billData.client.phoneNumber || billData.client.phone;
                if (clientPhone) {
                    const maskedPhone = this.formatMaskedPhone(clientPhone);
                    console.log('Masked phone:', maskedPhone);
                    this.printer.addText(`Ph: ${maskedPhone}`);
                    this.printer.addFeedLine(1);
                } else {
                    console.log('No phone number found in client data');
                    this.printer.addText('Ph: Not provided');
                    this.printer.addFeedLine(1);
                }
                
                // Wallet balance - show updated balance after wallet payment
                const originalWalletBalance = billData.client.walletId?.balance || billData.client.walletBalance || 0;
                const walletPayment = billData.payment?.methods?.wallet || 0;
                const updatedWalletBalance = Math.max(0, originalWalletBalance - walletPayment);
                
                if (walletPayment > 0) {
                    // Show wallet transaction details
                    this.printer.addText(`Wallet Balance: Rs.${this.formatCurrency(originalWalletBalance)} (Before)`);
                    this.printer.addFeedLine(1);
                    this.printer.addText(`Wallet Used: -Rs.${this.formatCurrency(walletPayment)}`);
                    this.printer.addFeedLine(1);
                    this.printer.addText(`Wallet Balance: Rs.${this.formatCurrency(updatedWalletBalance)} (After)`);
                    this.printer.addFeedLine(1);
                } else {
                    // No wallet payment, show current balance
                    this.printer.addText(`Wallet Balance: Rs.${this.formatCurrency(originalWalletBalance)}`);
                    this.printer.addFeedLine(1);
                }
                
                this.printer.addText('----------------------------------------');
                this.printer.addFeedLine(1);
            } else {
                console.log('No client data found in billData');
            }

            // Items section
            this.printer.addText('ITEMS:');
            this.printer.addFeedLine(1);

            // Services
            if (billData.services && billData.services.length > 0) {
                this.printer.addText('SERVICES:');
                this.printer.addFeedLine(1);
                billData.services.forEach(service => {
                    this.printer.addText(service.name);
                    this.printer.addFeedLine(1);
                    
                    // Show base price vs final price if there's a discount
                    if (service.pricing.basePrice > service.pricing.finalPrice) {
                        this.printer.addText(`${service.quantity} x Rs.${this.formatCurrency(service.pricing.basePrice)} = Rs.${this.formatCurrency(service.pricing.totalBasePrice)}`);
                        this.printer.addFeedLine(1);
                        this.printer.addText(`Discounted: ${service.quantity} x Rs.${this.formatCurrency(service.pricing.finalPrice)} = Rs.${this.formatCurrency(service.pricing.totalPrice)}`);
                        this.printer.addFeedLine(1);
                        this.printer.addText(`Savings: Rs.${this.formatCurrency(service.pricing.savings)}`);
                        this.printer.addFeedLine(1);
                    } else {
                        // No discount, show normal price
                        this.printer.addText(`${service.quantity} x Rs.${this.formatCurrency(service.pricing.finalPrice)} = Rs.${this.formatCurrency(service.pricing.totalPrice)}`);
                        this.printer.addFeedLine(1);
                    }
                    
                    if (service.staff && service.staff.name) {
                        this.printer.addText(`Staff: ${service.staff.name}`);
                        this.printer.addFeedLine(1);
                    }
                });
            }

            // Products
            if (billData.products && billData.products.length > 0) {
                this.printer.addText('PRODUCTS:');
                this.printer.addFeedLine(1);
                billData.products.forEach(product => {
                    this.printer.addText(product.name);
                    this.printer.addFeedLine(1);
                    
                    // Show base price vs final price if there's a discount
                    if (product.pricing.basePrice > product.pricing.finalPrice) {
                        this.printer.addText(`${product.quantity} x Rs.${this.formatCurrency(product.pricing.basePrice)} = Rs.${this.formatCurrency(product.pricing.totalBasePrice)}`);
                        this.printer.addFeedLine(1);
                        this.printer.addText(`Discounted: ${product.quantity} x Rs.${this.formatCurrency(product.pricing.finalPrice)} = Rs.${this.formatCurrency(product.pricing.totalPrice)}`);
                        this.printer.addFeedLine(1);
                        this.printer.addText(`Savings: Rs.${this.formatCurrency(product.pricing.savings)}`);
                        this.printer.addFeedLine(1);
                    } else {
                        // No discount, show normal price
                        this.printer.addText(`${product.quantity} x Rs.${this.formatCurrency(product.pricing.finalPrice)} = Rs.${this.formatCurrency(product.pricing.totalPrice)}`);
                        this.printer.addFeedLine(1);
                    }
                    
                    if (product.staff && product.staff.name) {
                        this.printer.addText(`Staff: ${product.staff.name}`);
                        this.printer.addFeedLine(1);
                    }
                });
            }

            // Memberships
            if (billData.newMemberships && billData.newMemberships.length > 0) {
                this.printer.addText('MEMBERSHIPS:');
                this.printer.addFeedLine(1);
                billData.newMemberships.forEach(membership => {
                    this.printer.addText(membership.name);
                    this.printer.addFeedLine(1);
                    this.printer.addText(`1 x Rs.${this.formatCurrency(membership.pricing.finalPrice)}`);
                    this.printer.addFeedLine(1);
                });
            }

            // Totals
            this.printer.addText('----------------------------------------');
            this.printer.addFeedLine(1);
            
            // Show base subtotal first (before any discounts)
            this.printer.addText(`Subtotal: Rs.${this.formatCurrency(billData.calculations?.totals?.subtotalBeforeDiscount)}`);
            this.printer.addFeedLine(1);

            // Show item discounts (membership/service level discounts)
            if (billData.calculations?.totals?.totalItemDiscount > 0) {
                this.printer.addText(`Item Discounts: -Rs.${this.formatCurrency(billData.calculations.totals.totalItemDiscount)}`);
                this.printer.addFeedLine(1);
            }

            // Show coupon discount separately
            if (billData.appliedCoupon && billData.calculations?.totals?.couponDiscount > 0) {
                this.printer.addText(`Coupon (${billData.appliedCoupon.code}): -Rs.${this.formatCurrency(billData.calculations.totals.couponDiscount)}`);
                this.printer.addFeedLine(1);
            }
            
            // Show net amount after all discounts (if different from grand total due to rounding)
            if (billData.calculations?.totals?.subtotalAfterCoupon !== billData.calculations?.totals?.grandTotal) {
                this.printer.addText(`Net Amount: Rs.${this.formatCurrency(billData.calculations?.totals?.subtotalAfterCoupon)}`);
                this.printer.addFeedLine(1);
            }
            
            // GST calculation and display - only if prices are exclusive of taxes
            if (billData.unit?.priceAreInclusiveTaxes === false && billData.unit?.gstPercentage) {
                const gstPercentage = billData.unit.gstPercentage;
                const netAmount = billData.calculations?.totals?.subtotalAfterCoupon || billData.calculations?.totals?.grandTotal;
                const gstAmount = (netAmount * gstPercentage) / 100;
                const totalWithGst = netAmount + gstAmount;

                this.printer.addText(`GST (${gstPercentage}%): Rs.${this.formatCurrency(gstAmount)}`);
                this.printer.addFeedLine(1);
                this.printer.addText(`Total with GST: Rs.${this.formatCurrency(totalWithGst)}`);
                this.printer.addFeedLine(1);
            } else if (billData.unit?.priceAreInclusiveTaxes !== false) {
                // Show inclusive tax message when taxes are included in prices
                this.printer.addText('* Prices are inclusive of taxes');
                this.printer.addFeedLine(1);
            }

            // Round off display
            if (billData.calculations?.totals?.roundOffAmount && Math.abs(billData.calculations.totals.roundOffAmount) >= 0.01) {
                const roundOffAmount = billData.calculations.totals.roundOffAmount;
                this.printer.addText(`Round Off: ${roundOffAmount >= 0 ? '+' : ''}Rs.${this.formatCurrency(Math.abs(roundOffAmount))}`);
                this.printer.addFeedLine(1);
            }

            // Grand total - calculate final total based on GST settings and round off
            let finalTotal = billData.calculations?.totals?.grandTotal;
            
            // For bills with GST calculation, we need to recalculate the final total
            if (billData.unit?.priceAreInclusiveTaxes === false && billData.unit?.gstPercentage) {
                const gstPercentage = billData.unit.gstPercentage;
                const netAmount = billData.calculations?.totals?.subtotalAfterCoupon || billData.calculations?.totals?.grandTotal;
                const gstAmount = (netAmount * gstPercentage) / 100;
                let totalWithGst = netAmount + gstAmount;
                
                // Add round off if present
                if (billData.calculations?.totals?.roundOffAmount) {
                    totalWithGst += billData.calculations.totals.roundOffAmount;
                }
                
                finalTotal = totalWithGst;
            } else {
                // For bills without GST, the grandTotal already includes round off
                finalTotal = billData.calculations?.totals?.grandTotal;
            }
            
            this.printer.addText('========================================');
            this.printer.addFeedLine(1);
            this.printer.addTextAlign(this.printer.ALIGN_CENTER);
            this.printer.addTextSize(2, 2);
            this.printer.addText(`TOTAL: Rs.${this.formatCurrency(finalTotal)}`);
            this.printer.addFeedLine(1);
            this.printer.addText('========================================');
            this.printer.addFeedLine(1);

            // Payment details
            this.printer.addTextAlign(this.printer.ALIGN_LEFT);
            this.printer.addTextSize(1, 1);
            this.printer.addText('PAYMENT DETAILS:');
            this.printer.addFeedLine(1);
            
            // Calculate total paid and change
            let totalPaid = 0;
            billData.payment?.activePaymentMethods?.forEach(payment => {
                totalPaid += payment.amount;
                this.printer.addText(`${payment.method}: Rs.${this.formatCurrency(payment.amount)}`);
                this.printer.addFeedLine(1);
            });
            
            // Show total paid
            this.printer.addText(`Total Paid: Rs.${this.formatCurrency(totalPaid)}`);
            this.printer.addFeedLine(1);
            
            this.printer.addText(`Status: ${billData.payment?.paymentStatus}`);
            this.printer.addFeedLine(1);
            
            // Calculate and show change/return amount
            const billTotal = finalTotal;
            const changeAmount = totalPaid > billTotal ? totalPaid - billTotal : 0;
            
            if (changeAmount > 0) {
                this.printer.addText('----------------------------------------');
                this.printer.addFeedLine(1);
                this.printer.addTextAlign(this.printer.ALIGN_CENTER);
                this.printer.addTextSize(1, 2);
                this.printer.addText(`CHANGE RETURNED: Rs.${this.formatCurrency(changeAmount)}`);
                this.printer.addFeedLine(1);
                this.printer.addText('----------------------------------------');
                this.printer.addFeedLine(1);
                this.printer.addTextAlign(this.printer.ALIGN_LEFT);
                this.printer.addTextSize(1, 1);
            }
            
            // Legacy return to client field (if exists)
            if (billData.payment?.returnToClient && billData.payment.returnToClient > 0) {
                this.printer.addText(`Return to Client: Rs.${this.formatCurrency(billData.payment.returnToClient)}`);
                this.printer.addFeedLine(1);
            }
            this.printer.addFeedLine(1);

            // Footer
            this.printer.addTextAlign(this.printer.ALIGN_CENTER);
            this.printer.addText('Thank you for your visit!');
            this.printer.addFeedLine(1);
            this.printer.addText('Please visit again');
            this.printer.addFeedLine(2);
            this.printer.addText('Powered by Elevate Panel');
            this.printer.addFeedLine(1);
            this.printer.addText(`Transaction ID: ${billData.transactionId}`);
            this.printer.addFeedLine(3);

            // AUTOMATIC PAPER CUT with FEED
            this.printer.addCut(this.printer.CUT_FEED);

            // Note: Cash drawer opening is now handled by CashModal component
            // No automatic drawer opening during bill printing to avoid duplicate openings
            if (openCashDrawer) {
                console.log('Cash drawer opening requested but skipped - handled by CashModal');
            }

            // Send to printer
            console.log('Sending print job to printer...');
            this.printer.send();

            // Success callback will be handled by printer.onreceive event
            return { success: true, message: 'Print job sent successfully' };

        } catch (error) {
            console.error('Print failed:', error);
            const errorMessage = `Print failed: ${error.message}`;
            if (onPrintError) {
                onPrintError(new Error(errorMessage));
            }
            throw new Error(errorMessage);
        }
    }

    async printBillWithXmlAPI(billData, printerIp, openCashDrawer = true, onPrintSuccess = null, onPrintError = null) {
        if (!billData) {
            const error = new Error('No bill data provided');
            if (onPrintError) onPrintError(error);
            throw error;
        }

        try {
            // Create XML for ePOS-Print API
            const phoneNumber = billData.unit?.phone || billData.business?.phone || 'Phone Number';
            const emailAddress = billData.unit?.email || billData.business?.email;
            const gstNumber = billData.unit?.gst;
            
            const xml = `<?xml version="1.0" encoding="utf-8"?>
<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
    <text align="center" width="1" height="1">TAX INVOICE</text>
    <feed line="1"/>
    <text align="center" width="2" height="2">${billData.unit?.unitName || billData.business?.name || 'ELEVATE LIFESTYLE'}</text>
    <feed line="1"/>
    <text align="center">${billData.unit?.address || billData.business?.address || 'Business Address'}</text>
    <feed line="1"/>
    <text align="center">Unit Code: ${billData.unit?.unitCode || 'N/A'}</text>
    <feed line="1"/>
    <text align="center">Ph: ${phoneNumber}</text>
    <feed line="1"/>
    ${emailAddress ? `<text align="center">Email: ${emailAddress}</text><feed line="1"/>` : ''}
    ${gstNumber ? `<text align="center">GST: ${gstNumber}</text><feed line="1"/>` : ''}
    <text>----------------------------------------</text>
    <feed line="1"/>
    <text>Bill No: ${billData.billNumber}</text>
    <feed line="1"/>
    <text>Date: ${new Date(billData.timestamp).toLocaleDateString('en-IN')}</text>
    <feed line="1"/>
    <text>Time: ${new Date(billData.timestamp).toLocaleTimeString('en-IN')}</text>
    <feed line="2"/>
    ${billData.client ? (() => {
        console.log('XML API - Client data:', billData.client);
        const clientPhone = billData.client.phoneNumber || billData.client.phone;
        console.log('XML API - Client phone:', clientPhone);
        const maskedPhone = clientPhone ? this.formatMaskedPhone(clientPhone) : 'Not provided';
        console.log('XML API - Masked phone:', maskedPhone);
        return `
    <text>CLIENT DETAILS:</text>
    <feed line="1"/>
    <text>${billData.client.name || 'N/A'}</text>
    <feed line="1"/>
    <text>Ph: ${maskedPhone}</text>
    <feed line="1"/>
    ${(() => {
        const originalWalletBalance = billData.client.walletId?.balance || billData.client.walletBalance || 0;
        const walletPayment = billData.payment?.methods?.wallet || 0;
        const updatedWalletBalance = Math.max(0, originalWalletBalance - walletPayment);
        
        if (walletPayment > 0) {
            return `
    <text>Wallet Balance: Rs.${this.formatCurrency(originalWalletBalance)} (Before)</text>
    <feed line="1"/>
    <text>Wallet Used: -Rs.${this.formatCurrency(walletPayment)}</text>
    <feed line="1"/>
    <text>Wallet Balance: Rs.${this.formatCurrency(updatedWalletBalance)} (After)</text>
    <feed line="1"/>
    `;
        } else {
            return `
    <text>Wallet Balance: Rs.${this.formatCurrency(originalWalletBalance)}</text>
    <feed line="1"/>
    `;
        }
    })()}
    <text>----------------------------------------</text>
    <feed line="1"/>
    `;
    })() : ''}
    <text>ITEMS:</text>
    <feed line="1"/>
    ${billData.services ? billData.services.map(service => `
    <text>${service.name}</text>
    <feed line="1"/>
    ${service.pricing.basePrice > service.pricing.finalPrice ? `
    <text>${service.quantity} x Rs.${this.formatCurrency(service.pricing.basePrice)} = Rs.${this.formatCurrency(service.pricing.totalBasePrice)}</text>
    <feed line="1"/>
    <text>Discounted: ${service.quantity} x Rs.${this.formatCurrency(service.pricing.finalPrice)} = Rs.${this.formatCurrency(service.pricing.totalPrice)}</text>
    <feed line="1"/>
    <text>Savings: Rs.${this.formatCurrency(service.pricing.savings)}</text>
    <feed line="1"/>
    ` : `
    <text>${service.quantity} x Rs.${this.formatCurrency(service.pricing.finalPrice)} = Rs.${this.formatCurrency(service.pricing.totalPrice)}</text>
    <feed line="1"/>
    `}
    ${service.staff && service.staff.name ? `<text>Staff: ${service.staff.name}</text><feed line="1"/>` : ''}
    `).join('') : ''}
    ${billData.products ? billData.products.map(product => `
    <text>${product.name}</text>
    <feed line="1"/>
    ${product.pricing.basePrice > product.pricing.finalPrice ? `
    <text>${product.quantity} x Rs.${this.formatCurrency(product.pricing.basePrice)} = Rs.${this.formatCurrency(product.pricing.totalBasePrice)}</text>
    <feed line="1"/>
    <text>Discounted: ${product.quantity} x Rs.${this.formatCurrency(product.pricing.finalPrice)} = Rs.${this.formatCurrency(product.pricing.totalPrice)}</text>
    <feed line="1"/>
    <text>Savings: Rs.${this.formatCurrency(product.pricing.savings)}</text>
    <feed line="1"/>
    ` : `
    <text>${product.quantity} x Rs.${this.formatCurrency(product.pricing.finalPrice)} = Rs.${this.formatCurrency(product.pricing.totalPrice)}</text>
    <feed line="1"/>
    `}
    ${product.staff && product.staff.name ? `<text>Staff: ${product.staff.name}</text><feed line="1"/>` : ''}
    `).join('') : ''}
    <text>----------------------------------------</text>
    <feed line="1"/>
    <text>Subtotal: Rs.${this.formatCurrency(billData.calculations?.totals?.subtotalBeforeDiscount)}</text>
    <feed line="1"/>
    ${billData.calculations?.totals?.totalItemDiscount > 0 ? `
    <text>Item Discounts: -Rs.${this.formatCurrency(billData.calculations.totals.totalItemDiscount)}</text>
    <feed line="1"/>
    ` : ''}
    ${billData.appliedCoupon && billData.calculations?.totals?.couponDiscount > 0 ? `
    <text>Coupon (${billData.appliedCoupon.code}): -Rs.${this.formatCurrency(billData.calculations.totals.couponDiscount)}</text>
    <feed line="1"/>
    ` : ''}
    ${billData.calculations?.totals?.subtotalAfterCoupon !== billData.calculations?.totals?.grandTotal ? `
    <text>Net Amount: Rs.${this.formatCurrency(billData.calculations?.totals?.subtotalAfterCoupon)}</text>
    <feed line="1"/>
    ` : ''}
    ${billData.unit?.priceAreInclusiveTaxes === false && billData.unit?.gstPercentage ? (() => {
        const gstPercentage = billData.unit.gstPercentage;
        const netAmount = billData.calculations?.totals?.subtotalAfterCoupon || billData.calculations?.totals?.grandTotal;
        const gstAmount = (netAmount * gstPercentage) / 100;
        const totalWithGst = netAmount + gstAmount;
        return `
    <text>GST (${gstPercentage}%): Rs.${this.formatCurrency(gstAmount)}</text>
    <feed line="1"/>
    <text>Total with GST: Rs.${this.formatCurrency(totalWithGst)}</text>
    <feed line="1"/>
    `;
    })() : (billData.unit?.priceAreInclusiveTaxes !== false ? `
    <text>* Prices are inclusive of taxes</text>
    <feed line="1"/>
    ` : '')}
    ${billData.calculations?.totals?.roundOffAmount && Math.abs(billData.calculations.totals.roundOffAmount) >= 0.01 ? (() => {
        const roundOffAmount = billData.calculations.totals.roundOffAmount;
        return `
    <text>Round Off: ${roundOffAmount >= 0 ? '+' : ''}Rs.${this.formatCurrency(Math.abs(roundOffAmount))}</text>
    <feed line="1"/>
    `;
    })() : ''}
    <text>========================================</text>
    <feed line="1"/>
    <text align="center" width="2" height="2">TOTAL: Rs.${(() => {
        let finalTotal = billData.calculations?.totals?.grandTotal;
        
        // For bills with GST calculation, we need to recalculate the final total
        if (billData.unit?.priceAreInclusiveTaxes === false && billData.unit?.gstPercentage) {
            const gstPercentage = billData.unit.gstPercentage;
            const netAmount = billData.calculations?.totals?.subtotalAfterCoupon || billData.calculations?.totals?.grandTotal;
            const gstAmount = (netAmount * gstPercentage) / 100;
            let totalWithGst = netAmount + gstAmount;
            
            // Add round off if present
            if (billData.calculations?.totals?.roundOffAmount) {
                totalWithGst += billData.calculations.totals.roundOffAmount;
            }
            
            finalTotal = totalWithGst;
        } else {
            // For bills without GST, the grandTotal already includes round off
            finalTotal = billData.calculations?.totals?.grandTotal;
        }
        
        return this.formatCurrency(finalTotal);
    })()}</text>
    <feed line="1"/>
    <text>========================================</text>
    <feed line="1"/>
    <text>PAYMENT DETAILS:</text>
    <feed line="1"/>
    ${billData.payment?.activePaymentMethods?.map(payment => `
    <text>${payment.method}: Rs.${this.formatCurrency(payment.amount)}</text>
    <feed line="1"/>
    `).join('') || ''}
    ${(() => {
        const totalPaid = billData.payment?.activePaymentMethods?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        return `<text>Total Paid: Rs.${this.formatCurrency(totalPaid)}</text><feed line="1"/>`;
    })()}
    <text>Status: ${billData.payment?.paymentStatus || 'N/A'}</text>
    <feed line="1"/>
    ${(() => {
        const totalPaid = billData.payment?.activePaymentMethods?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
        let finalTotal = billData.calculations?.totals?.grandTotal;
        
        // For bills with GST calculation, we need to recalculate the final total
        if (billData.unit?.priceAreInclusiveTaxes === false && billData.unit?.gstPercentage) {
            const gstPercentage = billData.unit.gstPercentage;
            const netAmount = billData.calculations?.totals?.subtotalAfterCoupon || billData.calculations?.totals?.grandTotal;
            const gstAmount = (netAmount * gstPercentage) / 100;
            let totalWithGst = netAmount + gstAmount;
            
            // Add round off if present
            if (billData.calculations?.totals?.roundOffAmount) {
                totalWithGst += billData.calculations.totals.roundOffAmount;
            }
            
            finalTotal = totalWithGst;
        }
        
        const changeAmount = totalPaid > finalTotal ? totalPaid - finalTotal : 0;
        
        if (changeAmount > 0) {
            return `
    <text>----------------------------------------</text>
    <feed line="1"/>
    <text align="center" width="1" height="2">CHANGE RETURNED: Rs.${this.formatCurrency(changeAmount)}</text>
    <feed line="1"/>
    <text>----------------------------------------</text>
    <feed line="1"/>
    `;
        }
        return '';
    })()}
    ${billData.payment?.returnToClient && billData.payment.returnToClient > 0 ? `
    <text>Return to Client: Rs.${this.formatCurrency(billData.payment.returnToClient)}</text>
    <feed line="1"/>
    ` : ''}
    <feed line="1"/>
    <text align="center">Thank you for your visit!</text>
    <feed line="1"/>
    <text align="center">Please visit again</text>
    <feed line="2"/>
    <text align="center">Powered by Elevate Panel</text>
    <feed line="1"/>
    <text align="center">ID: ${billData.transactionId}</text>
    <feed line="3"/>
    <cut type="partial"/>
    ${openCashDrawer ? '<!-- Cash drawer opening skipped - handled by CashModal -->' : ''}
</epos-print>`;

            // Send to printer via ePOS-Print API
            const { ip, port } = this.parseIpAndPort(printerIp);
            const printUrl = port === 9100 ? `http://${ip}/epos/print` : `http://${ip}:${port}/epos/print`;

            const response = await fetch(printUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': ''
                },
                body: xml,
                mode: 'no-cors'
            });

            console.log('Print job sent successfully to printer');
            
            // Simulate success since no-cors doesn't allow response reading
            setTimeout(() => {
                if (onPrintSuccess) {
                    onPrintSuccess();
                }
            }, 1500);

            return { success: true, message: 'Print job sent via XML API' };

        } catch (error) {
            console.error('XML API print failed:', error);
            const errorMessage = `Print failed: ${error.message}`;
            if (onPrintError) {
                onPrintError(new Error(errorMessage));
            }
            throw new Error(errorMessage);
        }
    }

    async printBill(billData, printerIp, openCashDrawer = true, onPrintSuccess = null, onPrintError = null) {
        if (!this.isConnected()) {
            const error = new Error('Printer not connected. Please connect to printer first.');
            if (onPrintError) onPrintError(error);
            throw error;
        }

        try {
            // Try SDK method first (when available), fallback to XML API
            if (this.printer) {
                return await this.printBillWithEposSDK(billData, openCashDrawer, onPrintSuccess, onPrintError);
            } else {
                return await this.printBillWithXmlAPI(billData, printerIp, openCashDrawer, onPrintSuccess, onPrintError);
            }
        } catch (error) {
            console.error('Print function failed:', error);
            if (onPrintError) {
                onPrintError(error);
            }
            throw error;
        }
    }
}

const printerConfig = new PrinterConfig();

export default printerConfig;
export { PrinterConfig };