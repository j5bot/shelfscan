import { SetFormValue } from '@/app/lib/extension/types';
import React, { ChangeEvent, useState } from 'react';

export const NotesTextArea = ({ notes, setValue }: {
    notes: string;
    setValue: SetFormValue;
}) => {
    const [tempValue, setTempValue] = useState<string>(notes);

    const changeHandler = (event: ChangeEvent<HTMLTextAreaElement>) =>
        setTempValue(event.currentTarget.value);

    return <textarea name="notes"
              rows={2}
              className="textarea text-xs pl-1.5 p-1"
              placeholder="Seller Notes"
              value={tempValue}
              onChange={changeHandler}
              onBlur={event =>
                  setValue('notes', event.currentTarget.value)
              }
    />;
};
