import vtt from "vtt-live-edit"
import { TorrentPlayer as LocalPlayer } from "./scripts/torrent.js"
import { TorrServer as RemotePlayer } from "./scripts/torrServer.js"
import { DashPlayer } from "./scripts/dashPlayer.js"
import {
    optionsPanel,
    torrentPanel,
    updateInput,
} from "./scripts/optionsPanel.js"
import { Subtitle, subTitlePanel } from "./scripts/subtitles.js"
import { HlsPlayer } from "./scripts/hlsPlayer.js"

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

const logsDiv = document.getElementById("logsDiv")
const debugLog = (text) => {
    const child = document.createElement("p")
    child.innerText = text
    logsDiv.appendChild(child)
}

class Player {
    constructor() {
        this.videoElement = document.getElementById("video")
        ;(this.torrServerLocation = null),
            (this.serverLocationInput = ""),
            (this.torrentId = null),
            (this.fileIdx = 0),
            (this.fallbackUrl = null),
            (this.subTracks = []),
            (this.player = null),
            (this.init = () => {
                this.videoElement.onerror = function (e) {
                    error(JSON.stringify(e))
                }
            })
        this.playLocaly = async () => {
            this.player = new LocalPlayer(this.torrentId, this.fileIdx)
            this.videoElement.src = "" //
            await this.player.streamTorrent(this.videoElement)
        }
        this.playRemotely = async () => {
            debugLog(`TorrServer provided location: ${this.serverLocation}`)
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
                    } at ${this.player.url}`,
                    () => TVXVideoPlugin.executeAction("player:show")
                )
                this.videoElement.src = ""
                await this.player.streamTorrent(
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
        /**
         * Stream a regular .mp4, .mpd or .m3u8 file
         *
         * @param {string} url
         */
        this.playFallback = (url) => {
            debugLog(`Playing fallback url ${url}`)
            if (this.rdPingUrl)
                setInterval(
                    () =>
                        fetch(this.rdPingUrl + Math.floor(this.getPosition()), {
                            mode: "no-cors",
                        }),
                    10000
                ) //ping rd every 10s
            if (url.endsWith(".mpd")) {
                this.player = new DashPlayer()
                this.player.play(url, this.videoElement)
            } else if (url.endsWith(".m3u8")) {
                this.player = new HlsPlayer()
                this.player.play(url, this.videoElement)
            } else {
                this.videoElement.src = url
            }
        }
        this.addSubTrack = (subtitle) => {
            this.subTracks.push(subtitle)
            this.videoElement.appendChild(subtitle.trackHTML())
        }
        this.ready = () => {
            //Player is ready
            TVXVideoPlugin.requestData("video:info", (data) => {
                const info = data?.video?.info
                //Content information
                //torrent id
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
                if (this.torrentId?.startsWith("{")) this.torrentId = null // prevents torrent id from being assigne {context: torrentId}
                debugLog(`Torrent id: ${this.torrentId}`)
                //file id
                this.fileIdx =
                    TVXPropertyTools.getNum(
                        info,
                        PROPERTY_PREFIX + "fileIdx",
                        null
                    ) ||
                    new TVXUrlParams(window.location.href).getNum("fileIdx", 0)
                debugLog(`File id: ${this.fileIdx}`)

                //fallback setting
                this.fallbackUrl =
                    TVXPropertyTools.getFullStr(
                        info,
                        PROPERTY_PREFIX + "fallbackUrl",
                        null
                    ) ||
                    new TVXUrlParams(window.location.href).getFullStr(
                        "fallbackUrl",
                        null
                    )
                debugLog(`Fallback URL: ${this.fallbackUrl}`)

                this.rdPingUrl =
                    TVXPropertyTools.getFullStr(
                        info,
                        PROPERTY_PREFIX + "rdPingUrl",
                        null
                    ) ||
                    new TVXUrlParams(window.location.href).getFullStr(
                        "rdPingUrl",
                        null
                    )

                if (!this.torrentId && !this.fallbackUrl) {
                    error(
                        "Error: No torrent id (infoHash, magnerURI or .torrent file) specified.",
                        () => {
                            throw "No torrent id"
                        }
                    )
                }
                const skipToFallback = !this.torrentId && !!this.fallbackUrl
                debugLog(`Skip to fallback ${skipToFallback}`)
                if (skipToFallback)
                    console.warn(
                        `No torrent id set; will skip to fallback ${this.fallbackUrl}`
                    )

                //External subtitles
                for (const track of Object.keys(info.properties).filter(
                    (s) => s.indexOf("torrent:subtitle:") == 0
                )) {
                    const subtitle = new Subtitle(
                        info.properties[track],
                        track.split(":")[2],
                        false
                    )
                    this.addSubTrack(subtitle)
                }
                debugLog(
                    `Player provided with ${this.subTracks.length} subtracks`
                )

                //Local webtorrent setup
                const torrServerPreferable = TVXPropertyTools.getBool(
                    info,
                    PROPERTY_PREFIX + "server:precedence",
                    false
                )
                debugLog(`TorrServer preferable: ${torrServerPreferable}`)
                const clientCompatible = LocalPlayer.IS_CLIENT_COMPATIBLE()
                debugLog(
                    `Client compatible with WebTorrent: ${clientCompatible}`
                )
                //Remote TorrServer setup
                const serverLocation = TVXPropertyTools.getFullStr(
                    info,
                    PROPERTY_PREFIX + "server:location",
                    "auto"
                )
                this.serverLocation = serverLocation
                this.serverLocationInput = serverLocation

                //Play torrent
                if (torrServerPreferable && !skipToFallback) {
                    debugLog(`Playing from TorrServer.`)
                    this.playRemotely().then(TVXVideoPlugin.startPlayback)
                }
                //staring the playback will result in intercepting the .play() promise with a load event
                else if (clientCompatible && !skipToFallback) {
                    debugLog(`Playing from WebTorrent`)
                    this.playLocaly().then(TVXVideoPlugin.startPlayback)
                } else if (!!this.fallbackUrl) {
                    debugLog(`Playing fallback`)
                    this.playFallback(this.fallbackUrl) //this is sync
                    TVXVideoPlugin.startPlayback()
                } else
                    error(
                        "Your system does not support WebTorrent. Will try to connect to a TorrServer as fallback.",
                        () => {
                            this.playRemotely().then(
                                TVXVideoPlugin.startPlayback
                            )
                        }
                    )
            })
        }
        this.play = () => {
            this.videoElement.play()
            if (this.rdPingUrl)
                fetch(this.rdPingUrl + "play", { mode: "no-cors" }) //rd specific functionality
        }
        this.pause = () => {
            this.videoElement.pause()
            if (this.rdPingUrl)
                fetch(this.rdPingUrl + "pause", { mode: "no-cors" }) //rd specific functionality
        }
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
            if (this.player instanceof DashPlayer) this.player.seekTo(position)
            else this.videoElement.currentTime = position
            if (this.rdPingUrl)
                fetch(
                    this.fallbackUrl + "?t=" + Math.floor(this.getPosition()),
                    { mode: "no-cors" }
                ) //rd specific functionality
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
            if (data.event == "custom:toggle_debug")
                logsDiv.style.opacity == 0
                    ? (logsDiv.style.opacity = 1)
                    : (logsDiv.style.opacity = 0)
        }
        this.handleData = async (data) => {
            if (data?.message.indexOf("input:") == 0) {
                //TorrServer location input change
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
                //TorrServer location input submit
                this.serverLocation = this.serverLocationInput
                this.playRemotely()
            } else if (data?.message.indexOf("addTrack:") == 0) {
                //Embeded tracks found
                const url = data.message.split(":")[1]
                const language = data.message.split(":")[2]
                const subtitle = new Subtitle(
                    decodeURIComponent(url),
                    language,
                    true
                ) //all subtites added after initialization are embeded
                this.addSubTrack(subtitle)
            } else if (data?.message.indexOf("setTrack:") == 0) {
                //Track chanegd
                const selectedTrack = this.subTracks.find(
                    (s) =>
                        s.url == decodeURIComponent(data.message.split(":")[1])
                )
                await selectedTrack.setActive()
            } else if (data?.message.indexOf("timing:") == 0) {
                if (data.message.split(":")[1] == "plus") {
                    vtt.addOffset("video", 0.1)
                    success("Subtitles delayed by 100ms")
                } else {
                    vtt.removeOffset("video", 0.1)
                    success("Subtitles hasten by 100ms")
                }
            } else error(`Unkown message ${data?.message}`)
        }
        this.handleRequest = (dataId, data, callback) => {
            if (dataId == "options") callback(optionsPanel(!!this.fallbackUrl))
            else if (dataId == "torrent")
                callback(torrentPanel(this.serverLocationInput))
            else if (dataId == "subtitles")
                callback(subTitlePanel(this.subTracks)) //TODO: subtitles
            else error(`Unkown request "${dataId}"`, callback)
        }
    }
}

TVXPluginTools.onReady(function () {
    debugLog(`Init fired`)
    TVXVideoPlugin.setupPlayer(new Player())
    TVXVideoPlugin.init()
})
