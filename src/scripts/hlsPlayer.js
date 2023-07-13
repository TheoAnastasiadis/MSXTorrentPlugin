/**
 * @class Wrapper around hls.js functionality.
 */
export class HlsPlayer {
    /**
     * Initiates hls.js player.
     * @memberof HlsPlayer
     */
    constructor() {
        this.hls = new Hls()
        console.log(`HLS player initialized.`)
    }
    /**
     * Establishes connections, fetches the manifest file and renders the .m3u8 videos.
     *
     * @param {string} url The url of the video
     * @param {HTMLVideoElement} elem The player where the video will be rendered.
     * @memberof DashPlayer
     */
    play(url, elem) {
        hls.loadSource(url)
        hls.attachMedia(elem)
        console.log(`MPD file (${url}) playing on element (${elem.id})`)
    }
}
