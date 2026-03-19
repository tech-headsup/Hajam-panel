import React from 'react';
import Pagination from './Pagination';
import { useSelector, useDispatch } from 'react-redux';
import { SET_PAGINATION } from '../../redux/ActionName/ActionName';

function AppPagination() {
  const dispatch = useDispatch();
  const TableDataReducer = useSelector((state) => state.TableReducer);

  console.log('TableDataReducer------', TableDataReducer);

  // Extract pagination data from reducer
  const { page, limit, total } = TableDataReducer.pagination;

  // Handle page change
  const handlePageChange = (newPage) => {
    dispatch({
      type: SET_PAGINATION,
      value: {
        ...TableDataReducer.pagination,
        page: newPage
      }
    });
  };

  // Handle limit change
  const handleLimitChange = (newLimit) => {
    dispatch({
      type: SET_PAGINATION,
      value: {
        ...TableDataReducer.pagination,
        limit: newLimit,
        page: 1 // Reset to first page when changing limit
      }
    });
  };

  // Limit options
  const limitOptions = [10, 20, 50, 100];

  return (
    <div className="flex justify-between items-center py-5 gap-4  w-full">

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Show:</span>
        <div className="relative">
          <select
            value={limit}
            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white cursor-pointer"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Pagination
        total={total}
        outline={true}
        defaultCurrent={1}
        current={page}
        onChange={handlePageChange}
        pageSize={limit}
      />

    </div>
  );
}

export default AppPagination;