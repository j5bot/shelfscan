// ==UserScript==
// @name         ShelfScan -> Swaptagon Import
// @namespace    https://github.com/j5bot/shelfscan
// @version      1.2.0
// @description  Import items from a ShelfScan trade interop file (ODS) to Swaptagon
// @author       ShelfScan
// @match        https://swaptagon.com/*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importSwap.user.js
// @updateURL    https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importSwap.user.js
// ==/UserScript==

(() => {
    'use strict';

    const OFFICE_NS = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
    const TABLE_NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
    const TEXT_NS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
    const DRAW_NS = 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0';
    const XLINK_NS = 'http://www.w3.org/1999/xlink';
    const MANIFEST_NS = 'urn:oasis:names:tc:opendocument:xmlns:manifest:1.0';

    const MIME_BY_EXTENSION = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif',
    };

    // Matches TradeItemInteropFormatColumnHeaders / the "Compare Value" split
    // of `options` in src/app/lib/types/trade.ts and src/app/lib/utils/swapExport.ts.
    // Columns not needed for a Swaptagon import (BGG ID, version info, etc.)
    // are intentionally omitted here.
    const COLUMN_HEADERS = {
        name: 'Name',
        description: 'Description',
        compareValue: 'Compare Value',
        cashValue: 'Cash Value',
        image: 'Image',
    };

    const requiredTextProps = [
        'name',
        'description',
    ];

    const requiredNumberProps = [
        'compareValue',
        'cashValue',
    ];

    let xsrfToken;
    try {
        xsrfToken = JSON.parse(document.body.getAttribute('hx-headers'))?.['X-CSRFToken'];
    } catch (e) {
        console.error('error parsing xsrf token');
        throw e;
    }

    const uploadImage = async (imageBlob) => {
        const formData = new FormData();
        formData.append('image_type', 'item');
        formData.append('file', imageBlob, 'defaultImage');

        return await fetch('https://swaptagon.com/upload_image', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': xsrfToken,
            },
        }).then(response => response.text());
    };

    const addItem = async (item) => {
        const fileName = await uploadImage(item.image);

        const formData = new FormData();
        const data = {
            csrfmiddlewaretoken: xsrfToken,
            name: item.name,
            description: item.description,
            value: item.compareValue,
            sale_price: item.cashValue,
            returned_filename: fileName.startsWith('#') ? fileName : `#${fileName}`,
        };
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value.toString());
        });

        return await fetch(window.location.href, {
            method: 'POST',
            body: formData,
        }).then(response => response.status);
    };

    const getCellNumber = (cell) => {
        if (!cell) { return undefined; }
        const raw = cell.getAttributeNS(OFFICE_NS, 'value');
        if (raw === null || raw === '') { return undefined; }
        const value = parseFloat(raw);
        return Number.isNaN(value) ? undefined : value;
    };

    const getCellString = (cell) => {
        if (!cell) { return ''; }
        const paragraphs = Array.from(cell.getElementsByTagNameNS(TEXT_NS, 'p'));
        return paragraphs.map(p => p.textContent ?? '').join('\n');
    };

    const getCellImagePath = (cell) => {
        if (!cell) { return undefined; }
        const image = cell.getElementsByTagNameNS(DRAW_NS, 'image')[0];
        return image?.getAttributeNS(XLINK_NS, 'href') ?? undefined;
    };

    const guessMediaType = (path) => {
        const extension = path.split('.').pop()?.toLowerCase() ?? '';
        return MIME_BY_EXTENSION[extension] ?? 'image/jpeg';
    };

    const readManifestMediaTypes = async (zip) => {
        const manifestFile = zip.file('META-INF/manifest.xml');
        if (!manifestFile) { return new Map(); }

        const xml = await manifestFile.async('text');
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const entries = Array.from(doc.getElementsByTagNameNS(MANIFEST_NS, 'file-entry'));

        return new Map(entries.map(entry => [
            entry.getAttributeNS(MANIFEST_NS, 'full-path'),
            entry.getAttributeNS(MANIFEST_NS, 'media-type'),
        ]));
    };

    const readImageDataUrl = async (zip, path, mediaTypes) => {
        const imageFile = zip.file(path);
        if (!imageFile) { return undefined; }

        const base64 = await imageFile.async('base64');
        const mediaType = mediaTypes.get(path) || guessMediaType(path);
        return `data:${mediaType};base64,${base64}`;
    };

    // Column order/presence is not fixed: swapExport.ts omits any column
    // with no data across the exported rows, so cells must be looked up by
    // header name rather than position.
    const getHeaderIndexByName = (headerRow) => {
        const cells = Array.from(headerRow.getElementsByTagNameNS(TABLE_NS, 'table-cell'));
        const indexByName = {};
        cells.forEach((cell, index) => {
            const name = getCellString(cell).trim();
            if (name) { indexByName[name] = index; }
        });
        return indexByName;
    };

    const parseSwapItems = async (arrayBuffer) => {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const contentFile = zip.file('content.xml');
        if (!contentFile) { throw new Error('content.xml not found in ODS archive'); }

        const contentXml = await contentFile.async('text');
        const doc = new DOMParser().parseFromString(contentXml, 'application/xml');
        const rows = Array.from(doc.getElementsByTagNameNS(TABLE_NS, 'table-row'));
        if (rows.length === 0) { return []; }

        const [headerRow, ...dataRows] = rows;
        const indexByName = getHeaderIndexByName(headerRow);
        const mediaTypes = await readManifestMediaTypes(zip);

        const cellFor = (cells, header) => {
            const index = indexByName[header];
            return index === undefined ? undefined : cells[index];
        };

        return Promise.all(dataRows.map(async (row) => {
            const cells = Array.from(row.getElementsByTagNameNS(TABLE_NS, 'table-cell'));
            const imagePath = getCellImagePath(cellFor(cells, COLUMN_HEADERS.image));

            return {
                name: getCellString(cellFor(cells, COLUMN_HEADERS.name)),
                description: getCellString(cellFor(cells, COLUMN_HEADERS.description)),
                compareValue: getCellNumber(cellFor(cells, COLUMN_HEADERS.compareValue)),
                cashValue: getCellNumber(cellFor(cells, COLUMN_HEADERS.cashValue)),
                image: imagePath ? await readImageDataUrl(zip, imagePath, mediaTypes) : undefined,
            };
        }));
    };

    const createImportPanel = () => {
        const panel = document.createElement('div');
        panel.id = 'shelfscan-swap-import-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '16px',
            right: '16px',
            zIndex: '2147483647',
            background: '#1f2933',
            color: '#f8fafc',
            padding: '12px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            fontFamily: 'sans-serif',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        });

        const label = document.createElement('span');
        label.textContent = 'Import Swap Export (.ods)';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ods';

        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.textContent = 'Import Swap Data';
        Object.assign(importButton.style, {
            cursor: 'pointer',
            padding: '4px 8px',
        });

        importButton.addEventListener('click', () => {
            const file = fileInput.files?.[0];
            if (!file) {
                console.warn('[importSwap] No file selected.');
                return;
            }

            importButton.disabled = true;
            importButton.textContent = 'Importing…';

            file.arrayBuffer()
                .then(parseSwapItems)
                .then((items) => {
                    console.log('[importSwap] Parsed trade items:', items);
                    return Promise.all(items
                        .filter(item =>
                            requiredTextProps.every(prop => (item[prop] ?? '').length > 0) &&
                            requiredNumberProps.every(prop => item[prop] !== undefined) &&
                            item.image !== undefined
                        )
                        .map(async (item) => {
                            const imageBlob = await fetch(item.image).then(resp => resp.blob());
                            return Object.assign(item, { image: imageBlob });
                        }));
                })
                .then(items => {
                    return Promise.all(items.map(addItem));
                })
                .catch((error) => {
                    console.error('[importSwap] Failed to import swap export:', error);
                })
                .finally(() => {
                    importButton.disabled = false;
                    importButton.textContent = 'Import Swap Data';
                });
        });

        panel.append(label, fileInput, importButton);
        document.body.append(panel);
    };

    const addBGGHyperlinks = () => {
        const gameName = document.querySelector('h3');
        const pars = Array.from(document.querySelectorAll('p'));
        pars.filter(par => par.innerHTML.startsWith('https://boardgamegeek.com/'))
            .forEach(par => {
                const link = par.innerHTML;
                const a = document.createElement('a');
                a.href = link;
                a.target = '_blank';
                a.innerText = gameName.innerText;
                par.innerHTML = '';
                par.appendChild(a);
            });
    };

    switch (true) {
        case window.location.pathname.endsWith('/additem'):
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createImportPanel);
            } else {
                createImportPanel();
            }
            break;
        case !isNaN(parseInt(window.location.pathname.slice(1), 10)):
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', addBGGHyperlinks);
            } else {
                addBGGHyperlinks();
            }
            break;
    }

})();
