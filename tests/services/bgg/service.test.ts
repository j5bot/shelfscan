import { describe, it, expect, beforeAll } from '../../setup.js';
import { vi } from 'vitest';
import {
    getBggUser,
    getCommonDetails,
    getCommonDetailsFromObject,
    getVersionDetailsFromObject,
    getPrivateInfoFromObject,
    getCollectionFromXml,
    getCollectionItemFromObject,
} from '@/app/lib/services/bgg/service';

// Mock Dexie-backed cache so the service module loads cleanly
vi.mock('@/app/lib/database/cacheDatabase', () => ({
    getResponseFromCache: vi.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Helper: build a minimal BGG XML user response
// ---------------------------------------------------------------------------
const buildUserXml = (overrides: Record<string, string> = {}) => {
    const name = overrides.name ?? 'testuser';
    const id = overrides.id ?? '12345';
    return `<?xml version="1.0" encoding="utf-8"?>
<user name="${name}" id="${id}">
  <firstname value="${overrides.firstName ?? 'Jane'}" />
  <lastname value="${overrides.lastName ?? 'Doe'}" />
  <lastlogin value="${overrides.lastLogin ?? '2024-01-01'}" />
  <stateorprovince value="${overrides.state ?? 'CA'}" />
  <country value="${overrides.country ?? 'United States'}" />
  <traderating value="${overrides.tradeRating ?? '4.5'}" />
  <marketrating value="${overrides.marketRating ?? '3.2'}" />
  <avatarlink value="${overrides.avatarUrl ?? 'https://example.com/avatar.jpg'}" />
</user>`;
};

// ---------------------------------------------------------------------------
// Helper: build a minimal BGG collection XML with one item
// ---------------------------------------------------------------------------
const buildCollectionXml = ({
    objectId = '100',
    collId = '200',
    name = 'Catan',
    yearPublished = '1995',
    subType = 'boardgame',
    own = '1',
    rating = '8.5',
}: {
    objectId?: string;
    collId?: string;
    name?: string;
    yearPublished?: string;
    subType?: string;
    own?: string;
    rating?: string;
} = {}) => `<?xml version="1.0" encoding="utf-8"?>
<items totalitems="1">
  <item objecttype="thing" objectid="${objectId}" subtype="${subType}" collid="${collId}">
    <name sortindex="1">${name}</name>
    <yearpublished>${yearPublished}</yearpublished>
    <status own="${own}" prevowned="0" fortrade="0" want="0" wanttoplay="0"
            wanttobuy="0" wishlist="0" preordered="0" lastmodified="2024-01-01 00:00:00" />
    <stats minplayers="2" maxplayers="6" minplaytime="60" maxplaytime="120" numowned="150000">
      <rating value="${rating}">
        <usersrated value="50000" />
      </rating>
    </stats>
  </item>
</items>`;

// ---------------------------------------------------------------------------
// Provide window.DOMParser in the jsdom environment
// ---------------------------------------------------------------------------
beforeAll(() => {
    if (typeof window === 'undefined') {
        (global as Record<string, unknown>).window = global;
    }
});

describe('bgg/service', () => {
    describe('#getBggUser', () => {
        it('parses a username from valid user XML', () => {
            const result = getBggUser(buildUserXml({ name: 'Alice' }));
            expect(result.user).toEqual('alice'); // lowercased
        });

        it('parses the numeric user id', () => {
            const result = getBggUser(buildUserXml({ id: '9999' }));
            expect(result.id).toEqual('9999');
        });

        it('parses first and last name', () => {
            const result = getBggUser(buildUserXml({ firstName: 'Bob', lastName: 'Smith' }));
            expect(result.firstName).toEqual('Bob');
            expect(result.lastName).toEqual('Smith');
        });

        it('parses tradeRating as a float', () => {
            const result = getBggUser(buildUserXml({ tradeRating: '4.75' }));
            expect(result.tradeRating).toEqual(4.75);
        });

        it('parses marketRating as a float', () => {
            const result = getBggUser(buildUserXml({ marketRating: '2.0' }));
            expect(result.marketRating).toEqual(2.0);
        });

        it('parses country and state', () => {
            const result = getBggUser(buildUserXml({ country: 'Germany', state: 'Bavaria' }));
            expect(result.country).toEqual('Germany');
            expect(result.state).toEqual('Bavaria');
        });

        it('parses avatarUrl', () => {
            const result = getBggUser(buildUserXml({ avatarUrl: 'https://cdn.example.com/pic.png' }));
            expect(result.avatarUrl).toEqual('https://cdn.example.com/pic.png');
        });
    });

    describe('#getCommonDetails', () => {
        it('returns name and yearPublished from an Element', () => {
            // Arrange: create a small DOM element
            const doc = new DOMParser().parseFromString(
                `<item>
                    <name value="Catan" sortindex="1">Catan</name>
                    <yearpublished>1995</yearpublished>
                </item>`,
                'text/xml',
            );
            const item = doc.querySelector('item');

            // Act
            const result = getCommonDetails(item);

            // Assert
            expect(result?.name).toBeDefined();
        });

        it('returns undefined when element is null', () => {
            expect(getCommonDetails(null)).toBeUndefined();
        });
    });

    describe('#getCommonDetailsFromObject', () => {
        it('extracts name and yearPublished from a raw object', () => {
            const obj = { name: 'Terraforming Mars', yearpublished: '2016' };
            const result = getCommonDetailsFromObject(obj);
            expect(result?.name).toEqual('Terraforming Mars');
            expect(result?.yearPublished).toEqual('2016');
        });

        it('returns undefined when the object is falsy', () => {
            // @ts-expect-error — intentionally passing null
            expect(getCommonDetailsFromObject(null)).toBeUndefined();
        });
    });

    describe('#getVersionDetailsFromObject', () => {
        it('returns undefined when objectid is missing', () => {
            const result = getVersionDetailsFromObject({ name: 'No ID version' });
            expect(result).toBeUndefined();
        });

        it('returns a version object with id when objectid is present', () => {
            const obj = { objectid: 42, name: 'English Edition', yearpublished: '2020' };
            const result = getVersionDetailsFromObject(obj);
            expect(result).toBeDefined();
            expect(result?.id).toEqual(42);
        });
    });

    describe('#getPrivateInfoFromObject', () => {
        it('parses pricepaid as a float', () => {
            const obj = { pricepaid: '29.99', pp_currency: 'USD' };
            const result = getPrivateInfoFromObject(obj);
            expect(result.pricepaid).toBeCloseTo(29.99);
            expect(result.pp_currency).toEqual('USD');
        });

        it('parses currvalue as a float', () => {
            const obj = { currvalue: '45.0', cv_currency: 'EUR' };
            const result = getPrivateInfoFromObject(obj);
            expect(result.currvalue).toBeCloseTo(45.0);
            expect(result.cv_currency).toEqual('EUR');
        });

        it('parses a private comment from nested textfield structure', () => {
            const obj = {
                textfield: { privatecomment: { value: 'Gift from Alice' } },
            };
            const result = getPrivateInfoFromObject(obj);
            expect(result.privatecomment).toEqual('Gift from Alice');
        });

        it('returns undefined for optional fields when they are absent', () => {
            const result = getPrivateInfoFromObject({});
            expect(result.pricepaid).toBeUndefined();
            expect(result.currvalue).toBeUndefined();
            expect(result.privatecomment).toBeUndefined();
        });
    });

    describe('#getCollectionFromXml', () => {
        it('returns undefined for an empty string', () => {
            expect(getCollectionFromXml('')).toBeUndefined();
        });

        it('returns undefined when called with no argument', () => {
            expect(getCollectionFromXml()).toBeUndefined();
        });

        it('returns undefined when the XML contains an error element', () => {
            const errorXml = `<?xml version="1.0"?>
<errors><error><message>Invalid request</message></error></errors>`;
            expect(getCollectionFromXml(errorXml)).toBeUndefined();
        });

        it('returns undefined when there is no <items> root element', () => {
            const xml = `<?xml version="1.0"?><data></data>`;
            expect(getCollectionFromXml(xml)).toBeUndefined();
        });

        it('parses a valid collection and returns a map keyed by collectionId', () => {
            const xml = buildCollectionXml({ objectId: '100', collId: '200' });
            const result = getCollectionFromXml(xml);
            expect(result).toBeDefined();
            expect(result?.[200]).toBeDefined();
            expect(result?.[200].objectId).toEqual(100);
        });

        it('sets the name of the collection item correctly', () => {
            const xml = buildCollectionXml({ name: 'Catan', collId: '201' });
            const result = getCollectionFromXml(xml);
            expect(result?.[201].name).toEqual('Catan');
        });

        it('maps the "own" status to true', () => {
            const xml = buildCollectionXml({ own: '1', collId: '202' });
            const result = getCollectionFromXml(xml);
            expect(result?.[202].statuses.own).toBe(true);
        });

        it('maps an unset status to false', () => {
            const xml = buildCollectionXml({ own: '0', collId: '203' });
            const result = getCollectionFromXml(xml);
            expect(result?.[203].statuses.own).toBe(false);
        });

        it('parses the numeric rating', () => {
            const xml = buildCollectionXml({ rating: '9.0', collId: '204' });
            const result = getCollectionFromXml(xml);
            expect(result?.[204].rating).toBeCloseTo(9.0);
        });

        it('filters out items missing objectId or collectionId', () => {
            const malformedXml = `<?xml version="1.0"?>
<items totalitems="1">
  <item objecttype="thing" subtype="boardgame">
    <name sortindex="1">No IDs</name>
    <status own="1" prevowned="0" fortrade="0" want="0" wanttoplay="0"
            wanttobuy="0" wishlist="0" preordered="0" />
  </item>
</items>`;
            const result = getCollectionFromXml(malformedXml);
            expect(result).toBeDefined();
            expect(Object.keys(result ?? {}).length).toEqual(0);
        });
    });

    describe('#getCollectionItemFromObject', () => {
        it('maps a raw API object to a BggCollectionItem', () => {
            // Arrange
            const obj = {
                name: 'Wingspan',
                yearpublished: '2019',
                objectid: 266192,
                collid: 55555,
                subtype: 'boardgame',
                status: { own: true, prevowned: false, fortrade: false,
                          want: false, wanttoplay: false, wanttobuy: false,
                          wishlist: false, preordered: false },
                rating: 8.0,
            };

            // Act
            const result = getCollectionItemFromObject(obj);

            // Assert
            expect(result.objectId).toEqual(266192);
            expect(result.collectionId).toEqual(55555);
            expect(result.name).toEqual('Wingspan');
            expect(result.rating).toEqual(8.0);
        });

        it('defaults subType to "boardgame" when not provided', () => {
            const obj = {
                objectid: 1,
                collid: 1,
                status: {},
            };
            const result = getCollectionItemFromObject(obj);
            expect(result.subType).toEqual('boardgame');
        });
    });
});
