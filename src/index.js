import TorrentPlayer from "./scripts/torrent.js";
// import { TorrServer } from './scripts/torrServer.js';

// const server = new TorrServer()
// server.detectUrl().then(() => {
//     console.log(`Server found at ${server.url} [V: ${server.version}]`)
// })
const PROPERTY_PREFIX = "torrent:"

function playTorrentLocaly (torrent, fileIdx) {
    console.log(`Local player: (${torrent}, ${fileIdx})`)
    const player = new TorrentPlayer(torrent, fileIdx)
    player.streamTorrent()
}

class MyPlayer {
    constructor() {
        this.init = () => {
            //placeholder
        }
        this.ready = () => {
            //Player is ready
            TVXVideoPlugin.requestData("video:info", (data) => {
                const info = data?.video?.info
                //we first try to find torrent id (infoHash, magnet etc) and file id from the properties object, then from the url
                const torrent = TVXPropertyTools.getFullStr(info, PROPERTY_PREFIX+'id', null) || 
                                (new TVXUrlParams(window.location.href)).getFullStr('torrent', null) 

                const fileIdx = TVXPropertyTools.getNum(info, PROPERTY_PREFIX+'fileIdx', null) || 
                                (new TVXUrlParams(window.location.href)).getNum('fileIdx', 0)

                if (!torrent) {
                    TVXVideoPlugin.error('Error: No torrent id (infoHash, magnerURI or .torrent file) specified.')
                    return
                }

                const torrServerPreferable = TVXPropertyTools.getBool(info, PROPERTY_PREFIX+'server:precedence', false)
                const clientCompatible = TorrentPlayer.IS_CLIENT_COMPATIBLE()
                if (clientCompatible && !torrServerPreferable) {
                    playTorrentLocaly(torrent, fileIdx)
                    
                } else {
                   //playTorrentFromServer(torrent, fileIdx)
                   TVXVideoPlugin.error('Your system does not support WebTorrent. Will try to use TorrServer as fallback...')
                }
            })
            TVXVideoPlugin.startPlayback(); //This will call the play function and will start the update process
        }
        this.play = () => {
            document.getElementById("video")?.play() //It will try to play before the element is created. 
        }
        this.pause = () => {
            document.getElementById("video").pause()
        }
        this.stop = () => {
            document.getElementById("video").pause()
            TVXVideoPlugin.stopPlayback()
        }
        this.getDuration = () =>(document.getElementById("video").duration)
        this.getPosition = () =>(document.getElementById("video").currentTime)
        this.setPosition = (position) => {document.getElementById("video").currentTime = position}
        this.setMuted = () =>{document.getElementById("video").muted = true}
        this.isMuted = () => (document.getElementById("video").muted)
        this.getSpeed = () => (document.getElementById("video").playbackRate)
        this.setSpeed = (speed) => {document.getElementById("video").playbackRate = speed}
        this.getUpdateData = () => ({
                position: this.getPosition(),
                duration: this.getDuration(),
                speed: this.getSpeed()
            })
    }
}

TVXPluginTools.onReady(function() {
    TVXVideoPlugin.setupPlayer(new MyPlayer());
    TVXVideoPlugin.init();
});