import http from 'http'
import https from 'https'

export default {
    get: (url: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            const port = url.startsWith("https://") ? 443 : 80;
            const type = port === 443 ? https : http;
            const link = url.startsWith("http") ? url.split("://")[1] : url;
            const host = link.substring(0, link.indexOf("/"))
            const path = link.substring(link.indexOf("/"))

            const options: http.RequestOptions = {
                host,
                port,
                path,
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            let output = "";

            const req = type.request(options, res => {
                if (res.statusCode !== 200) resolve({ data: null, status: res.statusCode, headers: res.headers })
                res.setEncoding('utf8');

                res.on("data", chunk => {
                    output += chunk;
                })

                res.on("end", () => {
                    try {
                        const data = JSON.parse(output)
                        const status = res.statusCode
                        const headers = res.headers
                        resolve({
                            data,
                            status,
                            headers
                        })
                    } catch (error) {
                        reject(error)
                    }
                })

                res.on("error", err => {
                    reject(err)
                })
            })

            req.on("error", (err) => {
                reject(err)
            })

            req.end()
        })
    }
}