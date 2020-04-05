const fs = require('fs'),
	path = require('path'),
	folders = require('./../../config')['folders'],
	isDirectory = function isDirectory(entryFullName) {
		var entryExtension = path.extname(entryFullName).toLowerCase();
		var stats = fs.statSync(entryFullName);
		return stats.isDirectory() && entryExtension !== '.torrent';
	},
	getFiles = function getFiles(dirPath) {
		var result = [];
		try {
			fs.readdirSync(dirPath, { withFileTypes: true })
				.sort(function compare(aEntry, bEntry) {
					var aEntryFullName = dirPath + '\\' + aEntry.name;
					var bEntryFullName = dirPath + '\\' + bEntry.name;
					if (!isDirectory(aEntryFullName) && isDirectory(bEntryFullName)) {
						return 1;
					}
					if (isDirectory(aEntryFullName) && !isDirectory(bEntryFullName)) {
						return -1;
					}

					return 0;
				})
				.forEach(function (entry) {
					var entryFullName = dirPath + '\\' + entry.name;
					var entryExtension = path.extname(entryFullName).toLowerCase();
					if (isDirectory(entryFullName)) {
						result.push(getFiles(entryFullName));
					} else {
						if (entryExtension === '.avi' ||
							entryExtension === '.mkv' ||
							entryExtension === '.mp4' ||
							entryExtension === '.mpg') {
							result.push(`<li><p><span>${entryFullName}</span>${dirPath}</p><a href="film?path=${Buffer.from(entryFullName, 'utf8').toString('hex')}">${entry.name}</a></li>`);
						}

						if (entryExtension === '.srt') {
							result.push(`<li><p><span>${entryFullName}</span>${dirPath}</p><a href="subtitle?path=${Buffer.from(entryFullName, 'utf8').toString('hex')}">${entry.name}</a></li>`);
						}
					}
				});
		} catch (error) {
			return `<h3>Invalid folder: ${dirPath}</h3>`;
		}

		return `<h3>${dirPath}</h3><ul class="collapsed">${result.join('')}</ul>`;
	}

// Serve static files
module.exports = {
	"/index.html": {
		handler: (callback) => {
			fs.readFile(`${process.cwd()}\\client\\index.html`, { encoding: 'utf8' }, (err, data) => {
				var films = folders.map((folder) => {
					return getFiles(path.normalize(folder));
				}).join('');

				callback(err, data.replace("{{films}}", films));
			});
		}
	},
	"/css/styles.css": {
		handler: (callback) => {
			fs.readFile(`${process.cwd()}\\client\\css\\styles.css`, callback);
		}
	}
}