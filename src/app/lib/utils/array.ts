export const removeFromArray = <T>(id: T, array: T[] = []) =>
    array.filter(x => x !== id);

export const removeAndDeletePropertyIfArrayEmpty = <T, U extends Record<string | number, T[]>>(
    id: T,
    object: U,
    key: string | number
) => {
    Object.assign(object, { [key]: removeFromArray(id, object[key]) });
    if (!object[key].length) {
        delete object[key];
    }
};

export const conditionalAddToArray = <T>(id: T, array: T[] = []) => {
    if (array.includes(id)) {
        return array;
    }
    array.push(id);
    return array;
};
