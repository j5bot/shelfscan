import { BarcodeFormat } from '@zxing/library';
import { PropsWithChildren, useEffect } from 'react';
import { useWebcam } from '../hooks';

export type WebcamOnScanOptions = {
    code: string;
    format?: BarcodeFormat;
};

export type WebcamScannerProps = {
    onScan: (options: WebcamOnScanOptions) => void;
    onDevices?: (devices: MediaDeviceInfo[]) => void;
    shouldScan?: boolean;
    preferDeviceLabelMatch?: RegExp;
    height?: number | string;
    width?: number | string;
};

export const WebcamScanner = (props: PropsWithChildren<WebcamScannerProps>) => {
    const {
        height = 480,
        width = 640,
        onDevices,
        onScan,
        shouldScan = true,
        preferDeviceLabelMatch,
        children,
    } = props;

    const { webcamRef, getCode, getDevices } = useWebcam({
        preferDeviceLabelMatch,
    });

    useEffect(() => {
        onDevices?.(getDevices() ?? []);
    }, [getDevices]);

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
            onScan({
                code: result.getText(),
                format: result.getBarcodeFormat(),
            });
        };
        scanCode().then();

        return () => {
            active = false;
        };
    }, [shouldScan, onScan]);

    return (
        <>
            <div className="webcam-scanner-preview-box">
                <div className="webcam-scanner-preview">
                    <video
                        ref={webcamRef}
                        height={height}
                        width={width}
                    />
                    {children}
                </div>
            </div>
        </>
    );
};
