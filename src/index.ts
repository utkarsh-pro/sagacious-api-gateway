import config from './config-management/gateway-config'
import cookieParser from 'cookie-parser'
import Gateway from './Gateway/Gateway'

const gateway = new Gateway(config);

const app = gateway.init();

app.use(cookieParser())
gateway.setup()

const server = gateway.listen(5000, () => console.log("ff"))