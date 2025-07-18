import { PluginMapContext } from '@/app/lib/PluginMapProvider';
import { ShelfScanPlugin } from '@/app/lib/types/plugins';
import { addPlugin, makePluginList, removePlugin } from '@/app/lib/utils/plugins';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa6';

export const PluginManager = () => {
    const [enabledPlugins, setEnabledPlugins] = useState<ShelfScanPlugin[]>([]);
    const { loadPlugins, plugins } = useContext(PluginMapContext);
    console.log(plugins);

    const pluginTextAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        (async () => setEnabledPlugins(await makePluginList()))();
    }, [plugins]);

    const onAddPlugin = () => {
        if (!pluginTextAreaRef.current) {
            return;
        }
        addPlugin(pluginTextAreaRef.current.value).then(loadPlugins);
    };

    return <div className="collapse collapse-arrow bg-base-100 border-base-300 text-sm">
        <input type="checkbox" />
        <div className="collapse-title font-semibold">Installed Plugins</div>
        <div className="collapse-content text-xs">
            <ul className="list-none">
                {enabledPlugins.map(plugin => {
                    return <li key={plugin.id} className="flex justify-between mb-1">
                        {plugin.name} ({plugin.type}/{plugin.location})
                        <button
                            disabled={plugin.id.startsWith('plugin.internal')}
                            onClick={() => {
                                removePlugin(plugin.id).then(loadPlugins);
                            }}
                            className="remove-button text-gray-500 h-5 w-5 md:w-fit p-1 btn flex text-xs"
                        >
                            <FaMinus className="md:w-2.5 md:h-2.5" />
                        </button>
                    </li>;
                })}
            </ul>
            <fieldset className="fieldset relative">
                <legend className="fieldset-legend">New Plugin JSON</legend>
                <textarea className="textarea h-24 w-full text-xs" ref={pluginTextAreaRef}></textarea>
                <button className="btn absolute top-2 right-1 btn-xs" onClick={onAddPlugin}>
                    <FaPlus />
                </button>
            </fieldset>
        </div>
    </div>;
};