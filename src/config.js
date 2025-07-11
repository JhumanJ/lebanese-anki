require('dotenv').config();

const config = {
  notion: {
    token: process.env.NOTION_TOKEN,
    pageId: process.env.NOTION_PAGE_ID,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  },
  noji: {
    bearerToken: process.env.NOJI_BEARER_TOKEN,
    apiUrl: process.env.NOJI_API_URL || 'https://api-de.noji.io',
    deckId: process.env.NOJI_DECK_ID,
  },
};

// Validate required environment variables
const validateConfig = () => {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NOJI_BEARER_TOKEN',
    'NOJI_DECK_ID',
    'NOTION_TOKEN',
    'NOTION_PAGE_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars.join(', '));
    console.error('Please check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
};

// Export validation function
config.validateConfig = validateConfig;

module.exports = config; 