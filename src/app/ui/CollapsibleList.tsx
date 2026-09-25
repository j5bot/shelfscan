import React, { ReactNode, useState } from 'react';

const makeListItemClassName = (current: number, selected: number | null) =>
    `cursor-pointer ml-0.5 mr-1 rounded-sm ${
        current === selected ?
        'p-1 pl-1.5 bg-[#f1eff9] dark:bg-green-800' :
        'pl-1.5'
    }`;

export type CollapsibleListProps<T> = {
    title?: ReactNode;
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
        title = <h4 className="uppercase tracking-widest text-center block">Select</h4>,
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
        onClick(e);
        setItemsClosed(false);
    };

    const listItemClickHandler = <SE extends HTMLElement,>(e: React.MouseEvent<SE>) => {
        onSelect(e);
        setItemsClosed(true);
    };

    return itemsClosed && (selectedItemIndex ?? null) !== null ?
     <div className="relative rounded-sm w-full mb-1 bg-[#f1eff9] dark:bg-green-800 p-2">
         {/* stretched button: clicking anywhere on the row (except its own controls) reopens the list */}
         {items.length > 1 && <button
             type="button"
             className="absolute inset-0 w-full h-full rounded-sm cursor-pointer"
             aria-label="Change selection"
             aria-expanded={false}
             onClick={selectedItemClickHandler}
         />}
         <div className={`relative ${items.length > 1
             ? 'pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto [&_.tooltip]:pointer-events-auto'
             : ''}`}>
             {renderSelectedItem(items[selectedItemIndex ?? 0])}
         </div>
     </div> :
     <div className="w-full mt-1 flex flex-col items-center">
         {title}
         <ul className={`pl-0 pt-2 ml-0 mr-0 bg-base-100 rounded-box max-w-full lg:min-w-64 shadow-sm ${className}`}>
             {items.map((item: T, index: number) => {
                 const itemProps = {
                    [`data-${type}-index`]: index,
                 };

                 return <li
                     key={getItemKey(item)}
                     className={makeListItemClassName(index, selectedItemIndex)}
                 >
                     <button
                         type="button"
                         className="block w-full text-left cursor-pointer"
                         aria-current={index === selectedItemIndex ? 'true' : undefined}
                         onClick={listItemClickHandler}
                         onMouseEnter={onHover}
                         {...itemProps}
                     >
                         {renderItem(item, index)}
                     </button>
                 </li>;
             })}
         </ul>
     </div>;
};
