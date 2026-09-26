type UpdateInCollectionToggleProps = {
    collectionId: number | undefined;
    update: boolean;
    onChange: (update: boolean) => void;
};

/** Whether actions update the existing collection item; only possible once the game is in the collection. */
export const UpdateInCollectionToggle = ({ collectionId, update, onChange }: UpdateInCollectionToggleProps) =>
    <div>
        <label className="flex gap-1 justify-start items-center p-2 pl-0.5 text-xs">
            <input disabled={!collectionId}
                   className="toggle toggle-xs checked:bg-brand-background checked:text-white" type="checkbox"
                   checked={collectionId !== undefined ? update : false} onChange={
                (event) => onChange(event.currentTarget.checked)
            } />
            Update in Collection
        </label>
    </div>;
