import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Interface for JWT Private key object
 */
export interface IJWTPublicKey {
    [kid: string]: string;
}

let pubKey: IJWTPublicKey = {};

if (process.env.NODE_ENV === "production") {
    // Get the public key from the auth service
    pubKey["0"] = "";
} else {
    pubKey["0"] = readFileSync(join(__dirname, "keys", "development", "public.key"), 'utf-8')
}

export const publicKey = pubKey;