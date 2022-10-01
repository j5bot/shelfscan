import { BarcodeFormat, BrowserMultiFormatReader, DecodeHintType, Result } from "@zxing/library";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UseWebcamOptions = {
    hints?: Map<DecodeHintType, string[]>;
    preferDeviceLabelMatch?: RegExp;
};

const defaultHints = new Map();
const barcodeFormats = [BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.EAN_13];
defaultHints.set(DecodeHintType.POSSIBLE_FORMATS, barcodeFormats);

const decodeFromVideo = async (codeReader: BrowserMultiFormatReader, element: HTMLVideoElement, deviceId?: string) => {
    return new Promise<Result>((resolve) => {
        codeReader.decodeFromVideoDevice(deviceId ?? '', element, (result, err) => {
            if (!result) {
                return;
            }
            resolve(result);
            codeReader.reset();
        });
    });
};

export const useWebcam = (options: UseWebcamOptions) => {
    const {
        hints = defaultHints,
        preferDeviceLabelMatch,
    } = options;

    const webcamRef = useRef<HTMLVideoElement | null>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader(hints));

    const [device, setDevice] = useState<MediaDeviceInfo>();
    const [devices, setDevices] = useState<MediaDeviceInfo[]>();

    const [code, setCode] = useState<string | undefined>();

    useEffect(() => {
        let active = true;

        const listDevices = async () => {
            if (!active) {
                return;
            }
            setDevices(await codeReaderRef.current.listVideoInputDevices());
        };
        listDevices();

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (devices?.length === 0) {
            return;
        }
        const deviceToUse = (preferDeviceLabelMatch &&
                            devices?.find(device => preferDeviceLabelMatch.test(device.label))) ??
                            devices?.[0];
        setDevice(deviceToUse);
    }, [devices]);

    const tearDown = () => codeReaderRef.current.reset();

    // Returned getter functions
    const getCode = useCallback(async () => {
        if (!(device && webcamRef.current)) {
            console.log('No webcam attached');
            tearDown();
            return;
        }
        return await decodeFromVideo(codeReaderRef.current, webcamRef.current, device?.deviceId);
    }, [device]);

    const getDevices = () => devices;

    return {
        webcamRef,
        codeReaderRef,

        getCode,
        getDevices,

        setDevice,
        tearDown,
    };
};
