'use client';

import React from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import styles from '../../page.module.css';
import { SalesChartData } from '../../types';

interface SalesLineChartProps {
    data: SalesChartData[];
}

export function SalesLineChart({ data }: SalesLineChartProps) {
    return (
        <div className={styles.chartSection}>
            <h3 className={styles.sectionTitle}>매출 추이</h3>
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data}>
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
    );
}
