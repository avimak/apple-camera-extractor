const fs = require('fs');
const path = require('path');

/**
 * Retrieve file paths from a given folder and its subfolders
 * @param folderPath
 * @return {String[]}
 */
const getFilePaths = (folderPath) => {
    const entryPaths = fs.readdirSync(folderPath).map(entry => path.join(folderPath, entry));
    const filePaths = entryPaths.filter(entryPath => fs.statSync(entryPath).isFile());
    const dirPaths = entryPaths.filter(entryPath => !filePaths.includes(entryPath));
    const dirFiles = dirPaths.reduce((prev, curr) => prev.concat(getFilePaths(curr)), []);
    return [...filePaths, ...dirFiles];
};

/**
 * Moves given file to target-folder
 * @return {Promise<VoidFunction>}
 */
const moveFile = (file, targetFolder, prefix) => {
    const [fileName] = file.split('/').splice(-1);
    const newPath = `${targetFolder}/${prefix ? prefix : ''}${fileName}`;
    return new Promise(((resolve, reject) => fs.rename(file, newPath, (err) => err ? reject(err) : resolve())));
};

/**
 * Ensures the given path points to an existing folder
 * @param path
 * @param mkdir if exist returns false, create a folder at path
 */
const ensureExistingFolder = (path, mkdir) => {
    try {
        if (fs.existsSync(path)) {
            return fs.lstatSync(path).isDirectory();
        }

        if (mkdir) {
            fs.mkdirSync(path);
            return true;
        }
    } catch (e) {
        console.error(e);
    }

    return false;
};

module.exports = {
    getFilePaths,
    moveFile,
    ensureExistingFolder,
};
