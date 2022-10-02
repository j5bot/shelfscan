import { FormGroup, InputGroup, TextArea } from '@blueprintjs/core';
import React, { useState } from 'react';
import './App.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import { WebcamScanner } from './components/WebcamScanner';
import { BarcodeDisplay } from './components/BarcodeDisplay';

const labelMatch = /back/ig;

const AppSettings = {
    showUPCText: false,
    showUPCImage: true,
    showHistory: false,
};

const App = () => {
  const [code, setCode] = useState<string>('');
  const [codes, setCodes] = useState<string[]>([]);

  const onScan = (scannedCode: string) => {
    setCode(scannedCode);
    setCodes(codes.concat(scannedCode));
  };

  return (
    <div className="App">
        {/* this is all you need for your scanner */}
          <WebcamScanner
              onScan={onScan}
              preferDeviceLabelMatch={labelMatch}
          />
        {/* right here */}

         {code &&
         <>
             {AppSettings.showUPCText &&
              <FormGroup label={'UPC'}>
                  <InputGroup
                      className={'barcode-display-input'}
                      large={true}
                      readOnly={true}
                      value={code}
                  />
              </FormGroup>}
             {AppSettings.showUPCImage && <BarcodeDisplay code={code} />}
         </>
        }
        {AppSettings.showHistory &&  <FormGroup label={'UPC History'}>
            <TextArea value={codes.join('\n')} />
        </FormGroup>}
    </div>
  );
};

export default App;
