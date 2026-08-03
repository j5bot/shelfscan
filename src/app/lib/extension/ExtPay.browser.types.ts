export interface ExtPayBrowser {
    /** Creates a new api key for the user and persists it to window.localStorage. */
    createKey: () => Promise<string>;
    /** Reads the api key from window.localStorage, or null if none has been created yet. */
    getKey: () => Promise<string | null>;
    /** Removes the stored api key from window.localStorage. */
    removeKey: () => Promise<void>;
    /**
     * Opens the ExtensionPay trial page in a popup window, creating an api key
     * first if one doesn't already exist. `period` is a display string like
     * '1 week' (e.g. "start your 1 week free trial").
     */
    openTrialPage: (period?: string) => Promise<void>;
    /**
     * Opens the ExtensionPay payment/choose-plan page in a new tab, creating an
     * api key first if one doesn't already exist.
     */
    openPaymentPage: (planNickname?: string) => Promise<void>;
}
