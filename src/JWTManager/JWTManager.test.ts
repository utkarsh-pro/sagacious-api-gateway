import 'mocha'
import chai from 'chai'
import { IUser } from '../Gateway/Gateway'
import { readFileSync } from 'fs'
import { join } from 'path'
import { sign, Algorithm, JsonWebTokenError } from 'jsonwebtoken'
import { JWTManager } from './JWTManager'

const expect = chai.expect

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
    issuer: "Development",
    audience: "https://sagacious.dev",
    expiresIn: "30m",
    algorithm: "RS256" as Algorithm,
    subject: DummyUser.id
}

// Dummy JWT verifyoptions
const jwtVerifyOptions = {
    issuer: "Development",
    audience: "https://sagacious.dev",
    expiresIn: "30m",
    algorithms: ["RS256"] as Array<Algorithm>,
    subject: DummyUser.id
}

// Get the development private sign key
const privateKey = readFileSync(join(__dirname, "..", "key-management", "keys", "development", "private.key"), 'utf-8')

// Generate temporary token
const token = sign(DummyUser, privateKey, jwtSignOptions)

// JWTManager
let jwtmanager: JWTManager;
describe('JWTManager class', () => {
    before(() => {
        jwtmanager = new JWTManager(jwtVerifyOptions)
    })

    describe("verify method", () => {
        it("should throw error when subject is invalid", (done) => {
            jwtmanager.verify(token, "randomsubject", (err, decoded) => {
                expect(err).to.be.an.instanceOf(JsonWebTokenError)
                expect(decoded).to.be.undefined
                done()
            })
        })

        it("should throw error when token is invalid", (done) => {
            jwtmanager.verify("randomvalue", jwtSignOptions.subject, (err, decoded) => {
                expect(err).to.be.an.instanceOf(JsonWebTokenError)
                expect(decoded).to.be.undefined
                done()
            })
        })

        it("should throw error when token is valid but machine id is revoked", done => {
            jwtmanager.storage.set(DummyUser.machineID, DummyUser.machineID)
            jwtmanager.verify(token, jwtSignOptions.subject, (err, _) => {
                expect(err).to.be.an.instanceOf(JsonWebTokenError)

                // Remove the machine id now
                jwtmanager.storage.remove(DummyUser.machineID)
                done()
            })
        })

        it("should run successfully when token and subject are correct", (done) => {
            jwtmanager.verify(token, jwtSignOptions.subject, (err, decoded) => {
                expect(err).to.be.null;
                expect(decoded).to.be.not.undefined
                const d = decoded as IUser
                expect(d.username).to.equal(DummyUser.username)
                expect(d.roles).to.deep.equal(DummyUser.roles)
                expect(d.name).to.equal(DummyUser.name)
                expect(d.id).to.equal(DummyUser.id)
                expect(d.email).to.equal(DummyUser.email)
                expect(d.machineID).to.equal(DummyUser.machineID)
                expect(d.accessLevel).to.equal(DummyUser.accessLevel)
                done()
            })
        })
    })
})
