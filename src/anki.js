const axios = require('axios');
const config = require('./config');

class NojiService {
  constructor() {
    this.nojiApiUrl = config.noji.apiUrl;
    this.bearerToken = config.noji.bearerToken;
    this.deckId = config.noji.deckId;
    this.headers = {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Creates a single card in Noji
   * @param {Object} card - Card object with front, back, and optional reverse
   * @param {string} card.front - Front side content (HTML supported)
   * @param {string} card.back - Back side content (HTML supported)
   * @param {boolean} card.reverse - Whether to create reverse cards (default: false)
   * @returns {Promise<Object>} Response from Noji API
   */
  async createCard(card) {
    try {
      const noteData = {
        note: {
          template_id: "front_to_back",
          fields: {
            front_side: card.front,
            back_side: card.back
          },
          deck_id: parseInt(this.deckId),
          field_attachments_map: {},
          reverse: card.reverse || false
        }
      };

      const response = await axios.post(`${this.nojiApiUrl}/api/notes`, noteData, {
        headers: this.headers,
      });

      console.log(`Card created successfully${card.reverse ? ' (with reverse)' : ''}`);
      return response.data;
    } catch (error) {
      console.error('Error creating card:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * Creates multiple cards in Noji
   * @param {Array} cards - Array of card objects
   * @returns {Promise<Object>} Summary of created cards
   */
  async addCards(cards) {
    try {
      console.log(`Adding ${cards.length} cards to Noji...`);
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];

      for (const card of cards) {
        try {
          await this.createCard(card);
          successCount++;
        } catch (error) {
          failCount++;
          errors.push({
            card: card,
            error: error.message
          });
        }
      }

      console.log(`Successfully added ${successCount} cards`);
      if (failCount > 0) {
        console.warn(`Failed to add ${failCount} cards`);
        console.warn('Failed cards:', errors);
      }
      
      return { 
        success: successCount, 
        failed: failCount,
        errors: errors
      };
    } catch (error) {
      console.error('Error in batch card creation:', error.message);
      throw error;
    }
  }

  /**
   * Test connection to Noji API and validate deck access
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      console.log('Testing Noji API connection...');
      console.log(`Testing access to deck ID: ${this.deckId}`);
      
      // Test by accessing the specific deck
      const response = await axios.get(`${this.nojiApiUrl}/api/decks/${this.deckId}`, {
        headers: this.headers,
      });
      
      console.log(`Noji API connection successful (status: ${response.status})`);
      
      // Extract deck info from response
      if (response.data && response.data.name) {
        console.log(`Deck found: "${response.data.name}"`);
        if (response.data.card_count !== undefined) {
          console.log(`Current card count: ${response.data.card_count}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Noji API connection failed:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 404) {
          console.error('💡 Deck not found. Check your NOJI_DECK_ID in the .env file');
        } else if (error.response.status === 401 || error.response.status === 403) {
          console.error('💡 Authentication failed. Check your NOJI_BEARER_TOKEN in the .env file');
        }
      }
      console.error('Make sure your Noji bearer token and deck ID are valid');
      return false;
    }
  }

  /**
   * Formats text content as HTML for Noji
   * Supported tags: h1-h6, p, strong, em, u, s, ul, ol, li
   * @param {string} text - Plain text or HTML content
   * @returns {string} HTML formatted content
   */
  formatAsHtml(text) {
    // If already contains HTML tags, return as-is
    if (/<[^>]*>/.test(text)) {
      return text;
    }
    
    // Otherwise, wrap in paragraph tags
    return `<p>${text}</p>`;
  }

  /**
   * Helper method to create a card with automatic HTML formatting
   * @param {string} front - Front side content
   * @param {string} back - Back side content
   * @param {boolean} reverse - Whether to create reverse cards
   * @returns {Promise<Object>} Response from Noji API
   */
  async createFormattedCard(front, back, reverse = false) {
    return this.createCard({
      front: this.formatAsHtml(front),
      back: this.formatAsHtml(back),
      reverse: reverse
    });
  }
}

module.exports = NojiService; 