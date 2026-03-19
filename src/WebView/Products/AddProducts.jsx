import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import AppInput from '../../components/AppInput/AppInput';
import { useSelector, useDispatch } from 'react-redux';
import TextArea from '../../components/AppInput/TextArea';
import { setApiErrorJson, setApiJson } from '../../redux/Actions/ApiAction';
import AppButton from '../../components/AppButton/AppButton';
import { HitApi } from '../../Api/ApiHit';
import { Package, DollarSign, Tag, Ruler, Percent } from 'lucide-react';
import { unitOptions } from '../../constant/Options';
import { ProductValidation } from '../../validationscheema/ProductValidation';
import { addProduct, searchProduct, updateProduct } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import SearchableSelect from '../../components/AppSelect/SearchableSelect';
import FileuploadComp from '../../components/SingleFileUpload/FileuploadComp';
import toast from 'react-hot-toast';
import { getErrorMsg, hasError } from '../../utils/utils';
import { fetchGeneralMasterOptions } from '../../utils/genralMasterUtils';

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
    const [brandSearch, setBrandSearch] = useState('');
    const [productTypeSearch, setProductTypeSearch] = useState('');
    const [vendorTypeSearch, setVendorTypeSearch] = useState('');
    const [searchTimeouts, setSearchTimeouts] = useState({});



    console.log("ApiReducer",ApiReducer);
    




    // Load all general master options
    useEffect(() => {
        loadAllOptions();
    }, []);

    // Debounced search effects
    useEffect(() => {
        debouncedLoadBrands(brandSearch);
    }, [brandSearch]);

    useEffect(() => {
        debouncedLoadProductTypes(productTypeSearch);
    }, [productTypeSearch]);

    useEffect(() => {
        debouncedLoadVendors(vendorTypeSearch);
    }, [vendorTypeSearch]);

    const loadAllOptions = async () => {
        setIsLoadingOptions(true);
        try {
            // Pre-fetch all options including Brands
            const [brands, productTypes, vendors] = await Promise.all([
                fetchGeneralMasterOptions('Brand', '', 500),
                fetchGeneralMasterOptions('ProductType', '', 500),
                fetchGeneralMasterOptions('Vendor', '', 200)
            ]);

            setBrandOptionsFromApi(brands);
            setProductTypeOptionsFromApi(productTypes);
            setVendorOptionsFromApi(vendors);
        } catch (error) {
            console.error('Error loading options:', error);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    // Debounced search functions
    const debouncedLoadBrands = (searchValue) => {
        if (searchTimeouts.brand) {
            clearTimeout(searchTimeouts.brand);
        }

        const timeout = setTimeout(async () => {
            try {
                const brands = await fetchGeneralMasterOptions('Brand', searchValue, 500);
                setBrandOptionsFromApi(brands);
            } catch (error) {
                console.error('Error loading brands:', error);
            }
        }, 300);

        setSearchTimeouts(prev => ({ ...prev, brand: timeout }));
    };

    const debouncedLoadProductTypes = (searchValue) => {
        if (searchTimeouts.productType) {
            clearTimeout(searchTimeouts.productType);
        }
        
        const timeout = setTimeout(async () => {
            try {
                const productTypes = await fetchGeneralMasterOptions('ProductType', searchValue, 500);
                setProductTypeOptionsFromApi(productTypes);
            } catch (error) {
                console.error('Error loading product types:', error);
            }
        }, 300);

        setSearchTimeouts(prev => ({ ...prev, productType: timeout }));
    };

    const debouncedLoadVendors = (searchValue) => {
        if (searchTimeouts.vendor) {
            clearTimeout(searchTimeouts.vendor);
        }
        
        const timeout = setTimeout(async () => {
            try {
                const vendors = await fetchGeneralMasterOptions('Vendor', searchValue, 200);
                setVendorOptionsFromApi(vendors);
            } catch (error) {
                console.error('Error loading vendors:', error);
            }
        }, 300);

        setSearchTimeouts(prev => ({ ...prev, vendor: timeout }));
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            Object.values(searchTimeouts).forEach(timeout => {
                if (timeout) clearTimeout(timeout);
            });
        };
    }, [searchTimeouts]);

    useEffect(() => {
        const initialProductData = {
            productName: "",
            costPrice: "",
            mrp: "",
            sellPrice: "",
            description: "",
            brand: "",
            productType: "",
            vendor: "",
            productImageUrl: "",
            unit: "",
            netQuantity: "",
            costPriceDis: "",
            sellPriceDis: ""
        };

        if (urlId) {
            setIsEditMode(true);
            loadProductData();
        } else {
            dispatch(setApiJson(initialProductData));
            dispatch(setApiErrorJson({}));
        }
    }, [dispatch, urlId]);

    // Price calculation helpers
    const calculatePriceFromDiscount = (mrp, discount) => {
        if (mrp && discount !== "" && !isNaN(parseFloat(discount))) {
            const mrpValue = parseFloat(mrp);
            const discountValue = parseFloat(discount);
            if (!isNaN(mrpValue) && discountValue >= 0 && discountValue <= 100) {
                return (mrpValue - (mrpValue * discountValue / 100)).toFixed(2);
            }
        }
        return "";
    };

    const calculateDiscountFromPrice = (mrp, price) => {
        if (mrp && price && !isNaN(parseFloat(price)) && parseFloat(price) > 0) {
            const mrpValue = parseFloat(mrp);
            const priceValue = parseFloat(price);
            if (!isNaN(mrpValue) && mrpValue > 0 && priceValue > 0) {
                const discount = ((mrpValue - priceValue) / mrpValue * 100);
                return Math.max(0, Math.min(100, discount)).toFixed(2);
            }
        }
        return "";
    };

    // Convert text to Title Case (Each Word Capitalized)
    const toTitleCase = (text) => {
        if (!text) return "";
        
        // Handle real-time conversion as user types
        let result = "";
        let shouldCapitalize = true;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === ' ') {
                result += char;
                shouldCapitalize = true;
            } else if (shouldCapitalize) {
                result += char.toUpperCase();
                shouldCapitalize = false;
            } else {
                result += char.toLowerCase();
            }
        }
        
        return result;
    };

    // Handle product name change with Title Case conversion
    const handleProductNameChange = (e) => {
        const inputValue = e.target.value;
        const titleCaseValue = toTitleCase(inputValue);
        
        dispatch(setApiJson({
            ...ApiReducer.apiJson,
            productName: titleCaseValue
        }));
    };

    // Handle MRP change and set selling price discount to 0%
    const handleMrpInputChange = (e) => {
        const value = e.target.value;
        
        // Update MRP and set selling price discount to 0%
        const updatedData = {
            ...ApiReducer.apiJson,
            mrp: value,
            sellPriceDis: "0", // Auto-set selling price discount to 0%
            sellPrice: value // Set selling price same as MRP (0% discount)
        };
        
        dispatch(setApiJson(updatedData));
    };

    const handleSubmit = () => {
        setIsSubmitting(true);

        ProductValidation(ApiReducer?.apiJson).then((errors) => {
            dispatch(setApiErrorJson(errors));
            if (Object.keys(errors).length === 0) {
                const productData = {
                    ...ApiReducer.apiJson,
                    id: urlId,
                    unitIds: getSelectedUnit()?._id
                };

                const apiCall = isEditMode ? updateProduct : addProduct;
                const successMsg = isEditMode ? 'Product updated successfully!' : 'Product created successfully!';

                HitApi(productData, apiCall).then((res) => {
                    // Handle both success field and statusCode (200 for update, 201 for create)
                    if ((res.success && (res.statusCode === 200 || res.statusCode === 201)) ||
                        (res.statusCode === 200 && res.data)) {
                        toast.success(res.message || successMsg);
                        navigate('/products');
                    } else {
                        toast.error(res?.message || "Failed to save product");
                    }
                }).catch((error) => {
                    console.error("Submit error:", error);
                    toast.error("Error saving product. Please try again.");
                }).finally(() => {
                    setIsSubmitting(false);
                });
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
        const json = {
            page: 1,
            limit: 10,
            search: {
                _id: urlId,
                unitIds: getSelectedUnit()?._id
            }
        };

        HitApi(json, searchProduct).then((res) => {
            if (res?.statusCode === 200) {
                const productData = res?.data?.docs?.[0];

                if (productData) {
                    let updatedProductData = { ...productData };

                    if (productData?.mrp && productData?.costPrice && !productData?.costPriceDis) {
                        updatedProductData.costPriceDis = calculateDiscountFromPrice(productData.mrp, productData.costPrice);
                    }

                    if (productData?.mrp && productData?.sellPrice && !productData?.sellPriceDis) {
                        updatedProductData.sellPriceDis = calculateDiscountFromPrice(productData.mrp, productData.sellPrice);
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
        if (isSubmitting) return;

        const calculatedPrice = calculatePriceFromDiscount(ApiReducer.apiJson.mrp, value);
        const field = discountType === 'cost' ? 'costPrice' : 'sellPrice';
        const discountField = discountType === 'cost' ? 'costPriceDis' : 'sellPriceDis';

        dispatch(setApiJson({
            ...ApiReducer.apiJson,
            [discountField]: value,
            [field]: calculatedPrice
        }));
    };

    const handlePriceChange = (priceType, value) => {
        if (isSubmitting) return;

        const calculatedDiscount = calculateDiscountFromPrice(ApiReducer.apiJson.mrp, value);
        const field = priceType === 'cost' ? 'costPrice' : 'sellPrice';
        const discountField = priceType === 'cost' ? 'costPriceDis' : 'sellPriceDis';

        dispatch(setApiJson({
            ...ApiReducer.apiJson,
            [field]: value,
            [discountField]: calculatedDiscount
        }));
    };


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
                <div className="text-lg font-medium mb-5 flex justify-between items-center">
                    <span>Product Information</span>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                    <AppInput
                        title="Product Name"
                        placeholder="Product Name (will be converted to Title Case)"
                        name="productName"
                        important={true}
                        error={hasError('productName', ApiReducer)}
                        errormsg={getErrorMsg('productName', ApiReducer)}
                        icon={<Package size={18} />}
                        disabled={isSubmitting}
                        value={ApiReducer?.apiJson?.productName || ""}
                        onChange={handleProductNameChange}
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
                            onChangeInput={handleMrpInputChange}
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
                        searchSlelect={(searchValue) => setBrandSearch(searchValue)}
                    />

                    <SearchableSelect
                        title="Select Product Type"
                        name="productType"
                        options={productTypeOptionsFromApi}
                        placeholder="Select Product Type"
                        icon={<Package size={18} />}
                        disabled={isLoadingOptions || isSubmitting}
                        searchSlelect={(searchValue) => setProductTypeSearch(searchValue)}
                    />

                    <SearchableSelect
                        title="Select Usage Type"
                        name="vendor"
                        options={vendorOptionsFromApi}
                        placeholder="Select usage type"
                        icon={<Tag size={18} />}
                        disabled={isLoadingOptions || isSubmitting}
                        searchSlelect={(searchValue) => setVendorTypeSearch(searchValue)}
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
                        error={hasError('netQuantity', ApiReducer)}
                        errormsg={getErrorMsg('netQuantity', ApiReducer)}
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