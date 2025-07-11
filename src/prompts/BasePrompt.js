const OpenAI = require('openai');
const config = require('../config');

class BasePrompt {
  constructor(options = {}) {
    // Default configuration
    this.provider = options.provider || 'openai';
    this.model = options.model || config.openai.model;
    this.temperature = options.temperature || 0.7;
    this.maxTokens = options.maxTokens || 2000;
    this.structuredOutputSchema = options.structuredOutputSchema || null;
    
    // Initialize LLM
    this.initializeLLM();
  }

  initializeLLM() {
    switch (this.provider) {
      case 'openai':
        this.openai = new OpenAI({
          apiKey: config.openai.apiKey,
        });
        break;
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Abstract method to be implemented by subclasses
   * Should return the prompt string
   */
  buildPrompt(...args) {
    throw new Error('buildPrompt method must be implemented by subclasses');
  }

  /**
   * Abstract method to be implemented by subclasses
   * Should return the system prompt string
   */
  getSystemPrompt() {
    throw new Error('getSystemPrompt method must be implemented by subclasses');
  }

  /**
   * Build messages array - can be overridden by subclasses for custom message structures
   * @param {...any} args - Arguments passed to execute method
   * @returns {Array} - Array of message objects for OpenAI API
   */
  buildMessages(...args) {
    const userPrompt = this.buildPrompt(...args);
    const systemPrompt = this.getSystemPrompt();
    
    return [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ];
  }

  /**
   * Parse the LLM response - can be overridden by subclasses
   */
  parseResponse(response) {
    return response;
  }

  /**
   * Validate the parsed response - can be overridden by subclasses
   */
  validateResponse(parsedResponse) {
    return parsedResponse;
  }

  /**
   * Main execution method
   */
  async execute(...args) {
    try {
      console.log(`Executing ${this.constructor.name}...`);
      
      const messages = this.buildMessages(...args);

      const requestOptions = {
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
      };

      // Add structured output if schema is provided
      if (this.structuredOutputSchema) {
        requestOptions.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'extraction_result',
            schema: this.structuredOutputSchema,
            strict: true
          }
        };
      }

      const response = await this.openai.chat.completions.create(requestOptions);

      const rawResponse = response.choices[0].message.content;
      const parsedResponse = this.parseResponse(rawResponse);
      const validatedResponse = this.validateResponse(parsedResponse);

      console.log(`✅ ${this.constructor.name} completed successfully`);
      return validatedResponse;
    } catch (error) {
      console.error(`❌ Error in ${this.constructor.name}:`, error.message);
      throw error;
    }
  }
}

module.exports = BasePrompt; 