import { useState } from 'react';
import PageHeader from '../../PageHeader/PageHeader';
import GroupList from './GroupList';
import CategoryList from './CategoryList';
import SubCategoryList from './SubCategoryList';
import ServiceList from './ServiceList';

function MasterService() {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    const handleGroupClick = (group) => {
        setSelectedGroup(group);
        setSelectedCategory(null);
        setSelectedSubCategory(null);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setSelectedSubCategory(null);
    };

    const handleSubCategoryClick = (subCategory) => {
        setSelectedSubCategory(subCategory);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-5">
            <div className="flex items-center justify-between mb-4">
                <PageHeader title={'Master Services'} description={'Group / Category / SubCategory / Service Management'} />
            </div>

            <div className="flex h-[calc(100vh-180px)] gap-1">
                <GroupList
                    selectedGroup={selectedGroup}
                    onGroupClick={handleGroupClick}
                />

                <CategoryList
                    selectedGroup={selectedGroup}
                    selectedCategory={selectedCategory}
                    onCategoryClick={handleCategoryClick}
                />

                <SubCategoryList
                    selectedCategory={selectedCategory}
                    selectedSubCategory={selectedSubCategory}
                    onSubCategoryClick={handleSubCategoryClick}
                    selectedGroup={selectedGroup}
                />

                <ServiceList
                    selectedSubCategory={selectedSubCategory}
                    selectedCategory={selectedCategory}
                    selectedGroup={selectedGroup}
                />
            </div>
        </div>
    );
}

export default MasterService;
