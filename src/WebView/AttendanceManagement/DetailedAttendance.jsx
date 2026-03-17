import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchAttendance } from '../../constant/Constant';
import { getSelectedUnit } from '../../storage/Storage';

function DetailedAttendance({ user }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const firstDayOfWeek = firstDayOfMonth.getDay();

    const generateCalendarDays = () => {
        const days = [];
        const daysInMonth = lastDayOfMonth.getDate();

        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    };

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const monthYear = currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    });

    const fetchAttendanceData = async () => {
        if (!user?._id) return;

        setIsLoading(true);
        try {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            const searchObj = {
                unitIds: getSelectedUnit()?._id,
                userId: user._id,
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
        } finally {
            setIsLoading(false);
        }
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

    const getAttendanceForDay = (day) => {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);

        const dayAttendance = attendanceData.filter(att => {
            const attDate = new Date(att.created);
            return attDate.toDateString() === targetDate.toDateString();
        });

        if (dayAttendance.length === 0) {
            return null;
        }

        const latestAttendance = dayAttendance.sort((a, b) =>
            new Date(b.created) - new Date(a.created)
        )[0];

        const workingTime = latestAttendance.punchInTime && latestAttendance.punchOutTime ?
            calculateWorkingHours(latestAttendance.punchInTime, latestAttendance.punchOutTime) : null;

        return {
            status: latestAttendance.status === 'Present' || latestAttendance.status === 'active' ? 'present' :
                latestAttendance.status === 'completed' ? 'present' :
                    latestAttendance.status === 'Absent' ? 'absent' : 'absent',
            punchIn: latestAttendance.punchInTime ?
                parseDateTime(latestAttendance.punchInTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : null,
            punchOut: latestAttendance.punchOutTime ?
                parseDateTime(latestAttendance.punchOutTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }) : null,
            workingHours: workingTime ? `${workingTime.hours}h ${workingTime.minutes}m` : null,
            rawData: latestAttendance
        };
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [currentDate, user?._id]);

    const isWeekOffDay = (day) => {
        if (!day || !user?.weekOff) return false;

        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dayOfWeek = dayDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        return dayOfWeek === user.weekOff.toLowerCase();
    };

    const getStatusStyle = (attendance, day) => {
        const today = new Date();
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isFutureDate = dayDate > today;

        const isWeekOff = isWeekOffDay(day);

        if (!attendance) {
            if (isFutureDate) {
                return { bg: '', border: '', icon: null };
            }

            if (isWeekOff) {
                return {
                    bg: 'bg-blue-100',
                    border: 'border-blue-300',
                    icon: <Calendar className="w-3 h-3 text-blue-500" />
                };
            }

            return {
                bg: 'bg-red-100',
                border: 'border-red-300',
                icon: <XCircle className="w-3 h-3 text-red-500" />
            };
        }

        if (attendance.status === 'present' && !attendance.punchOut) {
            return {
                bg: 'bg-orange-100',
                border: 'border-orange-300',
                icon: <AlertCircle className="w-3 h-3 text-orange-500" />
            };
        } else if (attendance.status === 'present') {
            const isHalfDay = attendance.workingHours && (() => {
                const timeMatch = attendance.workingHours.match(/(\d+)h\s*(\d+)m/);
                if (timeMatch) {
                    const hours = parseInt(timeMatch[1]);
                    const minutes = parseInt(timeMatch[2]);
                    const totalMinutes = (hours * 60) + minutes;
                    return totalMinutes < (8 * 60);
                }
                return false;
            })();

            if (attendance.punchIn) {
                const punchInTime = attendance.punchIn;
                const timeMatch = punchInTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
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
                            { bg: 'bg-yellow-100', border: 'border-yellow-300', icon: <CheckCircle className="w-3 h-3 text-yellow-500" /> } :
                            { bg: 'bg-purple-100', border: 'border-purple-300', icon: <CheckCircle className="w-3 h-3 text-purple-500" /> };
                    }
                    else if (hours > 11 || (hours === 11 && minutes > 0)) {
                        return isHalfDay ?
                            { bg: 'bg-yellow-100', border: 'border-yellow-300', icon: <CheckCircle className="w-3 h-3 text-yellow-500" /> } :
                            { bg: 'bg-pink-100', border: 'border-pink-300', icon: <CheckCircle className="w-3 h-3 text-pink-500" /> };
                    }
                }
            }

            return isHalfDay ?
                { bg: 'bg-yellow-100', border: 'border-yellow-300', icon: <CheckCircle className="w-3 h-3 text-yellow-500" /> } :
                { bg: 'bg-green-100', border: 'border-green-300', icon: <CheckCircle className="w-3 h-3 text-green-500" /> };
        } else if (attendance.status === 'absent') {
            return {
                bg: 'bg-red-100',
                border: 'border-red-300',
                icon: <XCircle className="w-3 h-3 text-red-500" />
            };
        }

        return { bg: '', border: '', icon: null };
    };

    const calendarDays = generateCalendarDays();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-4">
            <div className="mb-6 text-center">
                {isLoading && (
                    <div className="mt-2">
                        <span className="text-sm text-blue-600">Loading attendance data...</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <h3 className="text-xl font-semibold text-gray-800">{monthYear}</h3>
                </div>

                <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50">
                    {dayNames.map((day) => (
                        <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {calendarDays.map((day, index) => {
                        const attendance = day ? getAttendanceForDay(day) : null;
                        const statusStyle = getStatusStyle(attendance, day);
                        const isToday = day &&
                            new Date().toDateString() ===
                            new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                        const today = new Date();
                        const dayDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                        const isFutureDate = dayDate && dayDate > today;
                        const isWeekOff = day ? isWeekOffDay(day) : false;

                        return (
                            <div
                                key={index}
                                className={`
                                    h-20 sm:h-24 p-1 sm:p-2 border-r border-b border-gray-200 last:border-r-0
                                    ${day ? 'hover:bg-gray-50' : ''}
                                    ${statusStyle.bg}
                                    ${statusStyle.border ? `border-2 ${statusStyle.border}` : ''}
                                    ${isToday ? 'ring-2 ring-blue-500' : ''}
                                `}
                            >
                                {day && (
                                    <div className="h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {day}
                                            </span>
                                            {statusStyle.icon}
                                        </div>

                                        {attendance ? (
                                            <div className="text-xs text-gray-600 space-y-0.5">
                                                {attendance.punchIn && (
                                                    <div className="flex items-center">
                                                        <Clock className="w-2 h-2 mr-0.5 text-green-500" />
                                                        <span className="text-xs">In: {attendance.punchIn}</span>
                                                    </div>
                                                )}
                                                {attendance.punchOut ? (
                                                    <div className="flex items-center">
                                                        <Clock className="w-2 h-2 mr-0.5 text-red-500" />
                                                        <span className="text-xs">Out: {attendance.punchOut}</span>
                                                    </div>
                                                ) : attendance.punchIn && (
                                                    <div className="text-orange-600 text-xs font-medium">
                                                        No punch out
                                                    </div>
                                                )}
                                                {attendance.workingHours && (
                                                    <div className="flex items-center pt-0.5 border-t border-gray-300">
                                                        <Clock className="w-2 h-2 mr-0.5 text-blue-500" />
                                                        <span className="text-blue-600 text-xs font-medium">{attendance.workingHours}</span>
                                                    </div>
                                                )}
                                                {attendance.status === 'absent' && (
                                                    <div className="text-red-600 text-xs font-medium">
                                                        Absent
                                                    </div>
                                                )}
                                            </div>
                                        ) : !isFutureDate ? (
                                            isWeekOff ? (
                                                <div className="text-xs text-blue-600 font-medium">
                                                    Week Off
                                                </div>
                                            ) : (
                                                <div className="text-xs text-red-600 font-medium">
                                                    Absent
                                                </div>
                                            )
                                        ) : null}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                    <span>Present</span>
                </div>
                <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500" />
                    <span>Late (11+ AM)</span>
                </div>
                <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                    <span>Very Late (12+ PM)</span>
                </div>
                <div className="flex items-center space-x-1">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                    <span>Half Day (&lt;8h)</span>
                </div>
                <div className="flex items-center space-x-1">
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                    <span>Absent</span>
                </div>
                <div className="flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                    <span>No Punch Out</span>
                </div>
                <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                    <span>Week Off</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-blue-500 rounded"></div>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}

export default DetailedAttendance;
