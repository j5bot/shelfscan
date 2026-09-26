import { bggGetGeeklistInner } from '@/app/lib/actions';
import { useDispatch, useSelector } from '@/app/lib/hooks';
import { MathTradeItem, MathTradeResult, useMathTrade } from '@/app/lib/hooks/useMathTrade';
import {
    GeeklistItemData,
    GeekListEntryState,
    loadGeeklistError,
    loadGeeklistStart,
    loadGeeklistSuccess,
    setActiveGeekList,
} from '@/app/lib/redux/bgg/geeklist/slice';
import { GeekListSummary, selectLoadedGeekLists } from '@/app/lib/redux/bgg/geeklist/selectors';
import { RootState } from '@/app/lib/redux/store';
import { bggGetGeeklistFromXML } from '@/app/lib/services/bgg/service';
import { BggCollection } from '@/app/lib/types/bgg';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';

type UseOLWLGMathTradeOptions = {
    username: string | undefined;
    collection: BggCollection | undefined;
    initialMathTradeGeeklistId: number | undefined;
};

type UseOLWLGMathTradeResult = {
    mathTradeMode: boolean;
    setMathTradeMode: Dispatch<SetStateAction<boolean>>;
    showMathTradeDialog: boolean;
    setShowMathTradeDialog: Dispatch<SetStateAction<boolean>>;
    isBulkMathTradeAdding: boolean;
    mathTradeError: string | null;
    setMathTradeError: Dispatch<SetStateAction<string | null>>;
    isRefreshingGeeklist: boolean;
    geeklistData: Record<number, GeeklistItemData>;
    activeGeekListId: number | null;
    geeklist: GeekListEntryState | undefined;
    activeGeekListStatus: GeekListEntryState['status'] | undefined;
    activeGeekListTitle: string | undefined;
    allGeekLists: GeekListSummary[];
    setActiveGeekListId: (id: number) => void;
    handleRefreshGeeklist: () => Promise<void>;
    submitMathTrade: (items: MathTradeItem[]) => Promise<boolean>;
};

export const useOLWLGMathTrade = ({
    username,
    collection,
    initialMathTradeGeeklistId,
}: UseOLWLGMathTradeOptions): UseOLWLGMathTradeResult => {
    const dispatch = useDispatch();
    const { sendViaExtension } = useMathTrade();

    const [mathTradeMode, setMathTradeMode] = useState(!!initialMathTradeGeeklistId);
    const [showMathTradeDialog, setShowMathTradeDialog] = useState(false);
    const [isBulkMathTradeAdding, setIsBulkMathTradeAdding] = useState(false);
    const [mathTradeError, setMathTradeError] = useState<string | null>(null);
    const [isRefreshingGeeklist, setIsRefreshingGeeklist] = useState(false);

    const geeklistData = useSelector((state: RootState) => state.bgg.geeklist.data);
    const initialMathTradeGeeklistStatus = useSelector(
        (state: RootState) => initialMathTradeGeeklistId ?
                              state.bgg.geeklist.geekLists[initialMathTradeGeeklistId]?.status
                              : undefined
    );
    const activeGeekListId = useSelector(
        (state: RootState) => state.bgg.geeklist.activeGeekListId,
    );
    const geeklist = useSelector((state: RootState) => state.bgg.geeklist.geekLists[activeGeekListId ?? 0]);
    const activeGeekListStatus = useSelector((state: RootState) =>
        activeGeekListId !== null
            ? state.bgg.geeklist.geekLists[activeGeekListId]?.status
            : undefined,
    );
    const activeGeekListTitle = useSelector((state: RootState) =>
        activeGeekListId !== null
            ? state.bgg.geeklist.geekLists[activeGeekListId]?.geekList?.title
            : undefined,
    );
    const allGeekLists = useSelector((state: RootState) => selectLoadedGeekLists([state]));

    // Autoload the geeklist and enter math trade mode when an ID is provided via route params.
    // Skips the network request if the geeklist is already loaded in Redux (e.g. after a dialog
    // load followed by router navigation to the same ID).
    useEffect(() => {
        if (!username) {
            return;
        }
        if (!initialMathTradeGeeklistId) { return; }
        if (initialMathTradeGeeklistStatus === 'loaded') {
            dispatch(setActiveGeekList(initialMathTradeGeeklistId));
            setMathTradeMode(true);
            return;
        }
        let active = true;
        dispatch(loadGeeklistStart({ geekListId: initialMathTradeGeeklistId, username }));
        void bggGetGeeklistInner(initialMathTradeGeeklistId).then(xml => {
            if (!active) { return; }
            if (!xml) {
                dispatch(loadGeeklistError(initialMathTradeGeeklistId));
                return;
            }
            const geekList = bggGetGeeklistFromXML(xml);
            if (!geekList) {
                dispatch(loadGeeklistError(initialMathTradeGeeklistId));
                return;
            }
            dispatch(loadGeeklistSuccess({ collection, geekList, username }));
            setMathTradeMode(true);
        });
        return () => { active = false; };
    }, [initialMathTradeGeeklistId, initialMathTradeGeeklistStatus, dispatch, collection, username]);

    const setActiveGeekListId = useCallback((id: number) => {
        dispatch(setActiveGeekList(id));
    }, [dispatch]);

    const handleRefreshGeeklist = useCallback(async () => {
        if (!username) {
            return;
        }
        if (activeGeekListId === null) { return; }
        setIsRefreshingGeeklist(true);
        dispatch(loadGeeklistStart({ geekListId: activeGeekListId, username }));
        try {
            const xml = await bggGetGeeklistInner(activeGeekListId);
            const geekList = xml ? bggGetGeeklistFromXML(xml) : undefined;
            if (!geekList) {
                dispatch(loadGeeklistError(activeGeekListId));
                return;
            }
            dispatch(loadGeeklistSuccess({ collection, geekList, username }));
        } catch (error) {
            console.error('geeklist refresh failed', activeGeekListId, error);
            dispatch(loadGeeklistError(activeGeekListId));
        } finally {
            setIsRefreshingGeeklist(false);
        }
    }, [activeGeekListId, dispatch, collection, username]);

    const submitMathTrade = useCallback(async (items: MathTradeItem[]): Promise<boolean> => {
        setIsBulkMathTradeAdding(true);
        setMathTradeError(null);

        let results: MathTradeResult[];
        try {
            results = await sendViaExtension(items);
        } catch (error) {
            console.error('math trade submit failed', error);
            setMathTradeError('Failed to add items to the geeklist');
            return false;
        } finally {
            setIsBulkMathTradeAdding(false);
        }

        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
            setMathTradeError(
                `${failures.length} item${failures.length !== 1 ? 's' : ''} failed to add`,
            );
            return false;
        }
        return true;
    }, [sendViaExtension]);

    return {
        mathTradeMode,
        setMathTradeMode,
        showMathTradeDialog,
        setShowMathTradeDialog,
        isBulkMathTradeAdding,
        mathTradeError,
        setMathTradeError,
        isRefreshingGeeklist,
        geeklistData,
        activeGeekListId,
        geeklist,
        activeGeekListStatus,
        activeGeekListTitle,
        allGeekLists,
        setActiveGeekListId,
        handleRefreshGeeklist,
        submitMathTrade,
    };
};
