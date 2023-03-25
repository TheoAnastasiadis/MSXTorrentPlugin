//Code heavilly borrowed from webtorrent-server-browser
//https://github.com/jimmywarting/webtorrent-server-browser.git

import rangeParser from "range-parser"

export default (video, magnetLink, fileIdx) => {

    const client = new WebTorrent()

    const scope = '/'
    const sw = navigator.serviceWorker.register(`sw.js`, { scope })

    client.add(magnetLink, async function(torrent) {
        await sw
        video.src = `${scope}webtorrent/${torrent.infoHash}/${encodeURI(torrent.files[fileIdx].path)}`//specified scope in source and encoded uri of filepath to fix some weird filenames
    })

    function serveFile (file, req) {
        const res = {
          status: 200,
          headers: {
            'Content-Type': file._getMimeType(),
            // Support range-requests
            'Accept-Ranges': 'bytes'
          }
        }

        // `rangeParser` returns an array of ranges, or an error code (number) if
        // there was an error parsing the range.
        let range = rangeParser(file.length, req.headers.get('range') || '')

        if (Array.isArray(range)) {
          res.status = 206 // indicates that range-request was understood

          // no support for multi-range request, just use the first range
          range = range[0]

          res.headers['Content-Range'] = `bytes ${range.start}-${range.end}/${file.length}`
          res.headers['Content-Length'] =  `${range.end - range.start + 1}`
        } else {
          range = null
          res.headers['Content-Length'] = file.length
        }

        res.body = req.method === 'HEAD' ? '' : 'stream'

        return [res, req.method === 'GET' && file.createReadStream(range)]
    }

    // kind of a fetch event from service worker but for the main thread.
    navigator.serviceWorker.addEventListener('message', evt => {

        const request = new Request(evt.data.url, {
            headers: evt.data.headers,
            method: evt.data.method
        })

        const [ port ] = evt.ports
        const respondWith = msg => port.postMessage(msg)
        const pathname = request.url.split(evt.data.scope + 'webtorrent/')[1]
        let [ infoHash, ...filePath ] = pathname.split('/')
        filePath = decodeURI(filePath.join('/'))

        if (!infoHash || !filePath) return

        const torrent = client.get(infoHash)
        const file = torrent.files.find(file => file.path === filePath)

        const [response, stream] = serveFile(file, request)
        const asyncIterator = stream && stream[Symbol.asyncIterator]()

        respondWith(response)

        async function pull () {
            respondWith((await asyncIterator.next()).value)
        }

        port.onmessage = pull
    })

}