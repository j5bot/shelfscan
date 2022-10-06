import { useEffect, useRef, useState } from 'react';
import { hasCameraPermission, requestCameraPermission } from './camera/permission';

export const useWebcam2 = () => {
    const webcamVideoRef = useRef<HTMLVideoElement>();
    const hasPermission = hasCameraPermission() || requestCameraPermission();
    const deviceList = hasPermission ? getDeviceList() : [];

    const [stream, setStream] = useState<MediaStream>();

    useEffect(() => {
        let active = true;

        if (active && webcamVideoRef.current && deviceList.length > 0) {
            attachWebcamToVideoElement(webcamVideoRef.current, deviceList).then(setStream);
        }

        return () => { active = false; };
    }, [deviceList]);

    return {
        webcamVideoRef,
        deviceList,
        hasPermission,
        stream,
    };
};

const attachWebcamToVideoElement = (videoElement: HTMLVideoElement, deviceList: MediaDeviceInfo[]): Promise<MediaStream> => {
    // TODO: select device according to constraints / pattern match
    const device = deviceList[0];

    return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            advanced: [{ deviceId: device.deviceId }],
        },
    }).then((stream: MediaStream) => {
        videoElement.srcObject = stream;
        return stream;
    });
};

const getDeviceList = (): MediaDeviceInfo[] => {
    const [deviceList, setDeviceList] = useState<MediaDeviceInfo[]>([]);

    useEffect(() => {
        let active = true;
        listDevices().then(setDeviceList);
        return () => { active = false; };
    });

    return deviceList;
};

const listDevices = (): Promise<MediaDeviceInfo[]> => {
    return navigator.mediaDevices.enumerateDevices();
};
