import 'mocha'
import chai from 'chai'

import Gateway from './Gateway'
import { IGatewayConfig } from '../config-management/gateway-interface'
import { Express } from 'express'
import { Server } from 'http'

const expect = chai.expect
let gateway: Gateway;

describe('Gateway class', () => {
    beforeEach(() => {
        const config: IGatewayConfig = {
            routes: [
                {
                    route: "/v1/database/",
                    proxyPath: "http://database-service:5000",
                    accessType: "admin"
                }
            ]
        }
        gateway = new Gateway(config)
    })

    it("should return a http server", () => {
        const server = gateway.listen(5000)
        expect(server).to.be.instanceOf(Server)
        server.close()
    })

    it("should throw an error", () => {
        const server = gateway.listen(5000)

        expect(gateway.enableWSSupport.bind(gateway, server)).to.throw("Cannot use this method if using gateway 'listen' method")
        server.close()
    })
})
