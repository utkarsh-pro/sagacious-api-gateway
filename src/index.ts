import config from './config-management/gateway-config'
import cookieParser from 'cookie-parser'
import Gateway from './Gateway/Gateway'

const PORT = process.env.PORT || 5000
const gateway = new Gateway(config);

const app = gateway.init();

app.use(cookieParser())
gateway.setup()

export default gateway.listen(PORT, () => console.log("Server running on PORT", PORT))
