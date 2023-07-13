class TorrentPlayer {
    constructor(torrentId, fileIdx) {
        this.torrentId = torrentId
        this.fileIdx = fileIdx
        this.client = new window.WebTorrent()
    }

    streamTorrent = async (element) => {
        const scope = "./"

        let controller = await navigator.serviceWorker.register(`sw.js`, {
            scope,
        })
        while (!controller.active) {
            //do nothing
        }
        await this.client.loadWorker(controller.active)
        console.log("Service Worker ready")

        this.client.on("error", function (err) {
            console.error("ERROR: " + err.message)
        })

        const onTorrent = async (torrent) => {
            torrent.on("warning", (err) => {
                console.warn(err)
            })
            torrent.on("error", (err) => {
                console.error(err)
            })
            torrent.files[this.fileIdx].streamTo(element)
        }

        this.client.add(this.torrentId, onTorrent)
    }

    static IS_CLIENT_COMPATIBLE = () => {
        return window?.WebTorrent?.WEBRTC_SUPPORT && !!navigator.serviceWorker
    }
}

export { TorrentPlayer }
