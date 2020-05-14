import express, { Express, NextFunction, Request, Response, json } from 'express'
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";
import { Server } from 'http';
import { verify } from 'jsonwebtoken'

import { IGatewayConfig, IRouteConfig, HTTPMethod, AccessLevel } from '../config-management/gateway-interface';
import { publicKey } from '../config-management/gateway-key'

// ============================= INTERFACES AND TYPES =================================
/**
 * Interface for Gateway
 */
export interface IGateway {
    express: Express;
    init: () => Express;
    setup: () => void;
    listen: (...args: any[]) => Server;
    loadConfig: (config: IGatewayConfig) => IGatewayConfig;
}

/**
 * Defines the interface for the user payload of the token
 */
export interface IUser {
    username: string;
    name: string;
    id: string;
    email: string;
    role: AccessLevel;
    service: string;
}

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type Path = string;

// ============================= GATEWAY IMPLEMENTATION ================================
/**
 * Gateway creates a wrapper around express to
 * enable proxying based on the configuration provided.
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
     * Default allowed http methods based on access level
     */
    private defaultAllowedMethods: { open: HTTPMethod[], admin: HTTPMethod[] } = {
        open: ['GET', 'OPTIONS'],
        admin: ['OPTIONS']
    }

    /**
     * Keeps a record if the setup has been initialized
     * using the setup method
     */
    private setupInitialized: boolean = false;

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
        // Set initialized to true
        this.setupInitialized = true;

        // Setup verify middleware on all routes
        this.express.use(this.verify.bind(this))

        // Setup other middlewares on the given routes
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
     * Enables websocket based proxy
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

    /**
     * Loads new configuration
     * @param config 
     * @returns {IGatewayConfig}
     */
    loadConfig(config: IGatewayConfig): IGatewayConfig {
        if (this.setupInitialized) throw Error("Cannot load config after running setup");
        this.config = config;
        return this.config;
    }

    /**
     * Combines the authorization and proxying middlewares
     * @param config 
     */
    private authorizeAndProxy(config: IRouteConfig): Array<ExpressMiddleware> {
        return [this.authorize(config), this.proxy(config)]
    }

    /**
     * Creates a middleware for authorizing the requests
     * @param config {IRouteConfig}
     */
    private authorize(config: IRouteConfig): ExpressMiddleware {
        const middleware = (req: Request, res: Response, next: NextFunction) => {
            const user = req.get("user");
            const methods = config.allowedMethods || this.defaultAllowedMethods[config.accessType || "open"]

            if (config.accessType === "open") {
                if (user || methods.includes(req.method as HTTPMethod)) next()
                else res.sendStatus(401);
            } else if (config.accessType === "admin") {
                // Parse the user object
                const parsedUser = user && JSON.parse(user) as IUser

                if ((parsedUser && parsedUser.role === "admin") || methods.includes(req.method as HTTPMethod)) {
                    next()
                }
                else res.sendStatus(401);
            }
        }

        return middleware
    }

    /**
     * Calls createProxyMiddleware based on the type of proxy (http, websocket).
     * Also holds a record to the websocket route in websocketMappings
     * @param config 
     */
    private proxy(config: IRouteConfig) {
        if (config.isWebsocket) {
            const middleware = createProxyMiddleware(config.route, {});
            this.websocketMappings.set(config.route, middleware)
            return middleware
        } else {
            return createProxyMiddleware(config.route, { target: config.proxyPath })
        }
    }

    /**
     * Verifies if the given token is valid JWT or not.
     * Also sets up the header 'user' with the decoded JWT. No header
     * is set if the token is invalid
     * @param req {Request}
     * @param res {Response}
     * @param next {NextFunction}
     */
    private verify(req: Request, res: Response, next: NextFunction) {
        const token = this.extractToken(req)
        if (token) {
            verify(token, publicKey, (err, decoded) => {
                if (err) {
                    res.sendStatus(401)
                    return
                }

                if (decoded) {
                    req.headers["user"] = JSON.stringify(decoded)
                } else {
                    req.headers["user"] = undefined;
                }

                next()
            })
        }
        else res.status(401).json({ err: "no token was provided" })
    }

    /**
     * Extract the token from the requeest body
     * Looks into 'Authentication', 'x-auth-token' headers and then into 'token'
     * query parameter as a fallback
     * @param req {Request}
     */
    private extractToken(req: Request): string | undefined {
        // Look for token in Authentication header
        const bearer = req.get("Authorization")
        let token = bearer && bearer.split(" ")[1]; // Bearer <TOKEN HERE>

        // Fallback to x-auth-token header
        if (!token) token = req.get("x-auth-token")

        // Fallback to uri
        if (!token) token = req.query.token as string

        return token;
    }
}

// ====================================== EXPORTS =====================================
export default Gateway