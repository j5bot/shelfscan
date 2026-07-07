import { bggGetGeeklistInner } from '@/app/lib/actions';
import { useDispatch } from '@/app/lib/hooks';
import {
    loadGeeklistError,
    loadGeeklistStart,
    loadGeeklistSuccess,
} from '@/app/lib/redux/bgg/geeklist/slice';
import { bggGetGeeklistFromXML } from '@/app/lib/services/bgg/service';
import { useCallback, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';

const GEEKLIST_URL_REGEX = /.*\/geeklist\/([0-9]+)/;

type MathTradeDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onLoaded: (id: number) => void;
};

export const MathTradeDialog = ({ isOpen, onClose, onLoaded }: MathTradeDialogProps) => {
    const dispatch = useDispatch();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = useCallback(async () => {
        const match = url.match(GEEKLIST_URL_REGEX);
        if (!match) {
            setError('Could not find a geeklist ID in that URL. Expected format: .../geeklist/12345');
            return;
        }

        const id = parseInt(match[1], 10);
        setError(null);
        setLoading(true);

        dispatch(loadGeeklistStart(id));
        const xml = await bggGetGeeklistInner(id);

        if (!xml) {
            dispatch(loadGeeklistError(id));
            setLoading(false);
            setError('Failed to load geeklist. Please try again.');
            return;
        }

        const geekList = bggGetGeeklistFromXML(xml);
        if (!geekList) {
            dispatch(loadGeeklistError(id));
            setLoading(false);
            setError('Could not parse geeklist. Please check the URL and try again.');
            return;
        }

        dispatch(loadGeeklistSuccess(geekList));
        setLoading(false);
        setUrl('');
        onClose();
        onLoaded(id);
    }, [url, dispatch, onClose, onLoaded]);

    if (!isOpen) { return null; }

    return <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Load Math Trade Geeklist"
    >
        <div
            className="relative bg-base-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
        >
            <button
                className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
                onClick={onClose}
                aria-label="Close"
            >
                <FaXmark />
            </button>
            <h2 className="text-lg font-semibold mb-3">Load Math Trade Geeklist</h2>
            <label
                className="text-sm text-base-content/70 mb-1 block"
                htmlFor="geeklist-url"
            >
                Geeklist URL
            </label>
            <input
                id="geeklist-url"
                type="url"
                className={`input input-bordered w-full mb-2 ${error ? 'input-error' : ''}`}
                placeholder="https://boardgamegeek.com/geeklist/12345"
                value={url}
                onChange={e => { setUrl(e.target.value); setError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { void handleSubmit(); } }}
                autoFocus
                disabled={loading}
            />
            {error && (
                <p className="text-xs text-error mb-2" role="alert">{error}</p>
            )}
            <div className="flex justify-end gap-2 mt-1">
                <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => void handleSubmit()}
                    disabled={!url.trim() || loading}
                >
                    {loading
                        ? <span className="loading loading-bars loading-xs" />
                        : 'Load Geeklist'
                    }
                </button>
            </div>
        </div>
    </div>;
};
