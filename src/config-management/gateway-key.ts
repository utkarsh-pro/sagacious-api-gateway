import { readFileSync } from 'fs';
import { join } from 'path';

const file = process.env.NODE_ENV !== "production" ? "development" : "production";

const pk = readFileSync(join(__dirname, "keys", file, "public.key"), 'utf-8')
const prk = readFileSync(join(__dirname, "keys", file, "private.key"), 'utf-8')

export const publicKey = pk;
export const privateKey = prk;