export const formatBytes =
    (bytes: number, decimals: number = 2) => {
        if (bytes === 0) {
            return '0 Bytes';
        }

        const bytesInKilo = 1000;
        const resolvedDecimals = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        const sizeFactor = Math.floor(Math.log(bytes) / Math.log(bytesInKilo));

        return `${parseFloat((bytes / Math.pow(bytesInKilo, sizeFactor))
                .toFixed(resolvedDecimals))} ${sizes[sizeFactor]}`;
};