export const capitalize = (str: string) =>
    str?.length > 0 ? str.concat(str.charAt(0).toUpperCase(), str.substring(1)) : str;

export const snakeToLowerCamelCase = (str: string) => {
    const segments = str.split(/_/g);
    return segments.map(
        (segment, index) => index === 0 ? segment : capitalize(segment)
    ).join();
};

export const transformObjectKeys =
    <T extends string | number | symbol = string>(
        obj: Record<T, unknown>,
        transformFunction: (str: string) => string = snakeToLowerCamelCase,
    ) => Object.entries(obj).reduce((acc, entry) =>
            Object.assign(acc, { [transformFunction(entry[0])]: entry[1] }),
        {} as Record<T, unknown>);
