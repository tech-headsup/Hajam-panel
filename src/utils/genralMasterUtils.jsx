import { HitApi } from '../Api/ApiHit';
import { searchGeneralMaster } from '../constant/Constant';
import toast from 'react-hot-toast';

/**
 * Fetch general master options from API
 * @param {string} usedBy - Type of master data (Brand, ProductType, Vendor, etc.)
 * @param {string} searchValue - Search term for filtering
 * @param {number} limit - Maximum number of results (default: 200)
 * @returns {Promise<Array>} Array of options
 */
export const fetchGeneralMasterOptions = async (usedBy, searchValue = '', limit = 200) => {
    try {
        const searchCriteria = {
            usedBy: usedBy
        };

        // Add regex search if searchValue is provided
        if (searchValue && searchValue.trim()) {
            searchCriteria.label = {
                $regex: searchValue.trim(),
                $options: 'i'
            };
        }

        const json = {
            page: 1,
            limit: limit,
            search: searchCriteria
        };

        const res = await HitApi(json, searchGeneralMaster);

        if (res?.statusCode === 200 && res?.data?.docs) {
            return res.data.docs;
        } else {
            return [];
        }
    } catch (error) {
        console.error(`Error fetching ${usedBy} options:`, error);
        toast.error(`Failed to load ${usedBy.toLowerCase()} options`);
        return [];
    }
};

/**
 * Hook for managing general master options with search
 * @param {string} usedBy - Type of master data
 * @param {string} searchValue - Search term
 * @param {number} limit - Maximum results
 */
export const useGeneralMasterOptions = (usedBy, searchValue = '', limit = 200) => {
    return fetchGeneralMasterOptions(usedBy, searchValue, limit);
};