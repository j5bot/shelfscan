import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, Result } from '@zxing/library';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type UseWebcamOptions = {
    hints?: Map<DecodeHintType, string[]>;
    preferDeviceLabelMatch?: RegExp;
};

const defaultHints = new Map();
const barcodeFormats = [BarcodeFormat.CODE_39, BarcodeFormat.CODE_93, BarcodeFormat.EAN_13];
defaultHints.set(DecodeHintType.POSSIBLE_FORMATS, barcodeFormats);

const decodeFromVideo = async (codeReader: BrowserMultiFormatReader, element: HTMLVideoElement, deviceId?: string) => {
    return new Promise<Result>((resolve, reject) => {
        codeReader.decodeFromVideoDevice(deviceId ?? '', element, (result, err) => {
            if (!result) {
                return;
            }
            if (err) {
                console.log(err);
            }
            resolve(result);
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

    const [shouldReset, setShouldReset] = useState<boolean>(false);

    const [code, setCode] = useState<string | undefined>();

    const listDevices = async (active: boolean) => {
        if (!active) {
            return;
        }
        const deviceList = await BrowserMultiFormatReader.listVideoInputDevices();
        setDevices(deviceList);
        return deviceList;
    };

    const setPreferredDevice = (deviceList: MediaDeviceInfo[] | undefined = devices) => {
        if (deviceList?.length === 0) {
            return;
        }
        const deviceToUse = (preferDeviceLabelMatch &&
                             deviceList?.find(device => preferDeviceLabelMatch.test(device.label))) ??
                            deviceList?.[0];
        setDevice(deviceToUse);
        return deviceToUse;
    };

    useEffect(() => {
        let active = true;

        listDevices(active).then();
        return () => {
            active = false;
        };
    }, [shouldReset]);

    useEffect(() => {
        setPreferredDevice();
    }, [devices]);

    // Returned getter functions
    const getCode = useCallback(async () => {
        let deviceToUse = device;
        if (!webcamRef.current) {
            console.log('lost ref to webcam');
            return;
        }
        // webcamRef.current.pause();

        if (!deviceToUse) {
            console.log('No webcam attached');

            codeReaderRef.current = new BrowserMultiFormatReader(hints);
            const deviceList = await listDevices(true);

            if (deviceList?.length === 0) {
                console.log('No device list found');
                return;
            }
            deviceToUse = setPreferredDevice(deviceList);

            if (!deviceToUse) {
                console.log('N')
            }
        }
        return await decodeFromVideo(codeReaderRef.current, webcamRef.current, deviceToUse?.deviceId);
    }, [device]);

    const getDevices = () => devices;

    return {
        webcamRef,
        codeReaderRef,

        getCode,
        getDevices,

        setDevice,
        setShouldReset,
    };
};
