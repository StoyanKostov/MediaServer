const fs = require('fs'),
    ffmpegInstaller = require('@ffmpeg-installer/ffmpeg'),
    ffmpeg = require('fluent-ffmpeg'),
    srt2vtt = require('srt-to-vtt');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

module.exports = {
    "/film": {
        handler: (params, callback) => {
            const entryFullName = Buffer.from(params.entryFullName, 'hex').toString('utf8'),
                stat = fs.statSync(entryFullName),
                mimeType = "video/mp4",
                readStream = ffmpeg(entryFullName)
                    .videoCodec('libx264')
                    .format('mp4')
                    .outputOptions('-movflags frag_keyframe+empty_moov');

            callback(null, { mimeType: mimeType, fileSize: stat.size, readStream: readStream });
        }
    },
    "/subtitle": {
        handler: (params, callback) => {
            const entryFullName = Buffer.from(params.entryFullName, 'hex').toString('utf8'),
                stat = fs.statSync(entryFullName),
                mimeType = "text/vtt",
                readStream = fs.createReadStream(entryFullName).pipe(srt2vtt());

            callback(null, { mimeType: mimeType, fileSize: stat.size, readStream: readStream });
        }
    }
}   