// ==UserScript==
// @name         ShelfScan -> Atlas Realms Import
// @namespace    https://github.com/j5bot/shelfscan
// @version      1.0.2
// @description  Import items from a ShelfScan trade interop file (ODS) to Atlas Realms
// @author       ShelfScan
// @match        https://www.atlasrealms.com/trades/*/offerings*
// @grant        none
// @require      https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importAtlas.user.js
// @updateURL    https://raw.githubusercontent.com/j5bot/shelfscan/refs/heads/main/src/userscripts/importAtlas.user.js
// ==/UserScript==

(() => {
    'use strict';

    const OFFICE_NS = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
    const TABLE_NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
    const TEXT_NS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';

    // Matches TradeItemInteropFormatColumnHeaders / the "Compare Value" and
    // "Sweeteners" split of `options` in src/app/lib/types/trade.ts and
    // src/app/lib/utils/swapExport.ts. The embedded "Image" column (a picture
    // in the ODS) is intentionally omitted — only the URL columns are used
    // to populate edition_data.image/thumbnail below.
    const COLUMN_HEADERS = {
        type: 'Type',
        name: 'Name',
        bggId: 'BGG ID',
        year: 'Game Year',
        condition: 'Condition',
        description: 'Description',
        sweeteners: 'Sweeteners',
        compareValue: 'Compare Value',
        cashValue: 'Cash Value',
        versionName: 'Version Name',
        versionYear: 'Version Year',
        versionId: 'Version ID',
        versionLanguage: 'Version Language',
        versionPublisher: 'Version Publisher',
        imageUrl: 'Image URL',
        thumbnailUrl: 'Thumbnail URL',
    };

    const requiredTextProps = [
        'type',
        'name',
        'condition',
        'description',
    ];

    const requiredNumberProps = [
        'bggId',
    ];

    const getTradeId = () => {
        const match = window.location.pathname.match(/\/trades\/([^/]+)\/offerings/);
        return match?.[1];
    };

    // Atlas Realms is a Supabase-backed app: the session (including the
    // bearer token used to call trade-api.atlasrealms.com) is kept in
    // localStorage under a project-specific "sb-<project-ref>-auth-token" key.
    const getBearerToken = () => {
        const sessionKey = Object.keys(localStorage).find(key => /^sb-.*-auth-token$/.test(key));
        if (!sessionKey) { return undefined; }

        try {
            const session = JSON.parse(localStorage.getItem(sessionKey));
            return session?.access_token ?? session?.currentSession?.access_token;
        } catch (e) {
            console.error('[importAtlas] error parsing Supabase auth token', e);
            return undefined;
        }
    };

    const addItem = async (tradeId, token, item) => {
        const hasCashValue = item.cashValue !== undefined && item.cashValue > 0;
        const hasCompareValue = item.compareValue !== undefined && item.compareValue > 0;

        const payload = {
            type: 'game',
            subtype: item.type,
            game_title: item.name,
            bgg_id: item.bggId,
            year: item.year,
            condition: item.condition,
            condition_details: item.description,
            sweeteners: item.sweeteners || undefined,
            accepts_cash: hasCashValue ? true : undefined,
            cash_threshold: hasCashValue ? item.cashValue : undefined,
            owner_value: hasCompareValue ? item.compareValue : undefined,
            edition_data: item.versionId === undefined ? undefined : {
                version_id: item.versionId,
                name: item.versionName,
                year: item.versionYear,
                language: item.versionLanguage,
                thumbnail: item.thumbnailUrl ?? null,
                image: item.imageUrl ?? null,
                publisher: item.versionPublisher,
            },
        };

        return await fetch(`https://trade-api.atlasrealms.com/api/trade/${tradeId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
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

    const parseAtlasItems = async (arrayBuffer) => {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const contentFile = zip.file('content.xml');
        if (!contentFile) { throw new Error('content.xml not found in ODS archive'); }

        const contentXml = await contentFile.async('text');
        const doc = new DOMParser().parseFromString(contentXml, 'application/xml');
        const rows = Array.from(doc.getElementsByTagNameNS(TABLE_NS, 'table-row'));
        if (rows.length === 0) { return []; }

        const [headerRow, ...dataRows] = rows;
        const indexByName = getHeaderIndexByName(headerRow);

        const cellFor = (cells, header) => {
            const index = indexByName[header];
            return index === undefined ? undefined : cells[index];
        };

        return dataRows.map((row) => {
            const cells = Array.from(row.getElementsByTagNameNS(TABLE_NS, 'table-cell'));

            return {
                type: getCellString(cellFor(cells, COLUMN_HEADERS.type)) || undefined,
                name: getCellString(cellFor(cells, COLUMN_HEADERS.name)),
                bggId: getCellNumber(cellFor(cells, COLUMN_HEADERS.bggId)),
                year: getCellNumber(cellFor(cells, COLUMN_HEADERS.year)),
                condition: getCellString(cellFor(cells, COLUMN_HEADERS.condition)) || undefined,
                description: getCellString(cellFor(cells, COLUMN_HEADERS.description)),
                sweeteners: getCellString(cellFor(cells, COLUMN_HEADERS.sweeteners)) || undefined,
                compareValue: getCellNumber(cellFor(cells, COLUMN_HEADERS.compareValue)),
                cashValue: getCellNumber(cellFor(cells, COLUMN_HEADERS.cashValue)),
                versionName: getCellString(cellFor(cells, COLUMN_HEADERS.versionName)) || undefined,
                versionYear: getCellNumber(cellFor(cells, COLUMN_HEADERS.versionYear)),
                versionId: getCellNumber(cellFor(cells, COLUMN_HEADERS.versionId)),
                versionLanguage: getCellString(cellFor(cells, COLUMN_HEADERS.versionLanguage)) || undefined,
                versionPublisher: getCellString(cellFor(cells, COLUMN_HEADERS.versionPublisher)) || undefined,
                imageUrl: getCellString(cellFor(cells, COLUMN_HEADERS.imageUrl)) || undefined,
                thumbnailUrl: getCellString(cellFor(cells, COLUMN_HEADERS.thumbnailUrl)) || undefined,
            };
        });
    };

    const createImportPanel = (tradeId) => {
        const panel = document.createElement('div');
        panel.id = 'shelfscan-atlas-import-panel';
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
        label.textContent = 'Import Trade Export (.ods)';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ods';

        const importButton = document.createElement('button');
        importButton.type = 'button';
        importButton.textContent = 'Import Atlas Data';
        Object.assign(importButton.style, {
            cursor: 'pointer',
            padding: '4px 8px',
        });

        importButton.addEventListener('click', () => {
            const file = fileInput.files?.[0];
            if (!file) {
                console.warn('[importAtlas] No file selected.');
                return;
            }

            const token = getBearerToken();
            if (!token) {
                console.error('[importAtlas] No Atlas Realms session found — please log in and try again.');
                return;
            }

            importButton.disabled = true;
            importButton.textContent = 'Importing…';

            file.arrayBuffer()
                .then(parseAtlasItems)
                .then((items) => {
                    console.log('[importAtlas] Parsed trade items:', items);
                    return items.filter(item =>
                        requiredTextProps.every(prop => (item[prop] ?? '').length > 0) &&
                        requiredNumberProps.every(prop => item[prop] !== undefined)
                    );
                })
                .then(items => Promise.all(items.map(item => addItem(tradeId, token, item))))
                .catch((error) => {
                    console.error('[importAtlas] Failed to import trade export:', error);
                })
                .finally(() => {
                    importButton.disabled = false;
                    importButton.textContent = 'Import Atlas Data';
                });
        });

        panel.append(label, fileInput, importButton);
        document.body.append(panel);
    };

    const tradeId = getTradeId();
    if (tradeId) {
        const init = () => createImportPanel(tradeId);
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

})();
