'use client';

import { database, DataFormEntity } from '@/app/lib/database/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaArrowRotateLeft, FaChevronDown, FaFloppyDisk } from 'react-icons/fa6';

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

const DataFormItem = ({ data, setData, entry, onViewerReady }: {
    data?: unknown;
    setData: (id: string, data?: unknown) => void;
    entry: FormInstanceEntry;
    onViewerReady: (id: number, viewer: FormViewer) => void;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<FormViewer | null>(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!(viewerRef.current && data)) {
            return;
        }

        (async () => {
            const viewer = viewerRef.current;
            await viewer?.importSchema(entry.schema, data);
        })();
    }, [data, entry.schema]);

    useEffect(() => {
        if (!open || viewerRef.current) {
            return;
        }

        let destroyed = false;

        (async () => {
            const { Form } = await import('@bpmn-io/form-js');

            if (destroyed || !containerRef.current) return;

            const viewer = new Form({
                container: containerRef.current,
            });

            viewerRef.current = viewer;
            await viewer.importSchema(entry.schema, data ?? undefined);
            onViewerReady(entry.id, viewer);
        })();

        return () => {
            destroyed = true;
            if (viewerRef.current) {
                viewerRef.current.destroy();
                viewerRef.current = null;
            }
        };
    }, [data, open, entry.id, entry.schema, onViewerReady]);

    const toggleOpen = () => {
        // when closing, grab the data from the form and store it
        if (open && viewerRef.current && data) {
            const { data: formData } = viewerRef.current.submit();
            setData(entry.schema.id, formData);
        }
        setOpen(!open);
    };

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
    const [data, setData] = useState<Record<string, unknown>>({});

    const viewersRef = useRef<Map<number, FormViewer>>(new Map());

    const sendGetData = () => {
        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: 'getData',
                collectionId,
                timestamp: Date.now(),
            },
        });
        document.dispatchEvent(ce);
    };

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
        if (forms.length === 0 || !collectionId || !userId) {
            return;
        }

        const handler = (event: MessageEvent) => {
            if (event.origin !== 'https://boardgamegeek.com') {
                return;
            }
            switch (event.data?.type) {
                case 'getData-response':
                    handleGetDataResponse(event.data.response?.body);
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('message', handler);

        const timeoutId = window.setTimeout(() => {
            sendGetData();
        }, 2000);

        return () => {
            window.clearTimeout(timeoutId);
            window.removeEventListener('message', handler);
        };
    }, [forms.length, collectionId, userId]);

    const handleGetDataResponse = (body: string) => {
        const segments = body.split('\n', 2);
        if (!segments[1]) {
            return;
        }
        
        let storedData: Record<string, unknown>;
        try {
            storedData = JSON.parse(segments[1]);
        } catch (e) {
            console.error('Failed to parse stored data', e);
            return;
        }
        setData(storedData);

        forms.forEach(form => {
            const viewer = viewersRef.current.get(form.id!);
            if (!viewer) {
                return;
            }
            viewer.importSchema(form.schema, storedData[form.schema.id]!).then();
        })
    };

    const handleViewerReady = useCallback((id: number, viewer: FormViewer) => {
        viewersRef.current.set(id, viewer);
    }, []);

    const handleSaveAll = () => {
        const dataObject: Record<string, unknown> = data ? { ...data} : {};
        forms.forEach(form => {
            const viewer = viewersRef.current.get(form.id!);
            if (!viewer) {
                return;
            }
            const { data } = viewer.submit();
            dataObject[form.schema.id] = data;
        });

        setData(dataObject);

        const ce = new CustomEvent('shelfscan-sync', {
            detail: {
                userId,
                type: 'setData',
                collectionId,
                gameId,
                timestamp: Date.now(),
                formValues: { data: JSON.stringify(dataObject) },
            },
        });
        document.dispatchEvent(ce);
    };

    const setFormData = (id: string, formData: unknown) => {
        setData(prev => ({ ...(prev ?? {}), [id]: formData }));
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
                <div className="flex justify-end gap-1.5">
                    <div className="relative shrink-0 xs:w-20 w-22 xs:h-7 h-8">
                        <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 xs:w-20 w-22"></div>
                        <button onClick={sendGetData} className="collection-button cursor-pointer rounded-full
                        relative
                        flex justify-start items-center
                        bg-[#e07ca4] text-white
                        p-2 pl-2.5 xs:h-7 h-8
                        xs:font-stretch-condensed xs:tracking-tight
                        text-sm">
                            <FaArrowRotateLeft /> <div className="p-1 font-semibold uppercase">Reset</div>
                        </button>
                    </div>
                    <div className="relative shrink-0 xs:w-26 w-28 xs:h-7 h-8">
                        <div className="rounded-full border-0 border-[#e07ca4] absolute top-0 left-0 xs:h-7 h-8 xs:w-26 w-28"></div>
                        <button onClick={handleSaveAll} className="collection-button cursor-pointer rounded-full
                        relative
                        flex justify-start items-center
                        bg-[#e07ca4] text-white
                        p-2 pl-2.5 xs:h-7 h-8
                        xs:font-stretch-condensed xs:tracking-tight
                        text-sm">
                            <FaFloppyDisk /> <div className="p-1 font-semibold uppercase">Save All</div>
                        </button>
                    </div>
                </div>
            </div>
            {entries.map((entry) =>
                <DataFormItem
                    key={entry.id}
                    data={data?.[entry.schema.id]}
                    setData={setFormData}
                    entry={entry}
                    onViewerReady={handleViewerReady}
                />,
            )}
        </div>
    </div>;
};

