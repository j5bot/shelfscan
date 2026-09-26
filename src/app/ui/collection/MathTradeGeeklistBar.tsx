import { bggHost } from '@/app/lib/services/bgg/constants';
import { GeekListSummary } from '@/app/lib/redux/bgg/geeklist/selectors';
import { GeekListSwitcher } from '@/app/ui/GeekListSwitcher';
import Link from 'next/link';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FaArrowsRotate, FaPlus } from 'react-icons/fa6';

type MathTradeGeeklistBarProps = {
    activeGeekListId: number | null;
    allGeekLists: GeekListSummary[];
    isRefreshingGeeklist: boolean;
    onRefreshGeeklist: () => void;
    onSelectGeeklist: (id: number) => void;
    onLoadAnother: () => void;
};

export const MathTradeGeeklistBar = (props: MathTradeGeeklistBarProps) => {
    const {
        activeGeekListId,
        allGeekLists,
        isRefreshingGeeklist,
        onRefreshGeeklist,
        onSelectGeeklist,
        onLoadAnother,
    } = props;

    return <div className="w-full flex items-center justify-center gap-0.5">
        {activeGeekListId !== null && (
            <button
                type="button"
                className="btn btn-xs btn-ghost rounded-md shrink-0"
                onClick={onRefreshGeeklist}
                disabled={isRefreshingGeeklist}
                aria-label={isRefreshingGeeklist ? 'Refreshing geeklist…' : 'Refresh geeklist'}
                title={isRefreshingGeeklist ? 'Refreshing…' : 'Refresh geeklist'}
            >
                <FaArrowsRotate
                    className={isRefreshingGeeklist ? 'animate-spin' : ''}
                    aria-hidden="true"
                />
            </button>
        )}
        <GeekListSwitcher
            activeId={activeGeekListId}
            lists={allGeekLists}
            onSelect={onSelectGeeklist}
        />
        <Link
            className="btn btn-xs btn-ghost rounded-md shrink-0"
            href={`${bggHost}/geeklist/${activeGeekListId}`}
            rel="noreferrer noopener"
            aria-label="Open math trade list"
            title="Open math trade list"
            target="_blank"
        ><FaExternalLinkAlt aria-hidden="true" /></Link>
        <button
            type="button"
            className="btn btn-xs btn-ghost rounded-md shrink-0"
            onClick={onLoadAnother}
            aria-label="Load another geeklist"
            title="Load another geeklist"
        >
            <FaPlus aria-hidden="true" />
        </button>
    </div>;
};
