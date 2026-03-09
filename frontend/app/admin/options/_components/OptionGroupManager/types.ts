import { OptionGroup, OptionItem } from '@/types/menuOption';

export interface Category {
    id: number;
    name: string;
    sortOrder: number;
}

export interface GroupFormData {
    name: string;
    type: string;
    isRequired: boolean;
    sortOrder: number;
}

export interface ItemFormData {
    name: string;
    priceDelta: number;
    sortOrder: number;
}

export { type OptionGroup, type OptionItem };
