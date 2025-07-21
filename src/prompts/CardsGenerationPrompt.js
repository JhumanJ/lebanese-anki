const BasePrompt = require('./BasePrompt');

class CardsGenerationPrompt extends BasePrompt {
  constructor(options = {}) {
    super({
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature || 0.2,
      maxTokens: options.maxTokens || 16384,
      structuredOutputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          cards: {
            type: 'array',
            description: 'Array of flashcards generated from the lesson content',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                front: { 
                  type: 'string',
                  description: 'Front side of the flashcard (HTML formatting supported)'
                },
                back: { 
                  type: 'string',
                  description: 'Back side of the flashcard (HTML formatting supported)'
                }
              },
              required: ['front', 'back']
            }
          }
        },
        required: ['cards']
      },
      ...options
    });
  }

  getSystemPrompt() {
    return `You are an expert Lebanese Arabic language teacher who creates effective flashcards for language learning. You understand the nuances of Lebanese dialect and Modern Standard Arabic, and create cards that help students learn both dialects simultaneously.

Your expertise includes:
- Lebanese Arabic dialect (Levantine Arabic)
- Modern Standard Arabic (MSA/Fusha)
- Dialectal differences and similarities between Lebanese and MSA
- Effective spaced repetition learning principles
- Cultural context and practical usage
- Pronunciation guidance
- Grammar explanations that are clear and practical`;
  }

  buildPrompt(lessonContent) {
    return `Based on the following Lebanese Arabic lesson notes, create flashcards that will help a student learn effectively.

<LessonContent>
${lessonContent}
</LessonContent>

IMPORTANT NOTES ABOUT THE SOURCE MATERIAL:
- These are student notes, which may contain mistakes, typos, or incomplete information
- Feel free to correct obvious errors and fill in small logical gaps within the same topic
- Example: If student noted numbers 1, 2, 3, 5 but missed 4, include the missing number 4
- Example: If student noted days Monday, Tuesday, Thursday but missed Wednesday, include it
- Don't add entirely new topics or concepts not mentioned in the notes
- Focus on completing obvious sequences or fixing clear mistakes within existing content
- Notee use the syntax \`word(leabanese version): meaning\` to represent a word (and its lebanese version) and its meaning. Sometimes we also use\ \`word sinngular -> word plural: meaning\` to represent a word and its meaning.
- DUAL DIALECT REQUIREMENT: When you encounter Arabic words in the notes, identify whether they are Lebanese or MSA, and always provide the equivalent in the other dialect when it differs

Please create flashcards following these guidelines:

1. COMPREHENSIVE COVERAGE: Create as many cards as necessary to thoroughly cover ALL vocabulary, phrases, grammar concepts, and cultural information from the lesson. Don't limit yourself - complete coverage is more important than brevity.

2. OVERLAPPING CARDS: Create multiple cards for the same concept from different angles if needed.

3. DUAL DIALECT APPROACH: The student is learning both Lebanese Arabic and Modern Standard Arabic simultaneously. For vocabulary and phrases:
   - Include BOTH Lebanese Arabic and Modern Standard Arabic versions when they differ
   - If a word appears in MSA in the notes but has a different Lebanese equivalent, include both
   - When both versions are the same, mention this to reinforce the connection
   - Use clear labeling: "Lebanese:" and "MSA:" or "Standard Arabic:"

4. CARD TYPES:
   - **Recognition cards** (Arabic → English): Front = Arabic script only, Back = English translation + pronunciation hints + dialect info
   - **Production cards** (English → Arabic): Front = English phrase/word, Back = Arabic script (user must think/write Arabic)
   - **Dialect comparison cards**: When Lebanese ≠ MSA, create separate cards comparing the dialects
   - **Grammar concepts**: Front = Grammar rule or example, Back = Explanation covering both dialects when relevant
   - **Cultural context**: Front = Cultural concept, Back = Explanation and significance
   - **Pronunciation cards**: For difficult words, Front = Arabic, Back = Pronunciation guide + meaning + lebanese texto transcription

5. SEPARATE CARDS FOR VOCABULARY: Instead of using reverse cards, create dedicated cards for different learning objectives:
   - **Arabic Reading Practice**: Arabic script only on front → English + pronunciation on back
   - **Arabic Production Practice**: English on front → Arabic script on back (no English mixed with Arabic)
   - **Dialect Distinction**: When Lebanese differs from MSA, create a separate card specifically for this comparison

6. ARABIC SCRIPT REQUIREMENT: 
   - Use Arabic script (no Latin letters) for Arabic content to practice reading
   - Include pronunciation hints in parentheses when helpful
   - Keep Arabic and English content separate (don't mix on same side)

7. HTML FORMATTING: You can use basic HTML tags in both front and back content for better formatting:
   - <h1>, <h2>, <h3> for headings
   - <p> for paragraphs
   - <strong> for bold text
   - <em> for italic text
   - <u> for underlined text
   - <s> for strikethrough text
   - <ul>, <ol>, <li> for lists
   - <br> for line breaks

8. Include pronunciation hints when helpful (similar sound in English or French)

Format your response as a JSON object with a "cards" array containing objects with:
- "front": the question/prompt side (HTML formatting supported)
- "back": the answer/explanation side (HTML formatting supported)

Example format:
{
  "cards": [
    {
      "front": "<h3>كيفك؟</h3>",
      "back": "<p><strong>How are you?</strong> (masculine)</p><p>Pronunciation: /keefak/</p><p><strong>Lebanese:</strong> كيفك؟</p><p><strong>MSA:</strong> كيف حالك؟</p><p>Used when greeting a male. For females, use كيفك؟ (keefik) in Lebanese</p>"
    },
    {
      "front": "<p>How do you say 'How are you?' to a man in Lebanese Arabic?</p>",
      "back": "<h3>كيفك؟</h3><p>Pronunciation: /keefak/</p>"
    },
    {
      "front": "<h3>بيت</h3>",
      "back": "<p><strong>House</strong></p><p>Pronunciation: /bayt/</p><p>This word is the same in both Lebanese and MSA</p>"
    },
    {
      "front": "<p>What's the Lebanese word for 'I want'?</p>",
      "back": "<h3>بدي</h3><p>Pronunciation: /biddi/</p>"
    },
    {
      "front": "<p>Compare Lebanese and MSA for 'I want'</p>",
      "back": "<p><strong>Lebanese:</strong> بدي (/biddi/)</p><p><strong>MSA:</strong> أريد (/ureed/)</p><p>Completely different words - Lebanese uses 'biddi' while MSA uses 'ureed'</p>"
    }
  ]
}

JSON:`;
  }

  parseResponse(response) {
    try {
      // With structured output, the response should already be a JSON object
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Extract cards from the structured response
      if (!parsedData.cards || !Array.isArray(parsedData.cards)) {
        throw new Error('Response does not contain a valid cards array');
      }

      return parsedData.cards;
    } catch (error) {
      console.error('Error parsing cards response:', error.message);
      console.error('Generated content:', response);
      throw error;
    }
  }

  validateResponse(parsedResponse) {
    if (!Array.isArray(parsedResponse)) {
      throw new Error('Parsed response is not an array');
    }

    // Filter and validate cards
    const validCards = parsedResponse.filter(card => {
      return card.front && card.back && 
             typeof card.front === 'string' && 
             typeof card.back === 'string' &&
             card.front.trim().length > 0 &&
             card.back.trim().length > 0;
    });

    if (validCards.length === 0) {
      throw new Error('No valid cards generated');
    }

    console.log(`Generated ${validCards.length} valid cards`);
    return validCards;
  }

  /**
   * Generate flashcards from lesson content
   * @param {string} lessonContent - The lesson content to convert to cards
   * @returns {Promise<Array>} - Array of card objects with front, back, and reverse properties
   */
  async generateCards(lessonContent) {
    return await this.execute(lessonContent);
  }

  /**
   * Generate cards from multiple sources
   * @param {Array} sources - Array of {content, title} objects
   * @returns {Promise<Array>} - Combined array of card objects
   */
  async generateCardsFromSources(sources) {
    const allCards = [];
    
    for (const source of sources) {
      try {
        const cards = await this.generateCards(source.content);
        allCards.push(...cards);
      } catch (error) {
        console.error(`Error generating cards from source "${source.title}":`, error.message);
      }
    }
    
    return allCards;
  }

  /**
   * Helper method to clean up card content
   */
  static sanitizeCardContent(content) {
    return content
      .replace(/\n/g, '<br>')
      .replace(/"/g, '&quot;')
      .trim();
  }
}

module.exports = CardsGenerationPrompt; 