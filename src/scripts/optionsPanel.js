import { TorrentPlayer } from "./torrent.js"

const infoText = (id, headline, text, layout) => ({
    id,
    headline,
    text,
    type: "space",
    layout,
})

const keyboardButton = (key, layout, icon = null, text = null) => ({
    id: key,
    label: icon ? null : text || key,
    key,
    action: `player:commit:message:input:${key}`,
    type: "button",
    layout,
    ...(icon && { icon }),
    alignment: "justify",
    centration: "label",
    iconSize: "small",
})

const torrentPanel = (serverLocation) => {
    return {
        cache: false,
        reuse: false,
        headline: "Torrent streaming options",
        pages: [
            {
                items: [
                    infoText(
                        "webtorrent",
                        "WebTorrent Support",
                        `Your system ${
                            TorrentPlayer.IS_CLIENT_COMPATIBLE()
                                ? "{txt:msx-green:supports}"
                                : "{txt:msx-red:does not support}"
                        } WebTorrent streaming directly to the client.`,
                        "0,0,8,1"
                    ),
                    infoText(
                        "torrserver",
                        "TorrServer Setup",
                        "Local (private) ip of your TorrServer (ex. 192.168.1.9:8090)",
                        "0,1,8,1"
                    ),
                    {
                        focus: false,
                        id: "torrserverlocation",
                        type: "button",
                        label: serverLocation,
                        layout: "0,2,8,1",
                    },
                    keyboardButton("1", "0,3,1,1"),
                    keyboardButton("2", "1,3,1,1"),
                    keyboardButton("3", "2,3,1,1"),
                    keyboardButton("4", "3,3,1,1"),
                    keyboardButton("5", "4,3,1,1"),
                    keyboardButton("6", "5,3,1,1"),
                    keyboardButton("7", "6,3,1,1"),
                    keyboardButton("8", "7,3,1,1"),
                    keyboardButton("9", "0,4,1,1"),
                    keyboardButton("0", "1,4,1,1"),
                    keyboardButton("period", "2,4,1,1", null, "."),
                    keyboardButton("delete", "3,4,1,1", "backspace"),
                    {
                        id: "auto",
                        label: '"auto"',
                        action: `player:commit:message:input:auto`,
                        type: "control",
                        layout: "4,4,2,1",
                        icon: "auto-awesome",
                    },
                    {
                        id: "submit",
                        label: "Submit",
                        action: `player:commit:message:serverLocationChange`,
                        type: "control",
                        layout: "6,4,2,1",
                        icon: "check-circle-outline",
                    },
                    infoText(
                        "warning",
                        "",
                        '{txt:msx-yellow:Warning:} The "auto" option is an experimental feature that will try to locate a TorrServer instance within your local network. It might not always be possible to discover your server.',
                        "0,5,8,1"
                    ),
                ],
            },
        ],
    }
}

const updateInput = (input, key) => {
    if (key in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"])
        return input == "auto" ? key : input + key
    else if (key == "delete")
        return input == "auto" ? "" : input.substring(0, input.length - 1)
    //"auto" should be deleted completely on backspace
    else if (key == "period") return input == "auto" ? "." : input + "."
    else if (key == "auto") return "auto"
    else return input //remain unchanged
}

const optionsPanel = (isFallbackSet = false) => {
    return {
        cache: false,
        reuse: false,
        headline: "Options",
        pages: [
            {
                items: [
                    {
                        id: "title1",
                        title: "Content Options",
                        titleFooter:
                            "Select subtitle track and edit cue timing",
                        type: "space",
                        layout: "0,0,8,1",
                    },
                    {
                        id: "subtitles",
                        headline: "Subtitle Track",
                        text: "Select subtitle track",
                        action: `panel:request:player:subtitles`,
                        type: "control",
                        layout: "0,1,8,1",
                        extensionIcon: "subtitles",
                    },
                    {
                        id: "plus",
                        label: "100ms",
                        action: "player:commit:message:timing:plus",
                        key: "forward",
                        type: "control",
                        layout: "0,2,4,1",
                        icon: "add",
                    },
                    {
                        id: "minus",
                        label: " 100ms",
                        action: "player:commit:message:timing:minus",
                        key: "rewind",
                        type: "control",
                        layout: "4,2,4,1",
                        icon: "remove",
                    },
                    {
                        id: "tip",
                        text: "{txt:msx-green:Tip:} Use {ico:fast-forward} to delay or {ico:fast-rewind} to hasten subtitles while this panel is open (step {chr:plusmn}100ms)",
                        action: `panel:request:player:torrent`,
                        type: "space",
                        layout: "0,3,8,1",
                    },
                    {
                        id: "title2",
                        title: "Player Options",
                        titleFooter:
                            "Select how you want to stream torrent files",
                        type: "space",
                        layout: "0,4,8,1",
                    },
                    {
                        id: "torrent",
                        headline: "Torrent",
                        text: "Configure how torrents should be streamed.",
                        action: `panel:request:player:torrent`,
                        type: "control",
                        layout: "0,5,8,1",
                        extensionIcon: "account-tree",
                        enable: !isFallbackSet, //If fallback video is set, then connection to TorrServer will not be ettempted.
                    },
                ],
            },
        ],
    }
}

export { torrentPanel, updateInput, optionsPanel }
