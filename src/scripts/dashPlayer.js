/**
 * @class Wrapper around dash.js functionality.
 */
export class DashPlayer {
    /**
     * Initiates dahs.js MediaPlayer.
     * @memberof DashPlayer
     */
    constructor() {
        this.player = dashjs.MediaPlayer().create()
        console.log(`Dash player initialized.`)
    }
    /**
     * Establishes connections, fetches the manifest file and renders the .mpd videos.
     *
     * @param {string} url The url of the video
     * @param {HTMLVideoElement} elem The player where the video will be rendered.
     * @memberof DashPlayer
     */
    play(url, elem) {
        this.player.initialize(elem, url, true)
        console.log(`MPD file (${url}) playing on element (${elem.id})`)
    }
    /**
     * Skips to specified frame position. Usefull since `video.position = value` does not play well with dash streams.
     *
     * @param {number} position
     * @memberof DashPlayer
     */
    seekTo(position) {
        this.player.seek(position)
    }
}
