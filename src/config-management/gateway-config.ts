/**
 * The configuration is loaded based on the environment
 * @author Utkarsh Srivastava <utkarsh@sagacious.dev>
 */

// To read the config file
import { readFileSync } from 'fs'
import { join } from 'path'
import { IGatewayConfig } from './gateway-interface'

const file = process.env.NODE_ENV === "production" ? "config.production.json" : "config.development.json";

// ================================== CONFIGURATION =======================================

// Read the file
const gatewayConfig: IGatewayConfig = JSON.parse(readFileSync(join(__dirname, "config", file), { encoding: "UTF-8" }))

export default gatewayConfig