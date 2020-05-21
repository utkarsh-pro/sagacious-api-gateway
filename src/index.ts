import config from './config-management/gateway-config'
import cookieParser from 'cookie-parser'
import Gateway from './Gateway/Gateway'

// ==============================================================================================

export const gateway = new Gateway(config);
const PORT = process.env.PORT || 5000

// ======================================= GATEWAY SETUP ========================================

const app = gateway.init();
app.use(cookieParser())
gateway.setup() // Order is important!

// ==============================================================================================

export default gateway.listen(PORT, () => console.log("Server running on PORT", PORT))
