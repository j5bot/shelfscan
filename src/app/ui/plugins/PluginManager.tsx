import { addPlugin } from '@/app/lib/database/database';
import { PluginMapContext } from '@/app/lib/PluginMapProvider';
import { ShelfScanPlugin } from '@/app/lib/types/plugins';
import { makePluginList } from '@/app/lib/utils/plugins';
import { useContext, useEffect, useRef, useState } from 'react';
import { FaPlus } from 'react-icons/fa6';

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

    return <details className="text-sm">
        <summary>Installed Plugins</summary>
        <ul className="list list-none">
            {enabledPlugins.map(plugin => {
                return <li className="list-row">
                    {plugin.name} ({plugin.type}/{plugin.location})
                </li>;
            })}
        </ul>
        <textarea ref={pluginTextAreaRef} id="plugins-new"></textarea>
        <button className="btn" onClick={onAddPlugin}>
            <FaPlus />
        </button>
    </details>;
};