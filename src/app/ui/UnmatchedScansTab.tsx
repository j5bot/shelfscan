import { useScanHistory } from '@/app/lib/ScanHistoryProvider';
import { type ScanHistoryEntry } from '@/app/lib/types/scanHistory';
import Link from 'next/link';
import { FaBarcode } from 'react-icons/fa6';

const formatTimestamp = (timestamp: number) =>
    new Date(timestamp).toLocaleString();

const UnmatchedScanRow = ({ entry }: { entry: ScanHistoryEntry }) => (
    <div className="flex items-center gap-3 p-2 rounded bg-base-100 text-sm">
        <FaBarcode className="shrink-0 text-base-content/50" size={16} />
        <Link href={`/upc/${entry.upc}`} className="font-mono font-medium grow hover:underline">
            {entry.upc}
        </Link>
        <span className="text-xs text-base-content/50 shrink-0">
            {formatTimestamp(entry.timestamp)}
        </span>
    </div>
);

export const UnmatchedScansTab = () => {
    const { unmatchedScans } = useScanHistory();

    if (unmatchedScans.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center py-6 gap-2">
                <FaBarcode size={32} className="text-base-content/30" />
                <p className="text-base-content/60 text-sm">No unmatched scans in history.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1 w-full">
            {unmatchedScans.map(entry => (
                <UnmatchedScanRow key={entry.id} entry={entry} />
            ))}
        </div>
    );
};
