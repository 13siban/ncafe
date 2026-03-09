'use client';

import React from 'react';
import { X } from 'lucide-react';
import styles from '../../../OptionGroupManager.module.css';
import { ItemFormData } from '../../types';

interface ItemFormModalProps {
    isEdit: boolean;
    form: ItemFormData;
    setForm: (form: ItemFormData) => void;
    onClose: () => void;
    onSave: () => void;
}

export function ItemFormModal({
    isEdit,
    form,
    setForm,
    onClose,
    onSave
}: ItemFormModalProps) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>
                        {isEdit ? '항목 수정' : '항목 추가'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                    <div className={styles.formGroup}>
                        <label>선택 항목 이름</label>
                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: HOT" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>추가 금액 (원)</label>
                        <input type="number" step="100" value={form.priceDelta} onChange={e => setForm({ ...form, priceDelta: parseInt(e.target.value) || 0 })} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>추가 비용이 없으면 0으로 입력하세요.</p>
                    </div>
                    <div className={styles.formGroup}>
                        <label>표시 순서</label>
                        <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div className={styles.modalActions}>
                        <button type="button" className={styles.btnCancel} onClick={onClose}>취소</button>
                        <button type="submit" className={styles.btnSubmit}>저장</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
