import { readFileSync } from 'fs';
import { join } from 'path';

const file = process.env.NODE_ENV !== "production" ? "development" : "production";

const pk = readFileSync(join(__dirname, "keys", file, "public.key"))

export const publicKey = pk