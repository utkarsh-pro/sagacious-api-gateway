import 'mocha'
import chai from 'chai'
import chaiHTTP from 'chai-http'
import { fork } from 'child_process'
import path, { join } from 'path'

import { sign } from 'jsonwebtoken'
import app from '../index'
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
    accessLevel: "open"
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

// Spin the test server
const proc = fork(path.join(__dirname, "dummy-server.js"))

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
        // Kill the temporary process after running all the test
        proc.kill("SIGTERM")
    })
})
