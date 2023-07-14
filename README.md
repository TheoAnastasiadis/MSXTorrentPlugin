# MSX Torrent Plugin 🌐

HTML plugin for playing torrents "directly" from your smart TV. Built on top of the amazing [Media Station X Library](https://msx.benzac.de/info/?tab=Home) (support the maintainer!).

![Example Files](https://github.com/TheoAnastasiadis/MSXTorrentPlugin/blob/main/assets/example_files.png?raw=true)

## Quick Demo 🔮

Follow the link bellow for a quick preview.

https://msx.benzac.de/?start=content:https://theoanastasiadis.github.io/MSXTorrentPlugin/assets/example.json

## Capabilities

-   Play torrent files that have ws trackers directly on your Smart TV leveraging the [WebTorrent package](https://www.npmjs.com/package/webtorrent).
-   If your device does not support WebTorrent (or your torrents don't hace ws trackers) you can play torrents via a [TorrServer](https://github.com/YouROK/TorrServer) available in your network (available also for android devices).

## Usage/Examples

### Basic setup (Web Torrent)

```json
{
    "type": "pages",
    "headline": "Torrent Plugin Test",
    "items": [
        {
            "type": "separate",
            "layout": "0,0,2,4",
            "color": "msx-glass",
            "playerLabel": "Sintel © copyright Blender Foundation | durian.blender.org",
            "action": "video:plugin:http://localhost:8080",
            "properties": {
                "torrent:id": "08ada5a7a6183aae1e09d831df6748d566095a10",
                "torrent:fileIdx": "6",
                "torrent:server:precedence": false,
                "button:content:icon": "settings",
                "button:content:action": "panel:request:player:options"
            }
        }
    ]
}
```

With `torrent:server:precedence` se to `false` the player will try to play the torrent directly inside the browser. The `torrent:id` property can either be

-   a torrent info hash
-   magnet URI
-   ~local .torrent file~

To check about the compatibility of your device and WebTorrent go to player `options > Player Options > Web Torrent Support`. In general the browser should have WebRTC and Service Worker compatibility.

_Important: Please keep in mind that web socket trackers for torrents are still rare so your torrents might not play locally reagardless._

### LAN setup (TorrServer)

```json
{
    "type": "pages",
    "headline": "Torrent Plugin Test",
    "items": [
        {
            "type": "separate",
            "layout": "0,0,2,4",
            "color": "msx-glass",
            "playerLabel": "Sintel © copyright Blender Foundation | durian.blender.org",
            "action": "video:plugin:http://localhost:8080",
            "properties": {
                "torrent:id": "08ada5a7a6183aae1e09d831df6748d566095a10",
                "torrent:fileIdx": "6",
                "torrent:server:precedence": true,
                "torrent:server:location": "192.168.56.1",
                "button:content:icon": "settings",
                "button:content:action": "panel:request:player:options"
            }
        }
    ]
}
```

By giving the local network IP address of a TorrServer instance to the player (via the `torrent:server:location` property) it is possible to play your torrents to the TV without the use of a Debrid provider.

It is also possible to pass `auto` as the value of the server location, in which case the player will try to automatically detect the location of the server in the local network (and play the torrent file).

## Screenshots

![Content Options](https://github.com/TheoAnastasiadis/MSXTorrentPlugin/blob/main/assets/content_options.png?raw=true)

![Player Options](https://github.com/TheoAnastasiadis/MSXTorrentPlugin/blob/main/assets/stream_options.png?raw=true)

## Deployment 🚀

Clone this repo and serve via an http server.

```bash
  git clone git@github.com:TheoAnastasiadis/MSXTorrentPlugin.git
  npm install
  npm run build
  npm run serve-insecure //alternativelly make keys with mkcert and run `serve-secure`
```

Then open http://msx.benzac.de/?start=content:http://[your.localhost.address]/example.json

## API Reference

| Property                    | Value                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| `torrent:id`                | Infohash or Magnet URI of the target torrent.                                                            |
| `torrent:fileIdx`           | Index of the video file within the torrrent contents.                                                    |
| `torrent:server:precedence` | Set `true` to skip local play attempts.                                                                  |
| `torrent:server:location`   | Set as either the private IPv4 address of the TorrServer or `auto`.                                      |
| `torrent:subtitle:ln`       | Add .srt files to be rendered as subtitles.                                                              |
| `resume:position`           | Skip a part of the video. Check [MSX documentation](https://msx.benzac.de/wiki/index.php?title=Welcome). |
| `torrent:fallbackUrl`       | Optional video url\*\* to be played in case both the TorrServer and Webtorrent players fail.\*\*\*       |

\*If a torrent id is not supplied to the player, then this video will be played directly.

\*\*Valid formats are `.mp4`, `.webp`, `.mpd` and `.m3u8`

\*\*\*If `torrent:server:precedence` is set to `true` then the this video will be played after the server fails.

## Limitations

-   WS trackers are still not well supported.
-   The `auto` feature might need time to ping all the possibe LAN address and locate the server. It smartly starts from the most popular local address so as not to waste resource, but acccording to the platform this might take a while and it might also miss the server.
-   When serving the player through an SSL connection the `auto` feature but also the local TorrServer more generally might not function due to **insecure content**.

## Possible Additions

-   [x] Subtitle timing settings
-   [ ] Embeded subtitles loaded from the torrent file.
-   [x] Video fallback.
-   [ ] File picker (for torrents with multiple files).

## Support

Open an issue or a PR 😉

## References

-   [@benzac-de/msx](https://github.com/benzac-de/msx)
-   [@webtorrent/webtorrent](https://github.com/webtorrent/webtorrent)
-   [@YouROK/TorrServer](https://github.com/YouROK/TorrServer)
