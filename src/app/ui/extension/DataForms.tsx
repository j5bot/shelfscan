'use client';

import { database, DataFormEntity } from '@/app/lib/database/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaFloppyDisk } from 'react-icons/fa6';

import '@bpmn-io/form-js/dist/assets/form-js.css';

type FormViewer = InstanceType<typeof import('@bpmn-io/form-js').Form>;
type Schema = Parameters<FormViewer['importSchema']>[0];

type FormInstanceEntry = {
    id: number;
    name: string;
    schema: Schema;
    viewer: FormViewer | null;
};

const DataFormItem = ({ entry, onViewerReady }: {
    entry: FormInstanceEntry;
    onViewerReady: (id: number, viewer: FormViewer) => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<FormViewer | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open || viewerRef.current) return;

        let destroyed = false;

        (async () => {
            const { Form } = await import('@bpmn-io/form-js');

            if (destroyed || !containerRef.current) return;

            const viewer = new Form({
                container: containerRef.current,
            });

            viewerRef.current = viewer;
            await viewer.importSchema(entry.schema);
            onViewerReady(entry.id, viewer);
        })();

        return () => {
            destroyed = true;
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [open, entry.id, entry.schema, onViewerReady]);

    const toggleOpen = () => setOpen(!open);

    return <div className="collapse collapse-arrow bg-base-200 mb-1">
        <input type="checkbox" checked={open} onChange={toggleOpen} />
        <div className="collapse-title font-medium text-sm flex items-center gap-2">
            <FaChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            {entry.name}
        </div>
        <div className="collapse-content">
            <div ref={containerRef} className="w-full" />
        </div>
    </div>;
};

export const DataForms = () => {
    const [forms, setForms] = useState<DataFormEntity[]>([]);
    const viewersRef = useRef<Map<number, FormViewer>>(new Map());

    useEffect(() => {
        let active = true;
        (async () => {
            const dataForms = await database.dataforms.toArray();
            if (!active) return;
            setForms(dataForms);
        })();
        return () => { active = false; };
    }, []);

    const handleViewerReady = useCallback((id: number, viewer: FormViewer) => {
        viewersRef.current.set(id, viewer);
    }, []);

    const handleSaveAll = () => {
        const allData: Record<string, unknown> = {};
        for (const form of forms) {
            const viewer = viewersRef.current.get(form.id!);
            if (!viewer) continue;
            const { data, errors } = viewer.submit();
            allData[form.name] = { data, errors };
        }
        console.log('DataForms — all form values:', allData);
    };

    if (forms.length === 0) return null;

    const entries: FormInstanceEntry[] = forms.map((form) => ({
        id: form.id!,
        name: form.name,
        schema: form.schema as Schema,
        viewer: null,
    }));

    return <div className="bg-overlay w-full pt-2 flex flex-col items-center">
        {entries.map((entry) =>
            <DataFormItem
                key={entry.id}
                entry={entry}
                onViewerReady={handleViewerReady}
            />,
        )}
        <button
            className="btn btn-sm btn-primary mt-2 flex gap-1"
            onClick={handleSaveAll}
        >
            <FaFloppyDisk /> Save All
        </button>
    </div>;
};

