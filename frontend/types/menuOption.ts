export interface OptionItem {
    id: number;
    optionGroupId: number;
    name: string;
    priceDelta: number;
    sortOrder: number;
}

export interface OptionGroup {
    id: number;
    name: string;
    type: 'radio' | 'checkbox';
    isRequired: boolean;
    sortOrder: number;
    items: OptionItem[];
}

export interface MenuOptionsResponse {
    menuId: number;
    optionGroups: OptionGroup[];
}

export interface CategoryWithOptions {
    id: number;
    name: string;
    options: OptionGroup[];
}
