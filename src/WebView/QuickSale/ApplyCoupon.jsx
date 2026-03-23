import { useState } from 'react';
import { Ticket, Search, X, CheckCircle } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { validateCoupon } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';

function ApplyCoupon({ selectedClient, onCouponApply, appliedCoupon, onCouponRemove, services, purchaseAmount, disabled }) {
    const [couponCode, setCouponCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCouponInput, setShowCouponInput] = useState(false);

    const validateAndApplyCoupon = async () => {
        if (!couponCode.trim()) {
            toast.error('Please enter a coupon code');
            return;
        }

        if (!selectedClient) {
            toast.error('Please select a client first');
            return;
        }

        setIsLoading(true);
        
        try {
            // Get unit from storage and extract _id
            const selectedUnit = getSelectedUnit();
            const unitId = selectedUnit?._id || selectedUnit;
            
            // Extract service IDs from services array
            const serviceIds = services ? services.map(service => service._id).filter(Boolean) : [];
            
            const json = {
                code: couponCode.trim(),
                unitId: unitId,
                serviceIds: serviceIds,
                purchaseAmount: purchaseAmount || 0
            };

            console.log('Validating coupon with payload:', json);

            const res = await HitApi(json, validateCoupon);

            if (res?.statusCode === 200 && res?.data?.coupon) {
                // Coupon is valid, apply it
                const couponData = {
                    ...res.data.coupon,
                    appliedAt: new Date().toISOString(),
                    discountAmount: res.data.discountAmount,
                    finalAmount: res.data.finalAmount
                };
                
                if (onCouponApply) {
                    onCouponApply(couponData);
                }
                
                setCouponCode('');
                setShowCouponInput(false);
                toast.success(`Coupon "${couponData.code}" applied successfully! You saved ₹${res.data.discountAmount.toFixed(2)}`);
            } else {
                toast.error(res?.data?.message || res?.message || res.error || "Somthing went wrong");
            }
        } catch (error) {
            console.error('Error validating coupon:', error);
            toast.error('Error validating coupon. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const validateCouponConditions = (coupon) => {
        const now = new Date();
        
        // Check if coupon is active
        if (!coupon.isActive) {
            return { isValid: false, message: 'Coupon is not active' };
        }

        // Check validity dates
        if (coupon.validFrom && new Date(coupon.validFrom) > now) {
            return { isValid: false, message: 'Coupon is not yet valid' };
        }

        if (coupon.validUntil && new Date(coupon.validUntil) < now) {
            return { isValid: false, message: 'Coupon has expired' };
        }

        // Check usage limits
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { isValid: false, message: 'Coupon usage limit exceeded' };
        }

        // Check minimum order amount
        if (coupon.minOrderAmount && coupon.minOrderAmount > 0) {
            // This will be validated later when we have the order total
            // For now, we'll assume it's valid and check in the parent component
        }

        return { isValid: true };
    };

    const handleRemoveCoupon = () => {
        if (onCouponRemove) {
            onCouponRemove();
        }
        toast.success('Coupon removed');
    };

    const formatCouponDiscount = (coupon) => {
        if (coupon.discountType === 'percentage') {
            const discountText = `${coupon.discountValue}% off`;
            const maxDiscountText = coupon.maxDiscountAmount ? ` (max ₹${coupon.maxDiscountAmount})` : '';
            return discountText + maxDiscountText;
        } else {
            return `₹${coupon.discountValue} off`;
        }
    };

    return (
        <div className="bg-white p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <Ticket className="h-4 w-4 text-orange-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Apply Coupon</h3>
                </div>
                {appliedCoupon && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-600 rounded">
                        Applied
                    </span>
                )}
            </div>

            {/* Applied Coupon Display */}
            {appliedCoupon ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                                <p className="text-sm font-semibold text-green-800">
                                    {appliedCoupon.code}
                                </p>
                                <p className="text-xs text-green-600">
                                    {formatCouponDiscount(appliedCoupon)}
                                    {appliedCoupon.discountAmount && (
                                        <span className="font-semibold"> • Saved ₹{appliedCoupon.discountAmount}</span>
                                    )}
                                </p>
                                {appliedCoupon.description && (
                                    <p className="text-xs text-green-500 mt-1">
                                        {appliedCoupon.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleRemoveCoupon}
                            className="text-green-600 hover:text-red-600 transition-colors"
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Coupon Input Toggle */}
                    {!showCouponInput ? (
                        <button
                            onClick={() => setShowCouponInput(true)}
                            disabled={!selectedClient || disabled}
                            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-400 hover:text-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-center space-x-2">
                                <Ticket className="h-4 w-4" />
                                <span className="text-sm">
                                    {disabled ? 'Coupon disabled (products/memberships in billing or discounts applied)' : 'Click to apply coupon code'}
                                </span>
                            </div>
                        </button>
                    ) : (
                        /* Coupon Input */
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        placeholder="Enter coupon code"
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                        disabled={isLoading || disabled}
                                        onKeyPress={(e) => e.key === 'Enter' && validateAndApplyCoupon()}
                                    />
                                </div>
                                <button
                                    onClick={validateAndApplyCoupon}
                                    disabled={isLoading || !couponCode.trim() || disabled}
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                >
                                    {isLoading ? 'Checking...' : 'Apply'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCouponInput(false);
                                        setCouponCode('');
                                    }}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            
                            {!selectedClient && (
                                <p className="text-xs text-amber-600">
                                    Please select a client first to apply coupon
                                </p>
                            )}
                            
                            {disabled && (
                                <p className="text-xs text-red-600">
                                    ⚠️ Coupon is disabled when products/memberships are in billing, discounts are applied, or wallet payment is used
                                </p>
                            )}
                            
                            {selectedClient && (!services || services.length === 0) && (
                                <p className="text-xs text-blue-600">
                                    Add services to apply coupon discounts
                                </p>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default ApplyCoupon;