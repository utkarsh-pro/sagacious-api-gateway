
/**
 * Type for the objects that are stored in the store
 */
export type StoreValue = {
    value: any;
    expireOn?: number;
}

/**
 * Type for store
 */
export type Store = Map<string | number, StoreValue>;

/**
 * Interface for StorageManager
 */
export interface IStorageManager {
    get: (key: string | number) => any;
    set: (key: string | number, val: any, expireIn?: number) => StorageManager;
    search: (key: string) => boolean;
    remove: (key: string) => StorageManager;
    removeCleaner: (disableWarn?: boolean) => void;
    clear: () => void;
    copyStore: () => Store;
}

/**
 * StorageManager is a key value storage.
 * It is an abstraction over storage mechanism. It would make sure
 * that if we move to more reliable storage mechanisms like redis/memcache then
 * the public API doesn't changes and things works the same.
 */
export class StorageManager implements IStorageManager {
    /**
     * This is the temporary store which might be replaced
     * with a redis store in the future.
     */
    private store: Store = new Map<string | number, StoreValue>();

    /**
     * Stores a reference to the cleaner
     */
    private cleanerReference: NodeJS.Timeout | undefined;

    constructor({ initialStore, clearInterval = 10 * 60 * 1000 }: { initialStore?: Store, clearInterval?: number } = {}) {
        if (initialStore) this.store = initialStore;
        this.cleaner(clearInterval);
    }

    /**
     * Reference to current store
     */
    get Store() {
        return this.store;
    }

    /**
     * Copies the store and returns the copied store. 
     * Avoid using this.
     */
    public copyStore(): Store {
        return new Map<string | number, StoreValue>(this.store);
    }

    /**
     * Returns the value stored corresponding to the provided key
     * @param key {string | number}
     */
    public get(key: string | number): any {
        const val = this.store.get(key)
        if (this.isValidEntity(val)) {
            // TSC couldn't assert this one hence manual type assertion
            return (val as StoreValue).value;
        }

        return undefined
    }

    /**
     * Set the key value pair using this method. It returns the store
     * so chaining of subsequent methods is possible.
     * @param key {string | number}
     * @param val {any}
     * @param expireIn {number} Expire time in milliseconds
     */
    public set(key: string | number, val: any, expireIn?: number): StorageManager {
        // The actual value which will be stored in the store
        const value: StoreValue = {
            value: val,
            expireOn: expireIn && Date.now() + expireIn
        }

        this.store.set(key, value)
        return this
    }

    /**
     * Removes the key value pair from the store. It returns the store
     * so chaining of subsequest methods is possible.
     * @param key {key | string}
     */
    public remove(key: string | number): StorageManager {
        this.store.delete(key);
        return this;
    }

    /**
     * Searches the store for the provided key. If it exists
     * the returns true or else returns false
     * @param key {key | string}
     */
    public search(key: string | number): boolean {
        return !!this.get(key)
    }

    /**
     * Removes the cleaner.
     * Ideally it should not be removed. Unless you know what you are doing.
     */
    public removeCleaner(disableWarn?: boolean) {
        if (this.cleanerReference) {
            clearInterval(this.cleanerReference)
            !disableWarn && console.warn("Cleaner removed!")
        }
    }

    /**
     * Clears the store
     */
    public clear() {
        this.store.clear()
    }

    /**
     * Checks if the passed store value is valid. If the expire time has
     * has passed then it will deem it invalid or if the value was undefined
     * @param val {StoreValue | undefiend}
     */
    private isValidEntity(val: StoreValue | undefined): boolean {
        // If val is undefined then it's invalid
        if (!val) return false;
        // If val is defined and expireOn has exceeded then it's invalid
        if (val && val.expireOn && val.expireOn < Date.now()) return false

        // Otherwise the entity is valid
        return true;
    }

    /**
     * Cleans up the store occasionally
     * @param interval {number} Cleaning interval in ms (should be greater than 10s)
     */
    private cleaner(interval: number): Promise<number> {
        if (interval < 10 * 1000) throw Error("Interval cannot be lesser than 10 seconds")
        if (this.cleanerReference) return new Promise(resolve => resolve(-1));

        return new Promise<number>((resolve, reject) => {
            let count = 0;
            this.cleanerReference = setInterval(() => {
                this.store.forEach((value, key) => {
                    // If the entity is not valid then delete the entity
                    // from the store and count the number of deletes
                    if (!this.isValidEntity(value)) {
                        this.remove(key);
                        count++;
                    }
                })
                resolve(count)
            }, interval)
        })
    }
}