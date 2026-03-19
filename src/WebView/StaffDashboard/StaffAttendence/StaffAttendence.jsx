import React, { useEffect, useState } from 'react';
import PageHeader from '../../../PageHeader/PageHeader';
import { HitApi } from '../../../Api/ApiHit';
import { searchAttendance, deleteAttendance } from '../../../constant/Constant';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../../redux/Actions/ApiAction';
import AppTable from '../../../components/AppTable/AppTable';
import { setPagination } from '../../../redux/Actions/TableAction';
import DeleteButton from '../../../components/Delete/DeleteButton';
import toast from 'react-hot-toast';
import { hasPermission } from '../../../utils/permissionUtils';

function StaffAttendence() {
    const dispatch = useDispatch();
    const userData = useSelector((state) => state.UserReducer?.user);
    const ApiReducer = useSelector((state) => state.ApiReducer);
    const TableDataReducer = useSelector((state) => state.TableReducer);
    const canDeleteStaff = hasPermission('staff', 'delete');
    const [dateRange, setDateRange] = useState({
        fromDate: '',
        toDate: ''
    });

    const handleDateChange = (newDates) => {
        setDateRange(newDates);
    };

    useEffect(() => {
        getAttendance();
    }, [TableDataReducer.pagination.page, TableDataReducer.pagination.limit]);

    useEffect(() => {
        if (dateRange.fromDate || dateRange.toDate) {
            getAttendance();
        }
    }, [dateRange.fromDate, dateRange.toDate]);

    const getAttendance = () => {
        console.log("userData___+", userData?.roleData?.roleType);
        let json;

        if (userData?.roleData?.roleType === "SuperAdmin") {
            let searchQuery = {};

            // If date range is selected, use it; otherwise use today's date
            if (dateRange.fromDate && dateRange.toDate) {
                // Convert fromDate to start of day (12:00 AM)
                const fromDateTime = new Date(dateRange.fromDate);
                fromDateTime.setHours(0, 0, 0, 0);
                const startTime = fromDateTime.getTime();

                // Convert toDate to end of day (11:59 PM)
                const toDateTime = new Date(dateRange.toDate);
                toDateTime.setHours(23, 59, 59, 999);
                const endTime = toDateTime.getTime();

                searchQuery.punchInTime = {
                    $gte: startTime,
                    $lte: endTime
                };
            } else if (dateRange.fromDate) {
                // Only fromDate is selected
                const fromDateTime = new Date(dateRange.fromDate);
                fromDateTime.setHours(0, 0, 0, 0);
                const startTime = fromDateTime.getTime();

                searchQuery.punchInTime = {
                    $gte: startTime
                };
            } else if (dateRange.toDate) {
                // Only toDate is selected
                const toDateTime = new Date(dateRange.toDate);
                toDateTime.setHours(23, 59, 59, 999);
                const endTime = toDateTime.getTime();

                searchQuery.punchInTime = {
                    $lte: endTime
                };
            } else {
                // No date range selected - use today's date
                const today = new Date();
                const startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).getTime();
                const endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();

                searchQuery.punchInTime = {
                    $gte: startTime,
                    $lte: endTime
                };
            }

            json = {
                page: TableDataReducer.pagination.page || 1,
                limit: TableDataReducer.pagination.limit || 10,
                search: searchQuery
            };
        } else {
            json = {
                page: TableDataReducer.pagination.page || 1,
                limit: TableDataReducer.pagination.limit || 10,
                search: {
                    userId: userData?._id,
                }
            };
        }

        HitApi(json, searchAttendance).then((res) => {
            let attendanceData = [];
            let totalCount = 0;

            if (res?.statusCode === 200) {
                attendanceData = res?.data?.docs || [];
                totalCount = res?.data?.totalDocs || 0;
            } else if (Array.isArray(res)) {
                attendanceData = res;
                totalCount = res.length;
            } else if (res?.success && res?.attendance) {
                attendanceData = res.attendance || [];
                totalCount = res?.data?.totalDocs || 0;
            }

            dispatch(setApiJson(attendanceData));

            // Update pagination data in Redux
            const paginationData = {
                total: totalCount,
                page: TableDataReducer.pagination.page || 1,
                limit: TableDataReducer.pagination.limit || 10
            };

            dispatch(setPagination(paginationData));
        }).catch(error => {
            console.error("Error fetching attendance:", error);
            dispatch(setApiJson([]));
            // Show error toast
            toast.error('Failed to load attendance records. Please try again.');
        });
    };

    // Function to format date and time from timestamp
    const formatDateTime = (timestamp) => {
        if (!timestamp) return { date: 'N/A', time: 'N/A' };

        // Handle both string and number timestamps
        const timeValue = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;

        if (isNaN(timeValue)) return { date: 'N/A', time: 'N/A' };

        const date = new Date(timeValue);
        return {
            date: date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }),
            time: date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        };
    };

    // Function to format date from ISO string
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Function to get day of week from ISO string
    const getDayOfWeek = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    // Function to format total hours with 4 decimal places
    const formatTotalHours = (hours, row) => {
        // Convert string to number if needed
        let numHours = typeof hours === 'string' ? parseFloat(hours) : hours;

        // If totalHours is not available or is "0", calculate from punch times
        if (!numHours || numHours === 0) {
            const punchInTime = row?.punchInTime;
            const punchOutTime = row?.punchOutTime;

            if (punchInTime && punchOutTime) {
                const startTime = parseInt(punchInTime);
                const endTime = parseInt(punchOutTime);
                const diffMs = endTime - startTime;

                if (diffMs > 0) {
                    numHours = diffMs / (1000 * 60 * 60); // Convert to hours
                } else {
                    return <span className="text-gray-400">N/A</span>;
                }
            } else if (punchInTime && !punchOutTime) {
                // Still working - show "Working" badge
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Working...
                    </span>
                );
            } else {
                return <span className="text-gray-400">N/A</span>;
            }
        }

        if (isNaN(numHours) || numHours < 0) return <span className="text-gray-400">N/A</span>;

        // Always show hours with 4 decimal places
        const displayText = `${numHours.toFixed(4)}h`;

        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {displayText}
            </span>
        );
    };

    // Function to parse device info
    const parseDeviceInfo = (deviceInfoString) => {
        console.log("deviceInfoString", deviceInfoString);

        try {
            if (typeof deviceInfoString === 'string') {
                const deviceInfo = JSON.parse(deviceInfoString);
                return {
                    browser: deviceInfo.browser || 'Unknown',
                    deviceType: deviceInfo.deviceType || 'Unknown',
                    platform: deviceInfo.platform || 'Unknown'
                };
            } else if (typeof deviceInfoString === 'object') {
                return {
                    browser: deviceInfoString.browser || 'Unknown',
                    deviceType: deviceInfoString.deviceType || 'Unknown',
                    platform: deviceInfoString.platform || 'Unknown'
                };
            }
        } catch (error) {
            console.error('Error parsing device info:', error);
        }
        return {
            browser: 'Unknown',
            deviceType: 'Unknown',
            platform: 'Unknown'
        };
    };

    const handleDelete = (row) => {
        console.log("Delete attendance:", row);
        const staffName = row.userId?.name || 'this attendance record';
        const attendanceDate = formatDate(row.created);

        // Use toast for confirmation instead of window.confirm
        toast((t) => (
            <div className="flex flex-col gap-2">
                <div className="font-medium">Delete Attendance Record</div>
                <div className="text-sm text-gray-600">
                    Are you sure you want to delete attendance record for <strong>{staffName}</strong> on <strong>{attendanceDate}</strong>?
                </div>
                <div className="flex gap-2 mt-2">
                    <button
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDelete(row);
                        }}
                    >
                        Delete
                    </button>
                    <button
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: Infinity,
            position: 'top-center',
        });
    };

    const performDelete = (row) => {
        const json = {
            _id: row?._id
        };

        // Show loading toast
        const loadingToast = toast.loading('Deleting attendance record...');

        HitApi(json, deleteAttendance).then((res) => {
            toast.dismiss(loadingToast);
         
            if (res?.statusCode === 200) {
                // Refresh the data after successful deletion
                getAttendance();
                toast.success("Attendance record deleted successfully!");
            } else {
                toast.error(res?.message || "Failed to delete attendance record. Please try again.");
            }
        }).catch(error => {
            toast.dismiss(loadingToast);
            console.error("Error deleting attendance:", error);
            toast.error("An error occurred while deleting the attendance record.");
        });
    };

    // Define status badge renderer
    const renderStatus = (status) => {
        if (!status) return 'N/A';

        let bgColor = "bg-gray-100";
        let textColor = "text-gray-800";

        switch (status.toLowerCase()) {
            case 'present':
                bgColor = "bg-green-100";
                textColor = "text-green-800";
                break;
            case 'absent':
                bgColor = "bg-red-100";
                textColor = "text-red-800";
                break;
            case 'late':
                bgColor = "bg-yellow-100";
                textColor = "text-yellow-800";
                break;
            case 'half day':
                bgColor = "bg-orange-100";
                textColor = "text-orange-800";
                break;
            default:
                bgColor = "bg-gray-100";
                textColor = "text-gray-800";
        }

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                {status}
            </span>
        );
    };

    // Get base index for serial numbers
    const baseIndex = ((TableDataReducer.pagination.page || 1) - 1) * (TableDataReducer.pagination.limit || 10);

    // Define table headers for attendance data
    const tableHeaders = [
        {
            title: "S.No",
            key: "serialNumber",
            width: "60px",
            align: "center",
            render: (_, row, index) => {
                const serialNumber = baseIndex + index + 1;
                return (
                    <div className="text-center">
                        <span className="text-sm font-medium text-gray-900">{serialNumber}</span>
                    </div>
                );
            }
        },
        {
            title: "Staff Name",
            key: "userId",
            render: (userId, row) => (
                <div className="flex items-center">
                    <div>
                        <div className="font-medium">{userId?.name || 'N/A'}</div>
                        {userId?.email && (
                            <div className="text-xs text-gray-500">{userId.email}</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            title: "Unit",
            key: "unitIds",
            render: (unitIds) => (
                <div>
                    <div className="font-medium">{unitIds?.unitName || 'N/A'}</div>
                    {unitIds?.unitCode && (
                        <div className="text-xs text-gray-500">{unitIds.unitCode}</div>
                    )}
                </div>
            )
        },
        {
            title: "Date",
            key: "created",
            render: (value) => formatDate(value)
        },
        {
            title: "Day",
            key: "created",
            render: (value) => {
                const dayOfWeek = getDayOfWeek(value);
                const isWeekend = dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isWeekend
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {dayOfWeek}
                    </span>
                );
            }
        },
        {
            title: "Punch In",
            key: "punchInTime",
            render: (value) => {
                const dateTime = formatDateTime(value);
                return (
                    <div>
                        <div className="text-sm font-medium text-green-600">{dateTime.time}</div>
                        <div className="text-xs text-gray-500">{dateTime.date}</div>
                    </div>
                );
            }
        },
        {
            title: "Punch Out",
            key: "punchOutTime",
            render: (value) => {
                if (!value) {
                    return (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Not Punched Out
                        </span>
                    );
                }
                const dateTime = formatDateTime(value);
                return (
                    <div>
                        <div className="text-sm font-medium text-red-600">{dateTime.time}</div>
                        <div className="text-xs text-gray-500">{dateTime.date}</div>
                    </div>
                );
            }
        },
        {
            title: "Total Hours",
            key: "totalHours",
            render: (value, row) => formatTotalHours(value, row)
        },
        {
            title: "Status",
            key: "status",
            render: renderStatus
        },
        {
            title: "Earned Today",
            key: "todaySalary",
            render: (value) => (
                <span className="text-gray-700 font-medium text-base">{`${value && "₹"}${value}` || 'N/A'}</span>
            )
        },
    ];

    if (canDeleteStaff) {
        tableHeaders.push({
            title: "Actions",
            key: "actions",
            align: "center",
            render: (value, row) => (
                <div className="flex justify-center space-x-2">
                    <DeleteButton
                        onDelete={() => handleDelete(row)}
                        itemName="attendance"
                    />
                </div>
            )
        });
    }

    

    return (
        <div className="p-5">
            <PageHeader
                title={'Staff Attendance'}
                description={'View and manage staff attendance records'}
            />
            {/* <div className='my-2 flex justify-end'>
                <DateFilter
                    fromDate={dateRange.fromDate}
                    toDate={dateRange.toDate}
                    onDateChange={handleDateChange}
                    maxDate={new Date().getTime()}
                />
            </div> */}
            <AppTable
                TH={tableHeaders}
                TD={ApiReducer.apiJson || []}
                isLoading={!ApiReducer.apiJson?.length}
                emptyMessage="No attendance records found"
            />
        </div>
    );
}

export default StaffAttendence;
