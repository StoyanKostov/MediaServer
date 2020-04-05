const http = require('http'),
    url = require('url'),
    WEB_SERVER = require('./config')['WEB_SERVER'],
    staticFilesRouter = require('./server/routers/staticFilesRouter'),
    videoRouter = require('./server/routers/videoRouter'),
    requestListener = function (req, res) {
        let urlParsed = url.parse(req.url),
            pathName = urlParsed.pathname;

        if (req.method !== 'GET') {
            res.writeHead(405);
            res.end('HTTP Method Not Allowed');
        } else if (pathName === "/") {
            res.writeHead(302,
                { Location: `http://${req.headers.host}/index.html` }
            );
            res.end();
        } else if (staticFilesRouter[pathName]) {
            staticFilesRouter[pathName].handler((err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                    return;
                }
                res.writeHead(200);
                res.end(data);
            });

        } else if (videoRouter[pathName]) {
            let path = urlParsed.query.split('=')[1];
            videoRouter[pathName].handler({ entryFullName: path }, (err, data) => {
                data.readStream.on('error', function (err) {
                    if (err) {
                        res.writeHead(404);
                        res.end(JSON.stringify(err));
                        return;
                    }
                });
                res.writeHead(200, { 'Content-Length': data.fileSize, 'Content-Type': data.mimeType });
                data.readStream.pipe(res);
            });

        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found\n");
        }
    };

// Start apllication server
const server = http.createServer(requestListener).listen(WEB_SERVER.PORT, WEB_SERVER.HOST, function () {
    let address = server.address();
    console.log(`Server running at http://${address.address}:${address.port}`);
});