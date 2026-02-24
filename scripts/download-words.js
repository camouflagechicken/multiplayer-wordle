const https = require('https');
const fs = require('fs');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function generateWords() {
  try {
    const answersText = await fetchUrl('https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/shuffled_real_wordles.txt');
    const guessesText = await fetchUrl('https://raw.githubusercontent.com/Kinkelin/WordleCompetition/main/data/official/official_allowed_guesses.txt');

    const answers = answersText.split('\n').map(w => w.trim()).filter(w => w.length === 5);
    const guesses = guessesText.split('\n').map(w => w.trim()).filter(w => w.length === 5);

    const fileContent = `// Generated file
export const WORDS = ${JSON.stringify(answers)};
export const VALID_GUESSES = new Set([...WORDS, ...${JSON.stringify(guesses)}]);
`;

    fs.writeFileSync('./src/words.ts', fileContent);
    console.log('Successfully generated src/words.ts');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

generateWords();
