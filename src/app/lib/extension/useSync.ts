import { SyncContext } from '@/app/lib/extension/SyncContext';
import { useContext } from 'react';

export const useSync = () => useContext(SyncContext);
