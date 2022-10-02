import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, Result } from '@zxing/library';
import { FC, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWebcam } from '../hooks/useWebcam';

export type WebcamScannerProps = {
    onScan: (code: string, format?: BarcodeFormat) => void;
    shouldScan?: boolean;
    preferDeviceLabelMatch?: RegExp;
    height?: number;
    width?: number;
};

export const WebcamScanner = (props: PropsWithChildren<WebcamScannerProps>) => {
    const {
        height,
        width,
        onScan,
        shouldScan = true,
        preferDeviceLabelMatch,
        children,
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
            const result = await getCode();
            if (!result) {
                return;
            }
            onScan(result.getText(), result.getBarcodeFormat());
        };
        scanCode();

        return () => {
            active = false;
        };
    }, [shouldScan, onScan]);

    return (
        <>
            <div className="webcam-scanner-preview-box">
                <>
                    <video
                        ref={webcamRef}
                        height={height}
                        width={width}
                    />
                    {children}
                </>
            </div>
        </>
    );
};
