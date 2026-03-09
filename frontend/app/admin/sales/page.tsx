'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell,
    PieChart,
    Pie,
    Legend,
    PieLabelRenderProps
} from 'recharts';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    TrendingUp,
    ShoppingBag,
    Users,
    DollarSign,
    PieChart as PieChartIcon,
    List as ListIcon,
    BarChart3
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import styles from './page.module.css';
import { adminSalesAPI } from '@/app/lib/api';

// Types from backend
interface SalesSummary {
    totalSales: number;
    totalOrders: number;
    completedOrders: number;
    rejectedOrders: number;
    preparingOrders: number;
    avgOrderAmount: number;
    memberOrders: number;
    guestOrders: number;
}

interface MenuRanking {
    rank: number;
    menuName: string;
    categoryName: string;
    quantitySold: number;
    totalSales: number;
}

interface SalesChart {
    label: string;
    sales: number;
}

interface OrderItem {
    id: number;
    displayNumber: string;
    customerName: string;
    isGuest: boolean;
    status: string;
    totalPrice: number;
    summary: string;
    createdAt: string;
}

export default function SalesAnalysisPage() {
    const [period, setPeriod] = React.useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [activeTab, setActiveTab] = React.useState('summary');

    const [summary, setSummary] = React.useState<SalesSummary | null>(null);
    const [chartData, setChartData] = React.useState<SalesChart[]>([]);
    const [orders, setOrders] = React.useState<OrderItem[]>([]);
    const [menuRanking, setMenuRanking] = React.useState<MenuRanking[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        fetchData();
    }, [period, currentDate]);

    const fetchData = async () => {
        setIsLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        try {
            const [sumRes, chartRes, orderRes, rankingRes] = await Promise.all([
                adminSalesAPI.getSummary(period, dateStr),
                adminSalesAPI.getChart(period, dateStr),
                adminSalesAPI.getOrders(period, dateStr),
                adminSalesAPI.getMenuRanking(period, dateStr)
            ]);

            setSummary(sumRes);
            setChartData(chartRes || []);
            setOrders(orderRes || []);
            setMenuRanking(rankingRes || []);
        } catch (error) {
            console.error('Failed to fetch sales data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrev = () => {
        if (period === 'daily') setCurrentDate(subDays(currentDate, 1));
        else if (period === 'weekly') setCurrentDate(subDays(currentDate, 7));
        else if (period === 'monthly') {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() - 1);
            setCurrentDate(d);
        }
    };

    const handleNext = () => {
        if (period === 'daily') setCurrentDate(addDays(currentDate, 1));
        else if (period === 'weekly') setCurrentDate(addDays(currentDate, 7));
        else if (period === 'monthly') {
            const d = new Date(currentDate);
            d.setMonth(d.getMonth() + 1);
            setCurrentDate(d);
        }
    };

    const getPeriodLabel = () => {
        if (period === 'daily') return format(currentDate, 'yyyy년 MM월 dd일 (EEE)', { locale: ko });
        if (period === 'weekly') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, 'MM.dd')} ~ ${format(end, 'MM.dd')}`;
        }
        return format(currentDate, 'yyyy년 MM월');
    };

    // Process data for category pie chart
    const categoryData = React.useMemo(() => {
        const map = new Map<string, number>();
        menuRanking.forEach(m => {
            map.set(m.categoryName, (map.get(m.categoryName) || 0) + m.totalSales);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [menuRanking]);

    const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
        <div className={styles.container}>
            {/* Header & Controls */}
            <div className={styles.controls}>
                <div className={styles.periodTabs}>
                    {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                        <button
                            key={p}
                            className={`${styles.tabBtn} ${period === p ? styles.activeTabBtn : ''}`}
                            onClick={() => { setPeriod(p); setCurrentDate(new Date()); }}
                        >
                            {p === 'daily' ? '일간' : p === 'weekly' ? '주간' : '월간'}
                        </button>
                    ))}
                </div>

                <div className={styles.dateNav}>
                    <button onClick={handlePrev} className={styles.navBtn}><ChevronLeft size={20} /></button>
                    <div className={styles.currentDate}>
                        <CalendarIcon size={16} />
                        <span>{getPeriodLabel()}</span>
                    </div>
                    <button onClick={handleNext} className={styles.navBtn} disabled={isSameDay(currentDate, new Date()) && period === 'daily'}><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Main Tabs */}
            <div className={styles.mainTabs}>
                <button
                    className={`${styles.mainTab} ${activeTab === 'summary' ? styles.activeMainTab : ''}`}
                    onClick={() => setActiveTab('summary')}
                >
                    <BarChart3 size={18} /> 매출 요약
                </button>
                <button
                    className={`${styles.mainTab} ${activeTab === 'orders' ? styles.activeMainTab : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <ListIcon size={18} /> 주문 내역
                </button>
                <button
                    className={`${styles.mainTab} ${activeTab === 'menus' ? styles.activeMainTab : ''}`}
                    onClick={() => setActiveTab('menus')}
                >
                    <PieChartIcon size={18} /> 상품 분석
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'summary' && (
                    <div className={styles.tabContent}>
                        {/* Stats Cards */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>총 매출액</p>
                                    <h3 className={styles.statValue}>₩{summary?.totalSales?.toLocaleString() || '0'}</h3>
                                </div>
                                <div className={`${styles.iconBox} ${styles.blue}`}><DollarSign size={20} /></div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>주문 건수</p>
                                    <h3 className={styles.statValue}>{summary?.totalOrders?.toLocaleString() || '0'}건</h3>
                                </div>
                                <div className={`${styles.iconBox} ${styles.green}`}><ShoppingBag size={20} /></div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>객단가</p>
                                    <h3 className={styles.statValue}>₩{Math.round(summary?.avgOrderAmount || 0).toLocaleString()}</h3>
                                </div>
                                <div className={`${styles.iconBox} ${styles.purple}`}><TrendingUp size={20} /></div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statInfo}>
                                    <p className={styles.statLabel}>회원/비회원</p>
                                    <h3 className={styles.statValue}>{summary?.memberOrders || 0} / {summary?.guestOrders || 0}</h3>
                                </div>
                                <div className={`${styles.iconBox} ${styles.orange}`}><Users size={20} /></div>
                            </div>
                        </div>

                        {/* Chart Section */}
                        <div className={styles.chartSection}>
                            <h3 className={styles.sectionTitle}>매출 추이</h3>
                            <div className={styles.chartWrapper}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#6B7280' }}
                                            tickFormatter={(value) => value >= 10000 ? `${value / 10000}만` : value}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [`₩${Number(value).toLocaleString()}`, '매출']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#4F46E5"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#4F46E5', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className={styles.tabContent}>
                        <div className={styles.tableCard}>
                            <h3 className={styles.sectionTitle}>완료된 주문 내역</h3>
                            <div className={styles.tableWrapper}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>주문번호</th>
                                            <th>고객명</th>
                                            <th>상품 요약</th>
                                            <th>결제 금액</th>
                                            <th>주문 일시</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? orders.map(order => (
                                            <tr key={order.id}>
                                                <td>{order.displayNumber}</td>
                                                <td>{order.customerName} {order.isGuest ? '(비회원)' : ''}</td>
                                                <td className={styles.summaryCell}>{order.summary}</td>
                                                <td className={styles.priceCell}>₩{order.totalPrice.toLocaleString()}</td>
                                                <td className={styles.dateCell}>{format(new Date(order.createdAt), 'HH:mm')}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={5} className={styles.empty}>주문 내역이 없습니다.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'menus' && (
                    <div className={styles.tabContent}>
                        <div className={styles.menuAnalysisGrid}>
                            <div className={styles.tableCard}>
                                <h3 className={styles.sectionTitle}>상품별 판매 현황</h3>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>순위</th>
                                                <th>메뉴명</th>
                                                <th>카테고리</th>
                                                <th>판매량</th>
                                                <th>매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {menuRanking.length > 0 ? menuRanking.map(menu => (
                                                <tr key={menu.rank}>
                                                    <td className={styles.rankCell}>{menu.rank}</td>
                                                    <td className={styles.menuNameCell}>{menu.menuName}</td>
                                                    <td>{menu.categoryName}</td>
                                                    <td className={styles.countCell}>{menu.quantitySold}</td>
                                                    <td className={styles.priceCell}>₩{menu.totalSales.toLocaleString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={5} className={styles.empty}>데이터가 없습니다.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className={styles.pieCard}>
                                <h3 className={styles.sectionTitle}>카테고리별 매출 비중</h3>
                                <div className={styles.pieWrapper}>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                                label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: any) => `₩${Number(value).toLocaleString()}`} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// AreaChartComponent removed and inlined above for better compatibility with ResponsiveContainer and Recharts 3.x/2.x
