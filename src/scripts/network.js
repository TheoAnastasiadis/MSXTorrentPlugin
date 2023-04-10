import throttledMap from "./throttledMap.js"

export class Network {

    responseTimeout = 6000 //Maximum time to wait before deciding an endpoint doesn't exists
    retryTimeout = 2000 //How often to check if endpoints are pending
    concurrency = 8 //Number of parallel tries
    MOST_POPULAR_GETAWAYS =  ["192.168.1.1",
                                "192.168.0.1",
                                "192.168.2.1",
                                "192.168.1.254",
                                "192.168.10.1",
                                "192.168.100.1",
                                "192.168.0.50",
                                "192.168.0.254",
                                "192.168.88.1",
                                "192.168.123.254",
                                "192.168.8.1",
                                "10.0.0.1",
                                "192.168.1.2",
                                "192.168.11.1",
                                "10.0.0.2",
                                "192.168.1.240",
                                "192.168.1.250",
                                "192.168.3.1",
                                "192.168.20.1",
                                "10.0.0.138",
                                "192.168.254.254",
                                "192.168.15.1",
                                "172.19.3.1",
                                "192.168.1.245",
                                "10.1.1.1",
                                "192.168.10.100",
                                "192.168.16.1",
                                "10.10.10.254",
                                "192.168.0.20",
                                "192.168.0.100",
                                "192.168.178.1",
                                "192.168.0.30",
                                "192.168.1.20",
                                "192.168.2.2",
                                "192.168.1.253",
                                "192.168.0.10",
                                "192.168.2.254",
                                "10.10.10.1",
                                "192.168.0.99",
                                "192.168.1.100",
                                "192.168.31.1",
                                "192.168.168.168",
                                "192.168.100.252",
                                "192.168.62.1",
                                "192.168.50.1",
                                "192.168.111.1",
                                "192.168.1.252",
                                "192.168.1.230",
                                "192.168.30.1",
                                "192.168.10.30",
                                "192.168.8.254",
                                "192.168.0.228",
                                "10.0.10.254",
                                "192.168.0.101",
                                "172.16.0.1",
                                "192.168.200.1",
                                "192.168.0.32",
                                "192.168.1.226",
                                "10.0.1.1",
                                "10.90.90.91",
                                "169.254.128.132",
                                "192.168.0.227",
                                "192.168.169.1",
                                "192.168.6.1",
                                "192.168.168.1",
                                "192.168.1.200",
                                "192.168.1.10",
                                "192.168.1.99",
                                "192.168.1.241",
                                "192.168.7.2",
                                "192.168.61.1",
                                "192.168.80.240",
                                "222.222.222.1",
                                "10.90.90.90",
                                "192.168.9.2",
                                "10.1.0.99",
                                "172.23.56.254",
                                "192.168.0.2",
                                "192.168.18.1",
                                "192.168.10.110",
                                "10.10.1.1",
                                "192.168.16.254",
                                "10.1.10.1",
                                "192.0.2.1",
                                "192.168.5.1",
                                "192.168.1.251",
                                "192.168.16.168",
                                "192.168.190.1",
                                "192.168.22.1",
                                "192.168.1.225",
                                "192.168.123.1",
                                "192.168.42.1",
                                "192.168.0.40",
                                "192.168.40.1",
                                "192.168.0.35",
                                "192.168.32.1",
                                "192.168.0.4",
                                "10.8.0.99",
                                "192.168.0.3"] //100 most popular login pages (source: https://www.192-168-1-1-ip.co/default-router-login-ips/)
    
    constructor (responseTimeout, retryTimeout, concurrency) {
        this.responseTimeout = responseTimeout || this.responseTimeout
        this.retryTimeout = retryTimeout || this.retryTimeout
        this.concurrency = concurrency || this.concurrency
        this.getaway = null
        this.privateIps = []
        this.possibleLocalIps = []
        //this.MOST_POPULAR_GETAWAYS should not be modified
    }

    updatePossibleIps = () => {
        this.possibleLocalIps = []
        if (!this.getaway) throw 'No getaway detected. Impossible to parse local ips.'
        const prefix = this.getaway.split('.').splice(0,3).join('.') //192.168.1.0 -> 192.168.1
        for(let suffix = 0; suffix <= 255; suffix++) {
            this.possibleLocalIps.push(prefix + '.' + suffix)
        }
    }

    /**
     *Queries and endpoint with given IP using WebSocket request - this is A LOT faster when you need to query large number of endpoints (ex. 255). This works on all contexts
    *
    * @param {String} ip The local ip to be tried.
    * @memberof Network
    * @returns {Promise} Promise that resolves if endpoint exists, rejects otherwise.
    */
    checkAddress = (ip) => {
        const timeout = this.responseTimeout
        return new Promise((resolve, reject) => {
            const socket = new WebSocket(`wss://${ip}/`) //secure context wark on insecure one as well
            const start = Date.now()
            setTimeout(() => socket.close(), timeout) //The WebSocket will either close because of error or because of timeout
            socket.onclose = (event) => {
                const end = Date.now()
                if (end - start < timeout) { //If it closes before timeout, it means the server responded with an error => server exists
                    console.log(`Possible local ip: ${ip}`)
                    resolve(ip)
                } else {//If it closes after timeout, it means it kept trying to connect => no server exists
                    reject(ip)
                }
            }
        })
    }

    /**
     *Queries and endpoint with given IP using http request. This will not work on browsers if the content has been loaded over https. 
    *
    * @param {String} ip The local ip to be tried.
    * @memberof Network
    * @returns {Promise} Promise that resolves in an object with 'ip' and text 'response' values if the endpoint exists. It rejects otherwise.
    */
    checkServer = async (ip) => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), this.responseTimeout)
        const response = await fetch(`http://${ip}`, {signal: controller.signal})
        if (!controller.signal.aborted) {
            const text = (await response.text()) + ''
            return { ip, text }
        }
    }

    /**
     *Detects the default getaway (aka login ip) of the user's WLAN. It does this by querying the 100 most popular login IPs for responses. It only tryies until it recieves the first reponse, regardless if it's actually from the router or some other device.
    *
    * @memberof Network
    */
    detectGetaway = async () => {
        this.getaway = await Promise.any(throttledMap(this.MOST_POPULAR_GETAWAYS, this.checkAddress, this.concurrency, this.retryTimeout, true))
        this.updatePossibleIps()
    }
}