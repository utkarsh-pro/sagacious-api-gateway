import 'mocha'
import chai from 'chai'

import Gateway from './Gateway'
import { IGatewayConfig } from '../config-management/gateway-interface'
import { Server } from 'http'

const expect = chai.expect
let gateway: Gateway;

describe('Gateway class', () => {
    beforeEach(() => {
        const config: IGatewayConfig = {
            routes: [
                {
                    route: "/api/v1",
                    proxyPath: "http://localhost:9000",
                    accessType: "open"
                }
            ],
            jwtSignOptions: {}
        }
        gateway = new Gateway(config)
    })

    it("should load new config without error", () => {
        const newConfig: IGatewayConfig = {
            routes: [],
            jwtSignOptions: {}
        }
        const config = gateway.loadConfig(newConfig)

        expect(config).to.be.deep.equal(newConfig);
    })

    it("should throw error when loading new config", () => {
        gateway.setup();
        const newConfig = {
            routes: [],
            jwtSignOptions: {}
        }
        expect(gateway.loadConfig.bind(gateway, newConfig)).to.throw("Cannot load config after running setup")
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
