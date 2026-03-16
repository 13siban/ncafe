"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Save, Plus } from "lucide-react";
import styles from "./page.module.css";
import { fetchAPI } from '@/app/lib/api/client';
import GradeCard, { type GradeSetting } from "./_components/GradeCard";
import GradeAddForm from "./_components/GradeAddForm";

export default function AdminGradeSettingsPage() {
    const [settings, setSettings] = useState<GradeSetting[]>([]);
    const [systemEnabled, setSystemEnabled] = useState(true);
    const [defaultEarnRate, setDefaultEarnRate] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [savingGrade, setSavingGrade] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const [data, configData] = await Promise.all([
                fetchAPI("/admin/grade-settings"),
                fetchAPI("/admin/grade-settings/config")
            ]);
            setSettings(data);
            setSystemEnabled(configData.isEnabled);
            setDefaultEarnRate(configData.defaultEarnRate ?? 1);
        } catch (e) {
            console.error("Failed to fetch settings", e);
            alert("설정을 불러오지 못했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSystem = async () => {
        const nextState = !systemEnabled;
        if (!nextState && !confirm("등급 시스템을 비활성화하면 모든 회원에게 기본 적립률이 일괄 적용되며, 승급 로직이 정지됩니다. 비활성화하시겠습니까?")) return;
        try {
            await fetchAPI('/admin/grade-settings/config', {
                method: 'PUT', body: JSON.stringify({ isEnabled: nextState, defaultEarnRate })
            });
            setSystemEnabled(nextState);
            alert(`등급 시스템이 ${nextState ? '활성화' : '비활성화'}되었습니다.`);
        } catch (e) { alert('설정 변경에 실패했습니다.'); }
    };

    const handleSaveDefaultEarnRate = async () => {
        setIsSavingConfig(true);
        try {
            await fetchAPI('/admin/grade-settings/config', {
                method: 'PUT', body: JSON.stringify({ isEnabled: systemEnabled, defaultEarnRate })
            });
            alert(`기본 적립률이 ${defaultEarnRate}%로 저장되었습니다.`);
        } catch (e) { alert('기본 적립률 저장에 실패했습니다.'); }
        finally { setIsSavingConfig(false); }
    };

    const handleChange = (grade: string, field: keyof GradeSetting, value: string) => {
        let parsedValue: any = value;
        const stringFields: (keyof GradeSetting)[] = ['displayName', 'grade', 'mainColor', 'textColor'];
        if (!stringFields.includes(field)) {
            parsedValue = value === "" ? "" : parseInt(value, 10);
        }
        setSettings(prev => prev.map(s => s.grade === grade ? { ...s, [field]: parsedValue } : s));
    };

    const handleSave = async (setting: GradeSetting) => {
        setSavingGrade(setting.grade);
        try {
            await fetchAPI(`/admin/grade-settings/${setting.grade}`, {
                method: 'PUT',
                body: JSON.stringify({
                    displayName: setting.displayName, earnRate: setting.earnRate,
                    upgradeOrderCount: setting.upgradeOrderCount, upgradeOrderAmount: setting.upgradeOrderAmount,
                    mainColor: setting.mainColor, textColor: setting.textColor
                })
            });
            alert(`${setting.displayName} 설정이 저장되었습니다.`);
        } catch (e: any) { alert("저장에 실패했습니다: " + e.message); }
        finally { setSavingGrade(null); }
    };

    const handleDelete = async (grade: string) => {
        if (!confirm("이 등급을 삭제하시겠습니까? 해당 등급의 회원은 모두 기본 등급으로 강등됩니다.")) return;
        try {
            await fetchAPI(`/admin/grade-settings/${grade}`, { method: 'DELETE' });
            alert("삭제되었습니다."); fetchSettings();
        } catch (e: any) { alert("삭제 실패: " + e.message); }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === settings.length - 1) return;
        const newSettings = [...settings];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSettings[index], newSettings[targetIndex]] = [newSettings[targetIndex], newSettings[index]];
        const reordered = newSettings.map((s, i) => ({ grade: s.grade, sortOrder: i + 1 }));
        try {
            await fetchAPI('/admin/grade-settings/reorder', { method: 'PUT', body: JSON.stringify(reordered) });
            fetchSettings();
        } catch { alert('순서 변경 실패'); }
    };

    const handleAddSubmit = async (data: any) => {
        try {
            await fetchAPI('/admin/grade-settings', { method: 'POST', body: JSON.stringify(data) });
            alert("새 등급이 추가되었습니다."); setIsAdding(false); fetchSettings();
        } catch (e: any) { alert("추가 실패: " + e.message); }
    };

    if (isLoading) return <div className={styles.loading}><Loader2 className={styles.spin} /></div>;

    return (
        <div className={styles.container}>
            <div className={styles.headerRow}>
                <div>
                    <h1 className={styles.title}>회원 등급 설정</h1>
                    <p className={styles.description}>사용자 등급별 할인율, 적립률 및 승급 조건을 동적으로 관리합니다.</p>
                </div>
                <div className={styles.toggleSystem}>
                    <label>등급 시스템 사용</label>
                    <label className={styles.switch}>
                        <input type="checkbox" checked={systemEnabled} onChange={handleToggleSystem} />
                        <span className={styles.slider}></span>
                    </label>
                </div>
            </div>

            <div className={`${styles.systemContainer} ${!systemEnabled ? styles.disabledSystem : ''}`}>
                {!systemEnabled && (
                    <div className={styles.disabledOverlay}>
                        등급 시스템이 비활성화되었습니다. 기본 적립률({defaultEarnRate}%)이 모든 회원에게 적용됩니다.
                    </div>
                )}

                <div className={styles.defaultEarnRateSection}>
                    <div className={styles.defaultEarnRateRow}>
                        <div className={styles.defaultEarnRateInfo}>
                            <label className={styles.defaultEarnRateLabel}>기본 적립률 (등급 시스템 비활성화 시 적용)</label>
                            <span className={styles.defaultEarnRateDesc}>등급 시스템이 꺼져있을 때 모든 주문에 일괄 적용될 적립률입니다.</span>
                        </div>
                        <div className={styles.defaultEarnRateInput}>
                            <input type="number" min={0} max={100} value={defaultEarnRate} onChange={(e) => setDefaultEarnRate(e.target.value === '' ? '' as any : parseInt(e.target.value))} />
                            <span className={styles.percentText}>%</span>
                            <button onClick={handleSaveDefaultEarnRate} disabled={isSavingConfig} className={styles.saveDefaultBtn}>
                                {isSavingConfig ? <Loader2 size={16} className={styles.spin} /> : <><Save size={16} /> 저장</>}
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.addBtnWrap}>
                    <button onClick={() => setIsAdding(!isAdding)} className={styles.addBtn}>
                        <Plus size={18} /> 새 등급 추가
                    </button>
                </div>

                {isAdding && <GradeAddForm onSubmit={handleAddSubmit} onCancel={() => setIsAdding(false)} />}

                <div className={styles.cardList}>
                    {settings.map((setting, index) => (
                        <GradeCard
                            key={setting.grade}
                            setting={setting}
                            index={index}
                            total={settings.length}
                            savingGrade={savingGrade}
                            onChange={handleChange}
                            onSave={handleSave}
                            onDelete={handleDelete}
                            onMove={handleMove}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
