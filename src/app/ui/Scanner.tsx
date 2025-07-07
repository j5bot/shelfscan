'use client';

import { useTailwindBreakpoint } from '@/app/lib/TailwindProvider';
import { BarcodeScanner } from '@react-barcode-scanner/components/dist';
import React, { useMemo, useState } from 'react';

export type ScannerProps = {
    onScan: (code: string) => void;
};

export const ScannerSizes = {
    loading: { height: 0, width: 0, cropWidthRatio: 1 },
    mobile: { height: 240, width: 320, cropWidthRatio: 0.9 },
    sm: { height: 376, width: 480, cropWidthRatio: 1 },
    md: { height: 376, width: 480, cropWidthRatio: 1 },
    lg: { height: 376, width: 480, cropWidthRatio: 1 },
    xl: { height: 480, width: 640, cropWidthRatio: 1 },
    '2xl': { height: 480, width: 640, cropWidthRatio: 1 },
} as const;

export function Scanner(props: ScannerProps) {
    const { onScan } = props;
    const breakpoint = useTailwindBreakpoint() ?? 'loading';

    // usually from props
    const {
        scanLine = 'solid 3px red',
        canvasHeight = ScannerSizes[breakpoint].height,
        canvasWidth = ScannerSizes[breakpoint].width,
        videoHeight = ScannerSizes[breakpoint].height,
        videoWidth = ScannerSizes[breakpoint].width,
        videoCropHeight = ScannerSizes[breakpoint].height * 0.5,
        videoCropWidth= ScannerSizes[breakpoint].width * ScannerSizes[breakpoint].cropWidthRatio,
        zoom = 1.2,
        blur = 0,
    } = {};

    const scanAudio = useMemo(() => {
        try {
            return new global.Audio('/sounds/barcode-scan.mp3');
        } catch (e) {
            void e;
            return {
                play: () => Promise.resolve(),
            };
        }
    }, []);

    const [codes, setCodes] = useState<string[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const doScan = (code: string) => {
        if (codes.includes(code)) {
            return;
        }
        scanAudio.play().then();
        codes.push(code);
        setCodes(codes);
        onScan(code);
    };

    const onDevices = (devices: MediaDeviceInfo[]) => {
        setDevices(devices);
    };

    return <div
        id="scan-barcodes"
        style={{
            width: `${videoCropWidth}px`,
            height: `${videoCropHeight}px`,
            borderWidth: breakpoint === 'mobile' ? '0.25rem' : '0.35rem',
        }}
        className="border-red-300 box-content rounded-2xl bg-red-300"
    >
        <BarcodeScanner
            animate={true}
            className="rounded-none"
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
        />
    </div>;
}
