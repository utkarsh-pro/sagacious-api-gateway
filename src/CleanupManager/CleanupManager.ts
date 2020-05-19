
export type CleanupCB = () => void;

export interface ICleanupManager {
    attach: (cb: CleanupCB) => CleanupManager;
    detach: (cb: CleanupCB) => CleanupManager;
    unsubscribe: () => void;
}

/**
 * CleanupManager provides a graceful shutdown by running the synchronous
 * callbacks before exiting the process and then exits with exit code 0
 */
export class CleanupManager implements ICleanupManager {

    /**
     * Stores references to the passed callbacks
     */
    private callbacks = new Map<CleanupCB, boolean>()

    /**
     * If the cleanup is in process
     */
    private inProcess: boolean = false;

    constructor() {
        process.once("exit", this.gracefulShutdown.bind(this))
        process.once("SIGTERM", this.gracefulShutdown.bind(this))
        process.once("SIGINT", this.gracefulShutdown.bind(this))
    }

    /**
     * Adds a callback to be called when Cleanup Manager
     * cleans up the process. The function should not be async.
     * @param cb {CleanupCB}
     */
    public attach(cb: CleanupCB): CleanupManager {
        this.callbacks.set(cb, true);
        return this;
    }

    /**
     * Removes the given callback from the Cleanup Manager
     * @param cb {CleanupCB}
     */
    public detach(cb: CleanupCB): CleanupManager {
        this.callbacks.delete(cb);
        return this;
    }

    /**
     * Removes all the callbacks and disable the Cleanup Manager
     */
    public unsubscribe() {
        return this.callbacks.clear()
    }

    /**
     * Runs all the callbacks before exit
     */
    private gracefulShutdown() {
        // If already in process the skip
        if (this.inProcess) return;

        // Set inProcess to true
        this.inProcess = true;

        // Run all the callbacks
        this.callbacks.forEach((_, cb) => cb())
        // Then exit with code 0
        process.exit(0);
    }
}

export default new CleanupManager()