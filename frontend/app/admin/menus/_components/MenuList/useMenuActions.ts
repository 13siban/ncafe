import { fetchAPI } from '@/app/lib/api/client';
import { MenuResponse } from '@/components/menu/types';

export const useMenuActions = (
    menus: MenuResponse[] | undefined,
    setMenus: React.Dispatch<React.SetStateAction<MenuResponse[] | undefined>>
) => {
    const handleAvailableToggle = async (menuId: number, isAvailable: boolean) => {
        const targetMenu = menus?.find((m) => m.id === menuId);
        if (!targetMenu) return;

        try {
            await fetchAPI(`/admin/menus/${menuId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    ...targetMenu,
                    isAvailable: isAvailable,
                }),
            });

            setMenus((prev) =>
                prev?.map((menu) =>
                    menu.id === menuId ? { ...menu, isAvailable: isAvailable, isOrderable: isAvailable && !menu.isSoldOut } : menu
                )
            );
        } catch (error) {
            console.error('Failed to toggle availability', error);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const handleSoldOutToggle = async (menuId: number, isSoldOut: boolean) => {
        const targetMenu = menus?.find((m) => m.id === menuId);
        if (!targetMenu) return;
        try {
            await fetchAPI(`/admin/menus/${menuId}`, {
                method: 'PUT',
                body: JSON.stringify({ ...targetMenu, isSoldOut }),
            });
            setMenus((prev) =>
                prev?.map((menu) =>
                    menu.id === menuId ? { ...menu, isSoldOut, isOrderable: menu.isAvailable && !isSoldOut } : menu
                )
            );
        } catch (error) {
            console.error('Failed to toggle sold out', error);
            alert('품절 상태 변경에 실패했습니다.');
        }
    };

    const handleDelete = async (menuId: number) => {
        try {
            await fetchAPI(`/admin/menus/${menuId}`, { method: 'DELETE' });
            alert('메뉴가 삭제되었습니다.');
            setMenus((prev) => prev?.filter((menu) => menu.id !== menuId));
        } catch (error) {
            console.error('Failed to delete menu', error);
            alert('메뉴 삭제에 실패했습니다.');
        }
    };

    const handleReorder = async (reorderedMenus: MenuResponse[], previousMenus?: MenuResponse[]) => {
        try {
            await fetchAPI('/admin/menus/reorder', {
                method: 'PUT',
                body: JSON.stringify(reorderedMenus.map(m => ({
                    menuId: m.id,
                    sortOrder: m.sortOrder,
                }))),
            });
        } catch (e) {
            console.error('Reorder failed', e);
            if (previousMenus) {
                setMenus(previousMenus);
            }
            alert('순서 변경에 실패했습니다.');
        }
    };

    const handleInlineChange = (menuId: number, field: string, value: any) => {
        setMenus((prev) =>
            prev?.map((m) =>
                m.id === menuId ? { ...m, [field]: value, _modified: true } : m
            )
        );
    };

    const handleBatchSave = async () => {
        if (!menus) return;
        const modified = menus.filter((m: any) => m._modified);
        if (modified.length === 0) return;

        try {
            await Promise.all(
                modified.map((m) =>
                    fetchAPI(`/admin/menus/${m.id}`, {
                        method: 'PUT',
                        body: JSON.stringify(m),
                    })
                )
            );
            setMenus((prev) =>
                prev?.map((m) => ({ ...m, _modified: false } as any))
            );
            alert('변경사항이 저장되었습니다.');
        } catch (e) {
            alert('저장에 실패했습니다.');
        }
    };

    return {
        handleAvailableToggle,
        handleSoldOutToggle,
        handleDelete,
        handleReorder,
        handleInlineChange,
        handleBatchSave,
    };
};
