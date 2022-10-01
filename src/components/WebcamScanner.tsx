import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, Result } from '@zxing/library';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebcam } from '../hooks/useWebcam';

export type WebcamScannerProps = {
    onScan: (code: string) => void;
    shouldScan?: boolean;
    preferDeviceLabelMatch?: RegExp;
    height?: number;
    width?: number;
};

export const WebcamScanner = (props: WebcamScannerProps) => {
    const {
        height,
        width,
        onScan,
        shouldScan = true,
        preferDeviceLabelMatch
    } = props;

    const { webcamRef, getCode, getDevices } = useWebcam({
        preferDeviceLabelMatch,
    });

    useEffect(() => {
        if (!shouldScan) {
            return;
        }

        let active = true;

        const scanCode = async () => {
            const code = await getCode().then(result => result?.getText());
            if (code) {
                onScan(code);
            }
        };
        scanCode();

        return () => {
            active = false;
        };
    }, [shouldScan, onScan]);

    return (
        <>
            <div>
                <video
                    ref={webcamRef}
                    height={height}
                    width={width}
                />
            </div>
        </>
    );
};
