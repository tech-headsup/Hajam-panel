import React from 'react';

function PrintableBill({ billData, onPrint }) {
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0.00';
        return parseFloat(amount).toFixed(2);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const printBill = () => {
        const printWindow = window.open('', '_blank');
        const printContent = document.getElementById('printable-bill').innerHTML;
        
        // ESC/POS commands for Epson TM-30III
        const escPosCommands = {
            // Paper cut command (full cut)
            paperCut: '\x1B\x69', // ESC i - Full cut
            // Alternative paper cut commands you can try:
            // paperCutPartial: '\x1B\x6D', // ESC m - Partial cut
            // paperCutFeed: '\x1D\x56\x00', // GS V 0 - Full cut
            // paperCutFeedPartial: '\x1D\x56\x01', // GS V 1 - Partial cut
            
            // Initialize printer
            initialize: '\x1B\x40', // ESC @ - Initialize printer
            
            // Feed lines before cut
            lineFeed: '\x0A\x0A\x0A\x0A\x0A', // 5 line feeds for spacing
        };
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bill - ${billData.billNumber}</title>
                <style>
                    /* Epson TM-30III Thermal Printer Optimized Styles */
                    @media print {
                        @page {
                            size: 80mm auto;
                            margin: 0;
                            padding: 0;
                        }
                        
                        body {
                            margin: 0;
                            padding: 2mm;
                            font-family: 'Courier New', monospace;
                            font-size: 11px;
                            line-height: 1.2;
                            color: #000;
                            background: #fff;
                            width: 76mm;
                        }
                        
                        .bill-container {
                            width: 100%;
                            max-width: 76mm;
                        }
                        
                        .center {
                            text-align: center;
                        }
                        
                        .left {
                            text-align: left;
                        }
                        
                        .right {
                            text-align: right;
                        }
                        
                        .bold {
                            font-weight: bold;
                        }
                        
                        .large {
                            font-size: 14px;
                            font-weight: bold;
                        }
                        
                        .medium {
                            font-size: 12px;
                        }
                        
                        .small {
                            font-size: 10px;
                        }
                        
                        .header {
                            border-bottom: 1px dashed #000;
                            padding-bottom: 2mm;
                            margin-bottom: 2mm;
                        }
                        
                        .section {
                            margin: 2mm 0;
                        }
                        
                        .line {
                            border-bottom: 1px dashed #000;
                            margin: 1mm 0;
                        }
                        
                        .double-line {
                            border-bottom: 2px solid #000;
                            margin: 2mm 0;
                        }
                        
                        .row {
                            display: flex;
                            justify-content: space-between;
                            margin: 1mm 0;
                        }
                        
                        .item-row {
                            display: block;
                            margin: 1mm 0;
                        }
                        
                        .item-name {
                            display: block;
                            margin-bottom: 0.5mm;
                        }
                        
                        .item-details {
                            display: flex;
                            justify-content: space-between;
                            font-size: 10px;
                        }
                        
                        .total-section {
                            border-top: 1px dashed #000;
                            padding-top: 2mm;
                            margin-top: 2mm;
                        }
                        
                        .grand-total {
                            border-top: 2px solid #000;
                            border-bottom: 2px solid #000;
                            padding: 1mm 0;
                            margin: 2mm 0;
                            font-size: 14px;
                            font-weight: bold;
                        }
                        
                        .footer {
                            border-top: 1px dashed #000;
                            padding-top: 2mm;
                            margin-top: 3mm;
                            margin-bottom: 10mm;
                            text-align: center;
                            page-break-after: always;
                        }
                        
                        /* Paper cutting specific styles */
                        .paper-cut {
                            height: 5mm;
                            page-break-after: always;
                        }
                        
                        /* Force paper feed and cut for thermal printers */
                        .bill-container::after {
                            content: "";
                            display: block;
                            height: 5mm;
                            page-break-after: always;
                        }
                        
                        /* Hide non-printable elements */
                        .no-print {
                            display: none !important;
                        }
                    }
                    
                    /* Screen styles for preview */
                    body {
                        font-family: 'Courier New', monospace;
                        margin: 0;
                        padding: 10px;
                        background: #f5f5f5;
                    }
                    
                    .bill-container {
                        width: 80mm;
                        background: white;
                        padding: 5mm;
                        margin: 0 auto;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        font-size: 11px;
                        line-height: 1.2;
                    }
                    
                    .center { text-align: center; }
                    .left { text-align: left; }
                    .right { text-align: right; }
                    .bold { font-weight: bold; }
                    .large { font-size: 14px; font-weight: bold; }
                    .medium { font-size: 12px; }
                    .small { font-size: 10px; }
                    
                    .header {
                        border-bottom: 1px dashed #000;
                        padding-bottom: 2mm;
                        margin-bottom: 2mm;
                    }
                    
                    .section { margin: 2mm 0; }
                    .line { border-bottom: 1px dashed #000; margin: 1mm 0; }
                    .double-line { border-bottom: 2px solid #000; margin: 2mm 0; }
                    
                    .row {
                        display: flex;
                        justify-content: space-between;
                        margin: 1mm 0;
                    }
                    
                    .item-row {
                        display: block;
                        margin: 1mm 0;
                    }
                    
                    .item-name {
                        display: block;
                        margin-bottom: 0.5mm;
                    }
                    
                    .item-details {
                        display: flex;
                        justify-content: space-between;
                        font-size: 10px;
                    }
                    
                    .total-section {
                        border-top: 1px dashed #000;
                        padding-top: 2mm;
                        margin-top: 2mm;
                    }
                    
                    .grand-total {
                        border-top: 2px solid #000;
                        border-bottom: 2px solid #000;
                        padding: 1mm 0;
                        margin: 2mm 0;
                        font-size: 14px;
                        font-weight: bold;
                    }
                    
                    .footer {
                        border-top: 1px dashed #000;
                        padding-top: 2mm;
                        margin-top: 3mm;
                        text-align: center;
                    }
                </style>
            </head>
            <body>
                ${printContent}
                
                <!-- Paper Cut Commands for Epson TM-30III -->
                <div style="display: none;" class="cut-commands">
                    ${escPosCommands.lineFeed}
                    ${escPosCommands.paperCut}
                </div>
                
                <script>
                    // Send ESC/POS commands after content loads
                    window.addEventListener('load', function() {
                        // Try to send paper cut command via direct printer communication
                        try {
                            // Method 1: Using raw printing if available
                            if (window.qz && window.qz.websocket) {
                                // QZ Tray integration for direct ESC/POS commands
                                window.qz.websocket.connect().then(function() {
                                    var config = window.qz.configs.create("${billData.business?.name || 'Epson TM-30III'}");
                                    var data = [
                                        '${escPosCommands.initialize}', // Initialize
                                        // Bill content would be here
                                        '${escPosCommands.lineFeed}', // Feed paper
                                        '${escPosCommands.paperCut}' // Cut paper
                                    ];
                                    return window.qz.print(config, data);
                                });
                            }
                        } catch (e) {
                            console.log('Direct ESC/POS commands not available, using standard print');
                        }
                    });
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        // Auto-print after a short delay with enhanced paper cutting
        setTimeout(() => {
            // Add printer-specific settings for Epson TM-30III
            if (printWindow.navigator.userAgent.indexOf('Chrome') > -1) {
                // Chrome-specific print settings for thermal printers
                const printSettings = {
                    shouldPrintBackgrounds: true,
                    shouldPrintSelectionOnly: false,
                    mediaSize: {
                        width_microns: 80000, // 80mm
                        height_microns: 0      // Auto height
                    },
                    marginsType: 0, // NO_MARGINS
                    scalingType: 0, // DEFAULT
                    shouldPrintHeadersAndFooters: false
                };
                
                try {
                    // Try to set print parameters if supported
                    if (printWindow.chrome && printWindow.chrome.webstore) {
                        printWindow.print = () => {
                            printWindow.chrome.webstore.install(undefined, 
                                () => printWindow.print(),
                                () => printWindow.print()
                            );
                        };
                    }
                } catch (e) {
                    console.log('Advanced print settings not available');
                }
            }
            
            printWindow.print();
            
            // Close window after printing
            setTimeout(() => {
                printWindow.close();
            }, 1000);
        }, 500);
        
        if (onPrint) {
            onPrint();
        }
    };

    if (!billData) return null;

    return (
        <div>
            {/* Print Button */}
            <div className="no-print mb-4 text-center">
                <button
                    onClick={printBill}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    🖨️ Print Bill
                </button>
            </div>

            {/* Printable Bill Content */}
            <div id="printable-bill" className="bill-container">
                {/* Header */}
                <div className="header">
                    <div className="center medium">TAX INVOICE</div>
                    <div className="center large">{billData.business?.name || 'ELEVATE LIFESTYLE'}</div>
                    <div className="center small">{billData.business?.address || 'Business Address'}</div>
                    <div className="center small">Ph: {billData.business?.phone || 'Phone Number'}</div>
                    {billData.business?.email && (
                        <div className="center small">Email: {billData.business.email}</div>
                    )}
                    {billData.business?.taxId && (
                        <div className="center small">GST: {billData.business.taxId}</div>
                    )}
                </div>

                {/* Bill Details */}
                <div className="section">
                    <div className="row">
                        <span>Bill No:</span>
                        <span className="bold">{billData.billNumber}</span>
                    </div>
                    <div className="row">
                        <span>Date:</span>
                        <span>{formatDate(billData.timestamp)}</span>
                    </div>
                    <div className="row">
                        <span>Time:</span>
                        <span>{formatTime(billData.timestamp)}</span>
                    </div>
                </div>

                {/* Client Information */}
                {billData.client && (
                    <div className="section">
                        <div className="line"></div>
                        <div className="bold">CLIENT DETAILS:</div>
                        <div>{billData.client.name}</div>
                        {billData.client.phone && <div>Ph: {billData.client.phone}</div>}
                        {billData.client.clientType && <div>Type: {billData.client.clientType}</div>}
                    </div>
                )}

                <div className="line"></div>

                {/* Items Section */}
                <div className="section">
                    <div className="bold">ITEMS:</div>
                    
                    {/* Services */}
                    {billData.services && billData.services.length > 0 && (
                        <>
                            <div className="small bold">SERVICES:</div>
                            {billData.services.map((service, index) => (
                                <div key={index} className="item-row">
                                    <div className="item-name">{service.name}</div>
                                    <div className="item-details">
                                        <span>{service.quantity} x ₹{formatCurrency(service.pricing.finalPrice)}</span>
                                        <span>₹{formatCurrency(service.pricing.totalPrice)}</span>
                                    </div>
                                    {service.staff && (
                                        <div className="small">Staff: {service.staff.name}</div>
                                    )}
                                    {service.discount.amount > 0 && (
                                        <div className="small">Discount: -₹{formatCurrency(service.discount.amount)} ({service.discount.source})</div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {/* Products */}
                    {billData.products && billData.products.length > 0 && (
                        <>
                            <div className="small bold">PRODUCTS:</div>
                            {billData.products.map((product, index) => (
                                <div key={index} className="item-row">
                                    <div className="item-name">{product.name}</div>
                                    <div className="item-details">
                                        <span>{product.quantity} x ₹{formatCurrency(product.pricing.finalPrice)}</span>
                                        <span>₹{formatCurrency(product.pricing.totalPrice)}</span>
                                    </div>
                                    {product.brand && (
                                        <div className="small">Brand: {product.brand}</div>
                                    )}
                                    {product.staff && (
                                        <div className="small">Staff: {product.staff.name}</div>
                                    )}
                                    {product.discount.amount > 0 && (
                                        <div className="small">Discount: -₹{formatCurrency(product.discount.amount)}</div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {/* Memberships */}
                    {billData.newMemberships && billData.newMemberships.length > 0 && (
                        <>
                            <div className="small bold">MEMBERSHIPS:</div>
                            {billData.newMemberships.map((membership, index) => (
                                <div key={index} className="item-row">
                                    <div className="item-name">{membership.name}</div>
                                    <div className="item-details">
                                        <span>1 x ₹{formatCurrency(membership.pricing.finalPrice)}</span>
                                        <span>₹{formatCurrency(membership.pricing.finalPrice)}</span>
                                    </div>
                                    {membership.duration && (
                                        <div className="small">Duration: {membership.duration.value} {membership.duration.unit}</div>
                                    )}
                                    {membership.staff && (
                                        <div className="small">Staff: {membership.staff.name}</div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Totals Section */}
                <div className="total-section">
                    {/* Subtotals */}
                    {billData.calculations?.items?.services?.finalTotal > 0 && (
                        <div className="row">
                            <span>Services Total:</span>
                            <span>₹{formatCurrency(billData.calculations.items.services.finalTotal)}</span>
                        </div>
                    )}
                    {billData.calculations?.items?.products?.finalTotal > 0 && (
                        <div className="row">
                            <span>Products Total:</span>
                            <span>₹{formatCurrency(billData.calculations.items.products.finalTotal)}</span>
                        </div>
                    )}
                    {billData.calculations?.items?.memberships?.finalTotal > 0 && (
                        <div className="row">
                            <span>Memberships Total:</span>
                            <span>₹{formatCurrency(billData.calculations.items.memberships.finalTotal)}</span>
                        </div>
                    )}

                    <div className="row">
                        <span>Subtotal:</span>
                        <span>₹{formatCurrency(billData.calculations?.totals?.subtotalAfterItemDiscount)}</span>
                    </div>

                    {/* Discounts */}
                    {billData.calculations?.totals?.totalItemDiscount > 0 && (
                        <div className="row">
                            <span>Item Discounts:</span>
                            <span>-₹{formatCurrency(billData.calculations.totals.totalItemDiscount)}</span>
                        </div>
                    )}

                    {billData.appliedCoupon && billData.calculations?.totals?.couponDiscount > 0 && (
                        <div className="row">
                            <span>Coupon ({billData.appliedCoupon.code}):</span>
                            <span>-₹{formatCurrency(billData.calculations.totals.couponDiscount)}</span>
                        </div>
                    )}

                    {billData.calculations?.totals?.totalSavings > 0 && (
                        <div className="row small">
                            <span>Total Savings:</span>
                            <span>₹{formatCurrency(billData.calculations.totals.totalSavings)}</span>
                        </div>
                    )}

                    {/* Tax inclusive message */}
                    {billData.unit?.priceAreInclusiveTaxes !== false && (
                        <div className="row small">
                            <span style={{fontStyle: 'italic'}}>* Prices are inclusive of taxes</span>
                        </div>
                    )}

                    {/* Grand Total */}
                    <div className="grand-total">
                        <div className="row">
                            <span>TOTAL:</span>
                            <span>₹{formatCurrency(billData.calculations?.totals?.grandTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="section">
                    <div className="bold">PAYMENT DETAILS:</div>
                    {billData.payment?.activePaymentMethods?.map((payment, index) => (
                        <div key={index} className="row">
                            <span>{payment.method}:</span>
                            <span>₹{formatCurrency(payment.amount)}</span>
                        </div>
                    ))}
                    <div className="row bold">
                        <span>Total Paid:</span>
                        <span>₹{formatCurrency(billData.payment?.totalPaid)}</span>
                    </div>
                    <div className="row">
                        <span>Payment Status:</span>
                        <span>{billData.payment?.paymentStatus}</span>
                    </div>
                </div>

                {/* Selected Membership Info */}
                {billData.selectedMembership && (
                    <div className="section">
                        <div className="line"></div>
                        <div className="bold">ACTIVE MEMBERSHIP:</div>
                        <div>{billData.selectedMembership.name}</div>
                        <div className="small">Days Remaining: {billData.selectedMembership.daysRemaining}</div>
                    </div>
                )}

                {/* Footer */}
                <div className="footer">
                    <div className="small">Thank you for your visit!</div>
                    <div className="small">Please visit again</div>
                    {billData.tax?.taxMessage && (
                        <div className="small">{billData.tax.taxMessage}</div>
                    )}
                    <div className="line"></div>
                    <div className="small">Powered by Elevate Panel</div>
                    <div className="small">Transaction ID: {billData.transactionId}</div>
                    
                    {/* Paper feed and cut commands for thermal printer */}
                    <div className="center" style={{marginTop: '3mm'}}>
                        <div style={{height: '8mm'}}></div> {/* Extra spacing before cut */}
                        <div className="small" style={{color: 'white', fontSize: '1px'}}>
                            {/* Force paper feed with invisible content */}
                            .<br/>.<br/>.<br/>.<br/>.
                        </div>
                    </div>
                </div>
                
                {/* Paper Cut Section - Forces automatic cutting */}
                <div className="paper-cut">
                    <div style={{height: '10mm', pageBreakAfter: 'always'}}></div>
                </div>
                
                {/* ESC/POS Paper Cut Commands */}
                <div style={{display: 'none'}} className="printer-commands">
                    <pre style={{fontSize: '1px', color: 'white', margin: 0, padding: 0}}>
{/* Line feeds */}&#10;&#10;&#10;&#10;&#10;&#10;&#10;
{/* ESC i - Full cut */}&#27;i
{/* Alternative: GS V 0 - Full cut with feed */}&#29;V&#0;
{/* Alternative: GS V 1 - Partial cut */}&#29;V&#1;
                    </pre>
                </div>
            </div>
        </div>
    );
}

export default PrintableBill;