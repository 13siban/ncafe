'use client';

import React from 'react';
import { X } from 'lucide-react';
import styles from '../../../OptionGroupManager.module.css';
import { GroupFormData } from '../../types';

interface GroupFormModalProps {
    isEdit: boolean;
    targetCategoryId: number | null;
    form: GroupFormData;
    setForm: (form: GroupFormData) => void;
    onClose: () => void;
    onSave: () => void;
}

export function GroupFormModal({
    isEdit,
    targetCategoryId,
    form,
    setForm,
    onClose,
    onSave
}: GroupFormModalProps) {
    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>
                        {isEdit ? '옵션 그룹 수정' : '새 옵션 그룹 만들기'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                    {targetCategoryId !== null && !isEdit && (
                        <p className={styles.modalDesc}>새로 생성된 옵션은 현재 선택된 카테고리에 자동으로 연결됩니다.</p>
                    )}
                    <div className={styles.formGroup}>
                        <label>그룹 이름</label>
                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="예: 온도 선택" />
                    </div>
                    <div className={styles.formGroup}>
                        <label>입력 타입</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="radio">Radio (단일 선택)</option>
                            <option value="checkbox">Checkbox (다중 선택)</option>
                        </select>
                    </div>
                    <div className={`${styles.formGroup} ${styles.formGroupCheckbox}`}>
                        <input type="checkbox" id="req" checked={form.isRequired} onChange={e => setForm({ ...form, isRequired: e.target.checked })} />
                        <label htmlFor="req" style={{ margin: 0, fontWeight: 'normal' }}>필수 옵션으로 지정</label>
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
