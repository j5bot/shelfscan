import { FormGroup, TextArea } from '@blueprintjs/core';
import React from 'react';
import { ScannerDevOptions } from '../../types';

type ShowScanHistoryProps = Required<Pick<ScannerDevOptions, 'codes'>>;

export const ShowScanHistory = (props: ShowScanHistoryProps) => {
    const { codes } = props;

    if (codes?.length > 0) {
        return null;
    }

    return <FormGroup label={'UPC History'}>
        <TextArea rows={10} cols={100} value={codes.join('\n')} />
    </FormGroup>;
};
