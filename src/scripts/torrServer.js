//Add mapping function to JavaScript generator object for convinience.
const Generator = Object.getPrototypeOf(function* () {})

Generator.prototype.map = function* (mapper, thisArg) {
  for (const val of this) {
    yield mapper.call(thisArg, val);
  }
};

//Generator functions of all possible private (local) ips of the LAN.
//According to https://www.ibm.com/docs/en/networkmanager/4.2.0?topic=translation-private-address-ranges
// Address ranges to be use by private networks are:

// Class A: 10.0.0.0 to 10.255.255.255
// Class B: 172.16.0.0 to 172.31.255.255
// Class C: 192.168.0.0 to 192.168.255.255 <-- Assuming the client uses a small house network (and not a large shared one)
function* ipsGenerator() {
    for (let sub1 = 1; sub1 <= 1; sub1++){
        for (let sub2 = 0; sub2 <= 255; sub2++){
            yield [192,168,sub1,sub2].join('.')
        }
    }
}

const TIMEOUT = 200 //Connection timeout. Local ips will return very fast (if they exist).
const MAX_CONNECTIONS = 2//Number of concurrent fetches over the local network - shouldn't overburden the browser
const PORT = 8090 //See torrServer's documentation https://github.com/YouROK/TorrServer

let connections = []
async function pingIp(ip) {

    const controller = new AbortController()
    const options = {signal: controller.signal}

    const response = new Promise((resolve, reject) => {

        function timeoutHandler () {
            controller.abort()
            connections.splice(connections.indexOf(ip),1) //remove the ip from the array because it timed out
            reject()
        }

        function responseHandler (value, cb, timeOut) {
            clearTimeout(timeOut)
            connections.splice(connections.indexOf(ip),1) //remove the ip from the array because it responded
            cb(value)
        }

        (function initiate () {
            if (connections.length > MAX_CONNECTIONS){
                setTimeout(initiate, TIMEOUT) //If the array is full we will retry in a while...
            } else {
                console.log(`Current IPs are ${connections}`)
                const timeOut = setTimeout(timeoutHandler, TIMEOUT)
                connections.push(ip)
                fetch(`http://${ip}:${PORT}/echo`, options)
                    .then(value => responseHandler(value, resolve, timeOut))
                    .catch(error => responseHandler(error, reject, timeOut))
            }
        })()
    })

    return await response //return the promise to be passed at the Prmise.any array
}
/**
 *Wrapper class for the TorrServer API
 *See more: https://github.com/YouROK/TorrServer
 *
 * @class TorrServer
 */
class TorrServer {

    constructor() {
        this.url = null
        this.version = null
    }
/**
 *Async method to automatically detect the location of the server within the network. It is not very efficient at the moment and may need a lot of time to find the ip but will become a lot faster with WebSocket preprocessing (#TODO).
 *
 * @param {Function = } [cb = console.log] The callback to be executed when (and if) the location of the server is found
 * @memberof TorrServer
 */
async detectUrl (cb = console.log) {
        const ips = ipsGenerator() //all possible local ips (see above)
        //#TODO: Check the network with WS to find the IPs most likelly to exist.
        const server = await Promise.any(ips.map(pingIp))
        this.url = server.url
        this.version = server.body
        cb(this)
    }

}

export {TorrServer}