import { FormGroup, InputGroup } from '@blueprintjs/core';
import React, { useState } from 'react';
import './App.css';
import '@blueprintjs/core/lib/css/blueprint.css';
import { WebcamScanner } from './components/WebcamScanner';

const labelMatch = /back/ig;

const App = () => {
  const [code, setCode] = useState<string>('');

  const onScan = (scannedCode: string) => {
    setCode(scannedCode);
  };

  return (
    <div className="App">
      <WebcamScanner
          onScan={onScan}
          preferDeviceLabelMatch={labelMatch}
      />
      <FormGroup label={'UPC'}>
        <InputGroup
            className={'barcode-display-input'}
            large={true}
            readOnly={true}
            value={code}
        />
      </FormGroup>
    </div>
  );
};

export default App;
