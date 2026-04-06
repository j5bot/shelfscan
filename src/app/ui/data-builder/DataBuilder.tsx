'use client';

import { database, DataFormEntity } from '@/app/lib/database/database';
import { FormBuilderProps } from '@formio/react';
import dynamic from 'next/dynamic';
import { useCallback, useRef, useState } from 'react';
import { FaFolderOpen, FaFloppyDisk, FaTableList } from 'react-icons/fa6';

import 'bootstrap/dist/css/bootstrap.css';
import '@formio/js/dist/formio.builder.css';
import './DataBuilder.css';

const BUILDER_OPTIONS = {
    builder: {
        basic: {
            components: {
                password: false,
            },
        },
        advanced: {
            components: {
                email: false,
                phoneNumber: false,
                address: false,
                signature: false,
                survey: false,
            },
        },
        layout: {
            components: {
                htmlelement: false,
            },
        },
        premium: {
            components: {
                file: false,
            },
        },
    },
    noDefaultSubmitButton: true,
};

const FormBuilder = dynamic(
    () => import('@formio/react').then((mod) => mod.FormBuilder),
    { ssr: false },
);

export const DataBuilder = () => {
    const [formName, setFormName] = useState('');
    const [schema, setSchema] = useState<object>({ display: 'form', components: [] });
    const [currentId, setCurrentId] = useState<number | undefined>(undefined);
    const [savedForms, setSavedForms] = useState<DataFormEntity[]>([]);
    const [saveStatus, setSaveStatus] = useState<string>('');

    const openDialogRef = useRef<HTMLDialogElement>(null);

    const handleSchemaChange = useCallback((updatedSchema: object) => {
        setSchema(updatedSchema);
    }, []);

    const handleSave = async () => {
        if (!formName.trim()) {
            setSaveStatus('Please enter a form name.');
            return;
        }

        if (currentId !== undefined) {
            await database.dataforms.put({ id: currentId, name: formName.trim(), schema });
        } else {
            const newId = await database.dataforms.add({ name: formName.trim(), schema });
            setCurrentId(newId as number);
        }
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
        setSchema(form.schema);
        setCurrentId(form.id);
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

            <FormBuilder
                key={currentId ?? 'new'}
                initialForm={schema as FormBuilderProps['initialForm']}
                options={BUILDER_OPTIONS as FormBuilderProps['options']}
                onChange={handleSchemaChange}
            />
        </div>
    );
};
