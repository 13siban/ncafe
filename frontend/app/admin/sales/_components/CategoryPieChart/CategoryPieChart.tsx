'use client';

import React from 'react';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieLabelRenderProps
} from 'recharts';
import styles from '../../page.module.css';

interface CategoryPieChartProps {
    data: { name: string; value: number }[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function CategoryPieChart({ data }: CategoryPieChartProps) {
    return (
        <div className={styles.pieCard}>
            <h3 className={styles.sectionTitle}>카테고리별 매출 비중</h3>
            <div className={styles.pieWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            label={(props: PieLabelRenderProps) => `${props.name ?? ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => `₩${Number(value).toLocaleString()}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
