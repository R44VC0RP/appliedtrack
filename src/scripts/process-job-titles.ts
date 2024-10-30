import fs from 'fs';
import path from 'path';

const processJobTitles = () => {
  // Read the original file
  const jobTitles = fs.readFileSync(
    path.join(process.cwd(), 'src/data/raw-job-titles.txt'),
    'utf-8'
  )
    .split('\n')
    .map(title => title.trim())
    .filter(Boolean) // Remove empty lines
    .sort(); // Sort alphabetically
    
  // Remove duplicates and normalize titles
  const uniqueTitles = Array.from(new Set(jobTitles.map(title => ({
    original: title,
    normalized: title.toLowerCase()
  }))));
  
  // Create a prefix map for faster searching
  const prefixMap: { [key: string]: string[] } = {};
  
  uniqueTitles.forEach(({ original, normalized }) => {
    // Split the title into words
    const words = normalized.split(' ');
    
    // Create prefixes for the full title
    for (let i = 1; i <= normalized.length; i++) {
      const prefix = normalized.slice(0, i);
      if (!prefixMap[prefix]) {
        prefixMap[prefix] = [];
      }
      if (!prefixMap[prefix].includes(original)) {
        prefixMap[prefix].push(original);
      }
    }

    // Create prefixes for each word
    words.forEach(word => {
      for (let i = 1; i <= word.length; i++) {
        const prefix = word.slice(0, i);
        if (!prefixMap[prefix]) {
          prefixMap[prefix] = [];
        }
        if (!prefixMap[prefix].includes(original)) {
          prefixMap[prefix].push(original);
        }
      }
    });
  });

  // Limit suggestions to 10 per prefix
  Object.keys(prefixMap).forEach(prefix => {
    prefixMap[prefix] = prefixMap[prefix].slice(0, 10);
  });

  // Save the optimized prefix map
  fs.writeFileSync(
    path.join(process.cwd(), 'src/data/job-titles-map.json'),
    JSON.stringify(prefixMap)
  );
};

processJobTitles();