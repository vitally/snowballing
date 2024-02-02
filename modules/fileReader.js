// modules/fileReader.js
import fs from 'fs/promises';

export async function readPaperIds(filePath) {
    try {
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        const ids = data.split('\n').filter(id => id.trim() !== '');
        const unknownIds = [];
        const knownIdsWithType = [];
        ids.forEach(item => {
            const type = determineIdType(item);
            if (type === 'Unknown') {
                unknownIds.push(item); // Add only the ID to the array
            } else {
                knownIdsWithType.push({id:item, type:type}); // Add the entire object to the array
            }
        });
        return { unknownIds, knownIdsWithType };
    } catch (error) {
        console.error('Error reading file:', error);
        return [];
    }
}

function determineIdType(id) {
    if (id.startsWith('10.')) {
        return 'DOI';
    } else if (id.match(/^\d+$/)) {
        return 'CorpusId';
    } else if (id.startsWith('arXiv:')) {
        return 'arXivId';
    } else {
        return 'Unknown';
    }
}
