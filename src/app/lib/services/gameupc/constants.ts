export const makeGameUPCHost = (isTest: boolean = false) =>
    `https://api.gameupc.com/${isTest ? 'test' : 'v1'}`;
