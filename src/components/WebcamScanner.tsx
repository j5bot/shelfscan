import { FC, PropsWithChildren } from 'react';
import { useBarcodeScanner } from 'use-barcode-scanner/dist/esm';

export type WebcamScannerProps = {
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

export const WebcamScanner: FC<any> = (props: PropsWithChildren<WebcamScannerProps>) => {
    const {
        preferDeviceLabelMatch,
    } = props;

    const {
        onDevices,
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
    } = useBarcodeScanner({ zoom, onScan, onDevices });

    return (hasPermission ?
        <>
            <div className="webcam-scanner-preview-box">
                <div className="webcam-scanner-preview">
                    <video
                        ref={webcamVideoRef}
                        height={videoHeight}
                        width={videoWidth}
                    />
                    <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
                </div>
            </div>
        </>
    : null);
};
