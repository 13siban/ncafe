import { MenuResponse } from '@/components/menu/types';
import { MenuOptionsResponse, OptionGroup } from '@/types/menuOption';

export interface MenuDetailResponse extends MenuResponse {
    images?: { id: number; srcUrl: string; }[];
}

export { type MenuOptionsResponse, type OptionGroup };
