'use client';

import { useDispatch } from '@/app/lib/hooks';
import { TailwindCSSBreakId } from '@/app/lib/hooks/useTailwindBreakpoint';
import { fetchCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { GameUPCData } from '@/app/lib/types/GameUPCData';
import { BarcodeScanner } from '@react-barcode-scanner/components/dist';
import React, { useMemo, useState } from 'react';

export type ScannerProps = {
    size: ScannerSize;
    onScan: (code: string) => Promise<GameUPCData>;
};

export const ScannerSizes = {
    mobile: { height: 240, width: 320, cropWidthRatio: 0.8 },
    sm: { height: 376, width: 480, cropWidthRatio: 1 },
    md: { height: 376, width: 480, cropWidthRatio: 1 },
    lg: { height: 376, width: 480, cropWidthRatio: 1 },
    xl: { height: 376, width: 480, cropWidthRatio: 1 },
    '2xl': { height: 376, width: 480, cropWidthRatio: 1 },
} as const;
export type ScannerSize = TailwindCSSBreakId;

export function Scanner(props: ScannerProps) {
    const { onScan, size = 'mobile' } = props;

    // usually from props
    const {
        scanLine = 'solid 3px red',
        canvasHeight = ScannerSizes[size].height,
        canvasWidth = ScannerSizes[size].width,
        videoHeight = ScannerSizes[size].height,
        videoWidth = ScannerSizes[size].width,
        videoCropHeight = ScannerSizes[size].height * 0.5,
        videoCropWidth= ScannerSizes[size].width * ScannerSizes[size].cropWidthRatio,
        zoom = 2,
        blur = 0,
    } = {};

    const dispatch = useDispatch();

    const scanAudio = useMemo(() => {
        try {
            return new global.Audio('/sounds/barcode-scan.mp3');
        } catch (e) {
            void e;
            return {
                play: () => Promise.resolve(),
            };
        }
    }, [global.Audio]);

    const [codes, setCodes] = useState<string[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const doScan = async (code: string) => {
        if (codes.includes(code)) {
            return;
        }
        scanAudio.play().then();
        codes.push(code);
        setCodes(codes);
        const data = await onScan(code);
        // TODO: fix separation of concern
        await dispatch(fetchCollectionItems({ data }));
    };

    const onDevices = (devices: MediaDeviceInfo[]) => {
        setDevices(devices);
    };

    return <BarcodeScanner
        devices={devices}
        onDevices={onDevices}
        onScan={doScan}
        settings={{
            scanLine,
        }}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        videoWidth={videoWidth}
        videoHeight={videoHeight}
        videoCropHeight={videoCropHeight}
        videoCropWidth={videoCropWidth}
        zoom={zoom}
        blur={blur}
    />;
}