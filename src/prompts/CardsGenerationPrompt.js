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
- Grammar explanations that are clear and practical
- Multilingual support (English and French input languages)
- Error correction and completion of incomplete notes
- Spelling correction in Arabic, English, and French`;
  }

  buildPrompt(lessonContent) {
    return `Based on the following Lebanese Arabic lesson notes, create flashcards that will help a student learn effectively.

<LessonContent>
${lessonContent}
</LessonContent>

IMPORTANT NOTES ABOUT THE SOURCE MATERIAL:
- These are student notes, which may contain mistakes, typos, spelling errors, or incomplete information
- **ACTIVELY CORRECT ERRORS**: Fix spelling mistakes in Arabic, English, and French text
- **COMPLETE MISSING TRANSLATIONS**: If Lebanese translations are missing or incomplete, provide the correct Lebanese version
- **FIX MISSPELLED ARABIC**: Correct any misspelled Arabic words (both Lebanese and MSA)
- **FILL LOGICAL GAPS**: Complete obvious sequences or missing elements within the same topic
- Example: If student noted numbers 1, 2, 3, 5 but missed 4, include the missing number 4
- Example: If student noted days Monday, Tuesday, Thursday but missed Wednesday, include it
- Example: If a word shows "house: بيت" but the Lebanese is missing, add both "بيت (MSA/Lebanese: same)"
- Example: If "I want" shows only "أريد" but missing Lebanese, add "Lebanese: بدي, MSA: أريد"
- Don't add entirely new topics or concepts not mentioned in the notes
- Notes use the syntax "word(lebanese version): meaning" to represent a word and its meaning. Sometimes also "word singular -> word plural: meaning"
- **DUAL DIALECT REQUIREMENT**: When you encounter Arabic words, identify whether they are Lebanese or MSA, and always provide the equivalent in the other dialect when it differs
- **MULTILINGUAL SUPPORT**: Handle English and French input languages equally - create cards from both to Arabic

Please create flashcards following these guidelines:

1. COMPREHENSIVE COVERAGE: Create as many cards as necessary to thoroughly cover ALL vocabulary, phrases, grammar concepts, and cultural information from the lesson. Don't limit yourself - complete coverage is more important than brevity.

2. OVERLAPPING CARDS: Create multiple cards for the same concept from different angles if needed.

3. DUAL DIALECT APPROACH: The student is learning both Lebanese Arabic and Modern Standard Arabic simultaneously. For vocabulary and phrases:
   - Include BOTH Lebanese Arabic and Modern Standard Arabic versions when they differ
   - If a word appears in MSA in the notes but has a different Lebanese equivalent, include both
   - When both versions are the same, mention this to reinforce the connection
   - Use clear labeling: "Lebanese:" and "MSA:" or "Standard Arabic:"

4. CARD TYPES:
   - **Recognition cards** (Arabic → English/French): Front = Arabic script only, Back = English/French translation + pronunciation hints + dialect info
   - **Production cards** (English/French → Lebanese): Front = English/French phrase/word, Back = Lebanese Arabic script only
   - **Production cards** (English/French → MSA): Front = English/French phrase/word, Back = MSA Arabic script only
   - **Bidirectional production**: Create BOTH Lebanese and MSA production cards for the same English/French term when they differ
   - **Dialect comparison cards**: When Lebanese ≠ MSA, create separate cards comparing the dialects
   - **Grammar concepts**: Front = Grammar rule or example, Back = Explanation covering both dialects when relevant
   - **Cultural context**: Front = Cultural concept, Back = Explanation and significance
   - **Pronunciation cards**: For difficult words, Front = Arabic, Back = Pronunciation guide + meaning + transcription

5. SEPARATE CARDS FOR VOCABULARY: Instead of using reverse cards, create dedicated cards for different learning objectives:
   - **Arabic Reading Practice**: Arabic script only on front → English/French + pronunciation on back
   - **Lebanese Production Practice**: English/French on front → Lebanese Arabic script only on back
   - **MSA Production Practice**: English/French on front → MSA Arabic script only on back
   - **Dialect Distinction**: When Lebanese differs from MSA, create a separate card specifically for this comparison
   - **CRITICAL**: For each vocabulary item, create BOTH Lebanese and MSA production cards when they differ

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

9. ERROR CORRECTION EXAMPLES: Actively fix and improve the source material:
   - If notes say "house: bayt" but miss Arabic script, add "بيت"
   - If notes show "أكل" but miss Lebanese version, add "Lebanese: أكل (same as MSA)"
   - If notes show "سيارة" for "car" but miss Lebanese "عربية", include both versions
   - Fix any obvious typos in English, French, or Arabic text

Format your response as a JSON object with a "cards" array containing objects with:
- "front": the question/prompt side (HTML formatting supported)
- "back": the answer/explanation side (HTML formatting supported)

Example format:
{
  "cards": [
    {
      "front": "<h3>كيفك؟</h3>",
      "back": "<p><strong>How are you?</strong> (masculine)</p><p><strong>Comment allez-vous?</strong> (French)</p><p>Pronunciation: /keefak/</p><p><strong>Lebanese:</strong> كيفك؟</p><p><strong>MSA:</strong> كيف حالك؟</p><p>Used when greeting a male. For females, use كيفك؟ (keefik) in Lebanese</p>"
    },
    {
      "front": "<p>How do you say 'How are you?' to a man in Lebanese Arabic?</p>",
      "back": "<h3>كيفك؟</h3><p>Pronunciation: /keefak/</p>"
    },
    {
      "front": "<p>Comment dit-on 'Comment allez-vous?' à un homme en arabe libanais?</p>",
      "back": "<h3>كيفك؟</h3><p>Pronunciation: /keefak/</p>"
    },
    {
      "front": "<p>How do you say 'How are you?' to a man in MSA?</p>",
      "back": "<h3>كيف حالك؟</h3><p>Pronunciation: /kayf haalak/</p>"
    },
    {
      "front": "<h3>بيت</h3>",
      "back": "<p><strong>House / Maison</strong></p><p>Pronunciation: /bayt/</p><p>This word is the same in both Lebanese and MSA</p>"
    },
    {
      "front": "<p>What's the Lebanese word for 'I want'?</p>",
      "back": "<h3>بدي</h3><p>Pronunciation: /biddi/</p>"
    },
    {
      "front": "<p>What's the MSA word for 'I want'?</p>",
      "back": "<h3>أريد</h3><p>Pronunciation: /ureed/</p>"
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