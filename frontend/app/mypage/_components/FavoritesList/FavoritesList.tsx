'use client';

import React from 'react';
import { userFavoriteAPI } from '@/app/lib/api/userAPI';
import { useCartStore } from '@/store/useCartStore';
import styles from '../../mypage.module.css';

interface FavoritesListProps {
    favorites: any[];
    setFavorites: React.Dispatch<React.SetStateAction<any[]>>;
}

const getReasonLabel = (reason: string) => {
    switch (reason) {
        case 'MENU_DELETED': return { icon: '🚫', text: '메뉴가 삭제되었습니다' };
        case 'MENU_HIDDEN': return { icon: '🔒', text: '숨김 처리된 메뉴입니다' };
        case 'MENU_SOLD_OUT': return { icon: '📦', text: '품절' };
        case 'OPTION_GROUP_DELETED': return { icon: '⚙️', text: '선택한 옵션이 변경되었습니다' };
        case 'OPTION_ITEM_DELETED': return { icon: '⚙️', text: '선택한 옵션이 변경되었습니다' };
        default: return { icon: '⚠️', text: '주문 불가' };
    }
};

const FavoritesList: React.FC<FavoritesListProps> = ({ favorites, setFavorites }) => {
    const handleRemoveFavorite = async (id: number) => {
        if (!window.confirm('이 즐겨찾기를 삭제하시겠습니까?')) return;
        try {
            await userFavoriteAPI.removeFavorite(id);
            setFavorites(prev => prev.filter(f => f.id !== id));
        } catch (error: any) {
            alert(error.message || '삭제 중 오류가 발생했습니다.');
        }
    };

    const handleCleanupUnavailable = async () => {
        const unavailable = favorites.filter(f => !f.orderable);
        if (unavailable.length === 0) return;
        if (!window.confirm(`주문 불가 항목 ${unavailable.length}개를 모두 삭제하시겠습니까?`)) return;
        try {
            await Promise.all(unavailable.map(f => userFavoriteAPI.removeFavorite(f.id)));
            setFavorites(prev => prev.filter(f => f.orderable));
        } catch (error: any) {
            alert(error.message || '삭제 중 오류가 발생했습니다.');
        }
    };

    const handleAddToCart = (fav: any) => {
        if (!fav.orderable) {
            alert(`주문 불가: ${fav.unavailableReason}`);
            return;
        }

        const optionTotalPrice = fav.options.reduce((sum: number, opt: any) => sum + (opt.additionalPrice || 0), 0);

        const cartId = `${fav.menuId}-${fav.options.map((o: any) => `${o.optionGroupId}:${o.optionItemId}`).sort().join('-')}`;

        const cartItem = {
            cartId,
            menuId: fav.menuId,
            menuName: fav.menuName,
            menuEngName: fav.menuName,
            imageSrc: fav.imageUrl || 'placeholder.jpg',
            basePrice: fav.basePrice,
            quantity: 1,
            selectedOptions: fav.options.map((opt: any) => ({
                optionGroupId: opt.optionGroupId,
                optionGroupName: opt.optionGroupName,
                optionItemId: opt.optionItemId,
                optionItemName: opt.optionItemName,
                priceDelta: opt.additionalPrice || 0
            })),
            optionTotalPrice,
            subtotal: fav.basePrice + optionTotalPrice
        };

        useCartStore.getState().addItem(cartItem);
        alert('장바구니에 즐겨찾기 메뉴가 담겼습니다.');
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>즐겨찾기 메뉴</h2>

            {favorites.filter(f => !f.orderable).length > 0 && (
                <div className={styles.unavailableBanner}>
                    <span>⚠️ {favorites.filter(f => !f.orderable).length}개의 주문 불가 항목이 있습니다</span>
                    <button className={styles.cleanupBtn} onClick={handleCleanupUnavailable}>
                        일괄 삭제
                    </button>
                </div>
            )}

            <div className={styles.favoriteList}>
                {favorites.length === 0 ? (
                    <p style={{ color: 'var(--color-gray-500)', textAlign: 'center', padding: '2rem 0' }}>
                        즐겨찾기한 메뉴가 없습니다.
                    </p>
                ) : (
                    favorites.map(fav => {
                        const reason = !fav.orderable ? getReasonLabel(fav.unavailableReason) : null;
                        return (
                            <div
                                key={fav.id}
                                className={`${styles.favoriteCard} ${!fav.orderable ? styles.favoriteCardUnavailable : ''}`}
                            >
                                <img
                                    src={`/images/${fav.imageUrl || 'placeholder.jpg'}`}
                                    alt={fav.menuName}
                                    className={styles.favoriteImg}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                                    }}
                                />
                                <div className={styles.favoriteInfo}>
                                    <div className={styles.favoriteMenuName}>
                                        {fav.alias ? `${fav.alias} (${fav.menuName})` : fav.menuName}
                                    </div>
                                    <div className={styles.favoriteOptionTags}>
                                        {fav.options.map((opt: any, idx: number) => (
                                            <span key={idx} className={styles.tag}>
                                                {opt.optionGroupName}: {opt.optionItemName}
                                                {opt.additionalPrice > 0 ? ` (+${opt.additionalPrice}원)` : ''}
                                            </span>
                                        ))}
                                    </div>
                                    {reason ? (
                                        <div className={styles.reasonBadge}>
                                            {reason.icon} {reason.text}
                                        </div>
                                    ) : (
                                        <div className={styles.favoritePrice}>
                                            {new Intl.NumberFormat('ko-KR').format(fav.totalPrice)}원
                                        </div>
                                    )}
                                </div>
                                <div className={styles.favoriteActions}>
                                    <button
                                        className={styles.cartBtn}
                                        onClick={() => handleAddToCart(fav)}
                                        disabled={!fav.orderable}
                                        title={reason ? reason.text : ''}
                                    >
                                        장바구니 담기
                                    </button>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={() => handleRemoveFavorite(fav.id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
};

export default FavoritesList;
