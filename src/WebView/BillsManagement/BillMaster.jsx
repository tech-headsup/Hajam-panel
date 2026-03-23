import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { searchBill, searchUser, deleteBill } from '../../constant/Constant';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import AppTable from '../../components/AppTable/AppTable';
import { setPagination } from '../../redux/Actions/TableAction';
import toast from 'react-hot-toast';
import TableSearch from '../../components/TableSearch/TableSearch';
import DateSearch from '../../components/DateSearch/DateSearch';
import { exportToCSV, exportToPDF } from '../../utils/exportUtils';
import ViewButton from '../../components/AppButton/ViewButton';
import DeleteButton from '../../components/Delete/DeleteButton';
import CustomModal from '../../components/CustomModal/CustumModal';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { hasPermission } from '../../utils/permissionUtils';

function BillMaster() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const ApiReducer = useSelector((state) => state.ApiReducer);
  const TableDataReducer = useSelector((state) => state.TableReducer);

  // Search state variables
  const [optionSelect, setOptionSelect] = useState('');
  const [valueSearched, setValueSearched] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeDateRange, setActiveDateRange] = useState(null);
  const [activeTextSearch, setActiveTextSearch] = useState(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [staffDetailsMap, setStaffDetailsMap] = useState({});

  // Permission checks
  const canViewBill = hasPermission('bills', 'read');
  const canDeleteBill = hasPermission('bills', 'delete');

  useEffect(() => {
    if (activeDateRange) {
      performDateRangeSearch(activeDateRange.startDate, activeDateRange.endDate);
    }
    else if (activeTextSearch) {
      fetchBills(activeTextSearch.key, activeTextSearch.value);
    }
    else {
      fetchBills();
    }
  }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit]);

  // Fetch staff details when bill is selected
  useEffect(() => {
    if (!selectedBill) return;

    const fetchStaffDetails = async () => {
      const staffIds = new Set();

      // Collect staff IDs from services
      if (selectedBill.services && Array.isArray(selectedBill.services)) {
        selectedBill.services.forEach(service => {
          if (service.staff) {
            const staffId = typeof service.staff === 'object' ? service.staff._id : service.staff;
            if (staffId) staffIds.add(staffId);
          }
        });
      }

      // Collect staff IDs from products
      if (selectedBill.products && Array.isArray(selectedBill.products)) {
        selectedBill.products.forEach(product => {
          if (product.staff) {
            const staffId = typeof product.staff === 'object' ? product.staff._id : product.staff;
            if (staffId) staffIds.add(staffId);
          }
        });
      }

      // Fetch details for each staff member
      const staffDetailsTemp = {};

      for (const staffId of staffIds) {
        try {
          const json = {
            page: 1,
            limit: 1,
            search: { _id: staffId }
          };

          const res = await HitApi(json, searchUser);

          if (res?.statusCode === 200 && res?.data?.docs?.[0]) {
            staffDetailsTemp[staffId] = res.data.docs[0];
          }
        } catch (error) {
          console.error(`Error fetching staff details for ID ${staffId}:`, error);
        }
      }

      setStaffDetailsMap(staffDetailsTemp);
    };

    fetchStaffDetails();
  }, [selectedBill]);

  const fetchBills = (searchKey, searchValue) => {
    setIsSearching(true);

    const searchObj = {};

    if (searchKey && searchValue) {
      searchObj[searchKey] = searchValue;
    }
    const json = {
      page: TableDataReducer.pagination.page,
      limit: TableDataReducer.pagination.limit,
      search: searchObj
    };

    HitApi(json, searchBill).then((res) => {
      if (res?.statusCode === 200) {
        const billData = Array.isArray(res?.data?.docs) ? res?.data?.docs : [];
        dispatch(setApiJson(billData));

        const paginationData = {
          total: res?.data?.totalDocs || 0,
          page: TableDataReducer.pagination.page,
          limit: TableDataReducer.pagination.limit
        };

        dispatch(setPagination(paginationData));
      } else {
        dispatch(setApiJson([]));
        toast.error('Failed to fetch bills. Please try again.');
      }
    }).catch(() => {
      dispatch(setApiJson([]));
      toast.error('Error fetching bills. Please try again.');
    }).finally(() => {
      setIsSearching(false);
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    return `₹${Number(amount).toFixed(2)}`;
  };

  const renderPaymentStatus = (payment) => {
    const status = payment?.paymentStatus || 'Pending';
    let bgColor = 'bg-yellow-100';
    let textColor = 'text-yellow-800';

    if (status === 'Paid') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    } else if (status === 'Partial') {
      bgColor = 'bg-orange-100';
      textColor = 'text-orange-800';
    } else if (status === 'Unpaid') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status}
      </span>
    );
  };

  const renderBillStatus = (status) => {
    const statusText = status || 'pending';
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';

    if (statusText === 'completed') {
      bgColor = 'bg-green-100';
      textColor = 'text-green-800';
    } else if (statusText === 'cancelled') {
      bgColor = 'bg-red-100';
      textColor = 'text-red-800';
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
      </span>
    );
  };

  const renderPaymentMethods = (payment) => {
    if (!payment?.activePaymentMethods || payment.activePaymentMethods.length === 0) {
      return <span className="text-xs text-gray-500">No payment</span>;
    }

    return (
      <div className="space-y-1">
        {payment.activePaymentMethods.map((method, index) => (
          <div key={index} className="flex items-center text-xs">
            <span className="font-medium text-gray-700">{method.method}:</span>
            <span className="ml-1 text-gray-900">{formatCurrency(method.amount)}</span>
          </div>
        ))}
      </div>
    );
  };

  // Search functionality
  const handleSearch = () => {
    if (!optionSelect) {
      toast.error('Please select a search option');
      return;
    }
    if (!valueSearched || valueSearched.trim() === '') {
      toast.error('Please enter a search value');
      return;
    }

    // Store active text search state
    setActiveTextSearch({ key: optionSelect, value: valueSearched.trim() });
    // Clear date range state
    setActiveDateRange(null);

    fetchBills(optionSelect, valueSearched.trim());
  };

  // Search options based on bill fields
  const options = [
    { label: 'Bill Number', value: 'billNumber' },
    { label: 'Transaction ID', value: 'transactionId' },
    { label: 'Client Name', value: 'client.name' },
    { label: 'Phone Number', value: 'client.phoneNumber' },
    { label: 'Payment Status', value: 'payment.paymentStatus' },
    { label: 'Bill Status', value: 'status' },
  ];

  const handleClearSearch = () => {
    setOptionSelect('');
    setValueSearched('');
    setActiveTextSearch(null);
    setActiveDateRange(null);
    fetchBills();
  };

  // Perform date range search (without setting state)
  const performDateRangeSearch = (startDate, endDate) => {
    setIsSearching(true);

    const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0); // Start of day
    const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999); // End of day

    const searchObj = {
      createdAt: {
        $gte: startTimestamp,
        $lte: endTimestamp
      }
    };

    const json = {
      page: TableDataReducer.pagination.page,
      limit: TableDataReducer.pagination.limit,
      search: searchObj
    };

    HitApi(json, searchBill).then((res) => {
      if (res?.statusCode === 200) {
        const billData = Array.isArray(res?.data?.docs) ? res?.data?.docs : [];
        dispatch(setApiJson(billData));
        const paginationData = {
          total: res?.data?.totalDocs || 0,
          page: TableDataReducer.pagination.page,
          limit: TableDataReducer.pagination.limit
        };

        dispatch(setPagination(paginationData));
        toast.success(`Found ${res?.data?.totalDocs || 0} bills in the selected date range`);
      } else {
        dispatch(setApiJson([]));
        toast.error('Failed to fetch bills. Please try again.');
      }
    }).catch(() => {
      dispatch(setApiJson([]));
      toast.error('Error fetching bills. Please try again.');
    }).finally(() => {
      setIsSearching(false);
    });
  };

  const handleDateRangeSearch = (startDate, endDate) => {
    setActiveDateRange({ startDate, endDate });
    // Clear text search state
    setActiveTextSearch(null);

    performDateRangeSearch(startDate, endDate);
  };

  const handleViewBill = (billData) => {
    setSelectedBill(billData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBill(null);
  };

  const handleDeleteBill = async (billId) => {
    try {
      const res = await HitApi({ _id: billId }, deleteBill);

      if (res?.statusCode === 200) {
        toast.success('Bill deleted successfully');
        // Refresh the bills list based on current search state
        if (activeDateRange) {
          performDateRangeSearch(activeDateRange.startDate, activeDateRange.endDate);
        } else if (activeTextSearch) {
          fetchBills(activeTextSearch.key, activeTextSearch.value);
        } else {
          fetchBills();
        }
      } else {
        toast.error(res?.message || 'Failed to delete bill');
      }
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Error deleting bill. Please try again.');
    }
  };

  const baseIndex = (TableDataReducer.pagination.page - 1) * TableDataReducer.pagination.limit;

  const tableHeaders = [
    {
      title: "S.No",
      key: "serialNumber",
      width: "60px",
      align: "center",
      render: (_, __, index) => {
        const serialNumber = baseIndex + index + 1;
        return (
          <div className="text-center">
            <span className="text-sm font-medium text-gray-900">{serialNumber}</span>
          </div>
        );
      }
    },
    {
      title: "Bill Details",
      key: "billNumber",
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">{value || 'N/A'}</div>
          <div className="text-xs text-gray-500">
            {row.transactionId || 'No transaction ID'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDate(row.timestamp)}
          </div>
        </div>
      )
    },
    {
      title: "Client Details",
      key: "client",
      render: (client) => (
        <div>
          <div className="font-medium text-gray-900 text-sm">
            {client?.name || 'N/A'}
          </div>
          <div className="text-xs text-gray-500">
            {client?.phoneNumber || 'No phone'}
          </div>
          <div className="text-xs text-gray-400">
            {client?.gender || 'N/A'}
          </div>
        </div>
      )
    },

    {
      title: "Services",
      key: "services",
      align: "left",
      render: (services, row) => {
        const serviceList = Array.isArray(services) ? services : [];
        const totalQuantity = serviceList.reduce((sum, s) => sum + (s.quantity || 1), 0);

        return (
          <div>
            <div className="font-medium text-blue-600 text-sm mb-1">
              {totalQuantity} Service{totalQuantity !== 1 ? 's' : ''}
            </div>
            {serviceList.length > 0 ? (
              <div className="space-y-0.5">
                {serviceList.map((service, index) => (
                  <div key={index} className="text-xs text-gray-700">
                    • {service.name} {service.quantity > 1 ? `(x${service.quantity})` : ''}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">No services</div>
            )}
          </div>
        );
      }
    },
    {
      title: "Products",
      key: "products",
      align: "left",
      render: (products, row) => {
        const productList = Array.isArray(products) ? products : [];
        const totalQuantity = productList.reduce((sum, p) => sum + (p.quantity || 1), 0);

        return (
          <div>
            <div className="font-medium text-green-600 text-sm mb-1">
              {totalQuantity} Product{totalQuantity !== 1 ? 's' : ''}
            </div>
            {productList.length > 0 ? (
              <div className="space-y-0.5">
                {productList.map((product, index) => (
                  <div key={index} className="text-xs text-gray-700">
                    • {product.name} {product.quantity > 1 ? `(x${product.quantity})` : ''}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">No products</div>
            )}
          </div>
        );
      }
    },
    {
      title: "Amount Details",
      key: "calculations",
      render: (calculations, row) => {
        const grandTotal = calculations?.totals?.grandTotal || 0;
        const totalDiscount = calculations?.totals?.totalDiscount || 0;
        const originalPrice = grandTotal + totalDiscount;
        const isPending = row?.status === 'pending';

        return (
          <div className="space-y-1 text-xs">
            {totalDiscount > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Original Price:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(originalPrice)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-600">Discount (-):</span>
                  <span className="font-medium text-green-600">-{formatCurrency(totalDiscount)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                  <span className="text-gray-900 font-semibold">Paid Amount:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(grandTotal)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-gray-900 font-semibold">{isPending ? 'Amount To Pay:' : 'Total Amount:'}</span>
                <span className="font-bold text-gray-900">{formatCurrency(isPending ? calculations?.totals?.finalAmount : grandTotal)}</span>
              </div>
            )}
            {calculations?.totals?.gstAmount > 0 && (
              <div className="flex justify-between items-center text-gray-500 pt-1">
                <span>GST:</span>
                <span>{formatCurrency(calculations?.totals?.gstAmount)}</span>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: "Payment & Coupon",
      key: "payment",
      render: (payment, row) => (
        <div className="space-y-2">
          {renderPaymentStatus(payment)}
          <div className="mt-1">
            {renderPaymentMethods(payment)}
          </div>
          {payment?.totalPaid > 0 && (
            <div className="text-xs font-medium text-gray-700">
              Paid: {formatCurrency(payment.totalPaid)}
            </div>
          )}
          {row.appliedCoupon && row.appliedCoupon.code && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-purple-800 text-xs font-medium">
                {row.appliedCoupon.code}
              </div>
              {row.appliedCoupon.discountAmount > 0 && (
                <div className="text-xs text-green-600 mt-0.5">
                  -{formatCurrency(row.appliedCoupon.discountAmount)}
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Status & Time",
      key: "status",
      align: "start",
      render: (value, row) => (
        <div className="text-start">
          {renderBillStatus(value)}
          <div className="text-xs text-gray-600 mt-2">
            {formatTime(row.timestamp)}
          </div>
        </div>
      )
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: "100px",
      render: (_, row) => (
        <div className="flex justify-center gap-2">
          {canViewBill && (
            <ViewButton
              onClick={() => handleViewBill(row)}
              itemName="bill"
            />
          )}
          {canDeleteBill && (
            <DeleteButton
              onDelete={() => handleDeleteBill(row._id)}
              itemName="bill"
            />
          )}
        </div>
      )
    }
  ];


  const handleExportData = async (format) => {
    try {
      toast.loading('Preparing export...');

      // Determine which search params to use
      let searchObj = {};

      if (activeDateRange) {
        const startTimestamp = new Date(activeDateRange.startDate).setHours(0, 0, 0, 0);
        const endTimestamp = new Date(activeDateRange.endDate).setHours(23, 59, 59, 999);
        searchObj = {
          createdAt: {
            $gte: startTimestamp,
            $lte: endTimestamp
          }
        };
      } else if (activeTextSearch) {
        searchObj[activeTextSearch.key] = activeTextSearch.value;
      }

      // Fetch all data without pagination
      const json = {
        page: 1,
        limit: 10000, // Large number to get all data
        search: searchObj
      };

      const res = await HitApi(json, searchBill);

      if (res?.statusCode === 200 && res?.data?.docs) {
        const allData = res.data.docs;

        if (allData.length === 0) {
          toast.dismiss();
          toast.error('No data to export');
          return;
        }


        const exportHeaders = [
          { title: 'S.No', key: 'serialNumber' },
          { title: 'Bill Number', key: 'billNumber' },
          { title: 'Transaction ID', key: 'transactionId' },
          { title: 'Date', key: 'date' },
          { title: 'Time', key: 'time' },
          { title: 'Client Name', key: 'clientName' },
          { title: 'Phone Number', key: 'phoneNumber' },
          { title: 'Gender', key: 'gender' },
          { title: 'Bill Type', key: 'billType' },
          { title: 'Services Count', key: 'servicesCount' },
          { title: 'Services Details', key: 'servicesDetails' },
          { title: 'Products Count', key: 'productsCount' },
          { title: 'Products Details', key: 'productsDetails' },
          { title: 'Memberships Count', key: 'membershipsCount' },
          { title: 'Original Price', key: 'originalPrice' },
          { title: 'Discount', key: 'discount' },
          { title: 'Final Amount', key: 'finalAmount' },
          { title: 'GST Amount', key: 'gstAmount' },
          { title: 'Payment Status', key: 'paymentStatus' },
          { title: 'Payment Methods', key: 'paymentMethods' },
          { title: 'Total Paid', key: 'totalPaid' },
          { title: 'Bill Status', key: 'status' },
          { title: 'Coupon Code', key: 'couponCode' },
          { title: 'Coupon Discount', key: 'couponDiscount' }
        ];

        // Flatten and format data for export
        const flattenedData = allData.map((row, index) => {
          const grandTotal = row.calculations?.totals?.grandTotal || 0;
          const totalDiscount = row.calculations?.totals?.totalDiscount || 0;
          const originalPrice = grandTotal + totalDiscount;

          // Payment methods as string
          let paymentMethodsStr = 'No payment';
          if (row.payment?.activePaymentMethods && row.payment.activePaymentMethods.length > 0) {
            paymentMethodsStr = row.payment.activePaymentMethods
              .map(method => `${method.method}: ${Number(method.amount).toFixed(2)}`)
              .join(', ');
          }

          // Services details as string
          let servicesDetailsStr = 'No services';
          if (row.services && row.services.length > 0) {
            servicesDetailsStr = row.services
              .map(service => `${service.name} (Qty: ${service.quantity || 1})`)
              .join(', ');
          }

          // Products details as string
          let productsDetailsStr = 'No products';
          if (row.products && row.products.length > 0) {
            productsDetailsStr = row.products
              .map(product => `${product.name} (Qty: ${product.quantity || 1})`)
              .join(', ');
          }

          return {
            serialNumber: index + 1,
            billNumber: row.billNumber || 'N/A',
            transactionId: row.transactionId || 'N/A',
            date: formatDate(row.timestamp),
            time: formatTime(row.timestamp),
            clientName: row.client?.name || 'N/A',
            phoneNumber: row.client?.phoneNumber || 'N/A',
            gender: row.client?.gender || 'N/A',
            billType: row.billType ? row.billType.replace(/_/g, ' ') : 'N/A',
            servicesCount: row.services?.length || 0,
            servicesDetails: servicesDetailsStr,
            productsCount: row.products?.length || 0,
            productsDetails: productsDetailsStr,
            membershipsCount: row.newMemberships?.length || 0,
            originalPrice: Number(originalPrice).toFixed(2),
            discount: totalDiscount < 0 ? '0.00' : Number(totalDiscount).toFixed(2),
            finalAmount: Number(grandTotal).toFixed(2),
            gstAmount: Number(row.calculations?.totals?.gstAmount || 0).toFixed(2),
            paymentStatus: row.payment?.paymentStatus || 'Pending',
            paymentMethods: paymentMethodsStr,
            totalPaid: Number(row.payment?.totalPaid || 0).toFixed(2),
            status: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Pending',
            couponCode: row.appliedCoupon?.code || 'No coupon',
            couponDiscount: Number(row.appliedCoupon?.discountAmount || 0).toFixed(2)
          };
        });

        const filename = `bills_export_${new Date().toISOString().split('T')[0]}`;

        toast.dismiss();

        if (format === 'csv') {
          exportToCSV(flattenedData, exportHeaders, `${filename}.csv`);
          toast.success(`Exported ${allData.length} bills to CSV`);
        } else if (format === 'pdf') {
          exportToPDF(flattenedData, exportHeaders, `${filename}.pdf`, 'Bills Report');
          toast.success(`Exported ${allData.length} bills to PDF`);
        } else if (format === 'serviceBreakdown') {
          // Service Breakdown Export - Each service becomes a separate row
          const serviceBreakdownHeaders = [
            { title: 'S.No', key: 'serialNumber' },
            { title: 'Bill Number', key: 'billNumber' },
            { title: 'Transaction ID', key: 'transactionId' },
            { title: 'Date', key: 'date' },
            { title: 'Time', key: 'time' },
            { title: 'Client Name', key: 'clientName' },
            { title: 'Phone Number', key: 'phoneNumber' },
            { title: 'Gender', key: 'gender' },
            { title: 'Service Name', key: 'serviceName' },
            { title: 'Service Quantity', key: 'serviceQuantity' },
            { title: 'Service Base Price', key: 'serviceBasePrice' },
            { title: 'Service Discount', key: 'serviceDiscount' },
            { title: 'Service Final Price', key: 'serviceFinalPrice' },
            { title: 'Staff Name', key: 'staffName' },
            { title: 'Bill Status', key: 'billStatus' },
            { title: 'Payment Status', key: 'paymentStatus' },
            { title: 'Bill Grand Total', key: 'billGrandTotal' }
          ];

          // First, collect all unique staff IDs from services
          const staffIds = new Set();
          allData.forEach((row) => {
            if (row.services && Array.isArray(row.services)) {
              row.services.forEach((service) => {
                if (service.staff) {
                  const staffId = typeof service.staff === 'object' ? service.staff._id : service.staff;
                  if (staffId) staffIds.add(staffId);
                }
              });
            }
          });

          // Fetch staff details for all staff IDs
          const staffMap = {};
          for (const staffId of staffIds) {
            try {
              const staffRes = await HitApi({ page: 1, limit: 1, search: { _id: staffId } }, searchUser);
              if (staffRes?.statusCode === 200 && staffRes?.data?.docs?.[0]) {
                staffMap[staffId] = staffRes.data.docs[0].name || 'N/A';
              }
            } catch (error) {
              console.error(`Error fetching staff ${staffId}:`, error);
            }
          }

          const serviceBreakdownData = [];
          let serialNumber = 1;

          allData.forEach((row) => {
            const services = row.services || [];

            if (services.length === 0) {
              // If no services, still add one row with bill info
              serviceBreakdownData.push({
                serialNumber: serialNumber++,
                billNumber: row.billNumber || 'N/A',
                transactionId: row.transactionId || 'N/A',
                date: formatDate(row.timestamp),
                time: formatTime(row.timestamp),
                clientName: row.client?.name || 'N/A',
                phoneNumber: row.client?.phoneNumber || 'N/A',
                gender: row.client?.gender || 'N/A',
                serviceName: 'No Services',
                serviceQuantity: 0,
                serviceBasePrice: '0.00',
                serviceDiscount: '0.00',
                serviceFinalPrice: '0.00',
                staffName: 'N/A',
                billStatus: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Pending',
                paymentStatus: row.payment?.paymentStatus || 'Pending',
                billGrandTotal: Number(row.calculations?.totals?.grandTotal || 0).toFixed(2)
              });
            } else {
              // Create one row per service
              services.forEach((service) => {
                const basePrice = service.pricing?.basePrice || service.pricing?.totalPrice || 0;
                const finalPrice = service.pricing?.finalPrice || service.pricing?.totalPrice || 0;
                const discount = basePrice - finalPrice;

                // Get staff name from staffMap
                let staffName = 'N/A';
                if (service.staff) {
                  if (typeof service.staff === 'object' && service.staff.name) {
                    staffName = service.staff.name;
                  } else {
                    const staffId = typeof service.staff === 'object' ? service.staff._id : service.staff;
                    staffName = staffMap[staffId] || 'N/A';
                  }
                }

                serviceBreakdownData.push({
                  serialNumber: serialNumber++,
                  billNumber: row.billNumber || 'N/A',
                  transactionId: row.transactionId || 'N/A',
                  date: formatDate(row.timestamp),
                  time: formatTime(row.timestamp),
                  clientName: row.client?.name || 'N/A',
                  phoneNumber: row.client?.phoneNumber || 'N/A',
                  gender: row.client?.gender || 'N/A',
                  serviceName: service.name || 'N/A',
                  serviceQuantity: service.quantity || 1,
                  serviceBasePrice: Number(basePrice).toFixed(2),
                  serviceDiscount: discount > 0 ? Number(discount).toFixed(2) : '0.00',
                  serviceFinalPrice: Number(finalPrice).toFixed(2),
                  staffName: staffName,
                  billStatus: row.status ? row.status.charAt(0).toUpperCase() + row.status.slice(1) : 'Pending',
                  paymentStatus: row.payment?.paymentStatus || 'Pending',
                  billGrandTotal: Number(row.calculations?.totals?.grandTotal || 0).toFixed(2)
                });
              });
            }
          });

          const breakdownFilename = `bills_service_breakdown_${new Date().toISOString().split('T')[0]}`;
          exportToCSV(serviceBreakdownData, serviceBreakdownHeaders, `${breakdownFilename}.csv`);
          toast.success(`Exported ${serviceBreakdownData.length} service entries from ${allData.length} bills`);
        }
      } else {
        toast.dismiss();
        toast.error('Failed to fetch data for export');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Error exporting data');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="p-5">
      <PageHeader
        title={'Bills Management'}
        description={'View and manage system clients bills'}
      />

      <AppTable
        TH={tableHeaders}
        TD={Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : []}
        isLoading={!Array.isArray(ApiReducer.apiJson) || ApiReducer.apiJson.length === 0 || isSearching}
        emptyMessage="No bills found"
        enableExport={true}
        onExportData={handleExportData}
        exportFileName="bills_export"
        TableSearch={
          <TableSearch
            options={options}
            onClick={handleSearch}
            optionSelect={optionSelect}
            setOptionSelect={setOptionSelect}
            setValueSearched={setValueSearched}
            valueSearched={valueSearched}
            onClear={handleClearSearch}
          >
            <DateSearch
              onSearch={handleDateRangeSearch}
              onClear={handleClearSearch}
            />
          </TableSearch>
        }
      />

      {/* Bill Details Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="7xl"
      >
        {selectedBill && (
          <div className="p-3 sm:p-4">
            {/* Modal Header */}
            <div className="flex justify-between items-start sm:items-center mb-3 sm:mb-4 border-b pb-2 sm:pb-3">
              <div className="flex-1 pr-2">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 break-words">
                  Bill Details - {selectedBill.billNumber || 'N/A'}
                </h2>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                  View complete details of bill #{selectedBill.billNumber || 'N/A'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 max-h-[70vh] sm:max-h-[75vh] overflow-y-auto">
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-3">
                {/* Bill Information */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Bill Information</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] sm:text-xs">
                    <div>
                      <p className="text-gray-600">Bill Number</p>
                      <p className="font-medium text-gray-900">{selectedBill.billNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Transaction ID</p>
                      <p className="font-medium text-gray-900 truncate" title={selectedBill.transactionId}>{selectedBill.transactionId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Date & Time</p>
                      <p className="font-medium text-gray-900">{formatDate(selectedBill.timestamp)} {formatTime(selectedBill.timestamp)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Bill Status</p>
                      <div className="mt-0.5">{renderBillStatus(selectedBill.status)}</div>
                    </div>
                    <div>
                      <p className="text-gray-600">Bill Type</p>
                      <p className="font-medium text-gray-900">
                        {selectedBill.billType ? selectedBill.billType.replace(/_/g, ' ') : 'N/A'}
                      </p>
                    </div>
                    {selectedBill.tax?.taxMessage && (
                      <div>
                        <p className="text-gray-600">Tax Info</p>
                        <p className="font-medium text-gray-900">{selectedBill.tax.taxMessage}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Client Information */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Client Information</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[10px] sm:text-xs">
                    <div>
                      <p className="text-gray-600">Name</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone Number</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.phoneNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Gender</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Age Group</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.ageGroup || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Customer Type</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.customerType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Client Type</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.clientType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Visits</p>
                      <p className="font-medium text-gray-900">{selectedBill.client?.totalVisit || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Wallet Balance</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(selectedBill.client?.walletId?.balance || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Services */}
                {selectedBill.services && selectedBill.services.length > 0 && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Services ({selectedBill.services.length})
                    </h3>
                    <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                      {selectedBill.services.map((service, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded p-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <div className="flex gap-2 items-center">
                                <p className="text-gray-600">Qty: {service.quantity || 1}</p>
                                {service.pricing?.savings > 0 && (
                                  <span className="text-green-600 text-[10px]">
                                    (Saved: {formatCurrency(service.pricing.savings)})
                                  </span>
                                )}
                              </div>
                              {service.staff && (() => {
                                const staffId = typeof service.staff === 'object' ? service.staff._id : service.staff;
                                const staff = staffDetailsMap[staffId];

                                if (staff) {
                                  return (
                                    <div className="mt-1 flex items-center gap-1">
                                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="text-[10px] font-medium text-blue-600">
                                        Performed by: {staff.name}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(service.pricing?.finalPrice || service.pricing?.totalPrice || 0)}
                              </p>
                              {service.pricing?.basePrice !== service.pricing?.finalPrice && (
                                <p className="text-gray-500 line-through text-[10px]">
                                  {formatCurrency(service.pricing?.basePrice || 0)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {selectedBill.products && selectedBill.products.length > 0 && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Products ({selectedBill.products.length})
                    </h3>
                    <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                      {selectedBill.products.map((product, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded p-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <div className="flex gap-2 items-center">
                                <p className="text-gray-600">Qty: {product.quantity || 1}</p>
                                {product.pricing?.savings > 0 && (
                                  <span className="text-green-600 text-[10px]">
                                    (Saved: {formatCurrency(product.pricing.savings)})
                                  </span>
                                )}
                              </div>
                              {product.staff && (() => {
                                const staffId = typeof product.staff === 'object' ? product.staff._id : product.staff;
                                const staff = staffDetailsMap[staffId];

                                if (staff) {
                                  return (
                                    <div className="mt-1 flex items-center gap-1">
                                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="text-[10px] font-medium text-green-600">
                                        Sold by: {staff.name}
                                      </span>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(product.pricing?.finalPrice || product.pricing?.totalPrice || 0)}
                              </p>
                              {product.pricing?.basePrice !== product.pricing?.finalPrice && (
                                <p className="text-gray-500 line-through text-[10px]">
                                  {formatCurrency(product.pricing?.basePrice || 0)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memberships */}
                {selectedBill.newMemberships && selectedBill.newMemberships.length > 0 && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                      Memberships ({selectedBill.newMemberships.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedBill.newMemberships.map((membership, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded p-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{membership.name}</p>
                              <div className="flex gap-2 items-center">
                                <p className="text-gray-600">Duration: {membership.duration || 'N/A'}</p>
                                {membership.pricing?.savings > 0 && (
                                  <span className="text-green-600 text-[10px]">
                                    (Saved: {formatCurrency(membership.pricing.savings)})
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(membership.pricing?.finalPrice || membership.pricing?.totalPrice || 0)}
                              </p>
                              {membership.pricing?.basePrice !== membership.pricing?.finalPrice && (
                                <p className="text-gray-500 line-through text-[10px]">
                                  {formatCurrency(membership.pricing?.basePrice || 0)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Payment & Totals */}
              <div className="space-y-2 sm:space-y-3">
                {/* Items Breakdown */}
                {selectedBill.calculations?.items && (
                  <div className="bg-blue-50 rounded-lg border border-blue-200 p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">📊 Items Breakdown</h3>
                    <div className="space-y-1.5 text-[10px] sm:text-xs">
                      {selectedBill.calculations.items.services?.count > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Services ({selectedBill.calculations.items.services.count})</span>
                          <span className="text-blue-700 font-medium">
                            {formatCurrency(selectedBill.calculations.items.services.finalTotal || 0)}
                          </span>
                        </div>
                      )}
                      {selectedBill.calculations.items.products?.count > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Products ({selectedBill.calculations.items.products.count})</span>
                          <span className="text-blue-700 font-medium">
                            {formatCurrency(selectedBill.calculations.items.products.finalTotal || 0)}
                          </span>
                        </div>
                      )}
                      {selectedBill.calculations.items.memberships?.count > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700">Memberships ({selectedBill.calculations.items.memberships.count})</span>
                          <span className="text-blue-700 font-medium">
                            {formatCurrency(selectedBill.calculations.items.memberships.finalTotal || 0)}
                          </span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-blue-800 font-semibold">Total Items ({selectedBill.calculations.totals?.totalItems || 0})</span>
                        <span className="text-blue-800 font-bold">
                          {formatCurrency(selectedBill.calculations.totals?.subtotalAfterItemDiscount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Payment</h3>
                  <div className="space-y-2 text-[10px] sm:text-xs">
                    <div>
                      <p className="text-gray-600 mb-0.5">Status</p>
                      {renderPaymentStatus(selectedBill.payment)}
                    </div>
                    {selectedBill.payment?.activePaymentMethods && selectedBill.payment.activePaymentMethods.length > 0 && (
                      <div>
                        <p className="text-gray-600 mb-1">Payment Methods</p>
                        <div className="space-y-1">
                          {selectedBill.payment.activePaymentMethods.map((method, index) => (
                            <div key={index} className="flex justify-between items-center bg-white p-1.5 rounded">
                              <span className="font-medium text-gray-700">{method.method}</span>
                              <span className="text-gray-900">{formatCurrency(method.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Paid</span>
                        <span className="font-bold text-sm text-gray-900">
                          {formatCurrency(selectedBill.payment?.totalPaid || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discount Breakdown */}
                {selectedBill.discounts?.hasDiscounts && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-green-900 mb-2">💰 Discount Breakdown</h3>
                    <div className="space-y-1.5 text-[10px] sm:text-xs">
                      {selectedBill.discounts?.membershipDiscount?.applied && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Membership Discount</span>
                          <span className="text-green-700 font-bold">
                            -{formatCurrency(selectedBill.discounts.membershipDiscount.amount || 0)}
                          </span>
                        </div>
                      )}
                      {selectedBill.discounts?.couponDiscount?.applied && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Coupon ({selectedBill.discounts.couponDiscount.code})</span>
                          <span className="text-green-700 font-bold">
                            -{formatCurrency(selectedBill.discounts.couponDiscount.amount || 0)}
                          </span>
                        </div>
                      )}
                      {selectedBill.discounts?.walletUsed && (
                        <div className="flex justify-between items-center">
                          <span className="text-green-700">Wallet Used</span>
                          <span className="text-green-700 font-bold">✓</span>
                        </div>
                      )}
                      <div className="pt-1.5 border-t border-green-200 flex justify-between items-center">
                        <span className="text-green-800 font-semibold">Total Discount</span>
                        <span className="text-green-800 font-bold">
                          -{formatCurrency(selectedBill.discounts.totalDiscountAmount || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bill Summary */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Bill Summary</h3>
                  <div className="space-y-1.5 text-[10px] sm:text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal (Before Discount)</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedBill.calculations?.totals?.subtotalBeforeDiscount || 0)}
                      </span>
                    </div>
                    {selectedBill.calculations?.totals?.totalItemDiscount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Item Discount</span>
                        <span>-{formatCurrency(selectedBill.calculations?.totals?.totalItemDiscount || 0)}</span>
                      </div>
                    )}
                    {selectedBill.calculations?.totals?.couponDiscount > 0 && (
                      <div className="flex justify-between items-center text-purple-600">
                        <span>Coupon Discount</span>
                        <span>-{formatCurrency(selectedBill.calculations?.totals?.couponDiscount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">After Discount</span>
                      <span className="text-gray-900">
                        {formatCurrency(selectedBill.calculations?.totals?.subtotalAfterCoupon || 0)}
                      </span>
                    </div>
                    {selectedBill.calculations?.totals?.gstAmount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">
                          GST {selectedBill.tax?.taxIncluded ? '(Included)' : ''} ({selectedBill.calculations?.totals?.gstPercentage || 0}%)
                        </span>
                        <span className="text-gray-900">
                          {formatCurrency(selectedBill.calculations?.totals?.gstAmount || 0)}
                        </span>
                      </div>
                    )}
                    {selectedBill.calculations?.totals?.roundOffAmount !== 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Round Off</span>
                        <span className="text-gray-900">
                          {formatCurrency(selectedBill.calculations?.totals?.roundOffAmount || 0)}
                        </span>
                      </div>
                    )}
                    <div className="pt-2 border-t-2 border-gray-300">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm font-semibold text-gray-900">Grand Total</span>
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          {formatCurrency(selectedBill.calculations?.totals?.finalAmount || selectedBill.calculations?.totals?.grandTotal || 0)}
                        </span>
                      </div>
                    </div>
                    {selectedBill.calculations?.totals?.totalSavings > 0 && (
                      <div className="bg-green-50 p-1.5 rounded">
                        <div className="flex justify-between items-center">
                          <span className="text-green-700 font-medium">🎉 You Saved</span>
                          <span className="text-green-700 font-bold">
                            {formatCurrency(selectedBill.calculations?.totals?.totalSavings || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedBill.changeReturned > 0 && (
                      <div className="bg-blue-50 p-1.5 rounded mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 font-medium">Change Returned</span>
                          <span className="text-blue-700 font-bold">
                            {formatCurrency(selectedBill.changeReturned || 0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {selectedBill.remarks && (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 sm:p-3">
                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">Remarks</h3>
                    <p className="text-[10px] sm:text-xs text-gray-700">{selectedBill.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
}

export default BillMaster;
