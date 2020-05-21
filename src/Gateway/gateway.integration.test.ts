import 'mocha'
import chai from 'chai'
import chaiHTTP from 'chai-http'
import { join } from 'path'
import nock from 'nock'

import { sign } from 'jsonwebtoken'
import app, { gateway } from '../index'
import { IUser } from './Gateway'
import config from '../config-management/gateway-config'
import { readFileSync } from 'fs'

// Use expect for assertions
const expect = chai.expect
// Use chai-http for testing routes
chai.use(chaiHTTP)

// Setup dummy users for testing
const DummyUser: IUser = {
    username: "utkarsh",
    name: "Utkarsh Srivastava",
    id: "rwerwjkfhwer32089230",
    email: "test@test.com",
    roles: ["RETREIVE_INFO"],
    accessLevel: "open",
    machineID: "testmachine"
}

// Dummy JWT signoptions
const jwtSignOptions = {
    ...config.jwtVerifyOptions,
    algorithm: "RS256",
    subject: DummyUser.id
}

// Remove 'algorithms' from the options
delete jwtSignOptions.algorithms

// Get the development private sign key
const privateKey = readFileSync(join(__dirname, "..", "key-management", "keys", "development", "private.key"), 'utf-8')

// Generate temporary token
const token = sign(DummyUser, privateKey, { ...jwtSignOptions, algorithm: "RS256" })

// Nock for http request
const scope = nock("http://localhost:9000")
    .persist()
    .get(/\/api/)
    .reply(200, { userID: 1, task: "Do testing" })

describe('Proxy routes integration test', () => {
    describe("GET /api", () => {
        it("should send status 401 when no token is passed", async () => {
            try {
                const res = await chai.request(app).get("/api").send()
                expect(res).to.have.status(401)
            } catch (error) {
                throw error
            }
        })

        it("should send status 401 when a token is perfectly valid but is revoked", async () => {
            // Add machine ID to be revoked list
            gateway.jwtManager.storage.set(DummyUser.machineID, {})
            try {
                const res = await chai.request(app)
                    .get("/api")
                    .set("Authorization", `Bearer ${token}`)
                    .set("x-auth-subject", DummyUser.id)
                    .send()
                // Remove the key now
                gateway.jwtManager.storage.remove(DummyUser.machineID)
                expect(res).to.have.status(401)
            } catch (error) {
                throw error
            }
        })

        it("should send status 200 when token is passed in 'Authorization' header", async () => {
            try {
                const res = await chai.request(app)
                    .get("/api")
                    .set("Authorization", `Bearer ${token}`)
                    .set("x-auth-subject", DummyUser.id)
                    .send()
                expect(res).to.have.status(200)
            } catch (error) {
                throw error
            }
        })

        it("should send status 200 when token is passed in 'x-auth-token' header", async () => {
            try {
                const res = await chai.request(app)
                    .get("/api")
                    .set("x-auth-token", `${token}`)
                    .set("x-auth-subject", DummyUser.id)
                    .send()
                expect(res).to.have.status(200)
            } catch (error) {
                throw error
            }
        })

        it("should send status 200 when token is passed in uri", async () => {
            try {
                const res = await chai.request(app)
                    .get("/api?token=" + token)
                    .set("x-auth-subject", DummyUser.id)
                    .send()
                expect(res).to.have.status(200)
            } catch (error) {
                throw error
            }
        })

        it("should send status 401 when x-auth-subject is not passed", async () => {
            try {
                const res = await chai.request(app).get("/api").set("Authorization", `Bearer ${token}`).send()
                expect(res).to.have.status(401)
            } catch (error) {
                throw error
            }
        })

        it("should send status 403 when x-auth-subject is invalid", async () => {
            try {
                const res = await chai.request(app)
                    .get("/api")
                    .set("Authorization", `Bearer ${token}`)
                    .set("x-auth-subject", "random")
                    .send()
                expect(res).to.have.status(403)
            } catch (error) {
                throw error
            }
        })

    })

    after(() => {
        // Remove the mocker server
        scope.persist(false)
    })
})
