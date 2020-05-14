import express, { Express, NextFunction } from 'express'
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";

import { IGatewayConfig, IRouteConfig } from '../config-management/gateway-interface';
import { Server } from 'http';

// ============================= INTERFACES AND TYPES =================================
/**
 * Interface for Gateway
 */
export interface IGateway {
    express: Express;
    init: () => Express;
    setup: () => void;
    listen: (port: number, cb: (...args: any) => void) => Server;
}

type ExpressMiddleware = (req: Express.Request, res: Express.Response, next: NextFunction) => void;
type Path = string;

// ============================= GATEWAY IMPLEMENTATION ================================
/**
 * Gateway creates a wrapper around express to
 * enable proxying based on the configuration provided
 * It also supports proxy for websocket based connections
 */
class Gateway implements IGateway {
    /**
     * Default express instance
     * No changes are made to this instance so this can be used 
     * just the way a user will work with an express instance.
     */
    public express: Express;

    /**
     * Websocker mappings are stored to hold reference to the 
     * http-proxy-middleware to support auto connection upgradations.
     */
    private websocketMappings = new Map<Path, RequestHandler>()

    /**
     * For internal use only.
     * Checks if the express server is being used.
     */
    private usingExpressListener: boolean = true;

    constructor(private config: IGatewayConfig) {
        this.express = express();
    }

    /**
     * Initializes the gateway and returns the instance 
     * of express. This method will setup multiple express middlewares,
     * number of middlewares would depend upon the number of routes 
     * provided in the gateway configuration.
     */
    init(): Express {
        return this.express;
    }

    /**
     * Sets up the middleware into the express. 
     * This should be invoked only after all the custom
     * middlewares are setup by the user
     */
    setup() {
        this.config.routes.forEach(config => {
            this.express.use(config.route, this.authorizeAndProxy(config))
        })
    }

    /**
     * Use this method to enable auto support for websocket proxy
     * @param port 
     * @param cb 
     */
    listen(port: number, hostname: string, backlog: number, callback?: (...args: any[]) => void): Server;
    listen(port: number, callback?: (...args: any[]) => void): Server;
    listen(callback?: (...args: any[]) => void): Server;
    listen(path: string, callback?: (...args: any[]) => void): Server;
    listen(handle: any, listeningListener?: () => void): Server;
    listen(...args: any[]): Server {
        const server = this.express.listen(...args)
        this.enableWSSupport(server)
        this.usingExpressListener = false;

        return server
    }

    /**
     * Enables websocker based proxy
     * @param server 
     */
    enableWSSupport(server: Server): Server {
        if (!this.usingExpressListener) throw Error("Cannot use this method if using gateway 'listen' method")

        server.on('upgrade', (req, socket, head) => {
            this.websocketMappings.forEach((v, k) => {
                if (req.url.startsWith(k) && v.upgrade)
                    v.upgrade(req, socket, head);
            })
        })

        return server
    }

    private authorizeAndProxy(config: IRouteConfig): Array<ExpressMiddleware> {
        return [this.authorize, this.proxy(config)]
    }

    private authorize(req: Express.Request, res: Express.Response, next: NextFunction) {
        next()
    }

    private proxy(config: IRouteConfig) {
        if (config.isWebsocket) {
            const middleware = createProxyMiddleware(config.route, {});
            this.websocketMappings.set(config.route, middleware)
            return middleware
        } else {
            return createProxyMiddleware(config.route, { target: config.proxyPath, onProxyReq: this.onProxyReq })
        }
    }

    private onProxyReq(proxyReq: any, req: any, res: any) {
        proxyReq.setHeader('user', JSON.parse(req.verified))
    }
}

// ====================================== EXPORTS =====================================
export default Gateway