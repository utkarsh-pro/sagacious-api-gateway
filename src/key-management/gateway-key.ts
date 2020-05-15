import { readFileSync } from 'fs';
import { join } from 'path';

let pubKey: string;

if (process.env.NODE_ENV === "production") {
    // Get the public key from the auth service
    pubKey = "";
} else {
    pubKey = readFileSync(join(__dirname, "keys", "development", "public.key"), 'utf-8')
}

export const publicKey = pubKey;