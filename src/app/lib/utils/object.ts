export const stripUndefinedProperties = <T extends object>(object: T): T => {
    return Object.fromEntries(
        Object.entries(object).filter(([, value]) => value !== undefined),
    ) as T;
};

export const extend = (object: object, ...extensions: object[]) => {
    return Object.assign(object, ...extensions.map(stripUndefinedProperties));
};
