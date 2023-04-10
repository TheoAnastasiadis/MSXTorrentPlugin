import { Network } from "./network.js"
import throttledMap from "./throttledMap.js"

/**
 *Wrapper class for the TorrServer API
 *See more: https://github.com/YouROK/TorrServer
 *
 * @class TorrServer
 */
export class TorrServer {

    TIMEOUT = 6000 //Connection timeout. Local ips will return very fast (if they exist).
    MAX_CONNECTIONS = 3 //Number of concurrent WebSocket requests over the local network - we shouldn't overburden the browser
    PORT = 8090 //See torrServer's documentation https://github.com/YouROK/TorrServer
    url = null
    version = null

    /**
    *"Automatically" detects the location (ie. IP) of the torrServer within the network.
    *
    * @memberof TorrServer
    */
    detectUrl = async () => {
        const network = new Network(this.TIMEOUT, this.TIMEOUT/4)
        await network.detectGetaway()

        //This will only reutrn if server exists at IP, and its /echo encpoint responds with TorrServer version
        const checkIfTorrServer = async (ip) => {
            await network.checkAddress(ip) //this will throw if endpoint doesn't exist
            const server =  await network.checkServer(`${ip}:8090/echo`)
            if (server?.text.match(/MatriX\.\d{1,3}/)) { //ex. MatriX.121
                return {ip, version: server.text}
            }
            throw `No TorrServer here (${ip})`
        }

        const server = await Promise.any(throttledMap(network.possibleLocalIps, checkIfTorrServer, this.MAX_CONNECTIONS, this.TIMEOUT, true))
        this.url = server.ip
        this.version = server.version
    }
}