import React from 'react';
import { useBarcodeScanner } from 'use-barcode-scanner/dist/hooks/esm';

export type BarcodeScannerProps = {
    autoStart?: boolean;
    canvasHeight?: number;
    canvasWidth?: number;
    devices?: MediaDeviceInfo[];
    onDevices?: (devices: MediaDeviceInfo[]) => void;
    onScan: (code: string) => void;
    preferDeviceLabelMatch?: RegExp;
    settings?: Record<string, boolean | RegExp>;
    videoHeight?: number;
    videoWidth?: number;
    zoom?: number;
};

export const BarcodeScanner = (props: BarcodeScannerProps) => {
    const {
        autoStart = true,
        canvasHeight = 240,
        canvasWidth = 320,
        devices,
        onDevices,
        onScan,
        settings,
        videoHeight = 480,
        videoWidth = 640,
        zoom = 1,
    } = props;

    const {
        canvasRef,
        hasPermission,
        webcamVideoRef,
    } = useBarcodeScanner({
        onDevices,
        onScan,
        shouldPlay: false,
        zoom,
    });

    return (hasPermission && devices?.length ?
        <>
            <div className="webcam-scanner-preview-box">
                <div className="webcam-scanner-preview">
                    <video
                        ref={webcamVideoRef}
                        width={videoWidth}
                        height={videoHeight}
                        autoPlay={autoStart}
                        playsInline={true}
                    />
                    <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
                    {settings?.scanLine && <div className={'scanline'}>-</div>}
                </div>
            </div>
        </>
    : null);
};
