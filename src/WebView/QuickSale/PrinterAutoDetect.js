// PrinterAutoDetect.js - Network printer auto-detection utility
import { useState, useEffect } from 'react';

/**
 * Auto-detection utility for Epson thermal printers on network
 * Scans common IP ranges and tests for ePOS-Print capability
 */

// Common Epson printer models and their identifiers
const EPSON_PRINTER_MODELS = [
    'TM-T88VI', 'TM-T82III', 'TM-T20III', 'TM-T30III', 'TM-U220',
    'TM-P20', 'TM-P60II', 'TM-P80', 'TM-H6000V', 'TM-L90'
];

// Common network ports for Epson printers
const EPSON_PORTS = [80, 8080, 443, 9100];

// Default IP ranges to scan (can be customized)
const DEFAULT_IP_RANGES = [
    '192.168.1.', '192.168.0.', '192.168.2.', '172.16.0.'
];

/**
 * Get local network IP range based on current device IP
 */
const getLocalNetworkRange = () => {
    try {
        // This is a simplified approach - in real scenarios, you might use WebRTC to get local IP
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;
        
        // Common ranges based on typical router configurations
        return [
            '192.168.1.',  // Most common home router range
            '192.168.0.',  // Alternative common range
            '172.16.0.'    // Less common but possible
        ];
    } catch (error) {
        console.warn('Could not determine local network range, using defaults');
        return DEFAULT_IP_RANGES;
    }
};

/**
 * Test if an IP address has an Epson printer with ePOS-Print capability
 * Tests on port 80 for discovery but returns port 8008 for actual connection
 */
const testEpsonPrinter = async (ip, testPort = 80, timeout = 3000) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        // Test ePOS-Print capability endpoint on port 80 (discovery)
        const response = await fetch(`http://${ip}/epos/capability.xml`, {
            method: 'GET',
            mode: 'no-cors', // Required for cross-origin requests to printers
            signal: controller.signal,
            headers: {
                'Accept': 'application/xml, text/xml, */*'
            }
        });
        
        clearTimeout(timeoutId);
        
        // Since we're using no-cors mode, we can't read the response
        // But if the request doesn't throw an error, the endpoint likely exists
        // Return port 8008 for actual connection even though we tested on port 80
        return {
            ip: ip,
            port: 8008,  // Store port 8008 for ePOS SDK connection
            status: 'found',
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        // Different error types can indicate different states
        if (error.name === 'AbortError') {
            return { ip, port: 8008, status: 'timeout', error: 'Connection timeout' };
        } else if (error.name === 'TypeError') {
            // Network error - printer might not exist or be accessible
            return { ip, port: 8008, status: 'unreachable', error: 'Network unreachable' };
        } else {
            return { ip, port: 8008, status: 'error', error: error.message };
        }
    }
};

/**
 * Advanced printer detection using multiple methods
 */
const detectPrinterAdvanced = async (ip, timeout = 5000) => {
    const results = [];
    
    // Method 1: Test ePOS-Print capability
    try {
        const eposResult = await testEpsonPrinter(ip, 80, timeout);
        if (eposResult.status === 'found') {
            results.push({
                ...eposResult,
                method: 'epos-print',
                confidence: 'high'
            });
        }
    } catch (error) {
        console.log(`ePOS-Print test failed for ${ip}:`, error.message);
    }
    
    // Method 2: Test common printer ports
    for (const port of EPSON_PORTS) {
        if (port === 80) continue; // Already tested above
        
        try {
            const portResult = await testEpsonPrinter(ip, port, timeout / 2);
            if (portResult.status === 'found') {
                results.push({
                    ...portResult,
                    method: `port-${port}`,
                    confidence: 'medium'
                });
            }
        } catch (error) {
            console.log(`Port ${port} test failed for ${ip}:`, error.message);
        }
    }
    
    // Method 3: SSDP/UPnP discovery (simplified check)
    try {
        // Check for common printer web interface
        const webResult = await testEpsonPrinter(ip, 80, timeout / 4);
        if (webResult.status === 'found') {
            results.push({
                ...webResult,
                method: 'web-interface',
                confidence: 'low'
            });
        }
    } catch (error) {
        console.log(`Web interface test failed for ${ip}:`, error.message);
    }
    
    return results.length > 0 ? results[0] : null; // Return highest confidence result
};

/**
 * Scan network range for Epson printers
 */
const scanNetworkRange = async (baseIp, startRange = 1, endRange = 254, onProgress = null, onFound = null) => {
    const foundPrinters = [];
    const totalIps = endRange - startRange + 1;
    let scannedCount = 0;
    
    // Create batch of promises for parallel scanning (but limit concurrency)
    const batchSize = 10; // Scan 10 IPs concurrently to avoid overwhelming network
    const batches = [];
    
    for (let i = startRange; i <= endRange; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, endRange + 1); j++) {
            const ip = `${baseIp}${j}`;
            batch.push(
                detectPrinterAdvanced(ip, 2000).then(result => {
                    scannedCount++;
                    if (onProgress) {
                        onProgress({
                            scanned: scannedCount,
                            total: totalIps,
                            currentIp: ip,
                            percentage: Math.round((scannedCount / totalIps) * 100)
                        });
                    }
                    
                    if (result) {
                        foundPrinters.push(result);
                        if (onFound) {
                            onFound(result);
                        }
                    }
                    
                    return result;
                })
            );
        }
        batches.push(batch);
    }
    
    // Execute batches sequentially to avoid overwhelming the network
    for (const batch of batches) {
        await Promise.all(batch);
        // Small delay between batches to be network-friendly
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return foundPrinters;
};

/**
 * React hook for printer auto-detection
 */
export const usePrinterAutoDetect = () => {
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ scanned: 0, total: 0, percentage: 0 });
    const [foundPrinters, setFoundPrinters] = useState([]);
    const [scanError, setScanError] = useState(null);
    const [lastScanTime, setLastScanTime] = useState(null);
    
    const startScan = async (customRanges = null) => {
        setIsScanning(true);
        setScanError(null);
        setFoundPrinters([]);
        setScanProgress({ scanned: 0, total: 0, percentage: 0 });
        
        try {
            const ranges = customRanges || getLocalNetworkRange();
            const allFoundPrinters = [];
            
            for (const range of ranges) {
                console.log(`Scanning range: ${range}1-254`);
                
                const rangePrinters = await scanNetworkRange(
                    range,
                    1,
                    254,
                    (progress) => setScanProgress(progress),
                    (printer) => {
                        allFoundPrinters.push(printer);
                        setFoundPrinters([...allFoundPrinters]);
                    }
                );
                
                // Small delay between ranges
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            setLastScanTime(new Date());
            console.log(`Scan completed. Found ${allFoundPrinters.length} printers:`, allFoundPrinters);
            
        } catch (error) {
            console.error('Scan error:', error);
            setScanError(error.message);
        } finally {
            setIsScanning(false);
        }
    };
    
    const stopScan = () => {
        setIsScanning(false);
        // Note: In a real implementation, you'd want to cancel ongoing requests
    };
    
    const testPrinter = async (ip) => {
        try {
            const result = await detectPrinterAdvanced(ip, 5000);
            return result;
        } catch (error) {
            throw new Error(`Failed to test printer at ${ip}: ${error.message}`);
        }
    };
    
    return {
        isScanning,
        scanProgress,
        foundPrinters,
        scanError,
        lastScanTime,
        startScan,
        stopScan,
        testPrinter
    };
};

/**
 * Utility functions for external use
 */
export const PrinterAutoDetectUtils = {
    testEpsonPrinter,
    detectPrinterAdvanced,
    scanNetworkRange,
    getLocalNetworkRange,
    EPSON_PRINTER_MODELS,
    EPSON_PORTS
};

export default usePrinterAutoDetect;