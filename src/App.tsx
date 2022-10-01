import React, { useState } from 'react';
import './App.css';
import { WebcamScanner } from './components/WebcamScanner';

const labelMatch = /back/ig;

const App = () => {
  const [code, setCode] = useState<string>();

  const onScan = (scannedCode: string) => {
    setCode(scannedCode);
  };

  return (
    <div className="App">
      <WebcamScanner
          onScan={onScan}
          preferDeviceLabelMatch={labelMatch}
      />
      <input type="text" readOnly={true} value={code ?? ''} />
    </div>
  );
};

export default App;
