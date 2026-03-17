import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../PageHeader/PageHeader';
import { HitApi } from '../../Api/ApiHit';
import { useDispatch, useSelector } from 'react-redux';
import { setApiJson } from '../../redux/Actions/ApiAction';
import { searchUser, searchAttendance } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';
import toast from 'react-hot-toast';
import { hasPermission } from '../../utils/permissionUtils';
import { Clock, User, Calendar, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import DetailedAttendance from './DetailedAttendance';

function AttendanceMaster() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const ApiReducer = useSelector((state) => state.ApiReducer);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    });
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const canReadAttendance = hasPermission('staff', 'read');
    const canMarkAttendance = hasPermission('staff', 'write');

    useEffect(() => {
        if (!Array.isArray(ApiReducer.apiJson)) {
            dispatch(setApiJson([]));
        }
    }, []);

    const getUsers = async () => {
        if (!canReadAttendance) {
            toast.error('You do not have permission to view users');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const searchObj = {
                unitIds: getSelectedUnit()?._id
            };

            const json = {
                page: 1,
                limit: 100,
                search: searchObj
            };

            const res = await HitApi(json, searchUser);

            if (res?.statusCode === 200) {
                const usersData = res?.data?.docs || [];
                const filteredUsers = usersData.filter(user =>
                    user.userType !== 'superAdmin' &&
                    user.userType !== 'SuperAdmin' &&
                    user.userType !== 'superadmin' &&
                    (user.status === 'active' || user.status === 'Active')
                );
                dispatch(setApiJson(filteredUsers));
            } else {
                const errorMessage = res?.message || 'Failed to fetch users';
                setError(errorMessage);
                dispatch(setApiJson([]));
                toast.error('Failed to fetch users. Please try again.');
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            setError('Failed to fetch users. Please check your connection and try again.');
            dispatch(setApiJson([]));
            toast.error('Error fetching users. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getAttendanceData = async (date = selectedDate) => {
        if (!canReadAttendance) {
            return;
        }

        try {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);

            const searchObj = {
                unitIds: getSelectedUnit()?._id,
                created: {
                    $gte: startDate.toISOString(),
                    $lte: endDate.toISOString()
                }
            };

            const json = {
                page: 1,
                limit: 100,
                search: searchObj
            };

            const res = await HitApi(json, searchAttendance);

            if (res?.statusCode === 200) {
                const attendance = res?.data?.docs || [];
                setAttendanceData(attendance);
            } else {
                setAttendanceData([]);
            }
        } catch (error) {
            console.error("Error fetching attendance:", error);
            setAttendanceData([]);
        }
    };

    useEffect(() => {
        if (canReadAttendance) {
            getUsers();
            getAttendanceData(selectedDate);
        }
    }, [canReadAttendance, selectedDate]);

    const usersData = Array.isArray(ApiReducer.apiJson) ? ApiReducer.apiJson : [];

    const getUserAttendanceStatus = (userId) => {
        const userAttendanceRecords = attendanceData.filter(att =>
            att.userId?._id === userId || att.userId === userId
        );

        if (userAttendanceRecords.length === 0) {
            return null;
        }

        const latestAttendance = userAttendanceRecords.sort((a, b) =>
            new Date(b.created) - new Date(a.created)
        )[0];

        return latestAttendance;
    };

    const isWeekOffDay = (user, date = selectedDate) => {
        if (!user?.weekOff) return false;

        const dayDate = new Date(date);
        const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        return dayOfWeek === user.weekOff.toLowerCase();
    };

    const parseDateTime = (dateValue) => {
        if (!dateValue) return null;

        if (typeof dateValue === 'string' && dateValue.includes('T')) {
            return new Date(dateValue);
        }

        if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
            const timestamp = parseInt(dateValue);
            if (timestamp > 1000000000000 && timestamp < 9999999999999) {
                return new Date(timestamp);
            }
        }

        if (typeof dateValue === 'number') {
            return new Date(dateValue);
        }

        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
    };

    const calculateWorkingHours = (punchInTime, punchOutTime) => {
        if (!punchInTime || !punchOutTime) return null;

        const punchIn = parseDateTime(punchInTime);
        const punchOut = parseDateTime(punchOutTime);

        if (!punchIn || !punchOut || isNaN(punchIn.getTime()) || isNaN(punchOut.getTime())) {
            return null;
        }

        const diffMs = punchOut - punchIn;

        if (diffMs <= 0) return null;

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return { hours, minutes, totalMinutes };
    };

    const getStatusDisplay = (attendance, user) => {
        if (!attendance) {
            if (isWeekOffDay(user)) {
                return {
                    status: 'Week Off',
                    color: 'bg-blue-100 text-blue-600',
                    icon: <Calendar className="w-4 h-4" />
                };
            }

            const today = new Date();
            const selectedDateObj = new Date(selectedDate);
            const isToday = today.toDateString() === selectedDateObj.toDateString();

            if (isToday) {
                const currentHour = today.getHours();

                if (currentHour < 14) {
                    return {
                        status: 'Pending',
                        color: 'bg-yellow-100 text-yellow-600',
                        icon: <Clock className="w-4 h-4" />
                    };
                }
            }

            return {
                status: 'Absent',
                color: 'bg-red-100 text-red-600',
                icon: <XCircle className="w-4 h-4" />
            };
        }

        if (attendance.status === 'active') {
            if (attendance.punchInTime) {
                const punchInDate = parseDateTime(attendance.punchInTime);
                if (!punchInDate) return { status: 'Present', color: 'bg-green-100 text-green-600', icon: <CheckCircle className="w-4 h-4" /> };

                const punchInTimeString = punchInDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                const timeMatch = punchInTimeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const period = timeMatch[3].toUpperCase();

                    if (period === 'PM' && hours !== 12) {
                        hours += 12;
                    } else if (period === 'AM' && hours === 12) {
                        hours = 0;
                    }

                    if (hours > 12 || (hours === 12 && minutes > 0)) {
                        return {
                            status: 'Very Late',
                            color: 'bg-purple-100 text-purple-600',
                            icon: <CheckCircle className="w-4 h-4" />
                        };
                    }
                    else if (hours > 11 || (hours === 11 && minutes > 0)) {
                        return {
                            status: 'Late',
                            color: 'bg-pink-100 text-pink-600',
                            icon: <CheckCircle className="w-4 h-4" />
                        };
                    }
                }
            }

            return {
                status: 'Present',
                color: 'bg-green-100 text-green-600',
                icon: <CheckCircle className="w-4 h-4" />
            };
        }

        if (attendance.status === 'completed' || attendance.punchOutTime) {
            const workingTime = calculateWorkingHours(attendance.punchInTime, attendance.punchOutTime);
            const isHalfDay = workingTime && workingTime.totalMinutes < (8 * 60);

            if (attendance.punchInTime) {
                const punchInDate = parseDateTime(attendance.punchInTime);
                if (!punchInDate) {
                    return isHalfDay ?
                        { status: 'Half Day', color: 'bg-yellow-100 text-yellow-600', icon: <CheckCircle className="w-4 h-4" /> } :
                        { status: 'Completed', color: 'bg-blue-100 text-blue-600', icon: <CheckCircle className="w-4 h-4" /> };
                }

                const punchInTimeString = punchInDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                });

                const timeMatch = punchInTimeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (timeMatch) {
                    let hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const period = timeMatch[3].toUpperCase();

                    if (period === 'PM' && hours !== 12) {
                        hours += 12;
                    } else if (period === 'AM' && hours === 12) {
                        hours = 0;
                    }

                    if (hours > 12 || (hours === 12 && minutes > 0)) {
                        return isHalfDay ?
                            { status: 'Half Day (Very Late)', color: 'bg-yellow-100 text-yellow-600', icon: <CheckCircle className="w-4 h-4" /> } :
                            { status: 'Very Late', color: 'bg-purple-100 text-purple-600', icon: <CheckCircle className="w-4 h-4" /> };
                    }
                    else if (hours > 11 || (hours === 11 && minutes > 0)) {
                        return isHalfDay ?
                            { status: 'Half Day (Late)', color: 'bg-yellow-100 text-yellow-600', icon: <CheckCircle className="w-4 h-4" /> } :
                            { status: 'Late', color: 'bg-pink-100 text-pink-600', icon: <CheckCircle className="w-4 h-4" /> };
                    }
                }
            }

            return isHalfDay ?
                { status: 'Half Day', color: 'bg-yellow-100 text-yellow-600', icon: <CheckCircle className="w-4 h-4" /> } :
                { status: 'Completed', color: 'bg-blue-100 text-blue-600', icon: <CheckCircle className="w-4 h-4" /> };
        }

        if (attendance.status) {
            return {
                status: 'Present',
                color: 'bg-green-100 text-green-600',
                icon: <CheckCircle className="w-4 h-4" />
            };
        }

        return {
            status: 'Unknown',
            color: 'bg-gray-100 text-gray-600',
            icon: <AlertCircle className="w-4 h-4" />
        };
    };

    const handleUserClick = (user) => {
        setSelectedUser(user);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedUser(null);
    };

    const handleDateChange = (event) => {
        const newDate = event.target.value;
        const today = new Date();
        const selectedDateObj = new Date(newDate);

        if (selectedDateObj > today) {
            toast.error('Cannot select future dates');
            return;
        }

        setSelectedDate(newDate);
    };

    const getTodayDateString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getFilteredUsers = () => {
        if (statusFilter === 'all') return usersData;

        return usersData.filter(user => {
            const attendance = getUserAttendanceStatus(user._id);
            const statusDisplay = getStatusDisplay(attendance, user);

            switch (statusFilter) {
                case 'present':
                    return statusDisplay.status === 'Present';
                case 'pending':
                    return statusDisplay.status === 'Pending';
                case 'absent':
                    return statusDisplay.status === 'Absent';
                case 'completed':
                    return statusDisplay.status === 'Completed';
                case 'weekoff':
                    return statusDisplay.status === 'Week Off';
                case 'late':
                    return statusDisplay.status === 'Late' || statusDisplay.status === 'Very Late';
                case 'halfday':
                    return statusDisplay.status.includes('Half Day');
                default:
                    return true;
            }
        });
    };

    const filteredUsers = getFilteredUsers();

    if (!canReadAttendance) {
        return (
            <div className="p-5">
                <PageHeader
                    title={'Attendance Management'}
                    description={'View and manage employee attendance records'}
                />
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-red-600 mb-2">Access Denied</h3>
                        <p className="text-gray-600">You don't have permission to view attendance.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5">
            <div className="flex justify-between items-start mb-6">
                <PageHeader
                    title={'Attendance Management'}
                    description={'Select an employee to mark their attendance'}
                />

                <div className="flex items-center space-x-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border-none outline-none text-sm font-medium text-gray-700 bg-transparent px-2 py-1"
                        >
                            <option value="all">All Status</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="halfday">Half Day</option>
                            <option value="pending">Pending</option>
                            <option value="absent">Absent</option>
                            <option value="completed">Completed</option>
                            <option value="weekoff">Week Off</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <input
                            type="date"
                            value={selectedDate}
                            max={getTodayDateString()}
                            onChange={handleDateChange}
                            className="border-none outline-none text-sm font-medium text-gray-700 bg-transparent"
                        />
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">Error Loading Users</h4>
                            <p className="mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => getUsers()}
                            disabled={isLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Retry'}
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading users...</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredUsers.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center h-64 text-center">
                            <User className="w-16 h-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                            <p className="text-gray-600">No employees found in this unit.</p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => {
                            const attendance = getUserAttendanceStatus(user._id);
                            const statusDisplay = getStatusDisplay(attendance, user);

                            let cardBorderColor = 'border-gray-200';
                            let cardBgColor = 'bg-white';

                            const hasMissingPunchOut = attendance && attendance.punchInTime && !attendance.punchOutTime;

                            if (hasMissingPunchOut) {
                                cardBorderColor = 'border-orange-300';
                                cardBgColor = 'bg-orange-50';
                            } else if (statusDisplay.status === 'Present') {
                                cardBorderColor = 'border-green-300';
                                cardBgColor = 'bg-green-50';
                            } else if (statusDisplay.status === 'Completed') {
                                cardBorderColor = 'border-blue-300';
                                cardBgColor = 'bg-blue-50';
                            } else if (statusDisplay.status === 'Week Off') {
                                cardBorderColor = 'border-blue-300';
                                cardBgColor = 'bg-blue-50';
                            } else if (statusDisplay.status === 'Pending') {
                                cardBorderColor = 'border-yellow-300';
                                cardBgColor = 'bg-yellow-50';
                            } else if (statusDisplay.status === 'Absent') {
                                cardBorderColor = 'border-red-300';
                                cardBgColor = 'bg-red-50';
                            } else if (statusDisplay.status.includes('Half Day')) {
                                cardBorderColor = 'border-yellow-300';
                                cardBgColor = 'bg-yellow-50';
                            }

                            return (
                                <div
                                    key={user._id}
                                    onClick={() => handleUserClick(user)}
                                    className={`
                                    ${cardBgColor} rounded-xl shadow-md hover:shadow-lg transition-all duration-300
                                    border-2 ${cardBorderColor} overflow-hidden group relative
                                    cursor-pointer hover:scale-105
                                `}
                                >
                                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${statusDisplay.color} z-10`}>
                                        {statusDisplay.icon}
                                        <span>{statusDisplay.status}</span>
                                    </div>

                                    <div className="p-4 pt-12">
                                        <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate" title={user.name}>
                                            {user.name || 'Unknown User'}
                                        </h3>

                                        {attendance && (
                                            <div className="mt-3 space-y-1 text-xs text-gray-600">
                                                {attendance.punchInTime && (
                                                    <div className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-2 text-green-500" />
                                                        <span>In: {parseDateTime(attendance.punchInTime)?.toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        }) || 'Invalid'}</span>
                                                    </div>
                                                )}
                                                {attendance.punchOutTime ? (
                                                    <div className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-2 text-red-500" />
                                                        <span>Out: {parseDateTime(attendance.punchOutTime)?.toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        }) || 'Invalid'}</span>
                                                    </div>
                                                ) : attendance.punchInTime && (
                                                    <div className="flex items-center">
                                                        <AlertCircle className="w-3 h-3 mr-2 text-orange-500" />
                                                        <span className="text-orange-600 font-medium">Punch out missing</span>
                                                    </div>
                                                )}

                                                {attendance.punchInTime && attendance.punchOutTime && (
                                                    <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                                                        <Clock className="w-3 h-3 mr-2 text-blue-500" />
                                                        <span className="text-blue-600 font-medium">
                                                            {(() => {
                                                                const workingTime = calculateWorkingHours(attendance.punchInTime, attendance.punchOutTime);
                                                                if (workingTime) {
                                                                    return `${workingTime.hours}h ${workingTime.minutes}m`;
                                                                }
                                                                return 'Calculating...';
                                                            })()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {showModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Detailed Attendance - {selectedUser.name}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <DetailedAttendance user={selectedUser} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AttendanceMaster;
