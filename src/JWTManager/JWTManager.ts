import { verify, VerifyOptions, decode, JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken'
import { publicKey, IJWTPublicKey } from '../key-management/gateway-key'
import { StorageManager } from '../StorageManager/StorageManager';
import { IUser } from '../Gateway/Gateway';
import { CleanupManager } from '../CleanupManager/CleanupManager';

// ========================================================================================================

export type VerifyCallback = (
    err: JsonWebTokenError | NotBeforeError | TokenExpiredError | RevokedTokenError | null,
    decoded: IUser
) => any;

export interface IJwtManager {
    jwtVerifyOptions: VerifyOptions;
    verify: (token: string, subject: string, cb: VerifyCallback) => void;
}

// ========================================================================================================

/**
 * Class for Revoked token error
 */
export class RevokedTokenError extends JsonWebTokenError {
    constructor(message: string, public machineID: string) {
        super(message)
    }
}

// Setup a cleanup manager
export const cleaner = new CleanupManager()

// ========================================================================================================

/**
 * Manages the JWT token. It extracts the token and does the verification
 * of the given token.
 * @todo Handle token revocation
 * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
 */
export class JWTManager implements IJwtManager {

    private publicKey: IJWTPublicKey = publicKey;
    private revokedTokensStorage: StorageManager;

    constructor(public jwtVerifyOptions: VerifyOptions) {
        // Overwrite algorithm to RS256
        // This is the only supported algorithm
        jwtVerifyOptions.algorithms = ["RS256"]

        // Setup storagemanager
        this.revokedTokensStorage = new StorageManager({ clearInterval: 10 * 60 * 1000 })

        // Remove storage upon exit
        cleaner.attach(this.revokedTokensStorage.removeCleaner.bind(this))
    }

    /**
     * Verifies the JWT Token
     * @param req Express request object
     * @param cb Callback function
     * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
     */
    verify(token: string, subject: string, cb: VerifyCallback) {
        // kid is the public key id
        const kid = this.getKeyID(token) || "0"

        verify(token, this.publicKey[kid], { ...this.jwtVerifyOptions, subject }, (err, decoded) => {

            // Check if the machine id is revoked
            // if it is revoked then throw error
            if (!err && decoded && this.isRevoked((decoded as IUser).machineID)) {
                const err = new RevokedTokenError("machine id revoked", (decoded as IUser).machineID)
                cb(err, (decoded as IUser))
                return
            }

            cb(err, decoded as IUser)
        })
    }

    /**
     * Returns revoked token store
     */
    get storage() {
        return this.revokedTokensStorage
    }

    /**
     * Extracts the key id from the JWT.
     * This is the id which maps to the private key returned from 
     * the authentication service. If the kid is undefined then a default private key
     * is used.
     * @param token JWT Token
     * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
     */
    private getKeyID(token: string): string | undefined {
        const payload = decode(token, { json: true })

        return payload && payload.kid
    }

    /**
     * Checks if a given machin id is revoked
     * @param machineID Id of the machine the token was generated for
     * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
     */
    private isRevoked(machineID: string) {
        return this.revokedTokensStorage.search(machineID)
    }
}