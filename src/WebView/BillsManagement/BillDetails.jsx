import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { HitApi } from '../../Api/ApiHit';
import { searchUser } from '../../constant/Constant';

function BillDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id } = useParams();
    const billData = location.state?.billData;
    const [staffDetails, setStaffDetails] = useState({});

    // Fetch staff details for all services and products
    useEffect(() => {
        if (!billData) return;

        console.log("=== Bill Data ===", billData);

        const fetchStaffDetails = async () => {
            // Collect all unique staff IDs from services and products
            const staffIds = new Set();

            // Add staff IDs from services
            if (billData.services && Array.isArray(billData.services)) {
                console.log("Services:", billData.services);
                billData.services.forEach(service => {
                    console.log("Service staff:", service.staff);
                    if (service.staff) {
                        const staffId = typeof service.staff === 'object' ? service.staff._id : service.staff;
                        console.log("Extracted staff ID:", staffId);
                        if (staffId) staffIds.add(staffId);
                    }
                });
            }

            // Add staff IDs from products
            if (billData.products && Array.isArray(billData.products)) {
                console.log("Products:", billData.products);
                billData.products.forEach(product => {
                    console.log("Product staff:", product.staff);
                    if (product.staff) {
                        const staffId = typeof product.staff === 'object' ? product.staff._id : product.staff;
                        console.log("Extracted staff ID:", staffId);
                        if (staffId) staffIds.add(staffId);
                    }
                });
            }

            console.log("All Staff IDs to fetch:", Array.from(staffIds));

            // Fetch details for each staff member
            const staffDetailsMap = {};

            for (const staffId of staffIds) {
                try {
                    const json = {
                        page: 1,
                        limit: 1,
                        search: {
                            _id: staffId
                        }
                    };

                    console.log("Fetching staff with ID:", staffId);
                    const res = await HitApi(json, searchUser);
                    console.log("Staff API Response:", res);

                    if (res?.statusCode === 200 && res?.data?.docs?.[0]) {
                        staffDetailsMap[staffId] = res.data.docs[0];
                        console.log("Staff details added:", res.data.docs[0]);
                    }
                } catch (error) {
                    console.error(`Error fetching staff details for ID ${staffId}:`, error);
                }
            }

            console.log("Final staff details map:", staffDetailsMap);
            setStaffDetails(staffDetailsMap);
        };

        fetchStaffDetails();
    }, [billData]);

    if (!billData) {
        return (
            <div className="p-5">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">Bill data not found. Please go back and try again.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-2 text-red-600 hover:text-red-800 underline"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
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
        if (amount === null || amount === undefined) return '₹0.00';
        return `₹${Number(amount).toFixed(2)}`;
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
                {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
            </span>
        );
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${bgColor} ${textColor}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-5">
            <div className="mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                </button>
                <PageHeader
                    title={`Bill Details - ${billData.billNumber || 'N/A'}`}
                    description={`View complete details of bill #${billData.billNumber || 'N/A'}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bill Information */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Bill Number</p>
                                <p className="text-base font-medium text-gray-900">{billData.billNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Transaction ID</p>
                                <p className="text-base font-medium text-gray-900">{billData.transactionId || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date</p>
                                <p className="text-base font-medium text-gray-900">{formatDate(billData.timestamp)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Time</p>
                                <p className="text-base font-medium text-gray-900">{formatTime(billData.timestamp)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Bill Status</p>
                                <div className="mt-1">{renderBillStatus(billData.status)}</div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Bill Type</p>
                                <p className="text-base font-medium text-gray-900">
                                    {billData.billType ? billData.billType.replace(/_/g, ' ') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Client Information */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Client Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="text-base font-medium text-gray-900">{billData.client?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Phone Number</p>
                                <p className="text-base font-medium text-gray-900">{billData.client?.phoneNumber || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Gender</p>
                                <p className="text-base font-medium text-gray-900">{billData.client?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Customer Type</p>
                                <p className="text-base font-medium text-gray-900">{billData.client?.customerType || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    {billData.services && billData.services.length > 0 && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Services ({billData.services.length})
                            </h2>
                            <div className="space-y-3">
                                {billData.services.map((service, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-gray-900">{service.name}</p>
                                                <p className="text-sm text-gray-600">Quantity: {service.quantity || 1}</p>
                                                {(() => {
                                                    if (!service.staff) {
                                                        console.log("No staff for service:", service.name);
                                                        return null;
                                                    }

                                                    const staffId = typeof service.staff === 'object' ? service.staff._id : service.staff;
                                                    console.log("Rendering service staff. ID:", staffId, "StaffDetails:", staffDetails);
                                                    const staff = staffDetails[staffId];
                                                    console.log("Found staff:", staff);

                                                    if (staff) {
                                                        return (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-blue-600">
                                                                    Performed by: {staff.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    } else {
                                                        console.log("Staff not found in staffDetails for ID:", staffId);
                                                        return (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-gray-400">
                                                                    Loading staff info...
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {formatCurrency(service.pricing?.finalPrice || service.pricing?.totalPrice || 0)}
                                                </p>
                                                {service.pricing?.basePrice !== service.pricing?.finalPrice && (
                                                    <p className="text-sm text-gray-500 line-through">
                                                        {formatCurrency(service.pricing?.basePrice || 0)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {service.incentive && (
                                            <div className="mt-2 flex justify-between items-center text-sm">
                                                <span className="text-green-600">Staff Incentive: {service.incentive}%</span>
                                                <span className="text-green-600 font-medium">
                                                    {formatCurrency((service.pricing?.finalPrice || 0) * (service.incentive / 100))}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Products */}
                    {billData.products && billData.products.length > 0 && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Products ({billData.products.length})
                            </h2>
                            <div className="space-y-3">
                                {billData.products.map((product, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{product.name}</p>
                                                <p className="text-sm text-gray-600">Quantity: {product.quantity || 1}</p>
                                                {(() => {
                                                    if (!product.staff) {
                                                        console.log("No staff for product:", product.name);
                                                        return null;
                                                    }

                                                    const staffId = typeof product.staff === 'object' ? product.staff._id : product.staff;
                                                    console.log("Rendering product staff. ID:", staffId, "StaffDetails:", staffDetails);
                                                    const staff = staffDetails[staffId];
                                                    console.log("Found staff:", staff);

                                                    if (staff) {
                                                        return (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-green-600">
                                                                    Sold by: {staff.name}
                                                                </span>
                                                            </div>
                                                        );
                                                    } else {
                                                        console.log("Staff not found in staffDetails for ID:", staffId);
                                                        return (
                                                            <div className="mt-1 flex items-center gap-1.5">
                                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-gray-400">
                                                                    Loading staff info...
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                })()}
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {formatCurrency(product.pricing?.finalPrice || product.pricing?.totalPrice || 0)}
                                                </p>
                                                {product.pricing?.basePrice !== product.pricing?.finalPrice && (
                                                    <p className="text-sm text-gray-500 line-through">
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
                    {billData.newMemberships && billData.newMemberships.length > 0 && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                Memberships ({billData.newMemberships.length})
                            </h2>
                            <div className="space-y-3">
                                {billData.newMemberships.map((membership, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{membership.name}</p>
                                                <p className="text-sm text-gray-600">Duration: {membership.duration || 'N/A'}</p>
                                            </div>
                                            <p className="font-semibold text-gray-900">
                                                {formatCurrency(membership.pricing?.finalPrice || membership.pricing?.totalPrice || 0)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Payment & Totals */}
                <div className="space-y-6">
                    {/* Payment Information */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Status</p>
                                {renderPaymentStatus(billData.payment)}
                            </div>
                            {billData.payment?.activePaymentMethods && billData.payment.activePaymentMethods.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Payment Methods</p>
                                    <div className="space-y-2">
                                        {billData.payment.activePaymentMethods.map((method, index) => (
                                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                                <span className="font-medium text-gray-700">{method.method}</span>
                                                <span className="text-gray-900">{formatCurrency(method.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-gray-700">Total Paid</span>
                                    <span className="font-bold text-lg text-gray-900">
                                        {formatCurrency(billData.payment?.totalPaid || 0)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill Totals */}
                    <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bill Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="text-gray-900">
                                    {formatCurrency(billData.calculations?.totals?.subtotalBeforeDiscount || 0)}
                                </span>
                            </div>
                            {billData.calculations?.totals?.totalDiscount > 0 && (
                                <div className="flex justify-between items-center text-green-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(billData.calculations?.totals?.totalDiscount || 0)}</span>
                                </div>
                            )}
                            {billData.calculations?.totals?.gstAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">GST ({billData.calculations?.totals?.gstPercentage || 0}%)</span>
                                    <span className="text-gray-900">
                                        {formatCurrency(billData.calculations?.totals?.gstAmount || 0)}
                                    </span>
                                </div>
                            )}
                            {billData.appliedCoupon?.code && (
                                <div className="bg-purple-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-purple-700 font-medium">Coupon: {billData.appliedCoupon.code}</span>
                                        <span className="text-purple-700">
                                            -{formatCurrency(billData.appliedCoupon.discountAmount || 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="pt-3 border-t-2 border-gray-300">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900">Grand Total</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {formatCurrency(billData.calculations?.totals?.finalAmount || billData.calculations?.totals?.grandTotal || 0)}
                                    </span>
                                </div>
                            </div>
                            {billData.calculations?.totals?.totalSavings > 0 && (
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-green-700 font-medium">Total Savings</span>
                                        <span className="text-green-700 font-bold">
                                            {formatCurrency(billData.calculations?.totals?.totalSavings || 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    {billData.remarks && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Remarks</h2>
                            <p className="text-gray-700">{billData.remarks}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BillDetails;
