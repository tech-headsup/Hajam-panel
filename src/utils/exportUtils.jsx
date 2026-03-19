/**
 * Export data to CSV format
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with title and key
 * @param {String} filename - Name of the file to download
 */
export const exportToCSV = (data, headers, filename = 'export.csv') => {
    if (!data || data.length === 0) {
        alert('No data to export');
        return;
    }

    // Create CSV header row
    const csvHeaders = headers.map(header => header.title).join(',');

    // Create CSV data rows
    const csvRows = data.map(row => {
        return headers.map(header => {
            let value = row[header.key];

            // Handle nested objects
            if (header.key.includes('.')) {
                const keys = header.key.split('.');
                value = keys.reduce((obj, key) => obj?.[key], row);
            }

            // Handle null/undefined
            if (value === null || value === undefined) {
                value = '';
            }

            // Handle objects and arrays
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }

            // Handle values with commas, quotes, or newlines
            value = String(value);
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                value = `"${value.replace(/"/g, '""')}"`;
            }

            return value;
        }).join(',');
    });

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Export data to PDF format
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with title and key
 * @param {String} filename - Name of the file to download
 * @param {String} title - Title of the PDF document
 */
export const exportToPDF = (data, headers, filename = 'export.pdf', title = 'Data Export') => {
    alert('PDF export is not available in this panel build.');
};

/**
 * Get exportable headers from table headers
 * Filters out action columns and prepares headers for export
 * @param {Array} tableHeaders - Array of table header objects
 * @returns {Array} - Filtered headers suitable for export
 */
export const getExportableHeaders = (tableHeaders) => {
    return tableHeaders.filter(header => {
        // Exclude action columns and serial number columns
        const excludeKeys = ['actions', 'serialNumber'];
        return !excludeKeys.includes(header.key);
    });
};
