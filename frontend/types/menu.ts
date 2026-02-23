// types/menu.ts

export interface Menu {
  id: number;
  korName: string;
  engName: string;
  description: string;
  price: number;
  category: MenuCategory;
  categoryId?: number;
  images: MenuImage[];
  isAvailable: boolean;
  isSoldOut: boolean;
  sortOrder: number;
  options: MenuOption[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface MenuOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox';
  required: boolean;
  items: OptionItem[];
}

export interface OptionItem {
  id: string;
  name: string;
  priceDelta: number;
}

export interface MenuCategory {
  id: number;
  korName: string;
  engName: string;
  sortOrder: number;
}

// Form types
export interface MenuFormData {
  korName: string;
  engName: string;
  description: string;
  price: number;
  categoryId: number;
  isAvailable: boolean;
  images: File[];
  options: MenuOption[];
}

// Filter types
export type MenuStatusFilter = 'all' | 'available' | 'soldout' | 'hidden';
