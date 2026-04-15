'use client';

import { database, DataFormEntity } from '@/app/lib/database/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaChevronDown, FaFloppyDisk } from 'react-icons/fa6';

import '@bpmn-io/form-js/dist/assets/form-js.css';

type FormViewer = InstanceType<typeof import('@bpmn-io/form-js').Form>;
type Schema = Parameters<FormViewer['importSchema']>[0];

type DataFormsProps = {
    collectionId: number | undefined;
    userId: string;
    gameId: number | undefined;
};

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

export const DataForms = ({ collectionId, userId, gameId }: DataFormsProps) => {
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

    useEffect(() => {
        if (forms.length === 0) {
            return;
        }

        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'getData-response') {
                console.log('getData response:', event.data);
            }
        };
        window.addEventListener('message', handler);

        setTimeout(() => {
            console.log('getData sending');
            const ce = new CustomEvent('shelfscan-sync', {
                detail: {
                    userId,
                    type: 'getData',
                    collectionId,
                    timestamp: Date.now(),
                },
            });
            document.dispatchEvent(ce);
        }, 5000);

        return () => { window.removeEventListener('message', handler); };
    }, [forms.length, collectionId, userId]);

    const handleViewerReady = useCallback((id: number, viewer: FormViewer) => {
        viewersRef.current.set(id, viewer);
    }, []);

    const handleSaveAll = () => {
        const dataArray: string[] = [];
        for (const form of forms) {
            const viewer = viewersRef.current.get(form.id!);
            if (!viewer) continue;
            const { data } = viewer.submit();
            dataArray.push(JSON.stringify(data));
        }

        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: 'setData',
                collectionId,
                gameId,
                timestamp: Date.now(),
                formValues: { data: dataArray },
            },
        });
        document.dispatchEvent(ce);
    };

    if (!(collectionId && userId && gameId)) {
        return null;
    }

    if (forms.length === 0) {
        return null;
    }

    const entries: FormInstanceEntry[] = forms.map((form) => ({
        id: form.id!,
        name: form.name,
        schema: form.schema as Schema,
        viewer: null,
    }));

    return <div className="rounded-lg bg-overlay border-[#e07ca4] border-1 w-full flex flex-col items-center">
        <div className="w-full px-2 py-1 rounded-lg">
            <div className="flex justify-between items-center w-full pl-2 py-2">
                <h3>Data Forms</h3>
                <div className="relative shrink-0 xs:w-26 w-28 xs:h-7 h-8">
                    <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 xs:w-26 w-28"></div>
                    <button onClick={handleSaveAll} className="collection-button cursor-pointer rounded-full
                    relative
                    flex justify-start items-center
                    bg-[#e07ca4] text-white
                    p-1 pl-1.5 xs:h-7 h-8
                    xs:font-stretch-condensed xs:tracking-tight
                    text-sm">
                        <FaFloppyDisk /> <div className="p-1 font-semibold uppercase">Save All</div>
                    </button>
                </div>
            </div>
            {entries.map((entry) =>
                <DataFormItem
                    key={entry.id}
                    entry={entry}
                    onViewerReady={handleViewerReady}
                />,
            )}
        </div>
    </div>;
};

