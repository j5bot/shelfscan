// noinspection JSXDomNesting

import { SearchMode } from '@/app/lib/hooks/useCollectionFilters';
import { VersionIcon } from '@/app/ui/icons/VersionIcon';
import { FaA, FaAsterisk, FaTags } from 'react-icons/fa6';

const SEARCH_PLACEHOLDERS: Record<SearchMode, string> = {
    all: 'name:… version:… #tag…',
    name: 'Filter by name…',
    version: 'Filter by version…',
    tags: '#PnP #Review !#sleeved …',
};

type CollectionSearchProps = {
    searchMode: SearchMode;
    searchText: string;
    onSearchModeChange: (mode: SearchMode) => void;
    onSearchTextChange: (text: string) => void;
};

/** Search field picker (a customizable `<select>`) joined to the search input. */
export const CollectionSearch = (props: CollectionSearchProps) => {
    const { searchMode, searchText, onSearchModeChange, onSearchTextChange } = props;

    // @ts-ignore
    const selectedContent = <button><selectedcontent className="flex items-center pl-2"></selectedcontent></button>;

    return <div className="flex flex-1 min-w-0" id="search-filters">
        <select
            className={`select select-bordered select-sm select-content rounded rounded-r-none border-r-0 shrink-0 flex items-center`}
            value={searchMode}
            onChange={e => onSearchModeChange(e.target.value as SearchMode)}
            aria-label="Search field"
        >
            {selectedContent}
            <option value="all">
                <FaAsterisk aria-hidden={true} /> <span>All</span>
            </option>
            <option value="name">
                <FaA aria-hidden={true} /> <span>Name</span>
            </option>
            <option value="version">
                <VersionIcon aria-hidden={true} width={12} height={12} /> <span>Version</span>
            </option>
            <option value="tags">
                <FaTags aria-hidden={true} /> <span>Tags</span>
            </option>
        </select>
        <input
            type="search"
            aria-label="Filter collection"
            placeholder={SEARCH_PLACEHOLDERS[searchMode]}
            value={searchText}
            onChange={e => onSearchTextChange(e.target.value)}
            className="input input-bordered input-sm flex-1 min-w-0 rounded-l-none"
        />
    </div>;
};
