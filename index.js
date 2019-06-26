const mdls = require('mdls');
const { getFilePaths, moveFile, ensureExistingFolder } = require('./utils');

const [inputFolder, outputFolder, uniqueName] = process.argv.slice(2);
console.log(`target folder: "${inputFolder}"`);
console.log(`output folder: "${outputFolder}"`);

function exit(code = 0) {
    process.exit(code);
}

if (!inputFolder ||
    !outputFolder ||
    !ensureExistingFolder(inputFolder, false) ||
    !ensureExistingFolder(outputFolder, true)) {
    return exit(1); // exit missing crucial info
}

const files = getFilePaths(inputFolder);
console.log(`found ${files.length} files:`);
console.dir(files);

if (files.length <= 0) { // exit no files to process
    return exit();
}

async function processFiles(files) {
    const addIndexPrefix = uniqueName && (
        // is number and equals 1
        (!isNaN(uniqueName) && uniqueName === '1') ||
        // is non-number and 'true'
        uniqueName.toLowerCase() === 'true'
    );
    const batchSize = 10;
    const N = Math.ceil(files.length / batchSize);

    for (let i = 0; i < N; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const batch = files.slice(start, end);

        const batchTasks = batch.map(async (file, idx) => {
            try {
                const metadata = await mdls(file);
                const isAppleFile = (
                    // MOV file
                    metadata['ItemContentType'] === 'com.apple.quicktime-movie'
                    // iPhone created-by content
                    || (metadata['ItemAcquisitionMake'] === 'Apple'
                        && metadata['ItemAcquisitionModel'].toLowerCase().startsWith('iphone'))
                );

                if (isAppleFile) {
                    return moveFile(file, outputFolder, addIndexPrefix ? `${start}_${idx}_` : null);
                }
            } catch (err) {
                console.error(`mdls error for file: "${file}", err=${err}`);
                return file;
            }
        });
        const batchResults = await Promise.all(batchTasks);
    }
}

processFiles(files).then((err) => {
    if (err) {
        console.error(err);
    }
    console.log('done')
});
