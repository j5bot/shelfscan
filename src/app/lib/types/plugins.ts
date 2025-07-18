import { ValueOf } from 'next/constants';

export type Template = {
    icon: string;
    iconSize?: number;
    title: string;
    template: string;
};

export const TemplateTypes = {
    GAME: 'game',
    VERSION: 'version',
} as const;
export type TemplateType = ValueOf<typeof TemplateTypes>;
export type Templates = Record<TemplateType, Template[]>;

export type ShelfScanPlugin = {
    id: string;
    name?: string;
    type: 'link';
    location: 'details';
    templates: Templates;
};

export type PluginLocationTemplates =
    Record<ShelfScanPlugin['location'], Templates>;
export type ShelfScanPluginMap = Record<ShelfScanPlugin['type'], PluginLocationTemplates>;
export type ShelfScanPluginKey = ShelfScanPlugin['type'] |
    ShelfScanPlugin['location'] |
        TemplateType;

export type ShelfScanPluginSection = ShelfScanPluginMap & PluginLocationTemplates & Templates;
