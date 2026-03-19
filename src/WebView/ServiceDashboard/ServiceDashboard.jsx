import { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Activity, Scissors, Download, User, Trophy } from 'lucide-react';
import { HitApi } from '../../Api/ApiHit';
import { searchBill, searchUser } from '../../constant/Constant';
import PageHeader from '../../PageHeader/PageHeader';
import Pagination from '../../components/Pagination/Pagination';
import { exportToCSV } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

const RANK_STYLES = [
    { bg: 'from-yellow-400 to-amber-500', badge: 'bg-yellow-400 text-yellow-900', label: '🥇 1st' },
    { bg: 'from-gray-300 to-gray-400',   badge: 'bg-gray-300 text-gray-800',     label: '🥈 2nd' },
    { bg: 'from-orange-300 to-orange-400', badge: 'bg-orange-300 text-orange-900', label: '🥉 3rd' },
];

function ServiceDashboard() {
    const [selectedFilter, setSelectedFilter] = useState('today');
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [serviceStats, setServiceStats] = useState([]);
    const [staffStats, setStaffStats] = useState([]);
    const [totalServicesCount, setTotalServicesCount] = useState(0);
    const [staffMap, setStaffMap] = useState({});       // id → { name, ... }
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const limitOptions = [10, 20, 50, 100];

    const filterOptions = [
        { label: 'Today',        value: 'today' },
        { label: 'Yesterday',    value: 'yesterday' },
        { label: 'This Week',    value: 'thisWeek' },
        { label: 'This Month',   value: 'thisMonth' },
        { label: 'Last 7 Days',  value: 'last7Days' },
        { label: 'Last 30 Days', value: 'last30Days' },
        { label: 'Custom Range', value: 'customRange' },
    ];

    // ─── Fetch all staff once on mount ───────────────────────────────────────
    const fetchAllStaff = async () => {
        try {
            const res = await HitApi({ page: 1, limit: 10000, search: {} }, searchUser);
            if (res?.data?.docs) {
                const map = {};
                res.data.docs.forEach(s => {
                    map[s._id] = s;   // s.name is the display name (same as BillMaster)
                });
                setStaffMap(map);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    useEffect(() => {
        fetchAllStaff();
    }, []);

    // ─── Filter helpers ───────────────────────────────────────────────────────
    const handleFilterChange = (value) => {
        setSelectedFilter(value);
        setPage(1);
        if (value === 'customRange') {
            setShowCustomRange(true);
        } else {
            setShowCustomRange(false);
            setStartDate('');
            setEndDate('');
        }
    };

    const handlePageChange  = (newPage)  => setPage(newPage);
    const handleLimitChange = (newLimit) => { setLimit(newLimit); setPage(1); };

    const handleApplyCustomRange = () => {
        if (startDate && endDate) fetchBillsData();
    };

    const getDateRangeTimestamps = () => {
        const now = new Date();
        let start, end;
        switch (selectedFilter) {
            case 'today':
                start = new Date(now).setHours(0, 0, 0, 0);
                end   = new Date(now).setHours(23, 59, 59, 999);
                break;
            case 'yesterday':
                const yest = new Date(now);
                yest.setDate(now.getDate() - 1);
                start = yest.setHours(0, 0, 0, 0);
                end   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).setHours(23, 59, 59, 999);
                break;
            case 'thisWeek':
                const ws  = new Date(now);
                const day = now.getDay();
                ws.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
                start = ws.setHours(0, 0, 0, 0);
                end   = new Date(now).setHours(23, 59, 59, 999);
                break;
            case 'thisMonth':
                start = new Date(now.getFullYear(), now.getMonth(), 1).setHours(0, 0, 0, 0);
                end   = new Date(now).setHours(23, 59, 59, 999);
                break;
            case 'last7Days':
                const l7 = new Date(now); l7.setDate(now.getDate() - 7);
                start = l7.setHours(0, 0, 0, 0);
                end   = new Date(now).setHours(23, 59, 59, 999);
                break;
            case 'last30Days':
                const l30 = new Date(now); l30.setDate(now.getDate() - 30);
                start = l30.setHours(0, 0, 0, 0);
                end   = new Date(now).setHours(23, 59, 59, 999);
                break;
            case 'customRange':
                start = startDate ? new Date(startDate).setHours(0, 0, 0, 0)     : new Date(now).setHours(0, 0, 0, 0);
                end   = endDate   ? new Date(endDate).setHours(23, 59, 59, 999)   : new Date(now).setHours(23, 59, 59, 999);
                break;
            default:
                start = new Date(now).setHours(0, 0, 0, 0);
                end   = new Date(now).setHours(23, 59, 59, 999);
        }
        return { start, end };
    };

    const getDateRangeText = () => {
        const now = new Date();
        switch (selectedFilter) {
            case 'today':
                return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            case 'yesterday':
                const yest = new Date(now); yest.setDate(now.getDate() - 1);
                return yest.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            case 'thisWeek':
                const ws = new Date(now); const d = now.getDay();
                ws.setDate(now.getDate() - d + (d === 0 ? -6 : 1));
                return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'thisMonth':
                const ms = new Date(now.getFullYear(), now.getMonth(), 1);
                return `${ms.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
            case 'last7Days':
                const l7 = new Date(now); l7.setDate(now.getDate() - 7);
                return `${l7.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'last30Days':
                const l30 = new Date(now); l30.setDate(now.getDate() - 30);
                return `${l30.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'customRange':
                if (startDate && endDate) {
                    const s = new Date(startDate), e = new Date(endDate);
                    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                }
                return 'Select custom date range';
            default: return '';
        }
    };

    // ─── Aggregation ──────────────────────────────────────────────────────────
    const aggregateData = (bills, currentStaffMap) => {
        const serviceMap = {};   // serviceName → { name, count, staffBreakdown: { staffId: count } }
        const staffAgg   = {};   // staffId     → { totalCount, services: { serviceName: count } }

        bills.forEach(bill => {
            if (!Array.isArray(bill.services)) return;
            bill.services.forEach(svc => {
                const name    = svc.name  || 'Unknown Service';
                const staffId = svc.staff || null;
                const qty     = svc.quantity || 1;

                // --- service aggregation ---
                if (!serviceMap[name]) {
                    serviceMap[name] = { name, count: 0, staffBreakdown: {} };
                }
                serviceMap[name].count += qty;
                if (staffId) {
                    serviceMap[name].staffBreakdown[staffId] = (serviceMap[name].staffBreakdown[staffId] || 0) + qty;
                }

                // --- staff aggregation ---
                if (staffId) {
                    if (!staffAgg[staffId]) {
                        staffAgg[staffId] = { staffId, totalCount: 0, services: {} };
                    }
                    staffAgg[staffId].totalCount     += qty;
                    staffAgg[staffId].services[name]  = (staffAgg[staffId].services[name] || 0) + qty;
                }
            });
        });

        // Build serviceStats sorted by count desc
        const serviceList = Object.values(serviceMap).sort((a, b) => b.count - a.count);

        // Build staffStats sorted by totalCount desc
        const staffList = Object.values(staffAgg)
            .sort((a, b) => b.totalCount - a.totalCount)
            .map((s, idx) => {
                const staffInfo = currentStaffMap[s.staffId] || {};
                const topServices = Object.entries(s.services)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([svcName, count]) => ({ name: svcName, count }));
                return {
                    ...s,
                    rank: idx + 1,
                    name: staffInfo.name || 'Unknown Staff',   // searchUser returns .name
                    topServices,
                };
            });

        return { serviceList, staffList };
    };

    // ─── CSV Export ───────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (serviceStats.length === 0) { toast.error('No data to export'); return; }

        const serviceHeaders = [
            { title: 'Rank',        key: 'rank'  },
            { title: 'Service Name', key: 'name'  },
            { title: 'Count',       key: 'count' },
            { title: 'Share (%)',   key: 'share' },
            { title: 'Staff',       key: 'staff' },
        ];

        const serviceData = serviceStats.map((s, i) => ({
            rank:  i + 1,
            name:  s.name,
            count: s.count,
            share: totalServicesCount > 0 ? Math.round((s.count / totalServicesCount) * 100) + '%' : '0%',
            staff: Object.entries(s.staffBreakdown || {})
                .map(([id, cnt]) => `${staffMap[id]?.name || id} (${cnt})`)
                .join('; '),
        }));

        const staffHeaders = [
            { title: 'Rank',          key: 'rank'       },
            { title: 'Staff Name',    key: 'name'       },
            { title: 'Total Services', key: 'totalCount' },
            { title: 'Top Services',  key: 'topSvc'     },
        ];

        const staffData = staffStats.map(s => ({
            rank:       s.rank,
            name:       s.name,
            totalCount: s.totalCount,
            topSvc:     s.topServices.map(t => `${t.name} (${t.count})`).join('; '),
        }));

        const dateLabel = getDateRangeText().replace(/[^a-zA-Z0-9\- ]/g, '').replace(/ /g, '_');
        exportToCSV(serviceData, serviceHeaders, `Services_${dateLabel}.csv`);

        setTimeout(() => {
            exportToCSV(staffData, staffHeaders, `StaffPerformance_${dateLabel}.csv`);
        }, 500);

        toast.success('CSV files exported successfully');
    };

    // ─── Fetch bills ──────────────────────────────────────────────────────────
    const fetchBillsData = async () => {
        setIsLoading(true);
        try {
            const { start, end } = getDateRangeTimestamps();
            const res = await HitApi(
                { page: 1, limit: 10000, search: { createdAt: { $gte: start, $lte: end } } },
                searchBill
            );

            if (res?.statusCode === 200) {
                const bills = Array.isArray(res?.data?.docs) ? res.data.docs : [];
                const { serviceList, staffList } = aggregateData(bills, staffMap);
                const total = serviceList.reduce((sum, s) => sum + s.count, 0);
                setServiceStats(serviceList);
                setStaffStats(staffList);
                setTotalServicesCount(total);
                toast.success(`Loaded data for ${bills.length} bills`);
            } else {
                setServiceStats([]); setStaffStats([]); setTotalServicesCount(0);
                toast.error('Failed to fetch bills');
            }
        } catch (err) {
            console.error('Error fetching bills:', err);
            toast.error('Error loading service data');
            setServiceStats([]); setStaffStats([]); setTotalServicesCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedFilter !== 'customRange') fetchBillsData();
    }, [selectedFilter]);

    // Re-aggregate when staffMap loads (so names are resolved)
    useEffect(() => {
        if (Object.keys(staffMap).length > 0) fetchBillsData();
    }, [staffMap]);

    // ─── Derived display data ─────────────────────────────────────────────────
    const maxCount      = serviceStats.length > 0 ? serviceStats[0].count : 1;
    const paginatedStats = serviceStats.slice((page - 1) * limit, page * limit);
    const topStaff      = staffStats.slice(0, 3);
    const restStaff     = staffStats.slice(3);

    // Helper: get staff names string for a service's staffBreakdown
    const getStaffNames = (staffBreakdown = {}) => {
        const entries = Object.entries(staffBreakdown).sort((a, b) => b[1] - a[1]);
        if (entries.length === 0) return <span className="text-gray-400 text-xs">—</span>;
        return (
            <div className="flex flex-col gap-0.5">
                {entries.map(([id, cnt]) => (
                    <span key={id} className="text-xs text-gray-700">
                        <span className="font-medium">{staffMap[id]?.name || id}</span>
                        <span className="text-gray-400 ml-1">×{cnt}</span>
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-5">

            {/* ── Header ── */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                                <Scissors className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <PageHeader title={'Service Dashboard'} description={'Service count & staff performance by date range'} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3 bg-purple-50 px-4 py-2 rounded-lg border border-purple-100 w-fit">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-700 text-sm">{getDateRangeText()}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchBillsData}
                            disabled={isLoading}
                            className="p-2.5 border-2 border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={isLoading || serviceStats.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 border-2 border-green-300 rounded-xl bg-white text-green-700 hover:bg-green-50 hover:border-green-400 transition-all shadow-sm font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <select
                            value={selectedFilter}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-gray-700 font-medium cursor-pointer shadow-sm hover:border-purple-300 transition-all"
                        >
                            {filterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {showCustomRange && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-4 mt-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                <span className="text-sm font-semibold text-gray-700">Custom Date Range:</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 font-medium">From:</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-600 font-medium">To:</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-sm" />
                            </div>
                            <button
                                onClick={handleApplyCustomRange}
                                disabled={!startDate || !endDate}
                                className={`px-6 py-2 rounded-lg font-semibold transition-all shadow-md ${startDate && endDate ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                Apply Filter
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Loading ── */}
            {isLoading && (
                <div className="flex flex-col justify-center items-center py-20">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600"></div>
                        <div className="absolute top-0 left-0 animate-ping rounded-full h-16 w-16 border-b-4 border-indigo-400 opacity-75"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading service data...</p>
                </div>
            )}

            {!isLoading && (
                <>
                    {/* ── Summary Cards ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    <Activity className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white text-opacity-90 text-sm font-medium">Total Services Done</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{totalServicesCount}</p>
                            <p className="text-white text-opacity-70 text-xs mt-1">Across {serviceStats.length} unique service types</p>
                        </div>

                        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-lg p-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    <Scissors className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white text-opacity-90 text-sm font-medium">Most Popular Service</span>
                            </div>
                            <p className="text-2xl font-bold text-white truncate">
                                {serviceStats.length > 0 ? serviceStats[0].name : '—'}
                            </p>
                            <p className="text-white text-opacity-70 text-xs mt-1">
                                {serviceStats.length > 0 ? `${serviceStats[0].count} times` : 'No data'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg p-5">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-white text-opacity-90 text-sm font-medium">Top Performer</span>
                            </div>
                            <p className="text-2xl font-bold text-white truncate">
                                {staffStats.length > 0 ? staffStats[0].name : '—'}
                            </p>
                            <p className="text-white text-opacity-70 text-xs mt-1">
                                {staffStats.length > 0 ? `${staffStats[0].totalCount} services` : 'No data'}
                            </p>
                        </div>
                    </div>

                    {/* ── Staff Performance Ranking ── */}
                    {staffStats.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2.5 rounded-xl shadow">
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Staff Performance</h2>
                                    <p className="text-sm text-gray-500">Ranked by total services performed</p>
                                </div>
                            </div>

                            {/* Top 3 podium cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                {topStaff.map((staff, idx) => {
                                    const style = RANK_STYLES[idx] || RANK_STYLES[2];
                                    return (
                                        <div key={staff.staffId}
                                            className={`relative bg-gradient-to-br ${style.bg} rounded-xl p-5 shadow-lg`}>
                                            <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full ${style.badge}`}>
                                                {style.label}
                                            </div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="bg-white bg-opacity-40 p-2.5 rounded-full">
                                                    <User className="w-5 h-5 text-gray-800" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-base">{staff.name}</p>
                                                    <p className="text-gray-700 text-xs">{staff.totalCount} services total</p>
                                                </div>
                                            </div>
                                            {staff.topServices.length > 0 && (
                                                <div className="bg-white bg-opacity-30 rounded-lg p-2.5">
                                                    <p className="text-[10px] text-gray-700 font-semibold uppercase mb-1.5">Top Services</p>
                                                    {staff.topServices.map(t => (
                                                        <div key={t.name} className="flex justify-between text-xs text-gray-800 py-0.5">
                                                            <span className="truncate mr-2">{t.name}</span>
                                                            <span className="font-bold shrink-0">×{t.count}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Rest of staff table */}
                            {restStaff.length > 0 && (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100">
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-10">#</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Name</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Total Services</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Top Services</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {restStaff.map(staff => (
                                                <tr key={staff.staffId} className="hover:bg-amber-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-400 font-medium">{staff.rank}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-amber-100 p-1.5 rounded-full">
                                                                <User className="w-3.5 h-3.5 text-amber-600" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-800">{staff.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center justify-center bg-amber-100 text-amber-700 text-sm font-bold px-3 py-1 rounded-full min-w-[40px]">
                                                            {staff.totalCount}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-wrap gap-1">
                                                            {staff.topServices.map(t => (
                                                                <span key={t.name} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                                                    {t.name} ×{t.count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Service Count Table ── */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Service-wise Count</h2>
                                <p className="text-sm text-gray-500 mt-0.5">How many times each service was performed & by whom</p>
                            </div>
                            <div className="bg-purple-50 border border-purple-100 px-4 py-2 rounded-lg">
                                <span className="text-purple-700 font-semibold text-sm">{serviceStats.length} Services</span>
                            </div>
                        </div>

                        {serviceStats.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b-2 border-gray-100">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Count</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Staff</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-44">Share</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedStats.map((service, index) => {
                                            const globalIndex = (page - 1) * limit + index + 1;
                                            const barWidth    = Math.round((service.count / maxCount) * 100);
                                            return (
                                                <tr key={service.name} className="hover:bg-purple-50 transition-colors">
                                                    <td className="px-4 py-3 text-sm text-gray-400 font-medium">{globalIndex}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="bg-purple-100 p-1.5 rounded-lg">
                                                                <Scissors className="w-3.5 h-3.5 text-purple-600" />
                                                            </div>
                                                            <span className="text-sm font-semibold text-gray-800">{service.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center justify-center bg-purple-100 text-purple-700 text-sm font-bold px-3 py-1 rounded-full min-w-[40px]">
                                                            {service.count}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {getStaffNames(service.staffBreakdown)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 bg-gray-100 rounded-full h-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                                                                    style={{ width: `${barWidth}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 w-8 text-right">
                                                                {totalServicesCount > 0 ? Math.round((service.count / totalServicesCount) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Pagination Footer */}
                                <div className="flex justify-between items-center py-5 gap-4 border-t border-gray-100 mt-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Show:</span>
                                        <select
                                            value={limit}
                                            onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                                            className="border border-gray-300 rounded px-3 py-1 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white cursor-pointer"
                                        >
                                            {limitOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <Pagination
                                        total={serviceStats.length}
                                        outline={true}
                                        defaultCurrent={1}
                                        current={page}
                                        onChange={handlePageChange}
                                        pageSize={limit}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Scissors className="w-10 h-10 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-lg font-medium">No services found for this period</p>
                                <p className="text-gray-400 text-sm mt-1">Try selecting a different date range</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default ServiceDashboard;
