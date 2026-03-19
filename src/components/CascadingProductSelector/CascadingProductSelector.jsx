import { useState, useEffect, useRef } from 'react';
import { HitApi } from '../../Api/ApiHit';
import {
    searchProductGroup,
    searchProductCategory,
    searchProductSubCategory,
    searchProductBrand,
    searchProduct,
} from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import SearchableSelectNonRedux from '../AppSelect/SearchableSelectNonRedux';

function CascadingProductSelector({
    onProductSelect,
    onProductClear,
    disabled = false,
    // Initial values for edit mode
    initialProductGroupId = '',
    initialProductCategoryId = '',
    initialProductSubCategoryId = '',
    initialProductBrandId = '',
    initialProductId = '',
    initialProductName = '',
    initialBrand = '',
}) {
    // Dropdown data
    const [groups, setGroups] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [products, setProducts] = useState([]);

    // Selected IDs
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [selectedProductName, setSelectedProductName] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    // Loading states
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Ref to prevent cascade resets during initial population
    const isInitializing = useRef(false);
    const hasInitialized = useRef(false);

    // Fetch groups on mount
    useEffect(() => {
        fetchGroups();
    }, []);

    // Initialize from props (edit mode)
    useEffect(() => {
        if (
            initialProductGroupId &&
            groups.length > 0 &&
            !hasInitialized.current
        ) {
            hasInitialized.current = true;
            isInitializing.current = true;

            setSelectedGroupId(initialProductGroupId);
            setSelectedCategoryId(initialProductCategoryId || '');
            setSelectedSubCategoryId(initialProductSubCategoryId || '');
            setSelectedBrandId(initialProductBrandId || '');
            setSelectedProductId(initialProductId || '');
            setSelectedProductName(initialProductName || '');
            setSelectedBrand(initialBrand || '');

            // Fetch dependent data for edit mode
            const unitIds = getSelectedUnit()?._id || getSelectedUnit()?.[0];

            // Fetch categories
            if (initialProductGroupId) {
                HitApi(
                    { page: 1, limit: 100000, unitIds, productGroupId: initialProductGroupId },
                    searchProductCategory
                ).then((res) => {
                    if (res?.data?.docs) setCategories(res.data.docs);
                });

                // Fetch brands
                HitApi(
                    { page: 1, limit: 100000, productGroupId: initialProductGroupId },
                    searchProductBrand
                ).then((res) => {
                    if (res?.data?.docs) setBrands(res.data.docs);
                });
            }

            // Fetch subcategories
            if (initialProductCategoryId && initialProductGroupId) {
                HitApi(
                    {
                        page: 1,
                        limit: 100000,
                        productCategoryId: initialProductCategoryId,
                        productGroupId: initialProductGroupId,
                    },
                    searchProductSubCategory
                ).then((res) => {
                    if (res?.data?.docs) setSubCategories(res.data.docs);
                });
            }

            // Fetch products
            if (initialProductBrandId && initialProductSubCategoryId) {
                const searchQuery = {
                    productBrandId: initialProductBrandId,
                    productSubCategoryId: initialProductSubCategoryId,
                    productCategoryId: initialProductCategoryId,
                    productGroupId: initialProductGroupId,
                    unitIds,
                };
                HitApi({ page: 1, limit: 100000, search: searchQuery }, searchProduct).then(
                    (res) => {
                        if (res?.data?.docs) setProducts(res.data.docs);
                    }
                );
            }

            // Reset initializing flag after a tick
            setTimeout(() => {
                isInitializing.current = false;
            }, 500);
        }
    }, [groups, initialProductGroupId]);

    // --- Fetch helpers ---

    const fetchGroups = () => {
        setLoadingGroups(true);
        const unitIds = getSelectedUnit()?._id || getSelectedUnit()?.[0];
        HitApi({ page: 1, limit: 100000, unitIds }, searchProductGroup)
            .then((res) => {
                if (res?.data?.docs) setGroups(res.data.docs);
                else setGroups([]);
            })
            .catch(() => setGroups([]))
            .finally(() => setLoadingGroups(false));
    };

    const fetchCategories = (groupId) => {
        setLoadingCategories(true);
        const unitIds = getSelectedUnit()?._id || getSelectedUnit()?.[0];
        HitApi(
            { page: 1, limit: 100000, unitIds, productGroupId: groupId },
            searchProductCategory
        )
            .then((res) => {
                if (res?.data?.docs) setCategories(res.data.docs);
                else setCategories([]);
            })
            .catch(() => setCategories([]))
            .finally(() => setLoadingCategories(false));
    };

    const fetchBrands = (groupId) => {
        setLoadingBrands(true);
        HitApi(
            { page: 1, limit: 100000, productGroupId: groupId },
            searchProductBrand
        )
            .then((res) => {
                if (res?.data?.docs) setBrands(res.data.docs);
                else setBrands([]);
            })
            .catch(() => setBrands([]))
            .finally(() => setLoadingBrands(false));
    };

    const fetchSubCategories = (categoryId, groupId) => {
        setLoadingSubCategories(true);
        HitApi(
            {
                page: 1,
                limit: 100000,
                productCategoryId: categoryId,
                productGroupId: groupId,
            },
            searchProductSubCategory
        )
            .then((res) => {
                if (res?.data?.docs) setSubCategories(res.data.docs);
                else setSubCategories([]);
            })
            .catch(() => setSubCategories([]))
            .finally(() => setLoadingSubCategories(false));
    };

    const fetchProducts = (brandId, subCategoryId, categoryId, groupId) => {
        setLoadingProducts(true);
        const unitIds = getSelectedUnit()?._id || getSelectedUnit()?.[0];
        const searchQuery = {
            productBrandId: brandId,
            productSubCategoryId: subCategoryId,
            productCategoryId: categoryId,
            productGroupId: groupId,
            unitIds,
        };
        HitApi({ page: 1, limit: 100000, search: searchQuery }, searchProduct)
            .then((res) => {
                if (res?.data?.docs) setProducts(res.data.docs);
                else setProducts([]);
            })
            .catch(() => setProducts([]))
            .finally(() => setLoadingProducts(false));
    };

    // --- Options for SearchableSelectNonRedux ---

    const groupOptions = groups.map((g) => ({ value: g._id, label: g.name }));
    const categoryOptions = categories.map((c) => ({ value: c._id, label: c.name }));
    const subCategoryOptions = subCategories.map((sc) => ({ value: sc._id, label: sc.name }));
    const brandOptions = brands.map((b) => ({ value: b._id, label: b.name }));
    const productOptions = products.map((p) => ({
        value: p._id,
        label: p.productName + (p.brand ? ` (${p.brand})` : ''),
    }));

    // --- Change handlers ---

    const handleGroupChange = (groupId) => {
        setSelectedGroupId(groupId);

        if (!isInitializing.current) {
            setSelectedCategoryId('');
            setSelectedSubCategoryId('');
            setSelectedBrandId('');
            setSelectedProductId('');
            setSelectedProductName('');
            setSelectedBrand('');
            setCategories([]);
            setSubCategories([]);
            setBrands([]);
            setProducts([]);
        }

        if (groupId) {
            fetchCategories(groupId);
            fetchBrands(groupId);
        }
    };

    const handleCategoryChange = (categoryId) => {
        setSelectedCategoryId(categoryId);

        if (!isInitializing.current) {
            setSelectedSubCategoryId('');
            setSelectedProductId('');
            setSelectedProductName('');
            setSelectedBrand('');
            setSubCategories([]);
            setProducts([]);
        }

        if (categoryId && selectedGroupId) {
            fetchSubCategories(categoryId, selectedGroupId);
        }
    };

    const handleSubCategoryChange = (subCategoryId) => {
        setSelectedSubCategoryId(subCategoryId);

        if (!isInitializing.current) {
            setSelectedProductId('');
            setSelectedProductName('');
            setSelectedBrand('');
            setProducts([]);
        }

        if (subCategoryId && selectedBrandId && selectedCategoryId && selectedGroupId) {
            fetchProducts(selectedBrandId, subCategoryId, selectedCategoryId, selectedGroupId);
        }
    };

    const handleBrandChange = (brandId) => {
        setSelectedBrandId(brandId);

        if (!isInitializing.current) {
            setSelectedProductId('');
            setSelectedProductName('');
            setSelectedBrand('');
            setProducts([]);
        }

        if (brandId && selectedSubCategoryId && selectedCategoryId && selectedGroupId) {
            fetchProducts(brandId, selectedSubCategoryId, selectedCategoryId, selectedGroupId);
        }
    };

    const handleProductChange = (productId) => {
        if (!productId) return;
        const product = products.find((p) => p._id === productId);
        if (!product) return;

        setSelectedProductId(productId);
        setSelectedProductName(product.productName || '');
        setSelectedBrand(product.brand || '');

        if (onProductSelect) {
            onProductSelect({
                productId: product._id,
                productName: product.productName || '',
                brand: product.brand || '',
                productGroupId: selectedGroupId,
                productCategoryId: selectedCategoryId,
                productSubCategoryId: selectedSubCategoryId,
                productBrandId: selectedBrandId,
            });
        }
    };

    const handleClear = () => {
        setSelectedGroupId('');
        setSelectedCategoryId('');
        setSelectedSubCategoryId('');
        setSelectedBrandId('');
        setSelectedProductId('');
        setSelectedProductName('');
        setSelectedBrand('');
        setCategories([]);
        setSubCategories([]);
        setBrands([]);
        setProducts([]);
        hasInitialized.current = false;

        if (onProductClear) {
            onProductClear();
        }
    };

    // If a product is selected, show selected state
    if (selectedProductId && selectedProductName) {
        return (
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                    <div>
                        <p className="font-medium text-gray-900 text-sm">{selectedProductName}</p>
                        {selectedBrand && (
                            <p className="text-xs text-gray-500">{selectedBrand}</p>
                        )}
                    </div>
                    {!disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="ml-1 p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                            title="Clear selection"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {/* Row 1: Cascade dropdowns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <SearchableSelectNonRedux
                    title="Group"
                    name="productGroup"
                    options={groupOptions}
                    value={selectedGroupId}
                    onSelect={(val) => handleGroupChange(val)}
                    placeholder={loadingGroups ? 'Loading...' : 'Search Group'}
                    disabled={disabled || loadingGroups}
                />

                <SearchableSelectNonRedux
                    title="Category"
                    name="productCategory"
                    options={categoryOptions}
                    value={selectedCategoryId}
                    onSelect={(val) => handleCategoryChange(val)}
                    placeholder={loadingCategories ? 'Loading...' : 'Search Category'}
                    disabled={disabled || !selectedGroupId || loadingCategories}
                />

                <SearchableSelectNonRedux
                    title="SubCategory"
                    name="productSubCategory"
                    options={subCategoryOptions}
                    value={selectedSubCategoryId}
                    onSelect={(val) => handleSubCategoryChange(val)}
                    placeholder={loadingSubCategories ? 'Loading...' : 'Search SubCategory'}
                    disabled={disabled || !selectedCategoryId || loadingSubCategories}
                />

                <SearchableSelectNonRedux
                    title="Brand"
                    name="productBrand"
                    options={brandOptions}
                    value={selectedBrandId}
                    onSelect={(val) => handleBrandChange(val)}
                    placeholder={loadingBrands ? 'Loading...' : 'Search Brand'}
                    disabled={disabled || !selectedGroupId || loadingBrands}
                />
            </div>

            {/* Row 2: Product dropdown */}
            <SearchableSelectNonRedux
                title="Product"
                name="product"
                options={productOptions}
                value={selectedProductId}
                onSelect={(val) => handleProductChange(val)}
                placeholder={
                    loadingProducts
                        ? 'Loading products...'
                        : !selectedGroupId || !selectedCategoryId || !selectedSubCategoryId || !selectedBrandId
                        ? 'Select all filters above first'
                        : products.length === 0
                        ? 'No products found'
                        : 'Search Product'
                }
                disabled={
                    disabled ||
                    !selectedGroupId ||
                    !selectedCategoryId ||
                    !selectedSubCategoryId ||
                    !selectedBrandId ||
                    loadingProducts
                }
            />
        </div>
    );
}

export default CascadingProductSelector;
