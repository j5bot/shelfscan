import React from 'react';
import { useBarcodeScanner } from 'use-barcode-scanner/dist/hooks/esm';

export type WebcamScannerProps = {
    settings?: Record<string, boolean | RegExp>;
    devices?: MediaDeviceInfo[];
    onScan: (code: string) => void;
    onDevices?: (devices: MediaDeviceInfo[]) => void;
    shouldScan?: boolean;
    preferDeviceLabelMatch?: RegExp;
    canvasWidth?: number;
    canvasHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    zoom?: number;
};

export const WebcamScanner = (props: WebcamScannerProps) => {
    const {
        settings,
        devices,
        onDevices: parentOnDevices,
        onScan,
        canvasWidth = 320,
        canvasHeight = 240,
        videoWidth = 640,
        videoHeight = 480,
        zoom = 1,
    } = props;

    const {
        webcamVideoRef,
        canvasRef,
        hasPermission,
    } = useBarcodeScanner({
        zoom,
        onScan,
        onDevices: parentOnDevices,
        shouldPlay: false,
    });

    return (hasPermission && devices?.length ?
        <>
            <div className="webcam-scanner-preview-box">
                <div className="webcam-scanner-preview">
                    <video
                        ref={webcamVideoRef}
                        height={videoHeight}
                        width={videoWidth}
                        playsInline={true}
                        autoPlay={true}
                    />
                    <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
                    {settings?.scanLine && <div className={'scanline'}>-</div>}
                </div>
            </div>
        </>
    : null);
};
