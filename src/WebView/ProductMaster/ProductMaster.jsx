import { useState } from 'react';
import PageHeader from '../../PageHeader/PageHeader';
import ProductGroupList from './ProductGroupList';
import ProductCategoryList from './ProductCategoryList';
import ProductSubCategoryList from './ProductSubCategoryList';
import ProductBrandList from './ProductBrandList';
import ProductList from './ProductList';

function ProductMaster() {
    const [selectedProductGroup, setSelectedProductGroup] = useState(null);
    const [selectedProductCategory, setSelectedProductCategory] = useState(null);
    const [selectedProductSubCategory, setSelectedProductSubCategory] = useState(null);
    const [selectedProductBrand, setSelectedProductBrand] = useState(null);

    const handleProductGroupClick = (group) => {
        setSelectedProductGroup(group);
        setSelectedProductCategory(null);
        setSelectedProductSubCategory(null);
        setSelectedProductBrand(null);
    };

    const handleProductCategoryClick = (category) => {
        setSelectedProductCategory(category);
        setSelectedProductSubCategory(null);
        setSelectedProductBrand(null);
    };

    const handleProductSubCategoryClick = (subCategory) => {
        setSelectedProductSubCategory(subCategory);
        setSelectedProductBrand(null);
    };

    const handleProductBrandClick = (brand) => {
        setSelectedProductBrand(brand);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
                <PageHeader title={'Master Products'} description={'Product Group / Category / SubCategory / Brand / Products Management'} />
            </div>

            <div className="flex h-[calc(100vh-180px)] gap-1 overflow-x-auto">
                <ProductGroupList
                    selectedProductGroup={selectedProductGroup}
                    onProductGroupClick={handleProductGroupClick}
                />

                <ProductCategoryList
                    selectedProductGroup={selectedProductGroup}
                    selectedProductCategory={selectedProductCategory}
                    onProductCategoryClick={handleProductCategoryClick}
                />

                <ProductSubCategoryList
                    selectedProductCategory={selectedProductCategory}
                    selectedProductSubCategory={selectedProductSubCategory}
                    onProductSubCategoryClick={handleProductSubCategoryClick}
                    selectedProductGroup={selectedProductGroup}
                />

                <ProductBrandList
                    selectedProductGroup={selectedProductGroup}
                    selectedProductBrand={selectedProductBrand}
                    onProductBrandClick={handleProductBrandClick}
                />

                <ProductList
                    selectedProductBrand={selectedProductBrand}
                    selectedProductSubCategory={selectedProductSubCategory}
                    selectedProductCategory={selectedProductCategory}
                    selectedProductGroup={selectedProductGroup}
                />
            </div>
        </div>
    );
}

export default ProductMaster;
