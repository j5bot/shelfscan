'use client';

import { useTailwindBreakpoint } from '@/app/lib/TailwindProvider';
import { BarcodeScanner } from '@react-barcode-scanner/components/dist';
import React, { useMemo, useState } from 'react';
import { FaCamera } from 'react-icons/fa6';

export type ScannerProps = {
    onScan: (code: string) => void;
};

const SCANNER_SIZES = {
    NONE: { height: 0, width: 0, cropWidthRatio: 1 },
    XS: { height: 240, width: 320, cropWidthRatio: 0.9 },
    SM: { height: 376, width: 480, cropWidthRatio: 0.6 },
    MD: { height: 376, width: 480, cropWidthRatio: 1 },
    LG: { height: 480, width: 640, cropWidthRatio: 1 }
}

export const ScannerSizes = {
    loading: SCANNER_SIZES.NONE,
    mobile: SCANNER_SIZES.SM,
    sm: SCANNER_SIZES.MD,
    md: SCANNER_SIZES.MD,
    lg: SCANNER_SIZES.MD,
    xl: SCANNER_SIZES.LG,
    '2xl': SCANNER_SIZES.LG,
    'forced-xs': SCANNER_SIZES.XS,
    'forced-sm': SCANNER_SIZES.SM,
    'forced-md': SCANNER_SIZES.MD,
    'forced-lg': SCANNER_SIZES.LG,
} as const;

export function Scanner(props: ScannerProps) {
    const { onScan } = props;
    const breakpoint = useTailwindBreakpoint() ?? 'loading';

    const [forcedSize, setForcedSize] = useState<keyof typeof ScannerSizes>();
    void setForcedSize;

    // usually from props
    const {
        scanLine = 'solid 3px red',
        canvasHeight = ScannerSizes[forcedSize ?? breakpoint].height,
        canvasWidth = ScannerSizes[forcedSize ?? breakpoint].width,
        videoHeight = ScannerSizes[forcedSize ?? breakpoint].height,
        videoWidth = ScannerSizes[forcedSize ?? breakpoint].width,
        videoCropHeight = ScannerSizes[forcedSize ?? breakpoint].height * 0.5,
        videoCropWidth= ScannerSizes[forcedSize ?? breakpoint].width *
                        ScannerSizes[forcedSize ?? breakpoint].cropWidthRatio,
        zoom = 1,
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
    }, [breakpoint]);

    const [codes, setCodes] = useState<string[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [deviceId, setDeviceId] = useState<string>();

    const deviceChoiceOptions = useMemo(() => {
        if (!deviceId) {
            return undefined;
        }
        return { deviceId: { exact: deviceId } };
    }, [deviceId]);

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

    const handleCameraChange = (deviceId: string)=> {
        setDeviceId(deviceId);
    };

    return <>
        <div
            id="scan-barcodes"
            style={{
                width: `${videoCropWidth}px`,
                height: `${videoCropHeight}px`,
                borderWidth: breakpoint === 'mobile' ? '0.25rem' : '0.35rem',
            }}
            className="relative border-red-300 box-content rounded-2xl bg-red-300"
        >
            <BarcodeScanner
                animate={true}
                className="rounded-none"
                devices={devices}
                deviceChoiceOptions={deviceChoiceOptions}
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
            {devices.length > 1 && <div className="absolute top-1 right-2 text-white shadow-black">
                <button onClick={() => {
                    (document.getElementById('camera-dialog') as
                        HTMLDialogElement).showModal();
                }}>
                    <FaCamera />
                </button>
            </div>}
        </div>
        <dialog id="camera-dialog" className="modal">
            <div className="modal-box">
                <form method="dialog">
                    <button className="btn btn-sm btn-circle btn-ghost absolute right-0.5 top-0.5">
                        ✕
                    </button>
                    <h3 className="pb-1 pl-0.5">Choose Camera</h3>
                    <div className="join join-vertical text-left">
                        {devices.map((device) => {
                            return <button
                                key={device.deviceId}
                                className="btn btn-sm join-item flex justify-start"
                                onClick={() => handleCameraChange(device.deviceId)}
                            >
                                <FaCamera /> {device.label}
                            </button>
                        })}
                    </div>
                </form>
            </div>
        </dialog>
    </>;
}
