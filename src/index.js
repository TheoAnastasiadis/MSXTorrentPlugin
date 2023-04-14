import { TorrentPlayer as LocalPlayer } from "./scripts/torrent.js"
import { TorrServer as RemotePlayer } from "./scripts/torrServer.js"
import { optionsPanel, updateInput } from "./scripts/optionsPanel.js"

const PROPERTY_PREFIX = "torrent:"

const error = (message, cb) => {
    TVXVideoPlugin.error(message)
    cb && cb()
}

const success = (message, cb) => {
    TVXVideoPlugin.success(message)
    cb && cb()
}

const warning = (message, cb) => {
    TVXVideoPlugin.warn(message)
    cb && cb()
}

class Player {
    constructor() {
        this.videoElement = document.getElementById("video")
        ;(this.torrServerLocation = null),
            (this.serverLocationInput = ""),
            (this.torrentId = null),
            (this.fileIdx = 0),
            (this.player = null),
            (this.init = () => {
                //placeholder
            })
        this.playLocaly = () => {
            this.player = new LocalPlayer(this.torrentId, this.fileIdx)
            this.player.streamTorrent(this.videoElement)
        }
        this.playRemotely = async () => {
            console.log("Setting remote player")

            this.player = new RemotePlayer(
                this.serverLocation == "auto" ? null : this.serverLocation
            )

            if (this.serverLocation == "auto") {
                warning(
                    "No server ip was supplied, the system will attempt to locate one automatically."
                )
                TVXVideoPlugin.startLoading()
            }

            try {
                await this.player.init()
                success(
                    `TorrServer ${
                        this.serverLocation == "auto" ? "found" : "available"
                    } at ${this.player.url}`
                )
                this.player.streamTorrent(
                    this.torrentId,
                    this.fileIdx,
                    this.videoElement
                )
            } catch (e) {
                //display the appropriate message
                error(
                    this.serverLocation == "auto"
                        ? "No server was found in this network"
                        : "No server was found at the specified IP",
                    () => {
                        console.error(e)
                    }
                )
            }
        }
        this.ready = () => {
            //Player is ready
            TVXVideoPlugin.requestData("video:info", (data) => {
                const info = data?.video?.info
                //Content information
                this.torrentId =
                    TVXPropertyTools.getFullStr(
                        info,
                        PROPERTY_PREFIX + "id",
                        null
                    ) ||
                    new TVXUrlParams(window.location.href).getFullStr(
                        "torrent",
                        null
                    )

                this.fileIdx =
                    TVXPropertyTools.getNum(
                        info,
                        PROPERTY_PREFIX + "fileIdx",
                        null
                    ) ||
                    new TVXUrlParams(window.location.href).getNum("fileIdx", 0)

                if (!this.torrentId) {
                    error(
                        "Error: No torrent id (infoHash, magnerURI or .torrent file) specified.",
                        () => {
                            throw "No torrent id"
                        }
                    )
                }

                //Local webtorrent setup
                const torrServerPreferable = TVXPropertyTools.getBool(
                    info,
                    PROPERTY_PREFIX + "server:precedence",
                    false
                )
                const clientCompatible = LocalPlayer.IS_CLIENT_COMPATIBLE()

                //Remote TorrServer setup
                const serverLocation = TVXPropertyTools.getFullStr(
                    info,
                    PROPERTY_PREFIX + "server:location",
                    "auto"
                )
                this.serverLocation = serverLocation
                this.serverLocationInput = serverLocation

                //Play torrent
                if (torrServerPreferable) this.playRemotely()
                else if (clientCompatible) this.playLocaly()
                else
                    error(
                        "Your system does not support WebTorrent. Will try to connect to a TorrServer as fallback.",
                        this.playRemotely
                    )
            })
            TVXVideoPlugin.startPlayback()
        }
        this.play = () => this.videoElement.play()
        this.pause = () => this.videoElement.pause()
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
        this.handleEvent = function (data) {
            //placeholder
        }
        this.handleData = (data) => {
            if (data?.message.indexOf("input:") == 0) {
                this.serverLocationInput = updateInput(
                    //update state
                    this.serverLocationInput,
                    data.message.substring(6)
                )
                TVXVideoPlugin.executeAction(
                    //update view
                    "update:panel:torrserverlocation",
                    { label: this.serverLocationInput }
                )
            } else if (data?.message == "serverLocationChange") {
                this.serverLocation = this.serverLocationInput
                this.playRemotely()
            }
        }
        this.handleRequest = (dataId, data, callback) => {
            if (dataId == "options")
                callback(optionsPanel(this.serverLocationInput))
            //TODO: subtitles
        }
    }
}

TVXPluginTools.onReady(function () {
    TVXVideoPlugin.setupPlayer(new Player())
    TVXVideoPlugin.init()
})
