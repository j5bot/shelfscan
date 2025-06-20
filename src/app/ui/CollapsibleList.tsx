import React, { ReactNode, useState } from 'react';

export const makeListItemClassName = (current: number, selected: number | null) =>
    `cursor-pointer max-w-3/4 ml-0.5 mr-1 rounded-sm ${
        current === selected ?
        'p-1 pl-1.5 bg-orange-50' :
        'pl-1.5'
    }`;

export type CollapsibleListProps<T> = {
    type: string;
    selectedItemIndex: number | null;
    items: T[],
    onClick: <CE>(e: React.MouseEvent<CE>) => void;
    onHover?: <SE>(e: React.MouseEvent<SE>) => void;
    onSelect: <SE>(e: React.MouseEvent<SE>) => void;
    getItemKey: (item: T) => string;
    renderItem: (item: T, index: number) => ReactNode;
    renderSelectedItem: (item: T) => ReactNode;
    className?: string;
};

export const CollapsibleList =
    <T,>(props: CollapsibleListProps<T>) => {
    const {
        type,
        selectedItemIndex,
        items,
        onClick,
        onHover,
        onSelect,
        getItemKey,
        renderItem,
        renderSelectedItem,
        className,
    } = props;

    const [itemsClosed, setItemsClosed] = useState<boolean>(true);

    const selectedItemClickHandler = <CE extends HTMLElement,>(e: React.MouseEvent<CE>) => {
        if (e.currentTarget.tagName !== 'DIV') {
            return;
        }
        onClick(e);
        setItemsClosed(false);
    };

    const listItemClickHandler = <SE extends HTMLElement,>(e: React.MouseEvent<SE>) => {
        onSelect(e);
        setItemsClosed(true);
    };

    return itemsClosed && selectedItemIndex !== null ?
     <div
         className={`rounded-sm w-full mb-1 bg-orange-50 p-2 ${(selectedItemIndex ?? -1) >= 0 && items.length > 1 ? 'cursor-pointer' : ''}`}
         onClick={selectedItemClickHandler}
     >
         {renderSelectedItem(items[selectedItemIndex ?? 0])}
     </div> :
     <div>
         <h4>Select</h4>
         <ul className={`menu pl-0 ml-0 mr-0 bg-base-100 rounded-box w-full lg:min-w-64 shadow-sm ${className}`}>
             {items.map((item: T, index: number) => {
                 const itemProps = {
                    [`data-${type}-index`]: index,
                 };

                 return <li
                     key={getItemKey(item)}
                     className={makeListItemClassName(index, selectedItemIndex)}
                     onClick={listItemClickHandler}
                     onMouseEnter={onHover}
                     {...itemProps}
                 >
                     {renderItem(item, index)}
                 </li>;
             })}
         </ul>
     </div>;
};
