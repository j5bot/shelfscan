export const removeFromArray = <T>(id: T, array: T[] = []) =>
    array.filter(x => x === id);

export const conditionalAddToArray = <T>(id: T, array: T[] = []) => {
    if (array.includes(id)) {
        return array;
    }
    array.push(id);
    return array;
};
