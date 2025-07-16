import { ValueOf } from 'next/constants';

export type Template = {
    icon: string;
    template: string;
};

export const TemplateTypes = {
    GAME: 'game',
    VERSION: 'version',
} as const;
export type TemplateType = ValueOf<typeof TemplateTypes>;

export type ShelfScanPlugin = {
    id: string;
    name?: string;
    type: 'link';
    location: 'details';
    templates: Record<TemplateType, Template[]>;
};

export type ShelfScanPluginMap = Record<ShelfScanPlugin['type'],
    Record<ShelfScanPlugin['location'],
        ShelfScanPlugin['templates']>>;
