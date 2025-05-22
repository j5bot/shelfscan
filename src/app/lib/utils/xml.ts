let parser: DOMParser;

export const getPageDOM = (domStr: string, xml = false) => {
    'use client';

    if (!parser) {
        parser = new window.DOMParser();
    }
    if (xml) {
        return parser.parseFromString(domStr, 'text/xml');
    }
    const frag = document.createDocumentFragment();
    const node = document.createElement('html');
    node.innerHTML = domStr;
    frag.appendChild(node);
    return frag as unknown as Document;
};