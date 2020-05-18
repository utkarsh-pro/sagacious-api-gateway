import "mocha"
import chai from 'chai'
import { StorageManager } from './StorageManager'

const expect = chai.expect

let manager: StorageManager;

describe(("StoreMangager Class"), () => {
    beforeEach(() => {
        manager = new StorageManager()
    })

    describe("constructor", () => {
        it("should properly initialize the storage manager when interval is more than 10s", () => {
            const manager = new StorageManager({ clearInterval: 10 * 1000 })
            expect(manager).to.be.instanceOf(StorageManager)
            manager.removeCleaner(true)
        })

        it("should initialize the manager with initial store available", () => {
            const store = new Map<string | number, any>()
            store.set(1, "one")

            const lmanager = new StorageManager({ initialStore: store })
            const lstore = lmanager.Store;

            expect(lstore).to.be.deep.equal(store)

            // Clear the cleaner
            lmanager.removeCleaner(true)
        })
    })

    describe("#set", () => {
        it("should set the key value pair", () => {
            manager.set(1, "one")
            expect(manager.search(1)).to.be.true
        })

        it("should be able to chain set call", () => {
            manager.set(1, "one").set(2, "two").set(3, "three")
            expect(manager.get(1)).to.equal("one");
            expect(manager.get(2)).to.equal("two");
            expect(manager.get(3)).to.equal("three");
        })
    })

    describe("#get", () => {
        it("should not be found as it should have expired", (done) => {
            manager.set(1, "one", 10)
            expect(manager.get(1)).to.equal("one")
            setTimeout(() => {
                expect(manager.get(1)).to.be.undefined
                done()
            }, 10 + 2)
        })
    })

    describe("#search", () => {
        it("should return true when item exists in store", () => {
            manager.set(1, "one")
            expect(manager.search(1)).to.be.true
        })

        it("should return false when item doesn't exists in the store", () => {
            expect(manager.search(1)).to.be.false
        })
    })

    describe("#remove", () => {
        it("should remove the entry from the store", () => {
            manager.set(1, "one")
            expect(manager.search(1)).to.be.true
            manager.remove(1)
            expect(manager.search(1)).to.be.false
        })
    })


    afterEach(() => {
        manager.clear()
        manager.removeCleaner(true)
    })
})