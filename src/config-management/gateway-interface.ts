/**
 * This file contains the interface for configuration of the api gateways
 * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
 */

export type AccessLevel = 'admin' | 'open';
export type HTTPMethod = 'POST' | 'GET' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

export interface IRouteConfig {
    route: string;
    proxyPath: string;

    // Defaults to 'open'
    accessType?: AccessLevel;

    // Defaults to ['GET', 'OPTIONS'] if accessType is 'open'
    // Defaults to ['OPTIONS'] if accessType is 'admin'
    allowedMethods?: Array<HTTPMethod>;

    isWebsocket?: boolean;
}

export interface IExceptionRoute {
    route: string;
    method: HTTPMethod;
    accessType?: AccessLevel;
}

export interface IGatewayConfig {
    routes: Array<IRouteConfig>;
    jwtSignOptions: {
        issuer?: string;
        subject?: string;
        audience?: string;
        expiresIn?: string;
        algorithm?: Array<string>;
    }
}