import { SetFormValue } from '@/app/lib/extension/types';
import React from 'react';

export const NotesTextArea = ({ notes, setValue }: {
    notes: string;
    setValue: SetFormValue;
}) => {
    // the textarea owns the draft while typing and commits on blur; keying by
    // the committed notes resets the draft whenever that value changes
    return <textarea key={notes}
              name="notes"
              rows={2}
              className="textarea text-xs pl-1.5 p-1 w-full"
              placeholder="Seller Notes"
              defaultValue={notes}
              onBlur={event =>
                  setValue('notes', event.currentTarget.value)
              }
    />;
};
