import { iteratee } from "lodash"

const TIMEOUT = 1000 //Connection timeout. Local ips will return very fast (if they exist).
const MAX_CONNECTIONS = 2 //Number of concurrent WebSocket requests over the local network - we shouldn't overburden the browser
const PORT = 8090 //See torrServer's documentation https://github.com/YouROK/TorrServer

async function checkIfTorrServer(ip) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT);
    const response = await fetch(`http://${ip}:${PORT}/echo`, {signal: controller.signal})
    clearTimeout(id)
    if (response) {
        const text = await response.text()
        if (text.match(/MatriX\.\d{2,3}/)) return { ip, version: text }
    }
    throw `No server at ip ${ip}`
}

function checkIfPortOpen(ip) {
    const socket = new WebSocket(`wss://${ip}:${PORT}/echo`)
    const state = socket.readyState
    try {
        socket.close()
    } finally {
        if (state == 3) return ip
        else throw `No port open at ${ip}`
    }
}

async function checkIp(ip) {
    checkIfPortOpen(ip)
    const server = await checkIfTorrServer(serverAddress)
    return server
}

//await Promise.any(throttledMap(ips, checkIp, MAX_CONNECTIONS))

function* throttledMap(itterable, mapper, concurrency, retryTimeout) {
    let ongoing = []

    async function returnPromise (value) {
        console.log(`Next in line is ${value}. Current connections are ${ongoing.length}`)
        if(ongoing.length < concurrency) {
            try {
                console.log(`Started on ${value}!`)
                ongoing.push('')
                const result = await mapper(value)
                return result
            } finally {
                console.log(`Finished with ${value}!`)
                ongoing.pop()
            }
        } else {
            console.log(`Could not start on ${value}, reattempting...`)
            return new Promise((resolve, reject) => {
                setTimeout(() => returnPromise(value), retryTimeout) //this should work
            })
        }
    }
    
    for (const value of itterable) {
        yield returnPromise(value)
    }
}

//Add mapping function to JavaScript generator object for convinience.
const Generator = Object.getPrototypeOf(function* () {})

Generator.prototype.map = function* (mapper, thisArg) {
  for (const val of this) {
    yield mapper.call(thisArg, val);
  }
};

//Generator functions of all possible private (local) ips of the LAN.
//According to https://www.ibm.com/docs/en/networkmanager/4.2.0?topic=translation-private-address-ranges
//address ranges used by private networks are:

// Class A: 10.0.0.0 to 10.255.255.255
// Class B: 172.16.0.0 to 172.31.255.255
// Class C: 192.168.0.0 to 192.168.255.255 <-- Assuming the client uses a small house network (and not a large shared one)
function* ipsGenerator() {
    for (let sub1 = 1; sub1 <= 1; sub1++){
        for (let sub2 = 0; sub2 <= 12; sub2++){
            yield [192,168,sub1,sub2].join('.')
        }
    }
}

let connections = []

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
        const ips = Array.from(ipsGenerator()) //all possible local ips (see above)
        try {
            const server = await Promise.any(throttledMap(ips, checkIp, MAX_CONNECTIONS, TIMEOUT))
            this.url = server.ip
            this.version = server.version
        } catch(e) {
            console.log(e)
        }
        cb(this)
    }

}

export {TorrServer}