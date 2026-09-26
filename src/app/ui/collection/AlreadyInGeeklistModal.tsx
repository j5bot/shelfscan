type AlreadyInGeeklistModalProps = {
    onCancel: () => void;
    onConfirm: () => void;
};

export const AlreadyInGeeklistModal = ({ onCancel, onConfirm }: AlreadyInGeeklistModalProps) =>
    <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        onClick={onCancel}
        role="dialog"
        aria-modal="true"
        aria-label="Already in geeklist"
    >
        <div
            className="relative bg-base-100 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
            onClick={e => e.stopPropagation()}
        >
            <h2 className="text-lg font-semibold mb-2">Already in Geeklist</h2>
            <p className="text-sm text-base-content/70 mb-4">
                This game is already in your math trade geeklist. Select it to add again?
            </p>
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-sm btn-warning"
                    onClick={onConfirm}
                >
                    Add Again
                </button>
            </div>
        </div>
    </div>;
