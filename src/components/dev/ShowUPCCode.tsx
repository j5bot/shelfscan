import { FormGroup, InputGroup } from '@blueprintjs/core';
import React from 'react';
import { ScannerDevOptions } from '../../types';
import { BarcodeDisplay } from '../BarcodeDisplay';

type ShowUPCCodeProps = Pick<ScannerDevOptions, 'code'>;

export const ShowUPCImage = (props: ShowUPCCodeProps) => {
    const { code } = props;

    if (!code) {
        return null;
    }

    return <BarcodeDisplay code={code} />;
};

export const ShowUPCText = (props: ShowUPCCodeProps) => {
    const { code } = props;

    if (!code) {
        return null;
    }

    return <InputGroup
        className="barcode-display-input"
        large={true}
        readOnly={true}
        value={code}
    />;
};
