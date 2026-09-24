import { PluginMapContext } from '@/app/lib/PluginMapContext';
import { ShelfScanPlugin } from '@/app/lib/types/plugins';
import {
    addPlugin,
    enableOrDisablePlugin,
    getEnabledOrDisabledPlugins,
    removePlugin
} from '@/app/lib/plugins/plugins';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa6';

const logPluginError = (error: unknown) => {
    console.error('plugin update failed', error);
};

export const PluginManager = () => {
    const [enabledPlugins, setEnabledPlugins] = useState<ShelfScanPlugin[]>([]);
    const [disabledPlugins, setDisabledPlugins] = useState<ShelfScanPlugin[]>([]);

    const { loadPlugins, plugins } = useContext(PluginMapContext);
    const reloadPlugins = async () => {
        setEnabledPlugins(await getEnabledOrDisabledPlugins(true));
        setDisabledPlugins(await getEnabledOrDisabledPlugins(false));
    };

    const pluginTextAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        let active = true;
        Promise.all([
            getEnabledOrDisabledPlugins(true),
            getEnabledOrDisabledPlugins(false),
        ]).then(([enabled, disabled]) => {
            if (!active) {
                return;
            }
            setEnabledPlugins(enabled);
            setDisabledPlugins(disabled);
        }).catch(logPluginError);
        return () => { active = false; };
    }, [plugins]);

    const onAddPlugin = () => {
        if (!pluginTextAreaRef.current) {
            return;
        }
        addPlugin(pluginTextAreaRef.current.value)
            .then(loadPlugins)
            .catch(logPluginError);
    };

    return <div className="collapse collapse-arrow bg-base-100 border-1 border-base-300 text-sm">
        <input type="radio" name="settings" aria-labelledby="settings-plugins" />
        <h3 className="collapse-title font-semibold" id="settings-plugins">Installed Plugins</h3>
        <div className="collapse-content text-xs">
            <ul className="list-none">
                {enabledPlugins.map(plugin => {
                    return <li key={plugin.id} className="flex justify-between gap-1 mb-1">
                        <label>
                            <input
                                type="checkbox" className="checkbox w-3.5 h-3.5 rounded-sm"
                                onChange={() =>
                                    enableOrDisablePlugin(plugin.id, false)
                                        .then(loadPlugins)
                                        .then(reloadPlugins)
                                        .catch(logPluginError)
                                }
                                defaultChecked={true}
                            />{' '}
                            {plugin.name} ({plugin.type}/{plugin.location})
                        </label>
                        <button
                            aria-label={`Remove ${plugin.name}`}
                            disabled={plugin.id.startsWith('plugin.internal')}
                            onClick={() => {
                                removePlugin(plugin.id).then(loadPlugins).catch(logPluginError);
                            }}
                            className="remove-button text-gray-500 h-5 w-5 md:w-fit p-1 btn flex text-xs"
                        >
                            <FaMinus className="md:w-2.5 md:h-2.5" />
                        </button>
                    </li>;
                })}
                {disabledPlugins.map(plugin => {
                    return <li key={plugin.id} className="flex justify-between mb-1">
                        <label>
                            <input
                                type="checkbox" className="checkbox w-3.5 h-3.5 rounded-sm"
                                onChange={() =>
                                    enableOrDisablePlugin(plugin.id, true)
                                        .then(loadPlugins)
                                        .then(reloadPlugins)
                                        .catch(logPluginError)
                                }
                                defaultChecked={false}
                            />{' '}
                            {plugin.name} ({plugin.type}/{plugin.location})
                        </label>
                        <button
                            aria-label={`Remove ${plugin.name}`}
                            disabled={plugin.id.startsWith('plugin.internal')}
                            onClick={() => {
                                removePlugin(plugin.id).then(loadPlugins).catch(logPluginError);
                            }}
                            className="remove-button text-gray-500 h-5 w-5 md:w-fit p-1 btn flex text-xs"
                        >
                            <FaMinus className="md:w-2.5 md:h-2.5" />
                        </button>
                    </li>;
                })}
            </ul>
            <fieldset className="fieldset relative">
                <legend className="fieldset-legend" id="new-plugin-json">New Plugin JSON</legend>
                <textarea aria-labelledby="new-plugin-json" className="textarea h-40 inset-shadow-xs/40 inset-shadow-gray-400 w-full text-xs" ref={pluginTextAreaRef}></textarea>
                <button className="btn absolute top-2 right-1 btn-xs" aria-label="Add plugin" onClick={onAddPlugin}>
                    <FaPlus />
                </button>
            </fieldset>
        </div>
    </div>;
};