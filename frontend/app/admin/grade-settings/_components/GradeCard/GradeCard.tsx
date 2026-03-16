'use client';

import React from 'react';
import { Loader2, Save, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import styles from '../../page.module.css';

export type GradeSetting = {
    grade: string;
    displayName: string;
    earnRate: number;
    upgradeOrderCount: number | null;
    upgradeOrderAmount: number | null;
    sortOrder: number;
    mainColor: string;
    textColor: string;
};

interface GradeCardProps {
    setting: GradeSetting;
    index: number;
    total: number;
    savingGrade: string | null;
    onChange: (grade: string, field: keyof GradeSetting, value: string) => void;
    onSave: (setting: GradeSetting) => void;
    onDelete: (grade: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
}

const GradeCard: React.FC<GradeCardProps> = ({
    setting, index, total, savingGrade,
    onChange, onSave, onDelete, onMove
}) => {
    return (
        <div className={styles.card} style={{ borderColor: setting.mainColor }}>
            <div className={styles.cardHeader} style={{ backgroundColor: setting.mainColor, color: setting.textColor }}>
                <div className={styles.cardHeaderTop}>
                    <input
                        className={styles.nameInput}
                        value={setting.displayName}
                        onChange={(e) => onChange(setting.grade, 'displayName', e.target.value)}
                        placeholder="등급 이름"
                    />
                    <span className={styles.gradeCode}>{setting.grade}</span>
                </div>
                <div className={styles.cardActions}>
                    <button type="button" onClick={() => onMove(index, 'up')} disabled={index === 0}><ArrowUp size={16} /></button>
                    <button type="button" onClick={() => onMove(index, 'down')} disabled={index === total - 1}><ArrowDown size={16} /></button>
                </div>
            </div>
            <div className={styles.cardBody}>
                <div className={styles.fieldGroup}>
                    <label>적립률 (%)</label>
                    <input type="number" value={setting.earnRate} onChange={(e) => onChange(setting.grade, 'earnRate', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                    <label>승급 필요 주문 횟수 (회)</label>
                    <input type="number" placeholder="무제한" value={setting.upgradeOrderCount || ''} onChange={(e) => onChange(setting.grade, 'upgradeOrderCount', e.target.value)} disabled={index === 0} />
                </div>
                <div className={styles.fieldGroup}>
                    <label>승급 필요 주문 금액 (원)</label>
                    <input type="number" placeholder="무제한" value={setting.upgradeOrderAmount || ''} onChange={(e) => onChange(setting.grade, 'upgradeOrderAmount', e.target.value)} disabled={index === 0} />
                </div>
                <div className={styles.fieldGroup}>
                    <label>배경 색상 (mainColor)</label>
                    <div className={styles.colorPickerRow}>
                        <div className={styles.colorSwatch} style={{ backgroundColor: setting.mainColor || '#333333' }} />
                        <input type="color" value={setting.mainColor || "#333333"} onChange={(e) => onChange(setting.grade, 'mainColor', e.target.value)} className={styles.colorInput} />
                        <input type="text" value={setting.mainColor || "#333333"} onChange={(e) => onChange(setting.grade, 'mainColor', e.target.value)} placeholder="#333333" className={styles.colorTextInput} />
                    </div>
                </div>
                <div className={styles.fieldGroup}>
                    <label>글자 색상 (textColor)</label>
                    <div className={styles.colorPickerRow}>
                        <div className={styles.colorSwatch} style={{ backgroundColor: setting.textColor || '#FFFFFF' }} />
                        <input type="color" value={setting.textColor || "#FFFFFF"} onChange={(e) => onChange(setting.grade, 'textColor', e.target.value)} className={styles.colorInput} />
                        <input type="text" value={setting.textColor || "#FFFFFF"} onChange={(e) => onChange(setting.grade, 'textColor', e.target.value)} placeholder="#FFFFFF" className={styles.colorTextInput} />
                    </div>
                </div>
            </div>
            <div className={styles.cardFooter}>
                {index !== 0 && (
                    <button onClick={() => onDelete(setting.grade)} className={styles.deleteBtn} title="등급 삭제">
                        <Trash2 size={16} />
                    </button>
                )}
                <button onClick={() => onSave(setting)} disabled={savingGrade === setting.grade} className={styles.saveBtn}>
                    {savingGrade === setting.grade ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />} 저장
                </button>
            </div>
        </div>
    );
};

export default GradeCard;
