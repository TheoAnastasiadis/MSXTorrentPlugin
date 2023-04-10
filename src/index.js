import { TorrentPlayer as LocalPlayer } from "./scripts/torrent.js"
import { TorrServer as RemotePlayer } from "./scripts/torrServer.js"

// const server = new TorrServer()
// server.detectUrl().then(() => {
//     console.log(`Server found at ${server.url} [V: ${server.version}]`)
// })
const PROPERTY_PREFIX = "torrent:"

const error = (message, cb) => {
    console.log(message)
    TVXVideoPlugin.error(message)
    cb()
}

const parseInfo = (info) => {
    //we first try to find torrent id (infoHash, magnet etc) and file id from the properties object, then from the url
    const torrent =
        TVXPropertyTools.getFullStr(info, PROPERTY_PREFIX + "id", null) ||
        new TVXUrlParams(window.location.href).getFullStr("torrent", null)
    console.log("torrent", torrent)
    const fileIdx =
        TVXPropertyTools.getNum(info, PROPERTY_PREFIX + "fileIdx", null) ||
        new TVXUrlParams(window.location.href).getNum("fileIdx", 0)
    console.log("file", fileIdx)
    if (!torrent) {
        error(
            "Error: No torrent id (infoHash, magnerURI or .torrent file) specified.",
            () => {
                throw "No torrent id"
            }
        )
    }

    return [torrent, fileIdx]
}

class Player {
    constructor() {
        this.videoElement = document.getElementById("video")
        this.player = null
        this.init = () => {
            //placeholder
        }
        this.ready = () => {
            //Player is ready
            console.log("init()")
            TVXVideoPlugin.requestData("video:info", (data) => {
                console.log("TVX.requestData()")
                const info = data?.video?.info
                console.dir(info)
                const [torrent, fileIdx] = parseInfo(info)
                console.log(torrent, fileIdx)
                const torrServerPreferable = TVXPropertyTools.getBool(
                    info,
                    PROPERTY_PREFIX + "server:precedence",
                    false
                )
                console.log(1)
                const clientCompatible = LocalPlayer.IS_CLIENT_COMPATIBLE()
                console.log(2)

                console.log("parsed info")
                const playLocaly = () => {
                    console.log("Setting local player")
                    this.player = new LocalPlayer(torrent, fileIdx)
                    this.player.streamTorrent(this.videoElement)
                }

                const playRemotely = async () => {
                    console.log("Setting remote player")
                    const serverLocation = TVXPropertyTools.getFullStr(
                        info,
                        PROPERTY_PREFIX + "server:location",
                        "auto"
                    )
                    if (serverLocation != "auto") {
                        this.player = new RemotePlayer(serverLocation)
                    } else {
                        this.player = new RemotePlayer()
                        this.player.detectUrl() //If no ip address is provided by the user
                    }
                    try {
                        await this.player.init()
                        this.player.streamTorrent(
                            torrent,
                            fileIdx,
                            this.videoElement
                        )
                    } catch (e) {
                        //display the appropriate message
                        error(
                            serverLocation == "auto"
                                ? "No server was found in this network"
                                : "No server was found at the specified IP",
                            () => {
                                console.error(e)
                            }
                        )
                    }
                }

                if (torrServerPreferable) playRemotely()
                else if (clientCompatible) playLocaly()
                else
                    error(
                        "Your system does not support WebTorrent. Will try to find a  TorrServer as fallback...",
                        playRemotely
                    )
            })
            TVXVideoPlugin.startPlayback()
        }
        this.play = this.videoElement.play
        this.pause = this.videoElement.pause
        this.stop = () => {
            this.videoElement.pause()
            TVXVideoPlugin.stopPlayback()
            //this.player.destroy()
        }
        this.getDuration = () => this.videoElement.duration
        this.getPosition = () => this.videoElement.currentTime
        this.getSpeed = () => this.videoElement.playbackRate
        this.setSpeed = (speed) => {
            this.videoElement.playbackRate = speed
        }
        this.setPosition = (position) => {
            this.videoElement.currentTime = position
        }
        this.isMuted = () => this.videoElement.muted
        this.setMuted = () => {
            this.videoElement.muted = true
        }
        this.getUpdateData = () => ({
            position: this.getPosition(),
            duration: this.getDuration(),
            speed: this.getSpeed(),
        })
    }
}

TVXPluginTools.onReady(function () {
    TVXVideoPlugin.setupPlayer(new Player())
    TVXVideoPlugin.init()
})
