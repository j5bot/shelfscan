'use client';

import { useDispatch } from '@/app/lib/hooks';
import { fetchCollectionItems } from '@/app/lib/redux/bgg/collection/slice';
import { GameUPCData } from '@/app/lib/types/GameUPCData';
import { BarcodeScanner } from '@react-barcode-scanner/components/dist';
import React, { useMemo, useState } from 'react';

export type ScannerProps = {
    onScan: (code: string) => Promise<GameUPCData>;
};

export function Scanner(props: ScannerProps) {
    // usually from props
    const {
        scanLine = true,
        canvasHeight = 240,
        canvasWidth = 320,
        videoHeight = 480,
        videoWidth = 640,
        videoCropHeight = 240,
        videoCropWidth= 320,
        zoom = 2,
        blur = 0,
    } = {};

    const dispatch = useDispatch();

    const scanAudio = useMemo(() => {
        return new Audio('/sounds/barcode-scan.mp3');
    }, []);

    const [codes, setCodes] = useState<string[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const onScan = async (code: string) => {
        if (codes.includes(code)) {
            return;
        }
        scanAudio.play().then();
        codes.push(code);
        setCodes(codes);
        const data = await props.onScan(code);
        // TODO: fix separation of concern
        await dispatch(fetchCollectionItems({ data }));
    };

    const onDevices = (devices: MediaDeviceInfo[]) => {
        setDevices(devices);
    };

    return <BarcodeScanner
        devices={devices}
        onDevices={onDevices}
        onScan={onScan}
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