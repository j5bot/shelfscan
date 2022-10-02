import { FormGroup, TextArea } from '@blueprintjs/core';
import React from 'react';
import { ScannerDevOptions } from '../../types';

type ShowGameUPCDataProps = Pick<ScannerDevOptions, 'data'>

export const ShowGameUPCData = (props: ShowGameUPCDataProps) => {
    const { data: gameUPCData } = props;

    if (!gameUPCData) {
        return null;
    }

    return <FormGroup label={'GameUPC Data'}>
        <TextArea rows={10} cols={100} value={JSON.stringify(gameUPCData, undefined, 2)} />
    </FormGroup>;
};
