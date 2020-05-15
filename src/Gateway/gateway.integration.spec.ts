import 'mocha'
import chai from 'chai'
import chaiHTTP from 'chai-http'

import { sign } from 'jsonwebtoken'
import app from '../index'
import { IUser } from './Gateway'
import { privateKey } from '../config-management/gateway-key'
import config from '../config-management/gateway-config'

const expect = chai.expect
chai.use(chaiHTTP)

const DummyUser: IUser = {
    username: "utkarsh",
    name: "Utkarsh Srivastava",
    id: "rwerwjkfhwer32089230",
    email: "test@test.com",
    role: "open",
    service: "api"
}

const jwtSignOptions = {
    ...config.jwtSignOptions,
    algorithm: "RS256",
    subject: DummyUser.id
}

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
            const token = sign(DummyUser, privateKey, { ...jwtSignOptions, algorithm: "RS256" })
            try {
                const res = await chai.request(app)
                    .get("/api")
                    .set("Authorization", `Bearer ${token}`)
                    .set("x-auth-client", DummyUser.id)
                    .send()
                expect(res).to.have.status(200)
            } catch (error) {
                throw error
            }
        })

        it("should send status 401 when x-auth-client is not passed", async () => {
            const token = sign(DummyUser, privateKey, { ...jwtSignOptions, algorithm: "RS256" })
            try {
                const res = await chai.request(app).get("/api").set("Authorization", `Bearer ${token}`).send()
                expect(res).to.have.status(401)
            } catch (error) {
                throw error
            }
        })

        it("should send status 401 when x-auth-client is invalid", async () => {
            const token = sign(DummyUser, privateKey, { ...jwtSignOptions, algorithm: "RS256" })
            try {
                const res = await chai.request(app)
                    .get("/api")
                    .set("Authorization", `Bearer ${token}`)
                    .set("x-auth-client", "random")
                    .send()
                expect(res).to.have.status(403)
            } catch (error) {
                throw error
            }
        })

    })
})