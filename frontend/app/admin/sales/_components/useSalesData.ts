'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, addDays, subDays, isSameDay } from 'date-fns';
import { adminSalesAPI } from '@/app/lib/api/adminAPI';
import { SalesSummary, SalesChartData, SalesOrderItem, MenuRanking, SalesPeriod } from '../types';

export function useSalesData(period: SalesPeriod, currentDate: Date) {
    const [summary, setSummary] = useState<SalesSummary | null>(null);
    const [chartData, setChartData] = useState<SalesChartData[]>([]);
    const [orders, setOrders] = useState<SalesOrderItem[]>([]);
    const [menuRanking, setMenuRanking] = useState<MenuRanking[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const dateStr = format(currentDate, 'yyyy-MM-dd');

    const fetchData = async () => {
        setIsLoading(true);
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

    useEffect(() => {
        fetchData();
    }, [period, dateStr]);

    const categoryData = useMemo(() => {
        const map = new Map<string, number>();
        menuRanking.forEach(m => {
            map.set(m.categoryName, (map.get(m.categoryName) || 0) + m.totalSales);
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [menuRanking]);

    return {
        summary,
        chartData,
        orders,
        menuRanking,
        isLoading,
        categoryData,
        fetchData
    };
}
