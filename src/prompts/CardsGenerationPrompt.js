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
                },
                reverse: { 
                  type: 'boolean',
                  description: 'Whether to create a reverse card for bidirectional learning'
                }
              },
              required: ['front', 'back', 'reverse']
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
   - Vocabulary cards: Front = Word/phrase in Arabic, Back = English translation + both Lebanese and MSA versions (when different) + usage example
   - Grammar concepts: Front = Grammar rule or example, Back = Explanation covering both dialects when relevant
   - Cultural context: Front = Cultural concept, Back = Explanation and significance
   - Pronunciation: Front = Word with pronunciation, Back = Meaning, pronunciation tips, and dialectal differences
   - Dialect comparison: Front = Concept in one dialect, Back = Equivalent in other dialect + explanation of differences

5. HTML FORMATTING: You can use basic HTML tags in both front and back content for better formatting:
   - <h1>, <h2>, <h3> for headings
   - <p> for paragraphs
   - <strong> for bold text
   - <em> for italic text
   - <u> for underlined text
   - <s> for strikethrough text
   - <ul>, <ol>, <li> for lists
   - <br> for line breaks

6. REVERSE CARDS: Set "reverse": true when it would be beneficial to study the card in both directions. This creates an additional card with front/back swapped. Use this for:
   - Vocabulary that should be learned both ways (Arabic→English AND English→Arabic)
   - Translation exercises
   - Any concept where bidirectional learning is valuable

6. Include pronunciation hints when helpful (similar sound in English or French)

Format your response as a JSON object with a "cards" array containing objects with:
- "front": the question/prompt side (HTML formatting supported)
- "back": the answer/explanation side (HTML formatting supported)
- "reverse": boolean - true if this card should also be studied in reverse direction

Example format:
{
  "cards": [
    {
      "front": "<h3>Keefak?</h3>",
      "back": "<p><strong>How are you?</strong> (masculine)</p><p><strong>Lebanese:</strong> Keefak?</p><p><strong>MSA:</strong> Kayf halak? (كيف حالك؟)</p><p>Used when greeting a male. For females, use <em>Keefik?</em> (Lebanese) or <em>Kayf halik?</em> (MSA)</p>",
      "reverse": true
    },
    {
      "front": "<p>How do you say 'How are you?' to a woman in Lebanese Arabic?</p>",
      "back": "<p><strong>Lebanese:</strong> Keefik?</p><p><strong>MSA:</strong> Kayf halik? (كيف حالك؟)</p><p>Note the <em>-ik</em> ending for feminine in both dialects</p>",
      "reverse": false
    },
    {
      "front": "<h3>بيت (House)</h3>",
      "back": "<p><strong>House</strong></p><p><strong>Lebanese:</strong> Bayt (بيت)</p><p><strong>MSA:</strong> Bayt (بيت)</p><p>This word is the same in both dialects</p>",
      "reverse": true
    },
    {
      "front": "<p>What's the difference between Lebanese and MSA for 'want'?</p>",
      "back": "<p><strong>Lebanese:</strong> Biddi (بدي) - I want</p><p><strong>MSA:</strong> Ureed (أريد) - I want</p><p>Lebanese uses 'biddi' while MSA uses 'ureed' - completely different words for the same meaning</p>",
      "reverse": false
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

    // Ensure reverse is boolean
    validCards.forEach(card => {
      if (typeof card.reverse !== 'boolean') {
        card.reverse = false;
      }
    });

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