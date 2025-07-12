# Lebanese Anki Generator 🇱🇧

I built this project for fun in 3 hours to finally practice my Lebanese Arabic between lessons! Transform your Lebanese Arabic lesson notes from Notion into comprehensive flashcards using AI, automatically added to your Noji spaced repetition app.

## Features

- 📝 **Notion Integration**: Fetch and process lesson notes from any Notion page
- 🤖 **AI-Powered Card Generation**: Create comprehensive flashcards with GPT-4o-mini
- 📚 **Noji Integration**: Automatically add cards to your Noji deck with HTML formatting
- 🔄 **Smart State Management**: Resume processing from where you left off
- 🎯 **Lebanese Arabic Focus**: Specialized prompts for Lebanese dialect with cultural context
- 🔧 **Comprehensive Coverage**: Generates multiple overlapping cards to ensure complete lesson coverage
- 📊 **Progress Tracking**: Detailed logging and processing statistics

## Prerequisites

1. **Node.js** (v16 or higher)
2. **OpenAI API Key** with access to GPT-4o-mini
3. **Noji Account** with API bearer token and deck ID
4. **Notion Integration** with access to your lesson notes

## Installation

1. Clone this repository:

   ```bash
   git clone <repository-url>
   cd lebanaseanki
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp env.template .env
   ```

4. Edit `.env` file with your credentials (see Configuration section)

## Configuration

### Required Environment Variables

```env
OPENAI_API_KEY=sk-your_openai_api_key
NOJI_BEARER_TOKEN=your_noji_bearer_token
NOJI_DECK_ID=your_noji_deck_id_numeric
NOTION_TOKEN=secret_your_notion_integration_token
NOTION_PAGE_ID=your_notion_page_id
```

### Optional Environment Variables

```env
OPENAI_MODEL=gpt-4o-mini
NOJI_API_URL=https://api-de.noji.io
```

### Getting API Keys

#### Notion Integration Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the "Internal Integration Token"
4. Share your lesson notes page with the integration

#### Notion Page ID

1. Open your lesson notes page in Notion
2. Copy the page URL
3. Extract the page ID from the URL (32-character string)

#### OpenAI API Key

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy the key (starts with `sk-`)

#### Noji Bearer Token & Deck ID

1. **Bearer Token**:

   - Log into your Noji account
   - Open browser developer tools (F12)
   - Go to Network tab and make a request
   - Copy the Bearer token from the Authorization header

2. **Deck ID**:
   - Go to your Noji deck
   - Copy the numeric ID from the URL (e.g., `27043733` from `https://noji.io/deck/27043733`)
   - Or check the deck API endpoint in browser developer tools

## Usage

### Basic Commands

Process your Lebanese Arabic lesson notes:

```bash
npm start
```

Clear processing state and start fresh:

```bash
npm start clear
```

Show help and available commands:

```bash
npm start help
```

For development:

```bash
npm run dev
```

### Command Options

- **`npm start`** - Process lessons and generate cards (default behavior)
- **`npm start clear`** or **`npm start reset`** - Clear all processing state and start fresh
- **`npm start help`** - Show available commands and usage examples

### State Management

The application automatically tracks which lessons have been processed using a `lesson-state.json` file. This allows you to:

- **Resume processing**: If interrupted, run `npm start` again to continue from where you left off
- **Skip processed lessons**: Only new or unprocessed lessons will be processed
- **Start fresh**: Use `npm start clear` to reset state and reprocess all lessons

## How It Works

1. **🔧 Configuration Validation**: Validates all required environment variables
2. **📋 Noji Connection Test**: Tests API connection and deck access
3. **📝 Fetch Lessons**: Retrieves all lesson blocks from your Notion page
4. **🔍 Filter Processed**: Skips already processed lessons using state management
5. **📖 Process Each Lesson**:
   - Convert Notion blocks to markdown (including images)
   - Generate comprehensive flashcards with AI
   - Add cards to Noji with HTML formatting
   - Update processing state
6. **📊 Progress Tracking**: Shows detailed statistics and completion status
7. **🎯 Resume Capability**: Run again to process only new lessons

### Card Generation Strategy

- **Comprehensive Coverage**: Creates as many cards as needed to cover all content
- **Separate Card Types**: Generates dedicated cards for recognition (Arabic→English), production (English→Arabic), and dialect comparison
- **Smart Gap Filling**: Adds missing elements in sequences (e.g., missing numbers in a series)
- **HTML Formatting**: Rich formatting with headings, lists, bold, italic, underline
- **Lebanese Focus**: Specialized for Lebanese Arabic dialect and culture

## Card Types Generated

- **Vocabulary Cards**: Lebanese Arabic ↔ English with usage examples and context
- **Grammar Cards**: Rules, patterns, and examples with clear explanations
- **Cultural Context**: Important cultural concepts and their significance
- **Pronunciation Cards**: Pronunciation guides and phonetic hints

### HTML Formatting Support

Cards support rich formatting for better learning:

- **Headings**: `<h1>`, `<h2>`, `<h3>`
- **Text formatting**: `<strong>`, `<em>`, `<u>`, `<s>`
- **Lists**: `<ul>`, `<ol>`, `<li>`
- **Other**: `<p>`, `<br>`

### Example Cards

```json
{
  "front": "<h3>كيفك؟</h3><p>Keefak?</p>",
  "back": "<p><strong>How are you?</strong> (masculine)</p><p>Used when greeting a male. For females, use <em>Keefik?</em></p>"
}
```
