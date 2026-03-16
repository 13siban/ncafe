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
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');

        // 등급 코드 유효성 검사
        if (!newGrade.grade.trim()) {
            setFormError('등급 코드를 입력해주세요.');
            return;
        }
        if (!/^[A-Z][A-Z0-9_]*$/.test(newGrade.grade.trim())) {
            setFormError('등급 코드는 대문자 영문, 숫자, 밑줄(_)만 사용 가능합니다. (예: VIP_GOLD)');
            return;
        }

        // 표시 이름 유효성 검사
        if (!newGrade.displayName.trim()) {
            setFormError('표시 이름을 입력해주세요.');
            return;
        }
        if (newGrade.displayName.trim().length > 20) {
            setFormError('표시 이름은 20자 이내로 입력해주세요.');
            return;
        }

        // 적립률 유효성 검사
        if (newGrade.earnRate < 0 || newGrade.earnRate > 100) {
            setFormError('적립률은 0~100% 사이로 입력해주세요.');
            return;
        }

        // 승급 조건 음수 검사
        if (newGrade.upgradeOrderCount && parseInt(newGrade.upgradeOrderCount) < 0) {
            setFormError('승급 주문 횟수는 0 이상이어야 합니다.');
            return;
        }
        if (newGrade.upgradeOrderAmount && parseInt(newGrade.upgradeOrderAmount) < 0) {
            setFormError('승급 누적 금액은 0 이상이어야 합니다.');
            return;
        }

        await onSubmit({
            grade: newGrade.grade.trim(),
            displayName: newGrade.displayName.trim(),
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
            {formError && (
                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem', textAlign: 'center', marginBottom: '1rem' }}>
                    ⚠️ {formError}
                </div>
            )}
            <div className={styles.formGrid}>
                <div>
                    <label>등급 코드 (영문)</label>
                    <input required value={newGrade.grade} onChange={e => setNewGrade({...newGrade, grade: e.target.value.toUpperCase()})} placeholder="예: VIP_GOLD" />
                </div>
                <div>
                    <label>표시 이름</label>
                    <input required value={newGrade.displayName} onChange={e => setNewGrade({...newGrade, displayName: e.target.value})} placeholder="예: VIP 골드" />
                </div>
                <div>
                    <label>적립률 (%)</label>
                    <input type="number" required min={0} max={100} value={newGrade.earnRate} onChange={e => setNewGrade({...newGrade, earnRate: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                    <label>승급 주문 횟수</label>
                    <input type="number" placeholder="무제한" min={0} value={newGrade.upgradeOrderCount} onChange={e => setNewGrade({...newGrade, upgradeOrderCount: e.target.value})} />
                </div>
                <div>
                    <label>승급 누적 금액</label>
                    <input type="number" placeholder="무제한" min={0} value={newGrade.upgradeOrderAmount} onChange={e => setNewGrade({...newGrade, upgradeOrderAmount: e.target.value})} />
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
