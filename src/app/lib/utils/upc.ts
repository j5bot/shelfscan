export const UPC_A_PATTERN = /^\d{12}$/;
// UPC-E: number system 0 or 1, six data digits, check digit
export const UPC_E_PATTERN = /^[01]\d{7}$/;

// check digit for the first 11 digits of a UPC-A
export const upcCheckDigit = (digits: string) => {
    const sum = [...digits.slice(0, 11)].reduce(
        (total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1),
        0,
    );
    return (10 - (sum % 10)) % 10;
};

export const isValidUPCA = (upc: string) =>
    UPC_A_PATTERN.test(upc) && upcCheckDigit(upc) === Number(upc[11]);

// expand a zero-suppressed UPC-E to its 12-digit UPC-A equivalent
export const expandUPCE = (upc: string) => {
    const numberSystem = upc[0];
    const data = upc.slice(1, 7);
    const check = upc[7];
    const last = Number(data[5]);

    let body: string;
    switch (true) {
        case last <= 2:
            body = `${data.slice(0, 2)}${data[5]}0000${data.slice(2, 5)}`;
            break;
        case last === 3:
            body = `${data.slice(0, 3)}00000${data.slice(3, 5)}`;
            break;
        case last === 4:
            body = `${data.slice(0, 4)}00000${data[4]}`;
            break;
        default:
            body = `${data.slice(0, 5)}0000${data[5]}`;
    }
    return `${numberSystem}${body}${check}`;
};

export const isValidUPCE = (upc: string) =>
    UPC_E_PATTERN.test(upc) && isValidUPCA(expandUPCE(upc));
