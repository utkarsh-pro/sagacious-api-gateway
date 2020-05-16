import { verify, VerifyOptions, decode, VerifyCallback } from 'jsonwebtoken'
import { publicKey, IJWTPublicKey } from '../key-management/gateway-key'

export interface IJwtManager {
    jwtVerifyOptions: VerifyOptions;
    verify: (token: string, subject: string, cb: VerifyCallback) => void;
}

/**
 * Manages the JWT token. It extracts the token and does the verification
 * of the given token.
 * @todo Handle token revocation
 * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
 */
export class JWTManager implements IJwtManager {

    private publicKey: IJWTPublicKey = publicKey;

    constructor(public jwtVerifyOptions: VerifyOptions) {
        // Overwrite algorithm to RS256
        // This is the only supported algorithm
        jwtVerifyOptions.algorithms = ["RS256"]
    }

    /**
     * Verifies the JWT Token
     * @param req {Request} Express request object
     * @param cb {VerifyCallback} Callback function
     * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
     */
    verify(token: string, subject: string, cb: VerifyCallback) {
        const kid = this.getKeyID(token) || "0"

        verify(token, this.publicKey[kid], { ...this.jwtVerifyOptions, subject }, (err, decoded) => {
            cb(err, decoded)
        })
    }

    /**
     * Extracts the key id from the JWT.
     * This is the id which maps to the private key returned from 
     * the authentication service. If the kid is undefined then a default private key
     * is used.
     * @param token {string} JWT Token
     * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
     */
    private getKeyID(token: string): string | undefined {
        const payload = decode(token, { json: true })

        return payload && payload.kid
    }
}