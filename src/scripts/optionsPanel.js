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
})

const optionsPanel = (serverLocation) => {
    console.log("optionsPanel()")
    return {
        cache: false,
        reuse: false,
        headline: "Options",
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
                        icon: "devices",
                    },
                    {
                        id: "submit",
                        label: "Submit",
                        action: `player:commit:message:serverLocationChange`,
                        type: "control",
                        layout: "6,4,2,1",
                        icon: "network-check",
                    },
                ],
            },
        ],
    }
}

const updateInput = (input, key) => {
    if (key in ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"])
        return input + key
    else if (key == "delete") return input.substring(0, input.length - 1)
    else if (key == "period") return input + "."
    else if (key == "auto") return "auto"
    else return input //remain unchanged
}

export { optionsPanel, updateInput }
