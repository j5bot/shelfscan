import { FormGroup, InputGroup } from '@blueprintjs/core';
import React from 'react';
import { ScannerDevOptions } from '../../types';
import { BarcodeDisplay } from '../BarcodeDisplay';

type ShowUPCCodeProps = Pick<ScannerDevOptions, 'code'> & {
    onChange?: (code: string) => void;
};

export const ShowUPCImage = (props: ShowUPCCodeProps) => {
    const { code } = props;

    if (!code) {
        return null;
    }

    return <BarcodeDisplay code={code} />;
};

export const ShowUPCText = (props: ShowUPCCodeProps) => {
    const { code, onChange } = props;

    if (!(code || onChange)) {
        return null;
    }

    return (
        <FormGroup label={'UPC Text'}>
            <InputGroup
                className="barcode-display-input"
                large={true}
                value={code}
                onChange={(event) => onChange?.(event.target.value)}
                readOnly={!onChange}
            />
        </FormGroup>
    );
};
