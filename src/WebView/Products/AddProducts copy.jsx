import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import AppInput from '../../components/AppInput/AppInput';
import { useSelector, useDispatch } from 'react-redux';
import TextArea from '../../components/AppInput/TextArea';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import AppButton from '../../components/AppButton/AppButton';
import { HitApi } from '../../Api/ApiHit';
import {
    Package,
    DollarSign,
    Tag,
    Ruler,
    Percent,
} from 'lucide-react';
import { unitOptions } from '../../constant/Options';
import { ProductValidation } from '../../validationscheema/ProductValidation';
import { addProduct, searchGeneralMaster, searchProduct, updateProduct } from '../../constant/Constant';

import { getSelectedUnit } from '../../storage/Storage';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import FileuploadComp from '../../components/SingleFileUpload/FileuploadComp';
import toast from 'react-hot-toast';
import { getErrorMsg, hasError } from '../../utils/utils';

function AddProducts() {
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id: urlId } = useParams();

    const [isEditMode, setIsEditMode] = useState(false);
    const [brandOptionsFromApi, setBrandOptionsFromApi] = useState([]);
    const [vendorOptionsFromApi, setVendorOptionsFromApi] = useState([]);
    const [productTypeOptionsFromApi, setProductTypeOptionsFromApi] = useState([]);
    const [isLoadingOptions, setIsLoadingOptions] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [brandSearch, setBrandSearch] = useState()
    const [productTypeSearch, setProductTypeSearch] = useState()
    const [vendorTypeSearch, setVendorTypeSearch] = useState()

    useEffect(() => {
        getBrandOptions()
        getProductTypeOptions()
        getVendorTypeOptions()
    }, [brandSearch, productTypeSearch, vendorTypeSearch])

    const getBrandOptions = () => {
        var json = {
            page: 1,
            limit: 200,
            search: {
                usedBy: "Brand",
                value: brandSearch
            }
        }

        HitApi(json, searchGeneralMaster).then((res) => {
            if (res?.success && res?.data) {
                // API already returns correct format, just use it directly
                setBrandOptionsFromApi(res.data);
            } else {
                setBrandOptionsFromApi([]);
            }
        }).catch((error) => {
            console.error("Error fetching brand options:", error);
            setBrandOptionsFromApi([]);
            toast.error('Failed to load brand options');
        }).finally(() => {
            setIsLoadingOptions(false);
        });
    }

    const getProductTypeOptions = () => {
        var json = {
            page: 1,
            limit: 500,
            search: {
                usedBy: "ProductType",
                value: productTypeSearch
            }
        }

        HitApi(json, searchGeneralMaster).then((res) => {
            if (res?.success && res?.data) {
                // API already returns correct format, just use it directly
                setProductTypeOptionsFromApi(res.data);
            } else {
                setProductTypeOptionsFromApi([]);
            }
        }).catch((error) => {
            console.error("Error fetching product type options:", error);
            setProductTypeOptionsFromApi([]);
            toast.error('Failed to load product type options');
        }).finally(() => {
            setIsLoadingOptions(false);
        });
    }

    const getVendorTypeOptions = () => {
        var json = {
            page: 1,
            limit: 200,
            search: {
                usedBy: "Vendor",
                value: vendorTypeSearch
            }
        }

        HitApi(json, searchGeneralMaster).then((res) => {
            if (res?.success && res?.data) {
                // API already returns correct format, just use it directly
                setVendorOptionsFromApi(res.data);
            } else {
                setVendorOptionsFromApi([]);
            }
        }).catch((error) => {
            console.error("Error fetching vendor options:", error);
            setVendorOptionsFromApi([]);
            toast.error('Failed to load vendor options');
        }).finally(() => {
            setIsLoadingOptions(false);
        });
    }

    useEffect(() => {
        const initialProductData = {
            productName: "",
            costPrice: "",
            mrp: "", // Changed from fullPrice to mrp
            sellPrice: "",
            description: "",
            brand: "",
            productType: "",
            vendor: "",
            productImageUrl: "",
            unit: "",
            netQuantity: "",
            costPriceDis: "", // Added cost price discount
            sellPriceDis: "" // Added sell price discount
        };

        if (urlId) {
            setIsEditMode(true);
            loadProductData();
        } else {
            dispatch(setApiJson(initialProductData));
            dispatch(setApiErrorJson({}));
        }
    }, [dispatch, urlId]);

    // Auto-calculate cost price based on MRP and discount percentage
    const calculateCostPriceFromDiscount = (mrp, discount) => {
        if (mrp && discount !== "" && !isNaN(parseFloat(discount))) {
            const mrpValue = parseFloat(mrp);
            const discountValue = parseFloat(discount);

            if (!isNaN(mrpValue) && discountValue >= 0 && discountValue <= 100) {
                const calculatedCostPrice = mrpValue - (mrpValue * discountValue / 100);
                return calculatedCostPrice.toFixed(2);
            }
        }
        return "";
    };

    // Auto-calculate cost discount based on MRP and cost price
    const calculateCostDiscountFromPrice = (mrp, costPrice) => {
        if (mrp && costPrice && !isNaN(parseFloat(costPrice))) {
            const mrpValue = parseFloat(mrp);
            const costPriceValue = parseFloat(costPrice);

            if (!isNaN(mrpValue) && mrpValue > 0 && costPriceValue >= 0) {
                const calculatedDiscount = ((mrpValue - costPriceValue) / mrpValue * 100);
                return Math.max(0, Math.min(100, calculatedDiscount)).toFixed(2);
            }
        }
        return "";
    };

    // Auto-calculate sell price based on MRP and discount percentage
    const calculateSellPriceFromDiscount = (mrp, discount) => {
        if (mrp && discount !== "" && !isNaN(parseFloat(discount))) {
            const mrpValue = parseFloat(mrp);
            const discountValue = parseFloat(discount);

            if (!isNaN(mrpValue) && discountValue >= 0 && discountValue <= 100) {
                const calculatedSellPrice = mrpValue - (mrpValue * discountValue / 100);
                return calculatedSellPrice.toFixed(2);
            }
        }
        return "";
    };

    // Auto-calculate sell discount based on MRP and sell price
    const calculateSellDiscountFromPrice = (mrp, sellPrice) => {
        if (mrp && sellPrice && !isNaN(parseFloat(sellPrice))) {
            const mrpValue = parseFloat(mrp);
            const sellPriceValue = parseFloat(sellPrice);

            if (!isNaN(mrpValue) && mrpValue > 0 && sellPriceValue >= 0) {
                const calculatedDiscount = ((mrpValue - sellPriceValue) / mrpValue * 100);
                return Math.max(0, Math.min(100, calculatedDiscount)).toFixed(2);
            }
        }
        return "";
    };

    const handleSubmit = () => {
        setIsSubmitting(true);

        ProductValidation(ApiReducer?.apiJson).then((errors) => {

            console.log("errors", errors);

            dispatch(setApiErrorJson(errors));

            if (Object.keys(errors).length === 0) {
                const productData = {
                    ...ApiReducer.apiJson,
                    id: urlId,
                    unitIds: getSelectedUnit()?._id
                };

                if (isEditMode) {
                    HitApi(productData, updateProduct).then((res) => {
                        if (res?.message === "Product updated successfully" || res?.success) {
                            toast.success('Product updated successfully!');
                            navigate('/products');
                        } else {
                            toast.error(res?.message || "Failed to update product");
                        }
                    }).catch((error) => {
                        console.error("Update error:", error);
                        toast.error("Error updating product. Please try again.");
                    }).finally(() => {
                        setIsSubmitting(false);
                    });
                } else {
                    HitApi(productData, addProduct).then((res) => {
                        if (res?.message === "Product created successfully" || res?.success) {
                            toast.success('Product created successfully!');
                            navigate('/products');
                        } else {
                            toast.error(res?.message || "Failed to create product");
                        }
                    }).catch((error) => {
                        console.error("Create error:", error);
                        toast.error("Error creating product. Please try again.");
                    }).finally(() => {
                        setIsSubmitting(false);
                    });
                }
            } else {
                setIsSubmitting(false);
            }
        }).catch((validationError) => {
            console.error("Validation error:", validationError);
            toast.error('Validation failed. Please check your inputs.');
            setIsSubmitting(false);
        });
    };



    const loadProductData = () => {
        setIsLoadingData(true);
        var json = {
            page: 1,
            limit: 10,
            search: {
                _id: urlId,
                unitIds: getSelectedUnit()?._id
            }
        };

        HitApi(json, searchProduct).then((res) => {
            if (res?.message === "Products retrieved successfully") {
                const productData = res?.data?.[0];

                if (productData) {
                    // Calculate discount percentages if product has prices set but no discount values
                    let updatedProductData = { ...productData };

                    if (productData?.mrp && productData?.costPrice && !productData?.costPriceDis) {
                        updatedProductData.costPriceDis = calculateCostDiscountFromPrice(productData.mrp, productData.costPrice);
                    }

                    if (productData?.mrp && productData?.sellPrice && !productData?.sellPriceDis) {
                        updatedProductData.sellPriceDis = calculateSellDiscountFromPrice(productData.mrp, productData.sellPrice);
                    }

                    dispatch(setApiJson(updatedProductData));
                } else {
                    toast.error('Product not found');
                    navigate('/products');
                }
            } else {
                toast.error('Failed to load product data');
                navigate('/products');
            }
        }).catch((error) => {
            console.error("Error loading product data:", error);
            toast.error('Error loading product data. Please try again.');
            navigate('/products');
        }).finally(() => {
            setIsLoadingData(false);
        });
    };

    const handleDiscountChange = (discountType, value) => {
        // Prevent changes during submission
        if (isSubmitting) return;

        if (discountType === 'cost') {
            const calculatedPrice = calculateCostPriceFromDiscount(ApiReducer.apiJson.mrp, value);
            dispatch(setApiJson({
                ...ApiReducer.apiJson,
                costPriceDis: value,
                costPrice: calculatedPrice
            }));
        } else if (discountType === 'sell') {
            const calculatedPrice = calculateSellPriceFromDiscount(ApiReducer.apiJson.mrp, value);
            dispatch(setApiJson({
                ...ApiReducer.apiJson,
                sellPriceDis: value,
                sellPrice: calculatedPrice
            }));
        }
    };

    const handlePriceChange = (priceType, value) => {
        // Prevent changes during submission
        if (isSubmitting) return;

        if (priceType === 'cost') {
            const calculatedDiscount = calculateCostDiscountFromPrice(ApiReducer.apiJson.mrp, value);
            dispatch(setApiJson({
                ...ApiReducer.apiJson,
                costPrice: value,
                costPriceDis: calculatedDiscount
            }));
        } else if (priceType === 'sell') {
            const calculatedDiscount = calculateSellDiscountFromPrice(ApiReducer.apiJson.mrp, value);
            dispatch(setApiJson({
                ...ApiReducer.apiJson,
                sellPrice: value,
                sellPriceDis: calculatedDiscount
            }));
        }
    };

    const handleMrpChange = (value) => {
        // Prevent changes during submission
        if (isSubmitting) return;

        let updatedData = {
            ...ApiReducer.apiJson,
            mrp: value
        };

        // Recalculate prices if discounts are set
        if (ApiReducer.apiJson.costPriceDis) {
            updatedData.costPrice = calculateCostPriceFromDiscount(value, ApiReducer.apiJson.costPriceDis);
        }
        if (ApiReducer.apiJson.sellPriceDis) {
            updatedData.sellPrice = calculateSellPriceFromDiscount(value, ApiReducer.apiJson.sellPriceDis);
        }

        dispatch(setApiJson(updatedData));
    };

    // Show loading skeleton while data is being loaded
    if (isLoadingData) {
        return (
            <div className="p-5">
                <PageHeader
                    title={isEditMode ? 'Edit Product' : 'Add Product'}
                    description={isEditMode ? 'Update Product Information' : 'Add a new product to your inventory'}
                />
            </div>
        );
    }

    return (
        <div className="p-5">
            <PageHeader
                title={isEditMode ? 'Edit Product' : 'Add Product'}
                description={isEditMode ? 'Update Product Information' : 'Add a new product to your inventory'}
            />

            <div className="bg-white p-8 border rounded-xl mb-6">
                {/* Header with Save Button */}
                <div className="text-lg font-medium mb-5 flex justify-between items-center">
                    <span>Product Information</span>
                </div>

                {/* Product Name Row */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                    <AppInput
                        title="Product Name"
                        placeholder="Product Name"
                        name="productName"
                        important={true}
                        error={hasError('productName', ApiReducer)}
                        errormsg={getErrorMsg('productName', ApiReducer)}
                        icon={<Package size={18} />}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Pricing Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
                        <AppInput
                            title="MRP (Maximum Retail Price)"
                            placeholder="Enter MRP"
                            name="mrp"
                            important={true}
                            error={hasError('mrp', ApiReducer)}
                            errormsg={getErrorMsg('mrp', ApiReducer)}
                            icon={<DollarSign size={18} />}
                            type="number"
                            step="0.01"
                            prefix="₹"
                            value={ApiReducer?.apiJson?.mrp || ""}
                            onChange={(e) => handleMrpChange(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <AppInput
                            title="Cost Price Discount (%)"
                            placeholder="Enter discount percentage"
                            name="costPriceDis"
                            value={ApiReducer?.apiJson?.costPriceDis || ""}
                            onChange={(e) => handleDiscountChange('cost', e.target.value)}
                            icon={<Percent size={18} />}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            suffix="%"
                            disabled={isSubmitting}
                        />

                        <AppInput
                            title="Cost Price"
                            placeholder="Enter cost price or use discount %"
                            name="costPrice"
                            important={true}
                            error={hasError('costPrice', ApiReducer)}
                            errormsg={getErrorMsg('costPrice', ApiReducer)}
                            icon={<DollarSign size={18} />}
                            type="number"
                            step="0.01"
                            prefix="₹"
                            value={ApiReducer?.apiJson?.costPrice || ""}
                            onChange={(e) => handlePriceChange('cost', e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <AppInput
                            title="Selling Price Discount (%)"
                            placeholder="Enter discount percentage"
                            name="sellPriceDis"
                            value={ApiReducer?.apiJson?.sellPriceDis || ""}
                            onChange={(e) => handleDiscountChange('sell', e.target.value)}
                            icon={<Percent size={18} />}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            suffix="%"
                            disabled={isSubmitting}
                        />

                        <AppInput
                            title="Selling Price"
                            placeholder="Enter selling price or use discount %"
                            name="sellPrice"
                            important={true}
                            error={hasError('sellPrice', ApiReducer)}
                            errormsg={getErrorMsg('sellPrice', ApiReducer)}
                            icon={<DollarSign size={18} />}
                            type="number"
                            step="0.01"
                            prefix="₹"
                            value={ApiReducer?.apiJson?.sellPrice || ""}
                            onChange={(e) => handlePriceChange('sell', e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <TextArea
                        title="Description"
                        placeholder="Description"
                        name="description"
                        rows={4}
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <SearchableSelect
                        title="Select Brand"
                        name="brand"
                        options={brandOptionsFromApi}
                        placeholder="Select Brand"
                        icon={<Tag size={18} />}
                        disabled={isLoadingOptions || isSubmitting}
                        searchSlelect={setBrandSearch}
                    />


                    <SearchableSelect
                        title="Select Product Type"
                        name="productType"
                        options={productTypeOptionsFromApi}
                        placeholder="Select Product Type"
                        icon={<Package size={18} />}
                        disabled={isLoadingOptions || isSubmitting}
                        searchSlelect={setProductTypeSearch}
                    />

                    <SearchableSelect
                        title="Select Usage Type"
                        name="vendor"
                        options={vendorOptionsFromApi}
                        placeholder="Select usage type"
                        icon={<Tag size={18} />}
                        disabled={isLoadingOptions || isSubmitting}
                        searchSlelect={setVendorTypeSearch}
                    />

                    <SearchableSelect
                        title="Select Unit"
                        name="unit"
                        options={unitOptions}
                        placeholder="Select Unit"
                        icon={<Ruler size={18} />}
                        specification="Choose the unit of measurement for this product"
                        disabled={isSubmitting}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <AppInput
                        title="Net Quantity"
                        placeholder="Enter net quantity"
                        name="netQuantity"
                        important={true}
                        type="number"
                        disabled={isSubmitting}
                        error={hasError('sellPrice', ApiReducer)}
                        num
                    />
                </div>

                <FileuploadComp
                    title="Product Image URL"
                    name="productImageUrl"
                    allowed={["img"]}
                    disabled={isSubmitting}
                />

                <div className='flex mt-5 justify-end'>
                    <AppButton
                        buttontext={isSubmitting ? "Processing..." : (isEditMode ? "Update Product" : "Add Product")}
                        onClick={handleSubmit}
                        className="px-8 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        disabled={isSubmitting || isLoadingOptions}
                        isLoading={isSubmitting}
                    />
                </div>
            </div>
        </div>
    );
}

export default AddProducts;