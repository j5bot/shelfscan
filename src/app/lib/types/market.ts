export type MarketPreferences = {
    currency?: string;
    price?: number;
    condition?: string;
    notes?: string;
    paymentMethod?: string;
    country?: string;
    shipLocation?: string;
    shipAreas?: string;
};

export type GeekMarketProductImageSet = {
    src: string;
    'src@2x': string;
};

type GeekMarketProductVersionDescriptor = {
    name: string;
    displayValue: string;
};

export type GeekMarketRawProductVersion = {
    id: string;
    name: string;
    href?: string;
    descriptors: GeekMarketProductVersionDescriptor[];
    imageSets: Record<string, GeekMarketProductImageSet>;
};

export type GeekMarketObjectLink = {
    id: string;
    name: string;
    href: string;
};

export type GeekMarketProduct = {
    productid: string;
    objecttype: string;
    objectid: string;
    producthref: string;
    price: string;
    currency: string;
    currencystring: string;
    currencysymbol: string;
    condition: string;
    prettycondition: string;
    conditioncode: string;
    productstate?: string;
    itemlocation?: string;
    itemlocation_code?: string;
    listdate: string;
    utclistdate: string;
    inventorytype: string;
    quantity: string;
    version: GeekMarketRawProductVersion;
    imagesets: Record<string, GeekMarketProductImageSet>;
    objectlink?: GeekMarketObjectLink;
    images?: unknown[];
};

export type GeekMarketProductMap = Record<string, GeekMarketProduct>;
