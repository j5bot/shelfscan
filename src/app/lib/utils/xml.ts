let parser: DOMParser;

export const getElementAttribute = (
    element: Element | null,
    number?: boolean,
    attribute?: string
) =>
    (element && attribute && element.getAttribute(attribute)) ?
    number ?
    parseInt(element.getAttribute(attribute) ?? 'undefined', 10) :
    element.getAttribute(attribute) ?? undefined :
    undefined;

export const getElementInnerHTML = (
    element: Element | null,
    number?: boolean
) =>
    element ?
    number ?
    parseInt(element.innerHTML ?? 'undefined', 10) :
    element.innerHTML :
    undefined;

export const elementGetter = (
    element: Element | null,
    number?: boolean,
    selector?: string,
    attribute?: string
) => {
    const resolvedElement = selector ? element?.querySelector(selector) ?? null : element;
    return resolvedElement ? attribute ?
                             getElementAttribute(resolvedElement, number, attribute) :
                             getElementAttribute(resolvedElement, number, 'value') ??
                             getElementInnerHTML(resolvedElement, number) :
           undefined;
};

export const getPageDOM = (domStr: string, xml = false) => {
    'use client';

    if (!parser) {
        parser = new window.DOMParser();
    }
    // DOMParser documents are inert: scripts and event handlers in domStr never run
    return parser.parseFromString(domStr, xml ? 'text/xml' : 'text/html');
};