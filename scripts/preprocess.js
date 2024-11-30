const fs = require('fs');

// Load job titles
const jobTitles = fs.readFileSync('jobtitles.txt', 'utf-8').split('\n').map(title => title.trim().toLowerCase());

// Preprocessing util: Tokenize and create a searchable map
function preprocessJobTitles(titles) {
    const titleMap = new Map();
    titles.forEach(title => {
        const words = title.split(/\s+/); // Split title into words
        words.forEach(word => {
            if (!titleMap.has(word)) {
                titleMap.set(word, []);
            }
            titleMap.get(word).push(title); // Map each word to corresponding titles
        });
    });
    return Object.fromEntries(titleMap); // Convert Map to plain object for exporting
}

// Preprocess and write to a module
const preprocessedMap = preprocessJobTitles(jobTitles);

// Save to a JavaScript module
const output = `module.exports = ${JSON.stringify(preprocessedMap, null, 2)};`;
fs.writeFileSync('preprocessedJobTitles.js', output, 'utf8');
