import { CleanupManager } from '../CleanupManager'

const cleanupManager = new CleanupManager()

cleanupManager
    .attach(() => console.log("op1"))
    .attach(() => console.log("op2"))
    .attach(() => console.log("op3"))
    .unsubscribe()