// import { Icon, MenuItem } from '@blueprintjs/core';
// import { IconNames } from '@blueprintjs/icons';
// import { Select2 } from '@blueprintjs/select';
import { FC, PropsWithChildren } from 'react';
import { useBarcodeScanner } from 'use-barcode-scanner/dist/esm';

export type WebcamScannerProps = {
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

export const WebcamScanner: FC<any> = (props: PropsWithChildren<WebcamScannerProps>) => {
    const {
        // devices = [],
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

    // const renderDeviceMenuItem = (device: MediaDeviceInfo) => {
    //     const { deviceId, label } = device;
    //     const index = devices?.findIndex((findDevice: MediaDeviceInfo) => findDevice === device) ?? 0;
    //     return (
    //         <MenuItem key={device.deviceId} title={`${label} - ${deviceId}`} text={label.length > 0 ? label : `Camera #${index + 1}`} />
    //     );
    // };
    //
    // const onSelectDevice = (device: MediaDeviceInfo) => {
    //     console.log(JSON.stringify(device, undefined, 2));
    // };

    return (hasPermission ?
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
                    <div className={'scanline'}>-</div>
                    {/*<div className={'webcam-scanner-device-switcher'}>*/}
                    {/*    <Select2*/}
                    {/*        items={devices}*/}
                    {/*        itemRenderer={renderDeviceMenuItem}*/}
                    {/*        onItemSelect={onSelectDevice}*/}
                    {/*    >*/}
                    {/*        <Icon icon={IconNames.MOBILE_VIDEO} size={32} />*/}
                    {/*    </Select2>*/}
                    {/*</div>*/}
                </div>
            </div>
        </>
    : null);
};
