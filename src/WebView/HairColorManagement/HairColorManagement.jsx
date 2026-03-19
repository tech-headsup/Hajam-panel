import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import AppInput from '../../components/AppInput/AppInput';
import TextArea from '../../components/AppInput/TextArea';
import AppButton from '../../components/AppButton/AppButton';
import FileuploadComp from '../../components/SingleFileUpload/FileuploadComp';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson, setApiErrorJson } from '../../redux/Actions/ApiAction';
import { Scissors, Percent, Plus, AlertCircle, CheckCircle, Clock, DollarSign, Tag, ToggleLeft, ToggleRight, User, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSelectedUnit } from '../../storage/Storage';
import { HitApi } from '../../Api/ApiHit';
import { addHairColorService, updateHairColorService, searchHairColorService } from '../../constant/Constant';
import CascadingProductSelector from '../../components/CascadingProductSelector/CascadingProductSelector';

// Service category options
const categoryOptions = [
  { label: 'Single Color', value: 'single_color' },
  { label: 'Double Color', value: 'double_color' },
];

function HairColorManagement() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id: urlId } = useParams();
    const ApiReducer = useSelector((state) => state.ApiReducer);

    const [ratios, setRatios] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const initialData = {
        serviceName: '',
        description: '',
        img: '',
        category: '',
        gender: 'Unisex',
        duration: '',
        priceShort: '',
        priceMedium: '',
        priceLong: '',
    };

    // Initialize or load data for edit
    useEffect(() => {
        if (urlId) {
            setIsEditMode(true);
            loadServiceData();
        } else {
            dispatch(setApiJson(initialData));
            dispatch(setApiErrorJson({}));
        }
    }, [urlId]);

    const loadServiceData = () => {
        setIsLoadingData(true);
        const json = {
            page: 1,
            limit: 1,
            search: urlId,
        };

        HitApi({ _id: urlId, page: 1, limit: 1 }, searchHairColorService).then((res) => {
            if (res?.statusCode === 200) {
                const serviceData = res?.data?.docs?.[0];
                if (serviceData) {
                    dispatch(setApiJson({
                        serviceName: serviceData.serviceName || '',
                        description: serviceData.description || '',
                        img: serviceData.img || '',
                        category: serviceData.category || '',
                        gender: serviceData.gender || 'Unisex',
                        duration: serviceData.duration || '',
                        priceShort: serviceData.pricing?.short || '',
                        priceMedium: serviceData.pricing?.medium || '',
                        priceLong: serviceData.pricing?.long || '',
                    }));
                    setIsActive(serviceData.isActive !== false);
                    if (serviceData.ratios && serviceData.ratios.length > 0) {
                        setRatios(serviceData.ratios.map((r, i) => {
                            // productId comes populated from API with hierarchy fields
                            const prod = typeof r.productId === 'object' && r.productId ? r.productId : null;
                            return {
                                name: r.colorName || `Product ${i + 1}`,
                                percentage: r.percentage || 0,
                                developer: r.developer || '',
                                productId: prod?._id || r.productId || '',
                                productName: prod?.productName || r.productName || '',
                                brand: prod?.brand || r.brand || '',
                                productGroupId: prod?.productGroupId || '',
                                productCategoryId: prod?.productCategoryId || '',
                                productSubCategoryId: prod?.productSubCategoryId || '',
                                productBrandId: prod?.productBrandId || '',
                            };
                        }));
                    }
                } else {
                    toast.error('Service not found');
                    navigate('/service-color');
                }
            } else {
                toast.error('Failed to load service data');
                navigate('/service-color');
            }
        }).catch((error) => {
            console.error("Error loading service data:", error);
            toast.error('Error loading service data.');
            navigate('/service-color');
        }).finally(() => {
            setIsLoadingData(false);
        });
    };

    // Handle category change - auto set ratios
    const handleCategoryChange = (value) => {
        dispatch(setApiJson({ ...ApiReducer.apiJson, category: value }));
        if (value === 'single_color') {
            setRatios([{ name: 'Product 1', percentage: 100, developer: '', productId: '', productName: '', brand: '', productGroupId: '', productCategoryId: '', productSubCategoryId: '', productBrandId: '' }]);
        } else if (value === 'double_color') {
            setRatios([
                { name: 'Product 1', percentage: '', developer: '', productId: '', productName: '', brand: '', productGroupId: '', productCategoryId: '', productSubCategoryId: '', productBrandId: '' },
                { name: 'Product 2', percentage: '', developer: '', productId: '', productName: '', brand: '', productGroupId: '', productCategoryId: '', productSubCategoryId: '', productBrandId: '' },
            ]);
        }
    };

    // Calculate total percentage
    const totalPercentage = ratios.reduce((sum, r) => sum + (parseFloat(r.percentage) || 0), 0);
    const isPercentageValid = totalPercentage === 100;
    const hasRatios = ratios.length > 0;
    const isSingleColor = ApiReducer?.apiJson?.category === 'single_color';

    // Handle percentage change - auto-fill remaining for double color
    const handlePercentageChange = (index, value) => {
        if (value === '') {
            setRatios(prev => prev.map((r, i) => i === index ? { ...r, percentage: '' } : r));
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 100) return;

        setRatios(prev => {
            const updated = prev.map((r, i) => i === index ? { ...r, percentage: numValue } : r);
            // Auto-fill the other one if only 2 ratios
            if (updated.length === 2) {
                const otherIndex = index === 0 ? 1 : 0;
                const remaining = 100 - numValue;
                updated[otherIndex] = { ...updated[otherIndex], percentage: remaining >= 0 ? remaining : 0 };
            }
            return updated;
        });
    };

    // Handle product select for a ratio
    const handleProductSelect = (index, product) => {
        setRatios(prev => prev.map((r, i) => i === index ? {
            ...r,
            productId: product.productId || '',
            productName: product.productName || '',
            brand: product.brand || '',
            productGroupId: product.productGroupId || '',
            productCategoryId: product.productCategoryId || '',
            productSubCategoryId: product.productSubCategoryId || '',
            productBrandId: product.productBrandId || '',
        } : r));
    };

    // Clear product from a ratio
    const handleProductClear = (index) => {
        setRatios(prev => prev.map((r, i) => i === index ? {
            ...r,
            productId: '',
            productName: '',
            brand: '',
            productGroupId: '',
            productCategoryId: '',
            productSubCategoryId: '',
            productBrandId: '',
        } : r));
    };

    // Handle developer gm change
    const handleDeveloperChange = (index, value) => {
        if (value === '') {
            setRatios(prev => prev.map((r, i) => i === index ? { ...r, developer: '' } : r));
            return;
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) return;
        setRatios(prev => prev.map((r, i) => i === index ? { ...r, developer: numValue } : r));
    };

    // Auto-fill percentage for single ratio
    const handleAutoFillPercentage = (index) => {
        if (ratios.length === 1) {
            setRatios(prev => prev.map((r, i) => i === index ? { ...r, percentage: 100 } : r));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {};
        const data = ApiReducer?.apiJson;

        if (!data?.serviceName || data.serviceName.trim() === '') {
            errors.serviceName = 'Service name is required';
        }
        if (!data?.category) {
            errors.category = 'Service category is required';
        }
        if (!data?.duration || data.duration <= 0) {
            errors.duration = 'Service duration is required';
        }
        if (!data?.priceShort || data.priceShort <= 0) {
            errors.priceShort = 'Short hair price is required';
        }
        if (!data?.priceMedium || data.priceMedium <= 0) {
            errors.priceMedium = 'Medium hair price is required';
        }
        if (!data?.priceLong || data.priceLong <= 0) {
            errors.priceLong = 'Long hair price is required';
        }

        if (Object.keys(errors).length > 0) {
            dispatch(setApiErrorJson(errors));
            toast.error('Please fill all required fields');
            return false;
        }

        if (ratios.length === 0) {
            toast.error('Please add at least one product ratio');
            return false;
        }

        const emptyPercentage = ratios.some(r => r.percentage === '' || r.percentage === undefined);
        if (emptyPercentage) {
            toast.error('Please enter percentage for all product ratios');
            return false;
        }

        if (totalPercentage !== 100) {
            toast.error(`Total percentage must be 100%. Currently ${totalPercentage}%`);
            return false;
        }

        dispatch(setApiErrorJson({}));
        return true;
    };

    // Handle submit
    const handleSubmit = () => {
        if (!validateForm()) return;

        setIsSubmitting(true);

        const data = ApiReducer?.apiJson;

        // Build payload
        const payload = {
            serviceName: data?.serviceName,
            description: data?.description || '',
            img: data?.img || '',
            category: data?.category,
            gender: data?.gender || 'Unisex',
            duration: Number(data?.duration),
            pricing: {
                short: Number(data?.priceShort),
                medium: Number(data?.priceMedium),
                long: Number(data?.priceLong),
            },
            isActive: isActive,
            ratios: ratios.map(r => ({
                colorName: r.name,
                productId: r.productId || undefined,
                productName: r.productName || '',
                brand: r.brand || '',
                percentage: r.percentage,
                developer: Number(r.developer) || 0,
            })),
            unitIds: getSelectedUnit()?._id
        };

        if (isEditMode) {
            payload._id = urlId;
        }

        const apiCall = isEditMode ? updateHairColorService : addHairColorService;
        const successMsg = isEditMode ? 'Service updated successfully!' : 'Service created successfully!';

        HitApi(payload, apiCall).then((res) => {
            if (res?.statusCode === 201 || res?.statusCode === 200) {
                toast.success(res.message || successMsg);
                navigate('/service-color');
            } else {
                toast.error(res?.message || 'Failed to save service');
            }
        }).catch(() => {
            toast.error('Error saving service. Please try again.');
        }).finally(() => {
            setIsSubmitting(false);
        });
    };

    // Get simplified ratio (e.g. 50:50 -> 1:1, 70:30 -> 7:3)
    const getSimplifiedRatio = () => {
        const values = ratios.map(r => r.percentage).filter(v => v > 0);
        if (values.length === 0) return '';
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        const overall = values.reduce((a, b) => gcd(a, b));
        return values.map(v => v / overall).join(' : ');
    };

    // Percentage helpers
    const getPercentageColor = () => {
        if (totalPercentage === 100) return 'bg-green-500';
        if (totalPercentage > 100) return 'bg-red-500';
        return 'bg-blue-500';
    };

    const getPercentageTextColor = () => {
        if (totalPercentage === 100) return 'text-green-600';
        if (totalPercentage > 100) return 'text-red-600';
        return 'text-blue-600';
    };

    return (
        <div className="p-5">
            <PageHeader
                title={isEditMode ? "Edit Hair Color Service" : "Create Hair Color Service"}
                description={isEditMode ? "Update hair color service details" : "Create and manage hair color services with color ratio formulations"}
            />

            {/* ===== SECTION 1: Service Information ===== */}
            <div className="bg-white p-6 md:p-8 border rounded-xl mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Scissors size={20} className="text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">Service Information</h2>
                    </div>
                    {/* Status Toggle */}
                    <button
                        type="button"
                        onClick={() => setIsActive(prev => !prev)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${isActive
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}
                    >
                        {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        {isActive ? 'Active' : 'Inactive'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4">
                    <AppInput
                        title="Service Name"
                        placeholder="e.g. Root Touch Up, Multi Highlight, Balayage"
                        name="serviceName"
                        important={true}
                        icon={<Scissors size={18} />}
                        disabled={isSubmitting}
                        error={!!ApiReducer?.apiJsonError?.serviceName}
                        errormsg={ApiReducer?.apiJsonError?.serviceName}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Category <span className="text-red-500 ml-1">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <Tag size={18} />
                            </div>
                            <select
                                className={`w-full h-11 bg-transparent border rounded-lg transition-colors border-slate-300 hover:border-slate-400 focus:border-blue-500 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 pl-11 pr-3 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                value={ApiReducer?.apiJson?.category || ''}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                disabled={isSubmitting}
                            >
                                <option value="" disabled>Select category</option>
                                {categoryOptions.map((opt, i) => (
                                    <option key={i} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        {ApiReducer?.apiJsonError?.category && (
                            <p className="mt-1 text-sm text-red-500">{ApiReducer.apiJsonError.category}</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                <User size={18} />
                            </div>
                            <select
                                className={`w-full h-11 bg-transparent border rounded-lg transition-colors border-slate-300 hover:border-slate-400 focus:border-blue-500 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 pl-11 pr-3 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                                value={ApiReducer?.apiJson?.gender || 'Unisex'}
                                onChange={(e) => dispatch(setApiJson({ ...ApiReducer.apiJson, gender: e.target.value }))}
                                disabled={isSubmitting}
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Unisex">Unisex</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                    <AppInput
                        title="Service Duration (minutes)"
                        placeholder="e.g. 45, 60, 90"
                        name="duration"
                        important={true}
                        icon={<Clock size={18} />}
                        type="number"
                        min="1"
                        disabled={isSubmitting}
                        error={!!ApiReducer?.apiJsonError?.duration}
                        errormsg={ApiReducer?.apiJsonError?.duration}
                    />
                </div>

                <div className="mb-4">
                    <TextArea
                        title="Description"
                        placeholder="Describe this hair color service..."
                        name="description"
                        rows={3}
                        disabled={isSubmitting}
                    />
                </div>

                <FileuploadComp
                    title="Service Image"
                    name="img"
                    allowed={["img"]}
                    disabled={isSubmitting}
                />
            </div>

            {/* ===== SECTION 2: Hair Length Pricing ===== */}
            <div className="bg-white p-6 md:p-8 border rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-6">
                    <DollarSign size={20} className="text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-800">Hair Length Pricing</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AppInput
                        title="Short Hair Price (₹)"
                        placeholder="e.g. 1500"
                        name="priceShort"
                        important={true}
                        icon={<DollarSign size={18} />}
                        prefix="₹"
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isSubmitting}
                        error={!!ApiReducer?.apiJsonError?.priceShort}
                        errormsg={ApiReducer?.apiJsonError?.priceShort}
                    />
                    <AppInput
                        title="Medium Hair Price (₹)"
                        placeholder="e.g. 2500"
                        name="priceMedium"
                        important={true}
                        icon={<DollarSign size={18} />}
                        prefix="₹"
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isSubmitting}
                        error={!!ApiReducer?.apiJsonError?.priceMedium}
                        errormsg={ApiReducer?.apiJsonError?.priceMedium}
                    />
                    <AppInput
                        title="Long Hair Price (₹)"
                        placeholder="e.g. 3500"
                        name="priceLong"
                        important={true}
                        icon={<DollarSign size={18} />}
                        prefix="₹"
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={isSubmitting}
                        error={!!ApiReducer?.apiJsonError?.priceLong}
                        errormsg={ApiReducer?.apiJsonError?.priceLong}
                    />
                </div>

                <p className="mt-3 text-xs text-gray-400">
                    Set different prices based on hair length for accurate billing
                </p>
            </div>

            {/* ===== SECTION 3: Ratio Formulation ===== */}
            <div className="bg-white p-6 md:p-8 border rounded-xl mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <Percent size={20} className="text-gray-700" />
                        <h2 className="text-lg font-semibold text-gray-800">Ratio Formulation</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Show Ratio like 7:3 */}
                        {hasRatios && ratios.every(r => r.percentage > 0) && (
                            <div className="px-3 py-1.5 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                                {getSimplifiedRatio()}
                            </div>
                        )}
                        {hasRatios && (
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${totalPercentage === 100
                                    ? 'bg-green-50 text-green-700'
                                    : totalPercentage > 100
                                        ? 'bg-red-50 text-red-700'
                                        : 'bg-blue-50 text-blue-700'
                                }`}>
                                {totalPercentage === 100 ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {totalPercentage}% / 100%
                            </div>
                        )}
                    </div>
                </div>

                {/* Ratio List */}
                {ratios.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">
                                Product Ratios ({ratios.length})
                            </span>
                            <span className={`text-xs font-medium ${getPercentageTextColor()}`}>
                                Total: {totalPercentage}%
                            </span>
                        </div>

                        {/* Percentage Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${getPercentageColor()}`}
                                style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                            />
                        </div>

                        {/* Ratio Cards */}
                        {ratios.map((ratio, index) => (
                            <div
                                key={index}
                                className="p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
                            >
                                {/* Row 1: Badge + Percentage + Developer */}
                                <div className="flex items-center gap-3 mb-3">
                                    {/* Number Badge */}
                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 flex-1">{ratio.name}</span>

                                    {/* Percentage Input */}
                                    <div className="relative w-24">
                                        <input
                                            type="number"
                                            value={ratio.percentage}
                                            onChange={(e) => handlePercentageChange(index, e.target.value)}
                                            onFocus={() => handleAutoFillPercentage(index)}
                                            onWheel={(e) => e.target.blur()}
                                            placeholder="0"
                                            min="0"
                                            max="100"
                                            disabled={isSingleColor}
                                            className={`w-full h-9 px-3 pr-8 text-sm text-center font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${isSingleColor ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Percent size={14} className="text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Developer gm Input */}
                                    <div className="relative w-28">
                                        <input
                                            type="number"
                                            value={ratio.developer}
                                            onChange={(e) => handleDeveloperChange(index, e.target.value)}
                                            onWheel={(e) => e.target.blur()}
                                            placeholder="Developer"
                                            min="0"
                                            className="w-full h-9 px-3 pr-9 text-sm text-center font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                            <Percent size={14} className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Cascading Product Selector */}
                                <div className="ml-11">
                                    <CascadingProductSelector
                                        onProductSelect={(product) => handleProductSelect(index, product)}
                                        onProductClear={() => handleProductClear(index)}
                                        disabled={isSubmitting}
                                        initialProductGroupId={ratio.productGroupId}
                                        initialProductCategoryId={ratio.productCategoryId}
                                        initialProductSubCategoryId={ratio.productSubCategoryId}
                                        initialProductBrandId={ratio.productBrandId}
                                        initialProductId={ratio.productId}
                                        initialProductName={ratio.productName}
                                        initialBrand={ratio.brand}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {ratios.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                        <div className="p-3 bg-gray-100 rounded-full mb-3">
                            <Plus size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 mb-1">No product ratios yet</p>
                        <p className="text-xs text-gray-400">Select a category above to auto-set the product ratios</p>
                    </div>
                )}

                {/* Percentage Validation Message */}
                {hasRatios && !isPercentageValid && totalPercentage > 0 && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${totalPercentage > 100
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        <AlertCircle size={16} />
                        {totalPercentage > 100
                            ? `Total percentage exceeds 100% by ${totalPercentage - 100}%. Please adjust.`
                            : `${100 - totalPercentage}% more needed to reach 100%.`
                        }
                    </div>
                )}

                {hasRatios && isPercentageValid && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle size={16} />
                        Ratio formulation is complete (100%)
                    </div>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mb-8">
                <AppButton
                    buttontext={isSubmitting ? "Saving..." : (isEditMode ? "Update Hair Service" : "Create Hair Service")}
                    onClick={handleSubmit}
                    className="px-8 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    disabled={isSubmitting || isLoadingData || !hasRatios || !isPercentageValid}
                    isLoading={isSubmitting}
                    icon={Scissors}
                    iconPosition="left"
                />
            </div>
        </div>
    );
}

export default HairColorManagement;
