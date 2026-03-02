/**
 * 공유 메뉴 타입 정의
 * components/menu/ 하위의 모든 컴포넌트에서 사용
 */

export type MenuMode = 'admin' | 'public';

export interface MenuResponse {
    id: number;
    korName: string;
    engName: string;
    description: string;
    price: number;
    categoryName: string;
    imageSrc: string;
    isOrderable: boolean;
    isSoldOut: boolean;
    sortOrder: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface MenuListResponse {
    menus: MenuResponse[];
    total: number;
}

export interface CategoryResponseDto {
    id: number;
    name: string;
    sortOrder?: number;
    menuCount?: number;
}
