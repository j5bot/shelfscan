import { useEffect, useState } from 'react';
import { removeStreamTracks } from './stream';

export const hasCameraPermission = () => {
    const [hasPermission, setHasPermission] = useState<boolean>(false);

    useEffect(() => {
        let active = true;

        if (!hasPermission) {
            getHasDeviceLabels().then((hasDeviceLabels: boolean) => {
                setHasPermission(hasDeviceLabels);
            });
        }

        return () => { active = false; };
    });

    return hasPermission;
};

export const requestCameraPermission = () => {
    const [hasPermission, setHasPermission] = useState<boolean>(false);

    useEffect(() => {
        let active = true;

        if (!hasPermission) {
            canGetUserMedia().then(setHasPermission);
        }

        return () => { active = false; };
    });

    return hasPermission;
};

const canGetUserMedia = (): Promise<boolean> => {
    return navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
        })
        .then((stream: MediaStream) => {
            removeStreamTracks(stream);
            return true;
        })
        .catch(() => false);
};

const getHasDeviceLabels = (): Promise<boolean> => {
    return navigator.mediaDevices.enumerateDevices()
        .then((mediaDeviceInfos: MediaDeviceInfo[]) => {
            return mediaDeviceInfos.find((mediaDeviceInfo: MediaDeviceInfo) => {
                return 'label' in mediaDeviceInfo;
            }) !== undefined;
        });
};
