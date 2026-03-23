import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
import { Scissors, Package, Trash2, Search, Loader2, Plus, Crown, CreditCard, Smartphone, Banknote, Wallet } from 'lucide-react';
import AppButton from '../../components/AppButton/AppButton';
import HoldBillButton from './HoldBillButton';
import { HitApi } from '../../Api/ApiHit';
// import { searchChild, searchProduct, searchAttendance, addBill, domainId } from '../../constant/Constant';

import { getSelectedUnit, getElevateUser } from '../../storage/Storage';
import toast from 'react-hot-toast';
import ThankYouPage from './ThankYouPage';
import { addBill, domainId, searchAttendance, searchProduct, searchService, searchInventory, sendOtp, verifyOtp } from '../../constant/Constant';

const AddServices = forwardRef(({ selectedClient, selectedPaymentMethod, selectedMembership, appliedCoupon, onPaymentMethodSelect, onServicesUpdate, onPurchaseAmountUpdate, onDiscountStatusUpdate, onBillGenerated, onHoldBill }, ref) => {
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [memberships, setMemberships] = useState([]);

    // Payment split state
    const [paymentSplit, setPaymentSplit] = useState({
        CASH: 0,
        CARD: 0,
        UPI: 0,
        WALLET: 0
    });

    const [couponDiscount, setCouponDiscount] = useState(0);
    const [appliedCouponData, setAppliedCouponData] = useState(null);
    const [activePaymentInput, setActivePaymentInput] = useState(null);
    const [tempAmount, setTempAmount] = useState('');
    const [isGeneratingBill, setIsGeneratingBill] = useState(false);

    // Wallet OTP states
    const [walletOtpSent, setWalletOtpSent] = useState(false);
    const [walletOtpVerified, setWalletOtpVerified] = useState(false);
    const [walletOtp, setWalletOtp] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

    // Thank you page state
    const [showThankYouPage, setShowThankYouPage] = useState(false);
    const [billDataForThankYou, setBillDataForThankYou] = useState(null);

    // Service selection state
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [availableServices, setAvailableServices] = useState([]);
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    // Product selection state
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Staff/User state
    const [availableStaff, setAvailableStaff] = useState([]);

    // Remarks state
    const [remarks, setRemarks] = useState('');

    // Fetch services when dropdown opens or search term changes
    useEffect(() => {
        if (showServiceDropdown) {
            fetchServices();
        }
    }, [showServiceDropdown, serviceSearchTerm]);

    // Fetch products when dropdown opens or search term changes with debouncing
    useEffect(() => {
        if (showProductDropdown) {
            // Add debouncing for text input, but immediate search for barcodes
            const isBarcode = (searchTerm) => {
                if (!searchTerm || typeof searchTerm !== 'string') return false;
                const cleanTerm = searchTerm.trim().replace(/\s+/g, '');
                return /^[A-Z0-9]{6,}$/i.test(cleanTerm) || /^\d{8,}$/.test(cleanTerm);
            };

            // If it looks like a barcode, search immediately
            if (isBarcode(productSearchTerm)) {
                fetchProducts();
            } else {
                // For product names, use debouncing
                const timer = setTimeout(() => {
                    fetchProducts();
                }, 300);
                return () => clearTimeout(timer);
            }
        }
    }, [showProductDropdown, productSearchTerm]);

    // Fetch staff on component mount
    useEffect(() => {
        fetchStaff();
    }, []);

    // Notify parent when services change
    useEffect(() => {
        if (onServicesUpdate) {
            onServicesUpdate(services);
        }
    }, [services, onServicesUpdate]);

    // Notify parent when purchase amount changes
    useEffect(() => {
        const subtotal = calculateSubtotal();
        if (onPurchaseAmountUpdate) {
            onPurchaseAmountUpdate(subtotal);
        }
    }, [services, products, memberships, onPurchaseAmountUpdate]);

    // Calculate discount status helper function
    const calculateDiscountStatus = () => {
        // Calculate total discounts
        const totalServiceBasePrice = services.reduce((sum, service) => sum + ((service.basePrice || 0) * (service.quantity || 1)), 0);
        const totalProductBasePrice = products.reduce((sum, product) => sum + ((product.basePrice || 0) * (product.quantity || 1)), 0);
        const totalMembershipBasePrice = memberships.reduce((sum, membership) => sum + ((membership.purchaseAmount || 0) * (membership.quantity || 1)), 0);

        const totalServicePrice = services.reduce((sum, service) => sum + ((service.price || 0) * (service.quantity || 1)), 0);
        const totalProductPrice = products.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0);
        const totalMembershipPrice = memberships.reduce((sum, membership) => sum + ((membership.price || membership.purchaseAmount || 0) * (membership.quantity || 1)), 0);

        const totalServiceDiscount = totalServiceBasePrice - totalServicePrice;
        const totalProductDiscount = totalProductBasePrice - totalProductPrice;
        const totalMembershipDiscount = totalMembershipBasePrice - totalMembershipPrice;
        const totalDiscount = totalServiceDiscount + totalProductDiscount + totalMembershipDiscount;

        return {
            hasMembershipDiscount: totalDiscount > 0,
            hasCouponDiscount: couponDiscount > 0,
            hasWalletPayment: paymentSplit.WALLET > 0,
            hasMembershipInBilling: memberships.length > 0,
            hasProductsInBilling: products.length > 0
        };
    };

    // Track previous discount status to prevent unnecessary updates
    const prevDiscountStatusRef = useRef();

    // Watch for appliedCoupon prop changes from parent
    useEffect(() => {
        if (!appliedCoupon && appliedCouponData) {
            // Coupon was removed from parent, clear our local data
            setAppliedCouponData(null);
        }
    }, [appliedCoupon, appliedCouponData]);

    // Notify parent when discount status changes
    useEffect(() => {
        const discountStatus = calculateDiscountStatus();

        // Only update if status actually changed
        const prevStatus = prevDiscountStatusRef.current;
        const hasChanged = !prevStatus ||
            prevStatus.hasMembershipDiscount !== discountStatus.hasMembershipDiscount ||
            prevStatus.hasCouponDiscount !== discountStatus.hasCouponDiscount ||
            prevStatus.hasWalletPayment !== discountStatus.hasWalletPayment ||
            prevStatus.hasMembershipInBilling !== discountStatus.hasMembershipInBilling ||
            prevStatus.hasProductsInBilling !== discountStatus.hasProductsInBilling;

        if (hasChanged && onDiscountStatusUpdate) {
            onDiscountStatusUpdate(discountStatus);
            prevDiscountStatusRef.current = discountStatus;
        }
    }, [services, products, memberships, couponDiscount, paymentSplit.WALLET, onDiscountStatusUpdate]);

    // Function to apply membership discount to services
    const applyMembershipDiscount = (membership) => {
        if (!membership || !membership.membershipId) return;

        // Check if wallet payment is active
        const currentStatus = calculateDiscountStatus();
        if (currentStatus.hasWalletPayment) {
            toast.error('Cannot apply membership discount when wallet payment is used');
            return false;
        }

        const membershipData = membership.membershipId;
        const membershipType = membershipData.membershipType;

        let excludedCount = 0;
        let discountedCount = 0;

        // Apply discount to existing services
        const updatedServices = services.map(service => {
            // Check if service is excluded from membership discount
            const isExcluded = membershipData.excludedServices?.includes(service._id);

            if (isExcluded) {
                excludedCount++;
                return service; // No discount for excluded services
            }

            // Apply discount based on membership type
            if (membershipType === 'fix_discount' && membershipData.fixDiscountPercentage) {
                const discountPercentage = membershipData.fixDiscountPercentage;
                const discountedPrice = calculateDiscountedPrice(service.basePrice, 'percentage', discountPercentage);

                discountedCount++;
                return {
                    ...service,
                    discountType: 'percentage',
                    discountValue: discountPercentage,
                    price: discountedPrice,
                    discountSource: `Membership: ${membershipData.name}`
                };
            } else if (membershipType === 'service_discount' && membershipData.serviceDiscounts?.length > 0) {
                // Check if this specific service has a discount
                const serviceDiscount = membershipData.serviceDiscounts.find(sd => sd.serviceId === service._id);
                if (serviceDiscount) {
                    const discountedPrice = calculateDiscountedPrice(service.basePrice, 'percentage', serviceDiscount.discountPercentage);
                    discountedCount++;
                    return {
                        ...service,
                        discountType: 'percentage',
                        discountValue: serviceDiscount.discountPercentage,
                        price: discountedPrice,
                        discountSource: `Membership: ${membershipData.name}`
                    };
                }
            }

            return service; // No discount applied
        });

        setServices(updatedServices);

        // Show appropriate toast messages
        if (discountedCount > 0) {
            toast.success(`${membershipData.name} discount applied to ${discountedCount} service${discountedCount > 1 ? 's' : ''}`);
        }

        if (excludedCount > 0) {
            toast(`${excludedCount} service${excludedCount > 1 ? 's' : ''} excluded from membership discount`, {
                icon: 'ℹ️',
                style: {
                    background: '#f59e0b',
                    color: '#fff',
                },
            });
        }
    };


    // Function to apply coupon discount
    const applyCoupon = (couponData) => {
        // Check if wallet payment is active
        const currentStatus = calculateDiscountStatus();
        if (currentStatus.hasWalletPayment) {
            toast.error('Cannot apply coupon when wallet payment is used');
            return false;
        }

        // Use server-calculated discount amount
        const discountAmount = couponData.discountAmount || 0;

        // Distribute discount equally across all services
        const totalServices = services.length;
        if (totalServices > 0 && discountAmount > 0) {
            const discountPerService = discountAmount / totalServices;

            const updatedServices = services.map(service => {
                const newBasePrice = Math.max(0, (service.basePrice || 0) - discountPerService);
                return {
                    ...service,
                    basePrice: newBasePrice,
                    price: newBasePrice, // Update current price to match new base price
                    couponDiscount: discountPerService,
                    discountSource: service.discountSource === 'Not included'
                        ? `Coupon: ${couponData.code}`
                        : `${service.discountSource} + Coupon: ${couponData.code}`
                };
            });

            setServices(updatedServices);
            toast.success(`Coupon discount of ₹${discountAmount.toFixed(2)} distributed equally across ${totalServices} service${totalServices > 1 ? 's' : ''} (₹${discountPerService.toFixed(2)} each)`);
        }

        // Store the applied coupon data for future service additions
        setAppliedCouponData(couponData);

        // Don't set flat coupon discount anymore since we're distributing it to services
        setCouponDiscount(0);
        return true;
    };

    // Helper function to reapply coupon discount to all services
    const reapplyCouponToAllServices = (servicesList, couponData) => {
        if (!couponData || !couponData.discountAmount || servicesList.length === 0) {
            return servicesList;
        }

        const discountAmount = couponData.discountAmount;
        const totalServices = servicesList.length;
        const discountPerService = discountAmount / totalServices;

        return servicesList.map(service => {
            // If service already has coupon discount, restore original base price first
            let basePrice = service.basePrice || 0;
            if (service.couponDiscount && service.couponDiscount > 0) {
                basePrice = basePrice + service.couponDiscount;
            }

            const newBasePrice = Math.max(0, basePrice - discountPerService);
            return {
                ...service,
                basePrice: newBasePrice,
                price: newBasePrice,
                couponDiscount: discountPerService,
                discountSource: service.discountSource && service.discountSource !== 'Not included' && !service.discountSource.includes('Coupon:')
                    ? `${service.discountSource} + Coupon: ${couponData.code}`
                    : `Coupon: ${couponData.code}`
            };
        });
    };

    // Function to remove coupon discount
    const removeCoupon = () => {
        // Restore original base prices for services that have coupon discount
        const updatedServices = services.map(service => {
            if (service.couponDiscount && service.couponDiscount > 0) {
                const originalBasePrice = (service.basePrice || 0) + service.couponDiscount;
                return {
                    ...service,
                    basePrice: originalBasePrice,
                    price: originalBasePrice, // Restore current price to original base price
                    couponDiscount: 0,
                    discountSource: service.discountSource?.includes('+ Coupon:')
                        ? service.discountSource.split(' + Coupon:')[0]
                        : service.discountSource?.includes('Coupon:')
                            ? 'Not included'
                            : service.discountSource
                };
            }
            return service;
        });

        setServices(updatedServices);
        setCouponDiscount(0);
        setAppliedCouponData(null);
    };

    // Function to remove membership discount from services
    const removeMembershipDiscount = () => {
        // Reset all services to their base price and remove membership discount source
        const updatedServices = services.map(service => {
            if (service.discountSource && service.discountSource.includes('Membership:')) {
                return {
                    ...service,
                    discountType: 'fixed',
                    discountValue: 0,
                    price: service.basePrice,
                    discountSource: 'Not included'
                };
            }
            return service;
        });

        setServices(updatedServices);
        toast.success('Membership discount removed from services');
    };

    // Calculate subtotal (before coupon discount)
    const calculateSubtotal = () => {
        const servicesTotal = services.reduce((sum, service) => sum + ((service.price || 0) * (service.quantity || 1)), 0);
        const productsTotal = products.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0);
        const membershipsTotal = memberships.reduce((sum, membership) => sum + (membership.price || membership.purchaseAmount || 0), 0);

        return servicesTotal + productsTotal + membershipsTotal;
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
        addMembership: (membershipData) => {
            const membershipWithSource = {
                ...membershipData,
                discountSource: 'Not included'
            };
            setMemberships([...memberships, membershipWithSource]);
            toast.success('Membership added to billing');
        },
        applyMembershipDiscount: applyMembershipDiscount,
        removeMembershipDiscount: removeMembershipDiscount,
        applyCoupon: applyCoupon,
        removeCoupon: removeCoupon,
        getDiscountStatus: () => calculateDiscountStatus(),
        getBillData: () => ({
            services,
            products,
            memberships,
            paymentSplit,
            couponDiscount,
            remarks,
            purchaseAmount: grandTotal
        }),
        loadBillData: (billData) => {
            if (billData.services) setServices(billData.services);
            if (billData.products) setProducts(billData.products);
            if (billData.memberships) setMemberships(billData.memberships);
            if (billData.paymentSplit) setPaymentSplit(billData.paymentSplit);
            if (billData.couponDiscount) setCouponDiscount(billData.couponDiscount);
            if (billData.remarks) setRemarks(billData.remarks);
        },
        clearBill: () => {
            setServices([]);
            setProducts([]);
            setMemberships([]);
            setPaymentSplit({ CASH: 0, CARD: 0, UPI: 0, WALLET: 0 });
            setCouponDiscount(0);
            setAppliedCouponData(null);
            setRemarks('');
        }
    }));

    const fetchServices = async () => {
        setIsLoadingServices(true);
        try {
            // Get the serviceGroupId and unitId from the selected unit
            const unit = getSelectedUnit();
            const groupId = unit?.serviceGroupId;
            const unitId = unit?._id;

            const searchObj = {};

            // Add name search if search term exists
            if (serviceSearchTerm) {
                searchObj.$or = [
                    { name: { $regex: serviceSearchTerm, $options: 'i' } }
                ];
            }

            // Add groupId to search
            if (groupId) {
                searchObj.groupId = groupId;
            }

            const json = {
                page: 1,
                limit: 20,
                search: searchObj
            };

            const res = await HitApi(json, searchService);
            if (res?.statusCode === 200) {
                setAvailableServices(Array.isArray(res?.data?.docs) ? res.data.docs : []);
            } else {
                toast.error('Failed to fetch services');
                setAvailableServices([]);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            toast.error('Error fetching services');
            setAvailableServices([]);
        } finally {
            setIsLoadingServices(false);
        }
    };

    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const unit = getSelectedUnit();
            const unitId = unit?._id || unit?.[0];

            const json = {
                page: 1,
                limit: 20,
                search: {
                    unitIds: unitId
                },
                populate: [
                    { path: 'productId', select: 'productName brand productType productImageUrl mrp sellPrice unit netQuantity barcodes vendor' }
                ]
            };

            console.log('🔍 Inventory Search Query:', JSON.stringify(json, null, 2));

            const res = await HitApi(json, searchInventory);

            console.log('📦 Inventory Search Response:', {
                statusCode: res?.statusCode,
                totalDocs: res?.data?.totalDocs,
                foundProducts: res?.data?.docs?.length || 0,
                searchTerm: productSearchTerm
            });

            if (res?.statusCode === 200) {
                let inventoryItems = Array.isArray(res?.data?.docs) ? res.data.docs : [];

                // Filter by search term if provided
                if (productSearchTerm && productSearchTerm.trim()) {
                    const cleanSearchTerm = productSearchTerm.trim().toLowerCase();
                    inventoryItems = inventoryItems.filter(item => {
                        const product = item.productId;
                        if (!product) return false;

                        // Check product name
                        if (product.productName?.toLowerCase().includes(cleanSearchTerm)) return true;
                        // Check brand
                        if (product.brand?.toLowerCase().includes(cleanSearchTerm)) return true;
                        // Check barcode
                        if (product.barcodes?.some(barcode => barcode.includes(cleanSearchTerm))) return true;
                        // Check product type
                        if (product.productType?.toLowerCase().includes(cleanSearchTerm)) return true;

                        return false;
                    });
                }

                // Filter out items with zero or no stock
                inventoryItems = inventoryItems.filter(item => item.qty > 0);

                // Filter to show only Retail vendor products
                inventoryItems = inventoryItems.filter(item => item.productId?.vendor === 'Retail');

                setAvailableProducts(inventoryItems);
                console.log('✅ Inventory products set to state:', inventoryItems.length);
            } else {
                toast.error('Failed to fetch products');
                setAvailableProducts([]);
                console.log('❌ Inventory search failed:', res?.message);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Error fetching products');
            setAvailableProducts([]);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const fetchStaff = async () => {
        try {
            // Create date range for today to get current day attendance
            const today = new Date();
            const startDate = new Date(today);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(today);
            endDate.setHours(23, 59, 59, 999);

            const searchObj = {
                unitIds: getSelectedUnit()?._id,
                created: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            };

            const json = {
                page: 1,
                limit: 100,
                search: searchObj
            };

            const res = await HitApi(json, searchAttendance);

            if (res?.statusCode === 200) {
                const attendanceData = Array.isArray(res?.data?.docs) ? res.data.docs : [];
                // Group attendance records by userId to find the latest punch status for each user
                const userAttendanceMap = new Map();

                attendanceData.forEach(attendance => {
                    const userId = attendance.userId?._id;
                    if (userId) {
                        if (!userAttendanceMap.has(userId)) {
                            userAttendanceMap.set(userId, []);
                        }
                        userAttendanceMap.get(userId).push(attendance);
                    }
                });

                // Extract unique staff who are currently present (have punched in but not out)
                const presentStaff = [];

                userAttendanceMap.forEach((userAttendances, userId) => {
                    // Sort by modified time to get the most recent record
                    const sortedAttendances = userAttendances.sort((a, b) =>
                        new Date(b.modified || b.created) - new Date(a.modified || a.created)
                    );

                    const latestAttendance = sortedAttendances[0];
                    const user = latestAttendance.userId;

                    // Check if user is staff
                    if (user &&
                        (user.userType === "Staff" || user.userType === "staff" || user.userType === "STAFF")) {

                        // Show staff who have punched in today (regardless of punch out status)
                        // This includes both currently present and those who have already punched out
                        const hasPunchedInToday = latestAttendance.punchInTime;

                        if (hasPunchedInToday) {
                            // Add attendance info to user object for display
                            const userWithAttendance = {
                                ...user,
                                attendanceInfo: {
                                    punchInTime: latestAttendance.punchInTime,
                                    punchOutTime: latestAttendance.punchOutTime,
                                    status: latestAttendance.status
                                }
                            };
                            presentStaff.push(userWithAttendance);
                        }
                    }
                });

                setAvailableStaff(presentStaff);
            } else {
                console.error('Failed to fetch staff attendance');
                setAvailableStaff([]);
            }
        } catch (error) {
            console.error('Error fetching staff attendance:', error);
            setAvailableStaff([]);
        }
    };

    const handleAddNewService = () => {
        setShowServiceDropdown(true);
        setServiceSearchTerm('');
    };

    const handleAddNewProduct = () => {
        setShowProductDropdown(true);
        setProductSearchTerm('');
    };

    const handleSelectService = (service) => {
        let newService = {
            _id: service._id,
            name: service.name,
            parentId: service.parentId, // Store parent category information
            duration: service.duration,
            basePrice: service.price || 0, // Original price
            price: service.price || 0, // Final price after discount
            quantity: 1, // Default quantity for services
            discountType: 'fixed', // 'fixed' or 'percentage'
            discountValue: 0,
            discountSource: 'Not included', // Default source
            staff: null, // Will be selected later
            incentive: service.incentive || 0 // Staff incentive amount
        };

        // Apply membership discount if membership is selected
        if (selectedMembership && selectedMembership.membershipId) {
            const membershipData = selectedMembership.membershipId;
            const membershipType = membershipData.membershipType;

            // Check if service is excluded from membership discount
            const isExcluded = membershipData.excludedServices?.includes(service._id);

            if (!isExcluded) {
                // Apply discount based on membership type
                if (membershipType === 'fix_discount' && membershipData.fixDiscountPercentage) {
                    const discountPercentage = membershipData.fixDiscountPercentage;
                    const discountedPrice = calculateDiscountedPrice(newService.basePrice, 'percentage', discountPercentage);

                    newService = {
                        ...newService,
                        discountType: 'percentage',
                        discountValue: discountPercentage,
                        price: discountedPrice,
                        discountSource: `Membership: ${membershipData.name}`
                    };

                    toast.success(`Service added with ${discountPercentage}% membership discount`);
                } else if (membershipType === 'service_discount' && membershipData.serviceDiscounts?.length > 0) {
                    // Check if this specific service has a discount
                    const serviceDiscount = membershipData.serviceDiscounts.find(sd => sd.serviceId === service._id);
                    if (serviceDiscount) {
                        const discountedPrice = calculateDiscountedPrice(newService.basePrice, 'percentage', serviceDiscount.discountPercentage);
                        newService = {
                            ...newService,
                            discountType: 'percentage',
                            discountValue: serviceDiscount.discountPercentage,
                            price: discountedPrice,
                            discountSource: `Membership: ${membershipData.name}`
                        };
                        toast.success(`Service added with ${serviceDiscount.discountPercentage}% membership discount`);
                    } else {
                        toast.success('Service added');
                    }
                } else {
                    toast.success('Service added');
                }
            } else {
                toast(`Service "${service.name}" is excluded from membership discount`, {
                    icon: 'ℹ️',
                    style: {
                        background: '#3b82f6',
                        color: '#fff',
                    },
                });
            }
        } else {
            toast.success('Service added');
        }

        const updatedServices = [...services, newService];

        // If coupon is applied, reapply it to all services (including the new one)
        if (appliedCouponData) {
            const servicesWithCoupon = reapplyCouponToAllServices(updatedServices, appliedCouponData);
            setServices(servicesWithCoupon);
            toast.success(`Service added and coupon redistributed across ${servicesWithCoupon.length} services`);
        } else {
            setServices(updatedServices);
        }

        setShowServiceDropdown(false);
        setServiceSearchTerm('');
    };

    const handleSelectProduct = (product) => {
        const newProduct = {
            _id: product._id,
            name: product.productName || product.name,
            brand: product.brand,
            basePrice: product.sellPrice || product.price || 0, // Original price
            price: product.sellPrice || product.price || 0, // Final price after discount
            mrp: product.mrp || 0,
            costPrice: product.costPrice || 0,
            quantity: 1, // Default quantity
            discountType: 'fixed', // 'fixed' or 'percentage'
            discountValue: 0,
            discountSource: 'Not included', // Default source
            staff: null // Will be selected later
        };
        setProducts([...products, newProduct]);
        setShowProductDropdown(false);
        setProductSearchTerm('');
        toast.success('Product added');
    };

    const handleRemoveService = (index) => {
        const updatedServices = services.filter((_, i) => i !== index);

        // If coupon is applied and there are remaining services, reapply coupon discount
        if (appliedCouponData && updatedServices.length > 0) {
            const servicesWithCoupon = reapplyCouponToAllServices(updatedServices, appliedCouponData);
            setServices(servicesWithCoupon);
            toast.success(`Service removed and coupon redistributed across ${servicesWithCoupon.length} remaining services`);
        } else if (appliedCouponData && updatedServices.length === 0) {
            // If no services remain, clear the coupon
            setServices(updatedServices);
            setAppliedCouponData(null);
            toast.success('Service removed. No services remaining, coupon cleared.');
        } else {
            setServices(updatedServices);
            toast.success('Service removed');
        }
    };

    const handleRemoveProduct = (index) => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
    };

    const handleServiceQuantityChange = (index, newQuantity) => {
        const quantity = parseInt(newQuantity) || 1;
        if (quantity < 1) return;

        const updatedServices = [...services];
        updatedServices[index] = {
            ...updatedServices[index],
            quantity: quantity
        };
        setServices(updatedServices);
    };

    const handleProductQuantityChange = (index, newQuantity) => {
        const quantity = parseInt(newQuantity) || 1;
        if (quantity < 1) return;

        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            quantity: quantity
        };
        setProducts(updatedProducts);
    };

    const calculateDiscountedPrice = (basePrice, discountType, discountValue) => {
        if (discountType === 'percentage') {
            const discountAmount = (basePrice * discountValue) / 100;
            return Math.max(0, basePrice - discountAmount);
        } else {
            return Math.max(0, basePrice - discountValue);
        }
    };

    const handleServiceDiscountTypeChange = (index, newType) => {
        const updatedServices = [...services];
        const service = updatedServices[index];
        updatedServices[index] = {
            ...service,
            discountType: newType,
            price: calculateDiscountedPrice(service.basePrice, newType, service.discountValue)
        };
        setServices(updatedServices);
    };

    const handleServiceDiscountValueChange = (index, newValue) => {
        const value = parseFloat(newValue) || 0;
        if (value < 0) return;

        const updatedServices = [...services];
        const service = updatedServices[index];

        // Validate percentage doesn't exceed 100
        if (service.discountType === 'percentage' && value > 100) {
            toast.error('Discount percentage cannot exceed 100%');
            return;
        }

        updatedServices[index] = {
            ...service,
            discountValue: value,
            price: calculateDiscountedPrice(service.basePrice, service.discountType, value)
        };
        setServices(updatedServices);
    };

    const handleProductDiscountTypeChange = (index, newType) => {
        const updatedProducts = [...products];
        const product = updatedProducts[index];
        updatedProducts[index] = {
            ...product,
            discountType: newType,
            price: calculateDiscountedPrice(product.basePrice, newType, product.discountValue)
        };
        setProducts(updatedProducts);
    };

    const handleProductDiscountValueChange = (index, newValue) => {
        const value = parseFloat(newValue) || 0;
        if (value < 0) return;

        const updatedProducts = [...products];
        const product = updatedProducts[index];

        // Validate percentage doesn't exceed 100
        if (product.discountType === 'percentage' && value > 100) {
            toast.error('Discount percentage cannot exceed 100%');
            return;
        }

        updatedProducts[index] = {
            ...product,
            discountValue: value,
            price: calculateDiscountedPrice(product.basePrice, product.discountType, value)
        };
        setProducts(updatedProducts);
    };

    const handleServicePriceChange = (index, newPrice) => {
        const price = parseFloat(newPrice) || 0;
        if (price < 0) return;

        const updatedServices = [...services];
        updatedServices[index] = {
            ...updatedServices[index],
            price: price
        };
        setServices(updatedServices);
    };

    const handleProductPriceChange = (index, newPrice) => {
        const price = parseFloat(newPrice) || 0;
        if (price < 0) return;

        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            price: price
        };
        setProducts(updatedProducts);
    };

    const handleMembershipPriceChange = (index, newPrice) => {
        const price = parseFloat(newPrice) || 0;
        if (price < 0) return;

        const updatedMemberships = [...memberships];
        updatedMemberships[index] = {
            ...updatedMemberships[index],
            price: price
        };
        setMemberships(updatedMemberships);
    };

    const handleServiceStaffChange = (index, staffId) => {
        const selectedStaff = availableStaff.find(s => s._id === staffId);
        const updatedServices = [...services];
        updatedServices[index] = {
            ...updatedServices[index],
            staff: selectedStaff || null
        };
        setServices(updatedServices);
    };

    const handleProductStaffChange = (index, staffId) => {
        const selectedStaff = availableStaff.find(s => s._id === staffId);
        const updatedProducts = [...products];
        updatedProducts[index] = {
            ...updatedProducts[index],
            staff: selectedStaff || null
        };
        setProducts(updatedProducts);
    };

    const handleRemoveMembership = (index) => {
        const updatedMemberships = memberships.filter((_, i) => i !== index);
        setMemberships(updatedMemberships);
    };

    const handleMembershipStaffChange = (index, staffId) => {
        const selectedStaff = availableStaff.find(s => s._id === staffId);
        const updatedMemberships = [...memberships];
        updatedMemberships[index] = {
            ...updatedMemberships[index],
            staff: selectedStaff || null
        };
        setMemberships(updatedMemberships);
    };

    const handleMembershipDiscountTypeChange = (index, newType) => {
        const updatedMemberships = [...memberships];
        const membership = updatedMemberships[index];
        updatedMemberships[index] = {
            ...membership,
            discountType: newType,
            price: calculateDiscountedPrice(membership.purchaseAmount, newType, membership.discountValue)
        };
        setMemberships(updatedMemberships);
    };

    const handleMembershipDiscountValueChange = (index, newValue) => {
        const value = parseFloat(newValue) || 0;
        if (value < 0) return;

        const updatedMemberships = [...memberships];
        const membership = updatedMemberships[index];

        // Validate percentage doesn't exceed 100
        if (membership.discountType === 'percentage' && value > 100) {
            toast.error('Discount percentage cannot exceed 100%');
            return;
        }

        updatedMemberships[index] = {
            ...membership,
            discountValue: value,
            price: calculateDiscountedPrice(membership.purchaseAmount, membership.discountType, value)
        };
        setMemberships(updatedMemberships);
    };

    // Calculate totals
    const totalServicePrice = services.reduce((sum, service) => sum + ((service.price || 0) * (service.quantity || 1)), 0);
    const totalProductPrice = products.reduce((sum, product) => sum + ((product.price || 0) * (product.quantity || 1)), 0);
    const totalMembershipPrice = memberships.reduce((sum, membership) => sum + ((membership.price || membership.purchaseAmount || 0) * (membership.quantity || 1)), 0);

    // Calculate base totals (before discount)
    const totalServiceBasePrice = services.reduce((sum, service) => sum + ((service.basePrice || 0) * (service.quantity || 1)), 0);
    const totalProductBasePrice = products.reduce((sum, product) => sum + ((product.basePrice || 0) * (product.quantity || 1)), 0);
    const totalMembershipBasePrice = memberships.reduce((sum, membership) => sum + ((membership.purchaseAmount || 0) * (membership.quantity || 1)), 0);

    // Calculate total discounts
    const totalServiceDiscount = totalServiceBasePrice - totalServicePrice;
    const totalProductDiscount = totalProductBasePrice - totalProductPrice;
    const totalMembershipDiscount = totalMembershipBasePrice - totalMembershipPrice;
    const totalDiscount = totalServiceDiscount + totalProductDiscount + totalMembershipDiscount;

    const subtotal = totalServicePrice + totalProductPrice + totalMembershipPrice;
    const subtotalAfterCoupon = subtotal - couponDiscount;

    // Get unit data to check GST settings
    const unit = getSelectedUnit();
    let gstAmount = 0;
    let totalWithGst = subtotalAfterCoupon;

    // Calculate GST if prices are exclusive of taxes
    if (unit?.priceAreInclusiveTaxes === false && unit?.gstPercentage) {
        gstAmount = (subtotalAfterCoupon * unit.gstPercentage) / 100;
        totalWithGst = subtotalAfterCoupon + gstAmount;
    }

    // Round-off logic to make bill multiple of 10
    const roundedTotal = Math.round(totalWithGst / 10) * 10;
    const roundOffAmount = roundedTotal - totalWithGst;
    const grandTotal = roundedTotal;

    // Check if any discounts are active (membership, coupon, or wallet)
    const hasMembershipDiscount = totalDiscount > 0;
    const hasCouponDiscount = couponDiscount > 0;
    const hasWalletPayment = paymentSplit.WALLET > 0;
    const hasMembershipInBilling = memberships.length > 0;
    const hasProductsInBilling = products.length > 0;
    const hasAnyDiscount = hasMembershipDiscount || hasCouponDiscount || hasWalletPayment;

    // Calculate total paid and remaining amount
    const totalPaid = paymentSplit.CASH + paymentSplit.CARD + paymentSplit.UPI + paymentSplit.WALLET;
    const remainingAmount = grandTotal - totalPaid;

    // Get wallet balance from selected client
    const walletBalance = selectedClient?.walletId?.balance || 0;

    // Handle auto-fill remaining amount when input is focused
    const handlePaymentInputFocus = (method) => {
        const currentTotal = Object.entries(paymentSplit)
            .filter(([key]) => key !== method)
            .reduce((sum, [, value]) => sum + value, 0);

        const remainingAmount = grandTotal - currentTotal;

        // Only auto-fill if there's a remaining amount and current input is empty or zero
        if (remainingAmount > 0 && (!paymentSplit[method] || paymentSplit[method] === 0)) {
            // Special handling for wallet - check if wallet usage is allowed and has sufficient balance
            if (method === 'WALLET') {
                if (hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount) {
                    toast.error('Wallet can only be used for services. Cannot be used when products/memberships are added or when discounts are applied');
                    return;
                }

                if (walletBalance === 0) {
                    toast.error('Wallet balance is zero');
                    return;
                }

                // Use the minimum of remaining amount and wallet balance
                const amountToFill = Math.min(remainingAmount, walletBalance);
                setPaymentSplit(prev => ({
                    ...prev,
                    [method]: amountToFill
                }));
            } else {
                // For other payment methods, fill the full remaining amount
                setPaymentSplit(prev => ({
                    ...prev,
                    [method]: remainingAmount
                }));
            }
        }
    };

    const handlePaymentAmountChange = (method, amount) => {
        const numAmount = parseFloat(amount) || 0;
        const currentTotal = Object.entries(paymentSplit)
            .filter(([key]) => key !== method)
            .reduce((sum, [, value]) => sum + value, 0);

        // Allow cash overpayment for change scenarios, but limit other payment methods
        if (method !== 'CASH' && currentTotal + numAmount > grandTotal) {
            toast.error('Total payment cannot exceed grand total (except cash for change)');
            return;
        }

        // Restrict wallet usage when products/memberships are in billing, membership discounts, or coupon discounts are active
        if (method === 'WALLET' && (hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount) && numAmount > 0) {
            toast.error('Wallet can only be used for services. Cannot be used when products/memberships are added or when discounts are applied');
            return;
        }

        // Check if wallet amount exceeds wallet balance
        if (method === 'WALLET' && numAmount > walletBalance) {
            toast.error(`Wallet balance insufficient. Available: ₹${walletBalance.toFixed(2)}`);
            return;
        }

        setPaymentSplit(prev => ({
            ...prev,
            [method]: numAmount
        }));

        // Reset wallet OTP state if wallet amount is cleared
        if (method === 'WALLET' && numAmount === 0) {
            setWalletOtpSent(false);
            setWalletOtpVerified(false);
            setWalletOtp('');
        }

        // Update parent if all payment methods are used
        if (onPaymentMethodSelect) {
            const activeMethods = Object.entries({ ...paymentSplit, [method]: numAmount })
                .filter(([, value]) => value > 0)
                .map(([key]) => key);

            if (activeMethods.length > 0) {
                onPaymentMethodSelect(activeMethods.join(','));
            }
        }
    };

    const handleSendWalletOtp = async () => {
        const phoneNumber = selectedClient?.phoneNumber;
        if (!phoneNumber) {
            toast.error('Client phone number not found');
            return;
        }
        try {
            setIsSendingOtp(true);
            const result = await HitApi({ phoneNumber }, sendOtp);
            if (result?.statusCode === 200 || result?.statusCode === 201) {
                setWalletOtpSent(true);
                setWalletOtp('');
                toast.success('OTP sent to ' + phoneNumber);
            } else {
                toast.error(result?.message || 'Failed to send OTP');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyWalletOtp = async () => {
        if (walletOtp.length < 4) {
            toast.error('Please enter valid OTP');
            return;
        }
        const phoneNumber = selectedClient?.phoneNumber;
        try {
            setIsVerifyingOtp(true);
            const result = await HitApi({ phoneNumber, otp: walletOtp }, verifyOtp);
            if (result?.statusCode === 200 || result?.statusCode === 201) {
                setWalletOtpVerified(true);
                toast.success('Wallet OTP verified successfully');
            } else {
                toast.error(result?.message || 'Invalid OTP. Please try again.');
                setWalletOtp('');
            }
        } catch (error) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsVerifyingOtp(false);
        }
    };

    const handleGenerateBill = async () => {
        // Validation: Check if client is selected
        if (!selectedClient) {
            toast.error('Please select a client before generating bill');
            return;
        }

        // Validation: wallet OTP must be verified if wallet is used
        if (paymentSplit.WALLET > 0 && !walletOtpVerified) {
            toast.error('Please verify OTP to use wallet payment');
            return;
        }

        // Validation: Check if payment is complete
        const totalPaid = paymentSplit.CASH + paymentSplit.CARD + paymentSplit.UPI + paymentSplit.WALLET;

        if (totalPaid === 0) {
            toast.error('Please add payment amount');
            return;
        }

        if (totalPaid < grandTotal) {
            toast.error(`Payment incomplete. Remaining: ₹${(grandTotal - totalPaid).toFixed(2)}`);
            return;
        }

        // Validation: Check if staff is selected for all services
        const servicesWithoutStaff = services.filter(service => !service.staff);
        if (servicesWithoutStaff.length > 0) {
            toast.error('Please select staff for all services before generating bill');
            return;
        }

        //new

        // Generate comprehensive billing data with all details
        const billingData = {
            // Transaction Metadata
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            billNumber: `BILL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            timestamp: new Date().toISOString(),
            date: Date.now(), // Unix timestamp in milliseconds
            billDate: new Date().toLocaleDateString('en-IN'),
            billTime: new Date().toLocaleTimeString('en-IN'),

            // Client Information - Complete Details (matching API response structure)
            client: {
                // Core Client Identity
                _id: selectedClient?._id,
                id: selectedClient?._id, // Keep both for compatibility
                name: selectedClient?.name,
                phoneNumber: selectedClient?.phoneNumber,
                gender: selectedClient?.gender,
                ageGroup: selectedClient?.ageGroup,
                customerType: selectedClient?.customerType,
                clientType: selectedClient?.clientType || 'Regular',
                // Customer Analytics
                totalVisit: selectedClient?.totalVisit || 0,
                points: selectedClient?.points || 0,
                createdAt: selectedClient?.createdAt,
                // Wallet Information - Include if available
                walletId: selectedClient?.walletId ? {
                    _id: selectedClient.walletId._id,
                    balance: selectedClient.walletId.balance || 0,
                    totalCredits: selectedClient.walletId.totalCredits || 0,
                    totalDebits: selectedClient.walletId.totalDebits || 0,
                    isActive: selectedClient.walletId.isActive !== false,
                    isFrozen: selectedClient.walletId.isFrozen === true
                } : null


            },

            // Selected Membership ObjectId (if any)
            selectedMembership: selectedMembership ? selectedMembership._id : null,

            // Selected Membership Details for display/printing (not sent to backend)
            membershipDetails: selectedMembership ? {
                id: selectedMembership._id,
                name: selectedMembership.membershipId?.membershipName || selectedMembership.membershipId?.name,
                type: selectedMembership.membershipType,
                startDate: selectedMembership.startDate,
                endDate: selectedMembership.endDate,
                daysRemaining: Math.max(0, Math.ceil((new Date(selectedMembership.endDate) - new Date()) / (1000 * 60 * 60 * 24))),
                discountPercentage: selectedMembership.membershipId?.fixDiscountPercentage,
                valueAddedAmount: selectedMembership.membershipId?.valueAddedAmount,
                excludedServices: selectedMembership.membershipId?.excludedServices || [],
                serviceDiscounts: selectedMembership.membershipId?.serviceDiscounts || []
            } : null,

            // Applied Coupon Details (if any)
            appliedCoupon: appliedCoupon ? {
                code: appliedCoupon.code,
                name: appliedCoupon.name,
                description: appliedCoupon.description,
                discountType: appliedCoupon.discountType,
                discountValue: appliedCoupon.discountValue,
                discountAmount: appliedCoupon.discountAmount,
                finalAmount: appliedCoupon.finalAmount,
                maxDiscountAmount: appliedCoupon.maxDiscountAmount,
                minOrderAmount: appliedCoupon.minOrderAmount,
                appliedAt: appliedCoupon.appliedAt
            } : null,

            // Payment breakdown
            payment: {
                methods: {
                    cash: paymentSplit.CASH,
                    card: paymentSplit.CARD,
                    upi: paymentSplit.UPI,
                    wallet: paymentSplit.WALLET
                },
                activePaymentMethods: Object.entries(paymentSplit)
                    .filter(([, amount]) => amount > 0)
                    .map(([method, amount]) => ({ method, amount })),
                totalPaid: totalPaid,
                paymentStatus: totalPaid >= grandTotal ? 'Paid' : 'Partial',
                remainingAmount: Math.max(0, grandTotal - totalPaid)
            },
            // Services with detailed breakdown
            services: services.map(service => ({
                id: service._id,
                name: service.name,
                category: service.category,
                duration: service.duration,
                quantity: service.quantity,
                pricing: {
                    basePrice: service.basePrice,
                    finalPrice: service.price,
                    totalPrice: service.price * service.quantity,
                    totalBasePrice: service.basePrice * service.quantity,
                    savings: (service.basePrice - service.price) * service.quantity
                },
                discount: service.discountSource || 'Not included',
                staff: service.staff ? service.staff._id : null,
                incentive: service.incentive || 0
            })),
            // Products with detailed breakdown
            products: products.map(product => ({
                id: product._id,
                name: product.name,
                brand: product.brand,
                quantity: product.quantity,
                pricing: {
                    basePrice: product.basePrice,
                    finalPrice: product.price,
                    totalPrice: product.price * product.quantity,
                    totalBasePrice: product.basePrice * product.quantity,
                    mrp: product.mrp,
                    costPrice: product.costPrice,
                    savings: (product.basePrice - product.price) * product.quantity
                },
                discount: product.discountSource || 'Not included',
                staff: product.staff ? product.staff._id : null
            })),
            // Memberships purchased in this transaction
            newMemberships: memberships.map(membership => ({
                id: membership._id,
                membershipId: membership.membershipId,
                name: membership.name || membership.membershipName,
                type: membership.membershipType,
                duration: membership.duration,
                description: membership.description,
                pricing: {
                    purchaseAmount: membership.purchaseAmount,
                    finalPrice: membership.price || membership.purchaseAmount,
                    savings: membership.purchaseAmount - (membership.price || membership.purchaseAmount)
                },
                benefits: {
                    valueAddedAmount: membership.valueAddedAmount,
                    fixDiscountPercentage: membership.fixDiscountPercentage,
                    excludedServices: membership.excludedServices || [],
                    serviceDiscounts: membership.serviceDiscounts || []
                },
                staff: membership.staff ? membership.staff._id : null
            })),
            // Comprehensive calculations
            calculations: {
                items: {
                    services: {
                        count: services.length,
                        baseTotal: totalServiceBasePrice,
                        finalTotal: totalServicePrice,
                        totalDiscount: totalServiceDiscount,
                        discountPercentage: totalServiceBasePrice > 0 ? ((totalServiceDiscount / totalServiceBasePrice) * 100).toFixed(2) : 0
                    },
                    products: {
                        count: products.length,
                        baseTotal: totalProductBasePrice,
                        finalTotal: totalProductPrice,
                        totalDiscount: totalProductDiscount,
                        discountPercentage: totalProductBasePrice > 0 ? ((totalProductDiscount / totalProductBasePrice) * 100).toFixed(2) : 0
                    },
                    memberships: {
                        count: memberships.length,
                        baseTotal: totalMembershipBasePrice,
                        finalTotal: totalMembershipPrice,
                        totalDiscount: totalMembershipDiscount,
                        discountPercentage: totalMembershipBasePrice > 0 ? ((totalMembershipDiscount / totalMembershipBasePrice) * 100).toFixed(2) : 0
                    }
                },
                totals: {
                    totalItems: services.length + products.length + memberships.length,
                    subtotalBeforeDiscount: totalServiceBasePrice + totalProductBasePrice + totalMembershipBasePrice,
                    subtotalAfterItemDiscount: totalServicePrice + totalProductPrice + totalMembershipPrice,
                    totalItemDiscount: totalDiscount,
                    couponDiscount: couponDiscount,
                    subtotalAfterCoupon: subtotalAfterCoupon,
                    gstAmount: gstAmount,
                    gstPercentage: unit?.gstPercentage || 0,
                    priceAreInclusiveTaxes: unit?.priceAreInclusiveTaxes !== false,
                    subtotalWithGst: totalWithGst,
                    roundOffAmount: roundOffAmount,
                    totalDiscount: totalDiscount + couponDiscount,
                    grandTotal: grandTotal,
                    totalSavings: (totalServiceBasePrice + totalProductBasePrice + totalMembershipBasePrice) - grandTotal,
                    finalAmount: grandTotal
                }
            },

            // Discount Summary
            discounts: {
                hasDiscounts: hasMembershipDiscount || hasCouponDiscount,
                membershipDiscount: {
                    applied: hasMembershipDiscount,
                    amount: totalDiscount,
                    source: selectedMembership ? `Membership: ${selectedMembership.membershipId?.membershipName || selectedMembership.membershipId?.name}` : null
                },
                couponDiscount: {
                    applied: hasCouponDiscount,
                    amount: couponDiscount,
                    code: appliedCoupon?.code || null
                },
                walletUsed: hasWalletPayment,
                totalDiscountAmount: totalDiscount + couponDiscount
            },

            // Business Information (can be configured)
            business: {
                name: 'Elevate Lifestyle',
                address: 'Business Address Here',
                phone: 'Business Phone Here',
                email: 'Business Email Here',
                taxId: 'TAX ID Here',
                unitId: selectedClient?.unitId || 'Default Unit'
            },

            // Tax Information (if applicable)
            tax: {
                taxIncluded: unit?.priceAreInclusiveTaxes !== false,
                taxMessage: unit?.priceAreInclusiveTaxes === false ?
                    `Prices exclusive of ${unit?.gstPercentage || 0}% GST` :
                    'Including of all taxes',
                gstApplicable: unit?.priceAreInclusiveTaxes === false && unit?.gstPercentage > 0,
                gstPercentage: unit?.gstPercentage || 0,
                gstAmount: gstAmount,
                taxBreakdown: unit?.priceAreInclusiveTaxes === false && unit?.gstPercentage > 0 ? [{
                    taxType: 'GST',
                    percentage: unit.gstPercentage,
                    amount: gstAmount,
                    taxableAmount: subtotalAfterCoupon
                }] : []
            },

            // Additional Backend Required Fields
            billType: 'QUICK_SALE',
            billStatus: 'COMPLETED',
            createdBy: getElevateUser()?._id || getElevateUser()?.id || '000000000000000000000000',
            unitId: getSelectedUnit()?._id || getSelectedUnit(),
            domainId: domainId, // From constants

            // New Fields
            changeReturned: totalPaid > grandTotal ? totalPaid - grandTotal : 0,
            remarks: remarks.trim() || null
        };

        console.log('=== COMPREHENSIVE BILLING DATA ===');
        console.log(JSON.stringify(billingData, null, 2));
        console.log('===================================');

        // API call to save the bill
        try {
            setIsGeneratingBill(true);
            toast.loading('Generating bill...', { id: 'bill-generation' });

            const response = await HitApi(billingData, addBill);

            if (response?.statusCode === 200 || response?.statusCode === 201) {
                // Bill saved successfully
                toast.success(`Bill generated successfully! Total: ₹${grandTotal.toFixed(2)}`, {
                    id: 'bill-generation',
                    duration: 4000,
                    position: 'top-center'
                });

                // Log successful response
                console.log('=== BILL SAVED SUCCESSFULLY ===');
                console.log('Server Response:', response);
                console.log('Bill ID:', response?.data?._id || response?.data?.id);
                console.log('==============================');

                // Store bill data for thank you page
                setBillDataForThankYou(billingData);

                // Clear local state immediately
                setServices([]);
                setProducts([]);
                setMemberships([]);
                setPaymentSplit({ CASH: 0, CARD: 0, UPI: 0, WALLET: 0 });
                setCouponDiscount(0);
                setRemarks('');

                // Reset parent component states
                if (onBillGenerated) {
                    onBillGenerated(billingData);
                }

                // Show thank you page
                setShowThankYouPage(true);

            } else {
                // Handle API error
                toast.error(response?.message || 'Failed to generate bill. Please try again.', {
                    id: 'bill-generation',
                    duration: 4000
                });

                console.error('=== BILL GENERATION FAILED ===');
                console.error('Server Response:', response);
                console.error('==============================');
            }

        } catch (error) {
            // Handle network or other errors
            console.error('=== BILL GENERATION ERROR ===');
            console.error('Error:', error);
            console.error('============================');

            toast.error('Network error. Please check your connection and try again.', {
                id: 'bill-generation',
                duration: 4000
            });
        } finally {
            setIsGeneratingBill(false);
        }

        // Log bill summary for quick reference
        console.log('=== BILL SUMMARY ===');
        console.log(`Bill Number: ${billingData.billNumber}`);
        console.log(`Client: ${billingData.client.name}`);
        console.log(`Items: ${billingData.calculations.totals.totalItems}`);
        console.log(`Subtotal: ₹${billingData.calculations.totals.subtotalBeforeDiscount.toFixed(2)}`);
        console.log(`Total Discounts: ₹${billingData.calculations.totals.totalDiscount.toFixed(2)}`);
        if (gstAmount > 0) {
            console.log(`GST (${unit?.gstPercentage || 0}%): ₹${gstAmount.toFixed(2)}`);
        }
        console.log(`Grand Total: ₹${billingData.calculations.totals.grandTotal.toFixed(2)}`);
        console.log(`Payment Status: ${billingData.payment.paymentStatus}`);
        console.log('====================');
    };

    const handleThankYouPageClose = () => {
        setShowThankYouPage(false);
        setBillDataForThankYou(null);
    };

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex gap-3">
                <div className="flex-1">
                    <AppButton
                        buttontext="Add Service"
                        onClick={handleAddNewService}
                        icon={Scissors}
                        iconPosition="left"
                        className="w-full"
                    />
                </div>
                <div className="flex-1">
                    <AppButton
                        buttontext="Add Product"
                        onClick={handleAddNewProduct}
                        icon={Package}
                        iconPosition="left"
                        className="w-full"
                        backgroundColor="#10b981"
                        useCustomColors={true}
                    />
                </div>
            </div>

            {!selectedClient && (services.length > 0 || products.length > 0 || memberships.length > 0) && (
                <p className="text-xs text-center text-blue-600 bg-blue-50 py-2 px-4 rounded-lg">
                    💡 Don't forget to select a client before generating the bill
                </p>
            )}

            {/* Service Selection Dropdown */}
            {showServiceDropdown && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Select Service</h3>
                        <button
                            onClick={() => setShowServiceDropdown(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Plus className="h-5 w-5 rotate-45" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                            placeholder="Search services..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Services List */}
                    <div className="max-h-64 overflow-y-auto">
                        {isLoadingServices ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            </div>
                        ) : availableServices.length > 0 ? (
                            <div className="space-y-1">
                                {availableServices.map((service) => {
                                    const isOutOfStock = service.isProductRequired && (!service.inventoryId || service.inventoryId.qty <= 0);
                                    return (
                                        <button
                                            key={service._id}
                                            onClick={() => {
                                                if (isOutOfStock) {
                                                    toast.error(`${service.name} is out of stock`);
                                                    return;
                                                }
                                                handleSelectService(service);
                                            }}
                                            disabled={isOutOfStock}
                                            className={`w-full text-left p-3 rounded-lg transition-colors border border-transparent ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50 hover:border-blue-200'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-medium ${isOutOfStock ? 'text-gray-400' : 'text-gray-900'}`}>{service.name}</p>
                                                        {service.gender && (
                                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                                service.gender === 'Male' ? 'bg-blue-100 text-blue-700' :
                                                                service.gender === 'Female' ? 'bg-pink-100 text-pink-700' :
                                                                'bg-gray-100 text-gray-600'
                                                            }`}>
                                                                {service.gender}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                                        {service.categoryId?.name && (
                                                            <>
                                                                <span>{service.categoryId.name}</span>
                                                                {service.subCategoryId?.name && <span>›</span>}
                                                            </>
                                                        )}
                                                        {service.subCategoryId?.name && (
                                                            <span>{service.subCategoryId.name}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                                        {service.service_time && (
                                                            <span className="text-xs text-gray-500">{service.service_time}</span>
                                                        )}
                                                        {service.isProductRequired && service.inventoryId && (
                                                            <span className={`text-xs px-2 py-0.5 rounded ${service.inventoryId.qty > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                                                Stock: {service.inventoryId.qty || 0}
                                                            </span>
                                                        )}
                                                        {service.isProductRequired && !service.inventoryId && (
                                                            <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                                                                Out of stock
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-semibold ${isOutOfStock ? 'text-gray-400' : 'text-blue-600'}`}>
                                                    ₹{service.price?.toFixed(2) || '0.00'}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-8">No services found</p>
                        )}
                    </div>
                </div>
            )}

            {/* Product Selection Dropdown */}
            {showProductDropdown && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900">Select Product</h3>
                        <button
                            onClick={() => setShowProductDropdown(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <Plus className="h-5 w-5 rotate-45" />
                        </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        />
                    </div>

                    {/* Products List */}
                    <div className="max-h-64 overflow-y-auto">
                        {isLoadingProducts ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                            </div>
                        ) : availableProducts.length > 0 ? (
                            <div className="space-y-1">
                                {availableProducts.map((inventoryItem) => {
                                    const product = inventoryItem.productId;
                                    const stock = inventoryItem.qty || 0;
                                    return (
                                        <button
                                            key={inventoryItem._id}
                                            onClick={() => handleSelectProduct({ ...product, inventoryId: inventoryItem._id, stock: stock })}
                                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-green-200"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">{product?.productName || product?.name || 'Unknown'}</p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {product?.brand && (
                                                            <span className="text-xs text-gray-500">{product.brand}</span>
                                                        )}
                                                        {product?.productType && (
                                                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{product.productType}</span>
                                                        )}
                                                        {product?.vendor && (
                                                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{product.vendor}</span>
                                                        )}
                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${stock > 10 ? 'bg-green-100 text-green-700' : stock > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                                            Stock: {stock}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-3">
                                                    <span className="text-sm font-semibold text-green-600">
                                                        ₹{product?.sellPrice?.toFixed(2) || '0.00'}
                                                    </span>
                                                    {product?.mrp && product.mrp > product.sellPrice && (
                                                        <div className="text-xs text-gray-400 line-through">
                                                            ₹{product.mrp.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-8">No products found</p>
                        )}
                    </div>
                </div>
            )}

            {/* Items Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">

                {(services.length > 0 || products.length > 0 || memberships.length > 0) ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Quantity</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Staff</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Discount Source</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Price</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {/* Services */}
                                {services.map((service, index) => (
                                    <tr key={`service-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <Scissors className="h-4 w-4 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-600">Service</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{service.name}</p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                    {service.parentId?.name && (
                                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                                            {service.parentId.name}
                                                        </span>
                                                    )}
                                                    {service.duration && <span>{service.duration} min</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="1"
                                                value={service.quantity}
                                                onChange={(e) => handleServiceQuantityChange(index, e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={service.staff?._id || ''}
                                                onChange={(e) => handleServiceStaffChange(index, e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="">Select Staff</option>
                                                {availableStaff.map((staff) => {
                                                    const hasPunchedOut = staff.attendanceInfo?.punchOutTime;
                                                    const statusDot = hasPunchedOut ? '🔴' : '🟢';
                                                    const displayText = `${statusDot} ${staff.name}`;

                                                    return (
                                                        <option key={staff._id} value={staff._id}>
                                                            {displayText}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {service.discountSource || 'No Discount'}
                                                    </span>
                                                </div>
                                                {service.discountValue > 0 && (
                                                    <div className="text-xs text-green-600 font-medium">
                                                        {service.discountType === 'percentage' ? `${service.discountValue}% off` : `₹${service.discountValue} off`}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-end space-y-1">
                                                <div className="text-xs text-gray-500">
                                                    Base: <span className="line-through">₹{service.basePrice?.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs text-gray-500">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={service.price || ''}
                                                        onChange={(e) => handleServicePriceChange(index, e.target.value)}
                                                        onWheel={(e) => e.target.blur()}
                                                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                                {service.quantity > 1 && (
                                                    <div className="text-xs text-gray-500">
                                                        Total: ₹{((service.price || 0) * (service.quantity || 1))?.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveService(index)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                type="button"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Products */}
                                {products.map((product, index) => (
                                    <tr key={`product-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <Package className="h-4 w-4 text-green-600" />
                                                <span className="text-xs font-medium text-green-600">Product</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                                {product.brand && (
                                                    <div className="text-xs text-gray-500 mt-1">{product.brand}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="1"
                                                value={product.quantity}
                                                onChange={(e) => handleProductQuantityChange(index, e.target.value)}
                                                onWheel={(e) => e.target.blur()}
                                                className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={product.staff?._id || ''}
                                                onChange={(e) => handleProductStaffChange(index, e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Select Staff</option>
                                                {availableStaff.map((staff) => {
                                                    const hasPunchedOut = staff.attendanceInfo?.punchOutTime;
                                                    const statusDot = hasPunchedOut ? '🔴' : '🟢';
                                                    const displayText = `${statusDot} ${staff.name}`;

                                                    return (
                                                        <option key={staff._id} value={staff._id}>
                                                            {displayText}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {product.discountSource || 'No Discount'}
                                                    </span>
                                                </div>
                                                {product.discountValue > 0 && (
                                                    <div className="text-xs text-green-600 font-medium">
                                                        {product.discountType === 'percentage' ? `${product.discountValue}% off` : `₹${product.discountValue} off`}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-end space-y-1">
                                                <div className="text-xs text-gray-500">
                                                    Base: <span className="line-through">₹{product.basePrice?.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs text-gray-500">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={product.price || ''}
                                                        onChange={(e) => handleProductPriceChange(index, e.target.value)}
                                                        onWheel={(e) => e.target.blur()}
                                                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                                {product.quantity > 1 && (
                                                    <div className="text-xs text-gray-500">
                                                        Total: ₹{((product.price || 0) * (product.quantity || 1))?.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveProduct(index)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                type="button"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {/* Memberships */}
                                {memberships.map((membership, index) => (
                                    <tr key={`membership-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <Crown className="h-4 w-4 text-purple-600" />
                                                <span className="text-xs font-medium text-purple-600">Membership</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{membership.name || membership.membershipName}</p>
                                                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                                    {membership.membershipType && (
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded">
                                                            {membership.membershipType.replace(/_/g, ' ')}
                                                        </span>
                                                    )}
                                                    {membership.duration && membership.duration.value && membership.duration.unit && (
                                                        <span>{membership.duration.value} {membership.duration.unit}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-gray-500">1</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <select
                                                value={membership.staff?._id || ''}
                                                onChange={(e) => handleMembershipStaffChange(index, e.target.value)}
                                                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                            >
                                                <option value="">Select Staff</option>
                                                {availableStaff.map((staff) => {
                                                    const hasPunchedOut = staff.attendanceInfo?.punchOutTime;
                                                    const statusDot = hasPunchedOut ? '🔴' : '🟢';
                                                    const displayText = `${statusDot} ${staff.name}`;

                                                    return (
                                                        <option key={staff._id} value={staff._id}>
                                                            {displayText}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {membership.discountSource || 'No Discount'}
                                                    </span>
                                                </div>
                                                {membership.discountValue > 0 && (
                                                    <div className="text-xs text-green-600 font-medium">
                                                        {membership.discountType === 'percentage' ? `${membership.discountValue}% off` : `₹${membership.discountValue} off`}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col items-end space-y-1">
                                                <div className="text-xs text-gray-500">
                                                    Base: <span className="line-through">₹{membership.purchaseAmount?.toFixed(2)}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs text-gray-500">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={membership.price || membership.purchaseAmount || ''}
                                                        onChange={(e) => handleMembershipPriceChange(index, e.target.value)}
                                                        onWheel={(e) => e.target.blur()}
                                                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => handleRemoveMembership(index)}
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                type="button"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <Scissors className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">
                                No services or products added yet
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Click the buttons above to add items
                            </p>
                        </div>
                    </div>
                )}

                {/* Summary Section */}
                {(services.length > 0 || products.length > 0 || memberships.length > 0) && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
                        <div className="space-y-2">
                            {services.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Services Total ({services.length} items)</span>
                                    <span className="font-semibold text-blue-600">₹{totalServicePrice.toFixed(2)}</span>
                                </div>
                            )}
                            {products.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Products Total ({products.length} items)</span>
                                    <span className="font-semibold text-green-600">₹{totalProductPrice.toFixed(2)}</span>
                                </div>
                            )}
                            {memberships.length > 0 && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Memberships Total ({memberships.length} items)</span>
                                    <span className="font-semibold text-purple-600">₹{totalMembershipPrice.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Discount Sections */}
                            {totalDiscount > 0 && (
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-300">
                                    <span className="text-gray-600">Items Discount</span>
                                    <span className="font-semibold text-red-600">- ₹{totalDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {couponDiscount > 0 && (
                                <div className="flex items-center justify-between text-sm pt-1">
                                    <span className="text-gray-600">Coupon Discount</span>
                                    <span className="font-semibold text-orange-600">- ₹{couponDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* GST display - only if prices are exclusive of taxes */}
                            {unit?.priceAreInclusiveTaxes === false && unit?.gstPercentage && gstAmount > 0 && (
                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-300">
                                    <span className="text-gray-600">GST ({unit.gstPercentage}%)</span>
                                    <span className="font-semibold text-blue-600">+ ₹{gstAmount.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Round-off display */}
                            {Math.abs(roundOffAmount) >= 0.01 && (
                                <div className="flex items-center justify-between text-sm pt-1">
                                    <span className="text-gray-600">Round Off</span>
                                    <span className={`font-semibold ${roundOffAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {roundOffAmount >= 0 ? '+' : ''}₹{roundOffAmount.toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-base pt-2 border-t border-gray-300">
                                <span className="font-semibold text-gray-900">Grand Total</span>
                                <span className="text-xl font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
                            </div>

                            <div className="text-right mt-2">
                                <span className="text-xs text-gray-500 italic">
                                    {unit?.priceAreInclusiveTaxes === false ?
                                        `Prices exclusive of ${unit?.gstPercentage || 0}% GST` :
                                        'Including of all taxes'
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Payment Method & Generate Bill Section */}
                        <div className="mt-4 pt-4 border-t border-gray-300">
                            {/* Payment Split Section - Compact Grid Layout */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-gray-700">Payment Methods</p>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Total: ₹{grandTotal.toFixed(2)}</p>
                                        {remainingAmount > 0 && (
                                            <p className="text-xs font-semibold text-red-600">Remaining: ₹{remainingAmount.toFixed(2)}</p>
                                        )}
                                        {remainingAmount === 0 && totalPaid > 0 && (
                                            <p className="text-xs font-semibold text-green-600">Paid in Full</p>
                                        )}
                                    </div>
                                </div>

                                {/* Single Line Payment Methods */}
                                <div className="flex gap-2">
                                    {/* Cash Payment */}
                                    <div className={`flex-1 flex items-center gap-1 p-2 rounded border transition-all ${paymentSplit.CASH > 0
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 bg-white'
                                        }`}>
                                        <Banknote className={`h-3 w-3 ${paymentSplit.CASH > 0 ? 'text-green-600' : 'text-gray-500'}`} />
                                        <span className="text-xs font-medium text-gray-600 w-8">Cash</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={paymentSplit.CASH || ''}
                                                onChange={(e) => handlePaymentAmountChange('CASH', e.target.value)}
                                                onFocus={() => handlePaymentInputFocus('CASH')}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0"
                                                className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Card Payment */}
                                    <div className={`flex-1 flex items-center gap-1 p-2 rounded border transition-all ${paymentSplit.CARD > 0
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white'
                                        }`}>
                                        <CreditCard className={`h-3 w-3 ${paymentSplit.CARD > 0 ? 'text-blue-600' : 'text-gray-500'}`} />
                                        <span className="text-xs font-medium text-gray-600 w-8">Card</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={paymentSplit.CARD || ''}
                                                onChange={(e) => handlePaymentAmountChange('CARD', e.target.value)}
                                                onFocus={() => handlePaymentInputFocus('CARD')}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0"
                                                className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* UPI Payment */}
                                    <div className={`flex-1 flex items-center gap-1 p-2 rounded border transition-all ${paymentSplit.UPI > 0
                                        ? 'border-purple-500 bg-purple-50'
                                        : 'border-gray-200 bg-white'
                                        }`}>
                                        <Smartphone className={`h-3 w-3 ${paymentSplit.UPI > 0 ? 'text-purple-600' : 'text-gray-500'}`} />
                                        <span className="text-xs font-medium text-gray-600 w-8">UPI</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={paymentSplit.UPI || ''}
                                                onChange={(e) => handlePaymentAmountChange('UPI', e.target.value)}
                                                onFocus={() => handlePaymentInputFocus('UPI')}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0"
                                                className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Wallet Payment */}
                                    <div className={`flex-1 flex items-center gap-1 p-2 rounded border transition-all ${paymentSplit.WALLET > 0
                                        ? 'border-orange-500 bg-orange-50'
                                        : (hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount)
                                            ? 'border-gray-200 bg-gray-50'
                                            : 'border-gray-200 bg-white'
                                        }`}>
                                        <Wallet className={`h-3 w-3 ${paymentSplit.WALLET > 0
                                            ? 'text-orange-600'
                                            : (hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount)
                                                ? 'text-gray-400'
                                                : 'text-gray-500'
                                            }`} />
                                        <span className={`text-xs font-medium w-8 ${(hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount) ? 'text-gray-400' : 'text-gray-600'
                                            }`}>Wallet</span>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                max={walletBalance}
                                                value={paymentSplit.WALLET || ''}
                                                onChange={(e) => handlePaymentAmountChange('WALLET', e.target.value)}
                                                onFocus={() => handlePaymentInputFocus('WALLET')}
                                                onWheel={(e) => e.target.blur()}
                                                placeholder="0"
                                                disabled={walletBalance === 0 || hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount}
                                                className="w-full px-2 py-1 text-xs text-right border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            />
                                        </div>
                                        {walletBalance > 0 && (
                                            <span className={`text-xs ${(hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount) ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                {walletBalance.toFixed(0)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Wallet OTP Section */}
                                {paymentSplit.WALLET > 0 && (
                                    <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded">
                                        {!walletOtpVerified ? (
                                            <>
                                                {!walletOtpSent ? (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-orange-700">OTP verification required for wallet payment</span>
                                                        <button
                                                            onClick={handleSendWalletOtp}
                                                            disabled={isSendingOtp}
                                                            className="ml-2 px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                        >
                                                            {isSendingOtp ? 'Sending...' : 'Send OTP'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs text-orange-700">OTP sent to {selectedClient?.phoneNumber}</span>
                                                            <button
                                                                onClick={handleSendWalletOtp}
                                                                disabled={isSendingOtp}
                                                                className="text-xs text-orange-600 underline disabled:opacity-50"
                                                            >
                                                                {isSendingOtp ? 'Sending...' : 'Resend'}
                                                            </button>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="number"
                                                                value={walletOtp}
                                                                onChange={(e) => setWalletOtp(e.target.value)}
                                                                placeholder="Enter OTP"
                                                                maxLength={6}
                                                                className="flex-1 px-2 py-1 text-xs border border-orange-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            <button
                                                                onClick={handleVerifyWalletOtp}
                                                                disabled={isVerifyingOtp || walletOtp.length < 4}
                                                                className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                                                            >
                                                                {isVerifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex items-center gap-2 text-green-700">
                                                <span className="text-sm">✓</span>
                                                <span className="text-xs font-medium">Wallet OTP verified</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Wallet Restriction Message */}
                                {(hasProductsInBilling || hasMembershipInBilling || hasMembershipDiscount || hasCouponDiscount) && walletBalance > 0 && (
                                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                                        <div className="flex items-center space-x-1">
                                            <span>⚠️</span>
                                            <span>Wallet payment is disabled when {
                                                hasProductsInBilling
                                                    ? 'products are added to billing (wallet only for services)'
                                                    : hasMembershipInBilling
                                                        ? 'membership is added to billing'
                                                        : hasMembershipDiscount
                                                            ? 'membership discount is applied'
                                                            : 'coupon discount is applied'
                                            }</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Remarks Section */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">
                                    Remarks (Optional)
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Add any special notes for this bill..."
                                    className="w-full p-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    maxLength={500}
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="text-xs text-gray-500">Optional field for special instructions</span>
                                    <span className="text-xs text-gray-400">{remarks.length}/500</span>
                                </div>
                            </div>

                            {/* Generate Bill & Hold Bill Buttons */}
                            <div className="flex gap-3">
                                <HoldBillButton
                                    onClick={onHoldBill}
                                    disabled={!selectedClient || (services.length === 0 && products.length === 0 && memberships.length === 0)}
                                />
                                <AppButton
                                    buttontext={isGeneratingBill ? 'Generating Bill...' : 'Generate Bill'}
                                    onClick={handleGenerateBill}
                                    disabled={!selectedClient || totalPaid === 0 || remainingAmount > 0 || isGeneratingBill || services.some(service => !service.staff)}
                                    className="flex-1"
                                    backgroundColor="#6366f1"
                                    useCustomColors={true}
                                />
                            </div>
                            {remainingAmount > 0 && totalPaid > 0 && (
                                <p className="text-xs text-center text-amber-600 mt-2">
                                    Payment incomplete. Please add ₹{remainingAmount.toFixed(2)} more
                                </p>
                            )}
                            {totalPaid === 0 && selectedClient && (
                                <p className="text-xs text-center text-amber-600 mt-2">
                                    Please add payment amount
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Thank You Page Modal */}
            <ThankYouPage
                isOpen={showThankYouPage}
                onClose={handleThankYouPageClose}
                billData={billDataForThankYou}
            />
        </div>
    );
});

AddServices.displayName = 'AddServices';

export default AddServices;
