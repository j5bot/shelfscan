import { FormGroup, TextArea } from '@blueprintjs/core';
import React from 'react';
import { ScannerDevOptions } from '../../types';

type ShowDevicesProps = Required<Pick<ScannerDevOptions, 'devices'>>;

export const ShowDevices = (props: ShowDevicesProps) => {
    const { devices } = props;

    return <FormGroup label={'Device List'}>
        <TextArea rows={10} cols={100} value={JSON.stringify(devices, undefined, 2)} />
    </FormGroup>;
};
