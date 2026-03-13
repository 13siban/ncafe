"use client";

import React from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";

import { useOrderTracking } from "./_components/useOrderTracking";
import { TrackingHeader } from "./_components/TrackingHeader/TrackingHeader";
import { StatusCard } from "./_components/StatusCard/StatusCard";
import { OrderDetailsSummary } from "./_components/OrderDetailsSummary/OrderDetailsSummary";
import { TrackingFooter } from "./_components/TrackingFooter/TrackingFooter";
import { LoadingState, NotFoundState } from "./_components/TrackingStates";

export default function OrderTrackingPage() {
    const { date, number } = useParams();
    const { order, loading, lastUpdated, isRefreshing, markAsPickedUp } = useOrderTracking(date as string, number as string);

    if (loading && !order) {
        return <LoadingState />;
    }

    if (!order) {
        return <NotFoundState />;
    }

    return (
        <div className={styles.wrapper}>
            <TrackingHeader lastUpdated={lastUpdated} isRefreshing={isRefreshing} />

            <main className={styles.container}>
                <StatusCard order={order} onPickup={markAsPickedUp} />
                <OrderDetailsSummary order={order} />
                <TrackingFooter />
            </main>
        </div>
    );
}
