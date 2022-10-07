import React, { useEffect, useState } from 'react';

import './App.css';
// only needed if using some of the "fancy" components
import '@blueprintjs/core/lib/css/blueprint.css';

import { WebcamScanner } from './components/WebcamScanner';
import { useGameUPCApi } from './hooks/useGameUPCApi';
import {
    ShowGameUPCData,
    ShowScanHistory,
    ShowUPCImage,
    ShowUPCText
} from './components/dev';

const AppSettings = {
    labelMatch: /back/ig,

    /* dev/debug/display settings */
    showUPCText: false,
    showUPCImage: true,
    showGameUPCData: true,
    showHistory: false,
};

const App = () => {
    const {
        getGameData,
        submitOrVerifyGame,
        removeGame,
    } = useGameUPCApi({});

    const [code, setCode] = useState<string>('');
    const [codes, setCodes] = useState<string[]>([]);
    const [gameUPCData, setGameUPCData] = useState();

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

    return (
        <div className="App">
            {/* this is all you need for your scanner */}
            <WebcamScanner
                onScan={onScan}
                preferDeviceLabelMatch={AppSettings.labelMatch}
                zoom={2}
            />
            {/* that's all for the scanner */}

            {/* dev/debug/display */}
            {/* use this to show a textbox with the UPC */}
            {AppSettings.showUPCText && <ShowUPCText code={code} />}
            {/* end UPC textbox */}

            {/* use this to show an image copy of the UPC */}
            {AppSettings.showUPCImage && <ShowUPCImage code={code} />}
            {/* end copy of UPC */}

            {/* for debugging show the raw data returned from GameUPC API */}
            {AppSettings.showGameUPCData && <ShowGameUPCData data={gameUPCData} />}
            {/* end GameUPC API data */}

            {/* for debugging, show the history of UPCs scanned */}
            {AppSettings.showHistory && <ShowScanHistory codes={codes} />}
            {/* end scan history */}
        </div>
    );
};

export default App;
