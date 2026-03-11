'use client';

import { useState, useEffect } from 'react';
import { adminStoreAPI } from '@/app/lib/api';

export function useSettings() {
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Store Status & Operating Hours
    const [openTime, setOpenTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('22:00');

    // Cafe Metadata
    const [cafeName, setCafeName] = useState('');
    const [description, setDescription] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [address, setAddress] = useState('');
    const [faviconUrl, setFaviconUrl] = useState('');

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const data = await adminStoreAPI.getStoreStatus();
            setOpenTime(data.openTime || '09:00');
            setCloseTime(data.closeTime || '22:00');
            setCafeName(data.cafeName || '');
            setDescription(data.description || '');
            setContactNumber(data.contactNumber || '');
            setAddress(data.address || '');
            setFaviconUrl(data.faviconUrl || '');
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdateSettings = async () => {
        setIsUpdating(true);
        try {
            await adminStoreAPI.updateSettings({
                openTime,
                closeTime,
                cafeName,
                description,
                contactNumber,
                address,
                faviconUrl
            });
            alert('설정이 저장되었습니다.');
        } catch (error: any) {
            alert('설정 저장에 실패했습니다: ' + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUploadFavicon = async (file: File) => {
        try {
            const result = await adminStoreAPI.uploadFavicon(file);
            setFaviconUrl(result.faviconUrl);
            alert('파비콘이 업로드되었습니다. 저장 버튼을 눌러야 최종 반영됩니다.');
        } catch (error: any) {
            alert('파비콘 업로드 실패: ' + error.message);
        }
    };

    return {
        isLoading,
        isUpdating,
        openTime,
        closeTime,
        cafeName,
        description,
        contactNumber,
        address,
        faviconUrl,
        setOpenTime,
        setCloseTime,
        setCafeName,
        setDescription,
        setContactNumber,
        setAddress,
        setFaviconUrl,
        handleUpdateSettings,
        handleUploadFavicon
    };
}
