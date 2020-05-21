import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from '../fetch/fetch'

// ================================================================================================

/**
 * Interface for JWT Private key object
 */
export interface IJWTPublicKey {
    [kid: string]: string;
}

// ================================================================================================

let pubKey: IJWTPublicKey = {};

if (process.env.NODE_ENV === "production") {
    const URL = process.env.PUBLIC_KEY_ENDPOINT

    if (!URL) throw Error("No PUBLIC_KEY_ENDPOINT provided")

    // Get the public key from the auth service
    fetch.get(URL).then(res => pubKey = res.data)
} else {
    pubKey["0"] = readFileSync(join(__dirname, "keys", "development", "public.key"), 'utf-8')
}

export const publicKey = pubKey;