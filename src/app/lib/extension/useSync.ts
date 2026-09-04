import { SyncContext } from '@/app/lib/extension/SyncProvider';
import { useContext } from 'react';

export const useSync = () => useContext(SyncContext);
