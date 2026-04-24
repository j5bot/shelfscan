'use client';

import { useCodes } from '@/app/lib/CodesProvider';
import { useGameUPCData } from '@/app/lib/GameUPCDataProvider';
import { useSelector } from '@/app/lib/hooks';
import { RootState } from '@/app/lib/redux/store';
import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { ScanHistoryError, ScanHistoryMatchStatus } from '@/app/lib/types/scanHistory';
import { GameUPCStatus } from 'gameupc-hooks/types';
import { useCallback, useEffect, useState } from 'react';

type UseScanRecorderResult = {
    onScan: (code: string) => void;
    isScanning: boolean;
    duplicateUpc: string | null;
    historyLimitReached: boolean;
    clearDuplicateUpc: () => void;
    clearHistoryLimitReached: () => void;
};

export const useScanRecorder = (): UseScanRecorderResult => {
    const currentUsername = useSelector((state: RootState) => state.bgg.user?.user);

    const { getGameData } = useGameUPCData();
    const { codes, addHistoryID, setCodes } = useCodes();
    const { recordScan } = useScanHistory();

    const [isScanning, setIsScanning] = useState<boolean>(false);
    const [duplicateUpc, setDuplicateUpc] = useState<string | null>(null);
    const [historyLimitReached, setHistoryLimitReached] = useState<boolean>(false);

    useEffect(() => {
        if (!duplicateUpc) {
            return;
        }
        const timer = setTimeout(() => setDuplicateUpc(null), 4000);
        return () => clearTimeout(timer);
    }, [duplicateUpc]);

    const onScan = useCallback((code: string) => {
        if (isScanning) {
            return;
        }
        if (codes.includes(code)) {
            return;
        }
        setIsScanning(true);

        getGameData(code).then(data => {
            if (!data) {
                return;
            }
            const bggInfo = data.bgg_info?.[0];
            recordScan({
                upc: code,
                username: currentUsername ?? undefined,
                status: ScanHistoryMatchStatus.matched,
                verified: data?.bgg_info_status === GameUPCStatus.verified,
                gameName: bggInfo?.name,
                bggId: bggInfo?.id,
                thumbnailUrl: bggInfo?.thumbnail_url,
            }).then(result => {
                if (result.kind === 'duplicate') {
                    setDuplicateUpc(code);
                    return;
                }
                if (result.kind === 'limitReached') {
                    setHistoryLimitReached(true);
                    return;
                }
                if (result.kind !== 'added') {
                    return;
                }
                addHistoryID(code, result.id);
            });
        }).catch(() => {
            recordScan({
                upc: code,
                username: currentUsername ?? undefined,
                status: ScanHistoryMatchStatus.unmatched,
                error: ScanHistoryError.other,
            }).then(result => {
                if (result.kind === 'duplicate') {
                    setDuplicateUpc(code);
                    return;
                }
                if (result.kind === 'limitReached') {
                    setHistoryLimitReached(true);
                    return;
                }
                if (result.kind !== 'added') {
                    return;
                }
                addHistoryID(code, result.id);
            });
        }).finally(() => setIsScanning(false));

        codes.unshift(code);
        setCodes(codes);
    }, [codes, isScanning, setCodes, recordScan, getGameData, currentUsername, addHistoryID]);

    return {
        onScan,
        isScanning,
        duplicateUpc,
        historyLimitReached,
        clearDuplicateUpc: () => setDuplicateUpc(null),
        clearHistoryLimitReached: () => setHistoryLimitReached(false),
    };
};

