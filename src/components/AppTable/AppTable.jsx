import React, { useState, useEffect } from 'react';
import { Table, Empty, cn } from 'rizzui';
import AppButton from '../AppButton/AppButton';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CustomModal from '../CustomModal/CustumModal';
import { bulkApiHitAdvanced } from '../../Api/ApiHit';
import { downloadCSVTemplate } from '../../constant/Smaplecsv';
import MongoosePagination from '../Pagination/MongoosePagination';

function AppTable({
  TH = [],
  TD = [],
  onRowClick,
  isLoading = false,
  emptyMessage = "No data available",
  navigateTo,
  buttonText,
  variant = "modern",
  striped = true,
  bulkUpload,
  bulkuploadApi,
  csvSampleKey,
  csvFileName,
  onDataRefresh,
  hidePagination,
  TableSearch,
  enableExport = false,
  onExportData,
  exportFileName = "export",
}) {
  const TableDataReducer = useSelector((state) => state.TableReducer);
  const currentPage = TableDataReducer.pagination?.page || 1;
  const limit = TableDataReducer.pagination?.limit || 10;

  const normalizedTD = Array.isArray(TD) ? TD : [];
  console.log("TD", normalizedTD);

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 1024 && window.innerWidth >= 640);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const tableClassName = striped ? 'striped' : '';
  const baseIndex = (currentPage - 1) * limit;

  const getVisibleColumns = () => {
    if (isMobile) return TH.filter(header => (header.priority || 1) <= 2);
    if (isTablet) return TH.filter(header => (header.priority || 1) <= 3);
    return TH;
  };

  const visibleColumns = getVisibleColumns();

  const handleCloseBulkUploadModal = () => {
    setIsBulkUploadModalOpen(false);
    setSelectedFile(null);
    setUploadProgress(0);
    setIsDragOver(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const maxSize = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert('Please select a valid CSV or Excel file.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size should not exceed 10MB.');
      return;
    }

    setSelectedFile(file);
    console.log('File selected:', file.name);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile || !bulkuploadApi) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await bulkApiHitAdvanced(selectedFile, bulkuploadApi, {
        fieldName: 'file',
        onProgress: (percentage) => setUploadProgress(percentage),
        timeout: 60000,
        additionalData: {}
      });

      if (result.success) {
        alert('Bulk upload completed successfully!');
        handleCloseBulkUploadModal();
        window.location.reload();

        if (typeof onDataRefresh === 'function') {
          onDataRefresh();
        }
      } else {
        const errorMessage = result.error?.message || 'Upload failed. Please try again.';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please check your file and try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTemplateDownload = () => {
    if (!csvSampleKey) {
      alert('Template download not available');
      return;
    }

    const filename = csvFileName || `${csvSampleKey}_bulk_upload_template.csv`;
    downloadCSVTemplate(csvSampleKey, filename);
  };

  const handleExport = (format) => {
    setIsExportMenuOpen(false);
    if (onExportData) {
      onExportData(format);
    }
  };

  const MobileCardView = () => (
    <div className="space-y-4">
      {normalizedTD.map((row, rowIndex) => {
        const serialNumber = baseIndex + rowIndex + 1;

        return (
          <div
            key={`card-${row.id || rowIndex}`}
            className={cn("bg-white rounded-lg border border-gray-200 p-4 shadow-sm", onRowClick && "cursor-pointer hover:shadow-md")}
            onClick={() => onRowClick && onRowClick(alert('sdfds'))}
          >
            <div className="text-xs text-gray-500 mb-2">#{serialNumber}</div>
            <div className="space-y-3">
              {visibleColumns.map((header, colIndex) => {
                const key = header.key || header.title.toLowerCase().replace(/\s/g, '_');
                if (key === 'serialNumber') return null;
                const cellValue = row[key] !== undefined ? row[key] : '';

                return (
                  <div key={`mobile-cell-${colIndex}`} className="flex flex-col">
                    <div className="text-xs font-medium text-gray-500 uppercase">{header.title}</div>
                    <div className="mt-1">
                      {typeof header.render === 'function'
                        ? header.render(cellValue, row, rowIndex)
                        : <div className="text-sm text-gray-900">{cellValue}</div>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {(TableSearch || (navigateTo && buttonText) || enableExport) && (
        <div className="flex items-center justify-end py-3">
          <div className="flex justify-between w-full items-center">
            {TableSearch ?? <div />}
            <div className="flex items-center gap-2">
              {enableExport && (
                <div className="relative">
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Data
                    <svg className={`w-4 h-4 transition-transform ${isExportMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isExportMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleExport('csv')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Export as PDF
                      </button>
                      <button
                        onClick={() => handleExport('serviceBreakdown')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors border-t border-gray-100"
                      >
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                        <span className="whitespace-nowrap">Service Breakdown</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
              {navigateTo && buttonText && (
                <NavLink to={navigateTo}>
                  <AppButton buttontext={buttonText} />
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}

      {normalizedTD.length === 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <Empty text={emptyMessage} />
          </div>
        </div>
      ) : (
        <>
          <div className="block sm:hidden">
            <MobileCardView />
          </div>

          <div className="hidden sm:block">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="min-w-full">
                <Table className={tableClassName} variant={variant}>
                  <Table.Header>
                    <Table.Row>
                      {visibleColumns.map((header, index) => (
                        <Table.Head key={index} className={cn("px-3 py-2", header.align ? `text-${header.align}` : "text-left", "text-xs sm:text-sm")} style={header.width ? { width: header.width } : {}}>
                          <div className="truncate" title={header.title}>{header.title}</div>
                        </Table.Head>
                      ))}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {normalizedTD.map((row, rowIndex) => {
                      const serialNumber = baseIndex + rowIndex + 1;

                      return (
                        <Table.Row
                          key={`row-${row.id || rowIndex}`}
                          className={cn(onRowClick ? "hover:bg-gray-50 cursor-pointer" : "hover:bg-gray-50")}

                        >
                          {visibleColumns.map((header, colIndex) => {
                            const key = header.key || header.title.toLowerCase().replace(/\s/g, '_');
                            const cellValue = row[key] ?? '';

                            if (key === 'serialNumber') {
                              return (
                                <Table.Cell key={`cell-${colIndex}`} className="text-center px-3 py-2">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900">{serialNumber}</div>
                                </Table.Cell>
                              );
                            }

                            return (
                              <Table.Cell key={`cell-${colIndex}`} className={cn("px-3 py-2", header.align ? `text-${header.align}` : '')}>
                                <div onClick={() => onRowClick && onRowClick(row, rowIndex)} className="text-xs sm:text-sm text-gray-900" title={cellValue}>
                                  {typeof header.render === 'function' ? header.render(cellValue, row, rowIndex) : cellValue}
                                </div>
                              </Table.Cell>
                            );
                          })}
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-center sm:justify-end mt-4">
        {!hidePagination && <MongoosePagination />}
      </div>

      <CustomModal isOpen={isBulkUploadModalOpen} onClose={handleCloseBulkUploadModal} size="lg">
        {/* Upload modal UI remains unchanged... */}
      </CustomModal>
    </div>
  );
}

export default AppTable;
