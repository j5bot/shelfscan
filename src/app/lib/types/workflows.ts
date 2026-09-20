import { AtlasRealmsTrades } from '@/app/ui/workflows/math-trades/AtlasRealmsTrades';
import { OLWLGTrades } from '@/app/ui/workflows/math-trades/OLWLGTrades';
import { SwaptagonTrades } from '@/app/ui/workflows/math-trades/SwaptagonTrades';
import { FunctionComponent } from 'react';

export const WorkflowTitles = {
    olwlg: 'OLWLG',
    swaptagon: 'Swaptagon',
    'atlas-realms': 'Atlas Realms',
} as const;
export type WorkflowTitleKey = keyof typeof WorkflowTitles;

export const WorkflowComponents = {
    olwlg: OLWLGTrades,
    swaptagon: SwaptagonTrades,
    'atlas-realms': AtlasRealmsTrades,
} as Record<WorkflowTitleKey, FunctionComponent>;
