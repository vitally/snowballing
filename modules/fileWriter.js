import fs from 'fs';

export function saveToFile(fileName, data) {
    fs.writeFile(fileName, JSON.stringify(data, null, 2), 'utf8', function(err) {
        if (err) {
            console.log('An error occurred while writing the JSON Object to File.');
            return console.log(err);
        }
        console.log(`JSON file has been saved. (${fileName})`);
    });
}