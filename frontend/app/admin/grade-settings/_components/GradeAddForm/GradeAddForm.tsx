'use client';

import React, { useState } from 'react';
import styles from '../../page.module.css';

interface GradeAddFormProps {
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

const GradeAddForm: React.FC<GradeAddFormProps> = ({ onSubmit, onCancel }) => {
    const [newGrade, setNewGrade] = useState({
        grade: "", displayName: "", earnRate: 1,
        upgradeOrderCount: "", upgradeOrderAmount: "",
        mainColor: "#333333", textColor: "#FFFFFF"
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({
            grade: newGrade.grade,
            displayName: newGrade.displayName,
            earnRate: newGrade.earnRate,
            upgradeOrderCount: newGrade.upgradeOrderCount ? parseInt(newGrade.upgradeOrderCount) : null,
            upgradeOrderAmount: newGrade.upgradeOrderAmount ? parseInt(newGrade.upgradeOrderAmount) : null,
            mainColor: newGrade.mainColor,
            textColor: newGrade.textColor
        });
        setNewGrade({ grade: "", displayName: "", earnRate: 1, upgradeOrderCount: "", upgradeOrderAmount: "", mainColor: "#333333", textColor: "#FFFFFF" });
    };

    return (
        <form className={styles.addForm} onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
                <div>
                    <label>등급 코드 (영문)</label>
                    <input required value={newGrade.grade} onChange={e => setNewGrade({...newGrade, grade: e.target.value})} placeholder="예: VIP_GOLD" />
                </div>
                <div>
                    <label>표시 이름</label>
                    <input required value={newGrade.displayName} onChange={e => setNewGrade({...newGrade, displayName: e.target.value})} placeholder="예: VIP 골드" />
                </div>
                <div>
                    <label>적립률 (%)</label>
                    <input type="number" required value={newGrade.earnRate} onChange={e => setNewGrade({...newGrade, earnRate: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                    <label>승급 주문 횟수</label>
                    <input type="number" placeholder="무제한" value={newGrade.upgradeOrderCount} onChange={e => setNewGrade({...newGrade, upgradeOrderCount: e.target.value})} />
                </div>
                <div>
                    <label>승급 누적 금액</label>
                    <input type="number" placeholder="무제한" value={newGrade.upgradeOrderAmount} onChange={e => setNewGrade({...newGrade, upgradeOrderAmount: e.target.value})} />
                </div>
                <div>
                    <label>메인 컬러</label>
                    <input type="color" value={newGrade.mainColor} onChange={e => setNewGrade({...newGrade, mainColor: e.target.value})} />
                </div>
                <div>
                    <label>텍스트 컬러</label>
                    <input type="color" value={newGrade.textColor} onChange={e => setNewGrade({...newGrade, textColor: e.target.value})} />
                </div>
            </div>
            <div className={styles.formActions}>
                <button type="button" onClick={onCancel} className={styles.cancelBtn}>취소</button>
                <button type="submit" className={styles.submitBtn}>추가하기</button>
            </div>
        </form>
    );
};

export default GradeAddForm;
