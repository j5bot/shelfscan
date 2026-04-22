'use client';

import { database, DataFormEntity } from '@/app/lib/database/database';
import { transformSchemaKeys } from '@/app/lib/utils/formKeyTransform';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaFolderOpen, FaFloppyDisk, FaTableList } from 'react-icons/fa6';

import '@bpmn-io/form-js/dist/assets/form-js.css';
import '@bpmn-io/form-js-editor/dist/assets/form-js-editor.css';

import './DataBuilder.css';

const INITIAL_SCHEMA = {
    schemaVersion: 3,
    type: 'default',
    components: [],
    id: 'Form1',
};

type FormEditor = InstanceType<typeof import('@bpmn-io/form-js-editor').FormEditor>;
type Schema = Parameters<FormEditor['importSchema']>[0];

export const DataBuilder = () => {
    const [formName, setFormName] = useState('');
    const [schema, setSchema] = useState<object>(INITIAL_SCHEMA);
    const [currentId, setCurrentId] = useState<number | undefined>(undefined);
    const [savedForms, setSavedForms] = useState<DataFormEntity[]>([]);
    const [saveStatus, setSaveStatus] = useState<string>('');

    const openDialogRef = useRef<HTMLDialogElement>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<FormEditor | null>(null);
    const schemaRef = useRef<Schema>(INITIAL_SCHEMA);

    const handleSchemaChange = useCallback(() => {
        if (!editorRef.current) return;
        const currentSchema = editorRef.current.getSchema();
        schemaRef.current = currentSchema;
        setSchema(currentSchema);
    }, []);

    // Initialize & teardown the editor
    useEffect(() => {
        let destroyed = false;

        (async () => {
            const { FormEditor } = await import('@bpmn-io/form-js-editor');

            if (destroyed || !editorContainerRef.current) return;

            const editor = new FormEditor({
                container: editorContainerRef.current,
            });

            editorRef.current = editor;

            await editor.importSchema(schemaRef.current);
            editor.on('changed', handleSchemaChange);
        })();

        return () => {
            destroyed = true;
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, [handleSchemaChange]);

    const loadSchemaIntoEditor = useCallback(async (newSchema: Schema) => {
        schemaRef.current = newSchema;
        setSchema(newSchema);
        if (editorRef.current) {
            await editorRef.current.importSchema(newSchema,);
        }
    }, []);

    const handleSave = async () => {
        if (!formName.trim()) {
            setSaveStatus('Please enter a form name.');
            return;
        }

        const schemaToSave = transformSchemaKeys(editorRef.current?.getSchema() ?? schema);

        if (currentId !== undefined) {
            await database.dataforms.put({ id: currentId, name: formName.trim(), schema: schemaToSave });
        } else {
            const newId = await database.dataforms.add({ name: formName.trim(), schema: schemaToSave });
            setCurrentId(newId as number);
        }
        loadSchemaIntoEditor(schemaToSave).then();
        setSaveStatus(`Saved "${formName.trim()}"`);
        setTimeout(() => setSaveStatus(''), 3000);
    };

    const handleOpenDialog = async () => {
        const forms = await database.dataforms.toArray();
        setSavedForms(forms);
        openDialogRef.current?.showModal();
    };

    const handleLoadForm = (form: DataFormEntity) => {
        setFormName(form.name);
        setCurrentId(form.id);
        loadSchemaIntoEditor(form.schema).then();
        openDialogRef.current?.close();
    };

    return (
        <div className="data-builder w-full max-w-6xl mx-auto px-4 pb-10">
            <dialog ref={openDialogRef} className="modal">
                <div className="modal-box min-w-96">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-4">✕</button>
                    </form>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <FaFolderOpen className="inline" /> Open Form
                    </h2>
                    {savedForms.length === 0 ? (
                        <p className="text-base-content/60">No saved forms found.</p>
                    ) : (
                        <ul className="menu w-full p-0">
                            {savedForms.map((form) => (
                                <li key={form.id} className="w-full">
                                    <button
                                        className="flex items-center gap-2 text-left w-full"
                                        onClick={() => handleLoadForm(form)}
                                    >
                                        <FaTableList className="shrink-0" />
                                        <span className="truncate">{form.name}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            <div className="flex flex-wrap items-center gap-3 mb-4 pt-2">
                <input
                    type="text"
                    className="input input-bordered grow min-w-48"
                    placeholder="Form name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                />
                <button
                    className="btn btn-primary flex gap-2"
                    onClick={handleSave}
                >
                    <FaFloppyDisk /> Save
                </button>
                <button
                    className="btn btn-secondary flex gap-2"
                    onClick={handleOpenDialog}
                >
                    <FaFolderOpen /> Open
                </button>
                {saveStatus && (
                    <span className="text-success text-sm">{saveStatus}</span>
                )}
            </div>

            <div ref={editorContainerRef} className="w-full min-h-[600px]" />
        </div>
    );
};
