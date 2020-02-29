'use strict';
const {exec} = require('child_process');

function getFaceFeatures(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = exec(`docker exec openface /bin/bash -c "cd /svapi/scrapper && python ./features_getter.py --img ${imagePath}"`);

        pythonProcess.stdout.on('data', (data) => {
            let features = data
                .replace(']', '')
                .replace('[', '')
                .split('\n')
                .join(' ')
                .split(' ')
                .filter(elem => elem !== ']' && elem !== '[' && elem !== ' ' && elem !== '')
                .map(elem => Number.parseFloat(elem));
            return resolve(features);
        });

        pythonProcess.stderr.on('data', function (data) {
            console.log(data)
            reject(data);
        });
    });
}

module.exports = {
    getFaceFeatures
};