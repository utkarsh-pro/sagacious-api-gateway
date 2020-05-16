import 'mocha'
import chai from 'chai'
import fetch from './fetch'
import nock from 'nock'

const expect = chai.expect;

// Nock for https request
nock("https://example.com")
    .get("/todos/1")
    .once()
    .reply(200, { userID: 1, task: "Do testing" })

// Nock for http request
nock("http://example.com")
    .get("/todos/1")
    .once()
    .reply(200, { userID: 1, task: "Do testing" })

// Nock for https request status 404
nock("https://example.com")
    .get("/todos/100")
    .once()
    .reply(404)

describe('fetch function', () => {
    describe("get method", () => {
        it("should return status 200", async () => {
            try {
                const res = await fetch.get("https://example.com/todos/1")
                expect(res.status).to.equal(200)
            } catch (error) {
                throw error
            }
        })

        it("should return status 200", async () => {
            try {
                const res = await fetch.get("http://example.com/todos/1")
                expect(res.status).to.equal(200)
            } catch (error) {
                throw error
            }
        })

        it("should return status 404 and data be null", async () => {
            try {
                const res = await fetch.get("https://example.com/todos/100")
                expect(res.status).to.equal(404)
                expect(res.data).to.be.null
            } catch (error) {
                throw error
            }
        })
    })
})
