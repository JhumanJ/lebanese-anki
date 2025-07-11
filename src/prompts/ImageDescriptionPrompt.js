const BasePrompt = require('./BasePrompt');

class ImageDescriptionPrompt extends BasePrompt {
  constructor(options = {}) {
    super({
      model: options.model || 'gpt-4o-mini',
      temperature: options.temperature || 0.1,
      maxTokens: options.maxTokens || 8000,
      structuredOutputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          document_type: {
            type: 'string',
            description: 'Type of educational content (lesson page, vocabulary list, exercise, grammar explanation, etc.)'
          },
          visual_elements: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of visual elements present (photos, illustrations, diagrams, icons, etc.)'
          },
          layout_description: {
            type: 'string',
            description: 'Overall layout and spatial organization of the content'
          },
          text_content: {
            type: 'object',
            additionalProperties: false,
            properties: {
              arabic_text: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    location: { type: 'string' },
                    text: { type: 'string' }
                  },
                  required: ['location', 'text']
                }
              },
              transliteration: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    location: { type: 'string' },
                    text: { type: 'string' }
                  },
                  required: ['location', 'text']
                }
              },
              english_text: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    location: { type: 'string' },
                    text: { type: 'string' }
                  },
                  required: ['location', 'text']
                }
              },
              other_text: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    location: { type: 'string' },
                    text: { type: 'string' },
                    type: { type: 'string' }
                  },
                  required: ['location', 'text', 'type']
                }
              }
            },
            required: ['arabic_text', 'transliteration', 'english_text', 'other_text']
          },
          spatial_organization: {
            type: 'object',
            additionalProperties: false,
            properties: {
              top_section: { type: 'string' },
              main_content: { type: 'string' },
              sidebar_margins: { type: 'string' },
              bottom_section: { type: 'string' }
            },
            required: ['top_section', 'main_content', 'sidebar_margins', 'bottom_section']
          }
        },
        required: ['document_type', 'visual_elements', 'layout_description', 'text_content', 'spatial_organization']
      },
      ...options
    });
  }

  getSystemPrompt() {
    return `You are an expert at analyzing and extracting content from images of Arabic language learning materials. Your task is to objectively extract and document exactly what is visible in the image.

**CRITICAL RULES:**
- Extract ONLY what is actually written or shown in the image
- Do NOT create, infer, or add translations that aren't visible
- Do NOT make judgments or interpretations about pedagogical approach
- Focus on objective documentation of visual and textual content
- Preserve exact text as written, including any spelling or formatting

**What to extract:**
- Document type (what kind of educational content this is)
- Visual elements present (photos, illustrations, diagrams, icons)
- Layout and spatial organization
- All text content with precise locations
- Exact text in Arabic script, transliteration, and English as shown

**What NOT to do:**
- Do not add explanations not present in the image
- Do not create translations if they're not shown
- Do not analyze or judge the content quality
- Do not make assumptions about missing information`;
  }

  buildPrompt(context = '') {
    return `Extract and document exactly what is visible in this image from Arabic language learning material.

${context ? `Additional context: ${context}` : ''}

**Extract the following information:**

**Document Type:** What kind of educational content is this? (lesson page, vocabulary list, exercise, grammar explanation, dialogue, etc.)

**Visual Elements:** List all visual elements you can see (photos, illustrations, diagrams, icons, drawings, etc.)

**Layout Description:** Describe the overall layout and how content is organized spatially on the page.

**Text Content - Extract exactly as written:**
- **Arabic Text:** All text in Arabic script, exactly as shown, with location
- **Transliteration:** All romanized/transliterated text, exactly as shown, with location  
- **English Text:** All English text, exactly as written, with location
- **Other Text:** Any numbers, phonetic guides, or other text elements with location and type

**Spatial Organization:** Describe what appears in:
- Top section of the page
- Main content area
- Sidebar or margins
- Bottom section of the page

**IMPORTANT:** Only extract what is actually visible. Do not add translations, explanations, or interpretations that aren't shown in the image.`;
  }

  parseResponse(response) {
    try {
      // With structured output, the response should already be a JSON object
      const parsedData = typeof response === 'string' ? JSON.parse(response) : response;
      
      // Convert structured data to markdown format for consistency
      let markdown = `# ${parsedData.document_type}\n\n`;
      
      markdown += `## Visual Elements\n`;
      parsedData.visual_elements.forEach(element => {
        markdown += `- ${element}\n`;
      });
      
      markdown += `\n## Layout\n${parsedData.layout_description}\n\n`;
      
      markdown += `## Text Content\n\n`;
      
      if (parsedData.text_content.arabic_text?.length > 0) {
        markdown += `### Arabic Text\n`;
        parsedData.text_content.arabic_text.forEach(item => {
          markdown += `- **${item.location}**: ${item.text}\n`;
        });
        markdown += `\n`;
      }
      
      if (parsedData.text_content.transliteration?.length > 0) {
        markdown += `### Transliteration\n`;
        parsedData.text_content.transliteration.forEach(item => {
          markdown += `- **${item.location}**: ${item.text}\n`;
        });
        markdown += `\n`;
      }
      
      if (parsedData.text_content.english_text?.length > 0) {
        markdown += `### English Text\n`;
        parsedData.text_content.english_text.forEach(item => {
          markdown += `- **${item.location}**: ${item.text}\n`;
        });
        markdown += `\n`;
      }
      
      if (parsedData.text_content.other_text?.length > 0) {
        markdown += `### Other Text\n`;
        parsedData.text_content.other_text.forEach(item => {
          markdown += `- **${item.location}** (${item.type}): ${item.text}\n`;
        });
        markdown += `\n`;
      }
      
      markdown += `## Spatial Organization\n`;
      if (parsedData.spatial_organization.top_section) {
        markdown += `- **Top**: ${parsedData.spatial_organization.top_section}\n`;
      }
      if (parsedData.spatial_organization.main_content) {
        markdown += `- **Main**: ${parsedData.spatial_organization.main_content}\n`;
      }
      if (parsedData.spatial_organization.sidebar_margins) {
        markdown += `- **Sidebar/Margins**: ${parsedData.spatial_organization.sidebar_margins}\n`;
      }
      if (parsedData.spatial_organization.bottom_section) {
        markdown += `- **Bottom**: ${parsedData.spatial_organization.bottom_section}\n`;
      }
      
      return markdown.trim();
    } catch (error) {
      console.error('Error parsing structured response:', error);
      // Fallback to treating as regular text
      return response.trim();
    }
  }

  validateResponse(parsedResponse) {
    if (!parsedResponse || parsedResponse.length < 10) {
      throw new Error('Extracted content is too short or empty');
    }

    // Check if the response contains meaningful content
    const hasContent = parsedResponse.includes('#') || 
                      parsedResponse.includes('*') || 
                      parsedResponse.includes('-') ||
                      parsedResponse.length > 50;
    
    if (!hasContent) {
      throw new Error('Extracted content appears to be invalid or incomplete');
    }

    return parsedResponse;
  }

  /**
   * Override buildMessages to include image data
   * @param {string} imageData - Base64 image data or image URL
   * @param {string} context - Optional context about what to look for
   * @returns {Array} - Array of message objects for OpenAI API
   */
  buildMessages(imageData, context = '') {
    const userPrompt = this.buildPrompt(context);
    const systemPrompt = this.getSystemPrompt();
    
    return [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData
            }
          }
        ]
      }
    ];
  }

  /**
   * Extract text from image
   * @param {string} imageData - Base64 image data or image URL
   * @param {string} context - Optional context about what to look for
   * @returns {Promise<string>} - Extracted text content in markdown format
   */
  async extractFromImage(imageData, context = '') {
    return await this.execute(imageData, context);
  }
}

module.exports = ImageDescriptionPrompt; 