import { FormGroup, Switch } from '@blueprintjs/core';
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/popover2/lib/css/blueprint-popover2.css';
import '@blueprintjs/select/lib/css/blueprint-select.css';
import React, { FormEvent, useEffect, useState } from 'react';

import './App.css';

import {
    ShowGameUPCData,
    ShowScanHistory,
    ShowUPCImage,
    ShowUPCText,
    WebcamScanner
} from './components';
import { ShowDevices } from './components/dev/ShowDevices';
import { Results } from './components/Results';
import { useGameUPCApi } from './hooks';
import { GameUPCData } from './types';

const AppSettings: Record<string, boolean | RegExp> = {
    labelMatch: /back/ig,

    scanLine: true,

    /* dev/debug/display settings */
    showDevices: false,
    showUPCText: false,
    showUPCImage: true,
    showGameUPCData: false,
    showHistory: false,
    showButtons: true,
};

const App = () => {
    const {
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCApi({});

    const [settings, setSettings] = useState<typeof AppSettings>(AppSettings);

    const [code, setCode] = useState<string>('');
    const [codes, setCodes] = useState<string[]>([]);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [gameUPCData, setGameUPCData] = useState<GameUPCData | undefined>();

    const onScan = (code: string) => {
        setCode(code);
        setCodes(codes.concat(code));
    };

    useEffect(() => {
        let active = true;

        if (code.length > 0) {
            getGameData(code).then(setGameUPCData);
        }

        return () => { active = false; };
    }, [code]);

    const setSetting = (event: FormEvent<HTMLInputElement>) => {
        AppSettings[event.currentTarget.value] = event.currentTarget.checked;
        setSettings(Object.create(AppSettings));
    };

    return (
        <div className="App">
            {/* this is all you need for your scanner */}
            <WebcamScanner
                settings={settings}
                devices={devices}
                onScan={onScan}
                onDevices={setDevices}
                zoom={2}
            />
            {/* that's all for the scanner */}

            <Results settings={settings} gameData={gameUPCData} submitOrVerifyGame={submitOrVerifyGame} removeGame={removeGame} />

            <FormGroup label={'Extras'} className="settings-switches">
                <Switch label="Scan Line"
                        name={'scanLine'}
                        value={'scanLine'}
                        onChange={setSetting}
                        checked={!!settings.scanLine}
                />
            </FormGroup>

            <FormGroup label={'Info Options'} className="settings-switches">
                <Switch label="Devices"
                        name={'showDevices'}
                        value={'showDevices'}
                        onChange={setSetting}
                        checked={!!settings.showDevices}
                />
                <Switch label="UPC Textbox"
                        name={'showUPCText'}
                        value={'showUPCText'}
                        onChange={setSetting}
                        checked={!!settings.showUPCText}
                />
                <Switch label="UPC Image"
                        name={'showUPCImage'}
                        value={'showUPCImage'}
                        onChange={setSetting}
                        checked={!!settings.showUPCImage}
                />
                <Switch label="GameUPC Raw Data"
                        name={'showGameUPCData'}
                        value={'showGameUPCData'}
                        onChange={setSetting}
                        checked={!!settings.showGameUPCData}
                />
                <Switch label="History"
                        name={'showHistory'}
                        value={'showHistory'}
                        onChange={setSetting}
                        checked={!!settings.showHistory}
                />
            </FormGroup>

            {/* dev/debug/display */}
            {/* use this to show the list of devices */}
            {settings.showDevices && <ShowDevices devices={devices} />}

            {/* use this to show a textbox with the UPC */}
            {settings.showUPCText && <ShowUPCText code={code} onChange={setCode} />}
            {/* end UPC textbox */}

            {/* use this to show an image copy of the UPC */}
            {settings.showUPCImage && <ShowUPCImage code={code} />}
            {/* end copy of UPC */}

            {/* for debugging show the raw data returned from GameUPC API */}
            {settings.showGameUPCData && <ShowGameUPCData data={gameUPCData} />}
            {/* end GameUPC API data */}

            {/* for debugging, show the history of UPCs scanned */}
            {settings.showHistory && <ShowScanHistory codes={codes} />}
            {/* end scan history */}
        </div>
    );
};

export default App;
