import WebVTTConverter from "srt-webvtt"

const convertToVtt = async (url) => {
    const response = await fetch(url)
    const srt = await response.blob()
    const vtt = await WebVTTConverter.default(srt)
    return vtt
}

const makeVisible = (trackElement) => (trackElement.track.mode = "showing")
const makeInvisible = (trackElement) => (trackElement.track.mode = "disabled")

class Subtitle {
    constructor(url, language, embeded) {
        this.url = url
        this.language = language
        this.embeded = embeded
    }
    trackHTML = () => {
        const track = document.createElement("track")
        track.dataset.originalurl = this.url
        track.srclang = this.language
        track.kind = "subtitles"
        return track
    }
    setActive = async () => {
        const track = document.querySelectorAll(
            `[data-originalurl="${this.url}"`
        )[0]
        console.assert(track)
        track.src =
            this.url.indexOf(".vtt") != -1
                ? this.url
                : await convertToVtt(this.url)
        Array.from(document.getElementsByTagName("track")).forEach(
            (element) => {
                makeInvisible(element) //hide all ohter tracks
            }
        )
        makeVisible(track)
        TVXVideoPlugin.setupExtensionLabel(`${this.language} {ico:subtitles}`) // Display the selected subtitle language
    }
    isActive = () =>
        document.querySelectorAll(`[data-originalurl="${this.url}"`)[0].track
            .mode == "showing"
}

const subTitlePanel = (subtitles) => {
    return {
        cache: false,
        reuse: false,
        headline: "Available subtitle tracks",
        template: {
            enumerate: false,
            type: "control",
            layout: "0,0,2,1",
        },
        items: [
            ...subtitles.map((s) => ({
                title: s.language,
                titleFooter: s.embeded
                    ? "{txt:msx-green:Embeded}"
                    : "{txt:msx-yellow:External}",
                extensionIcon: s.isActive() ? "check" : "blank",
                action: `[player:commit:message:setTrack:${encodeURIComponent(
                    s.url
                )}|player:show]`,
            })),
        ],
    }
}

export { subTitlePanel, Subtitle }
