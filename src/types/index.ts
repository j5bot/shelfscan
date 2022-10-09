import { GameUPCData } from './GameUPCData';

export type ScannerDevOptions = {
    code?: string;
    codes?: string[];
    data?: GameUPCData;
    devices?: MediaDeviceInfo[];
};

export * from './GameUPCData';
