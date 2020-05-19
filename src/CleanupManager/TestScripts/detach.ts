import { CleanupManager } from '../CleanupManager'

const cleanupManager = new CleanupManager()

const a = () => console.log("op1")
const b = () => console.log("op2")
const c = () => console.log("op3")

cleanupManager
    .attach(a)
    .attach(b)
    .attach(c)
    .detach(b) // Detach function b => b should not execute now

