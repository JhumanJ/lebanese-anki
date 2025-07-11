class Lesson {
  constructor(blocks, notionClient, index = 0, dividerId = null) {
    this.blocks = blocks || [];
    this.notionClient = notionClient;
    this.index = index;
    this.dividerId = dividerId;
    
    // Generate stable lesson ID with hybrid approach
    this.id = this.generateStableId();
  }
  
  generateStableId() {
    const baseId = `lesson-${this.index}`;
    return baseId;
  }



  // Get lesson metadata
  getMetadata() {
    return {
      id: this.id,
      index: this.index,
      dividerId: this.dividerId, // Include divider ID for reference
      blockCount: this.blocks.length,
      blockTypes: this.getBlockTypes(),
      hasImages: this.hasImages(),
      hasText: this.hasText(),
      title: this.extractTitle()
    };
  }

  // Get unique block types in this lesson
  getBlockTypes() {
    return [...new Set(this.blocks.map(block => block.type))];
  }

  // Check if lesson contains images
  hasImages() {
    return this.blocks.some(block => 
      block.type === 'image' || 
      block.type === 'embed' ||
      (block.type === 'paragraph' && block.paragraph?.rich_text?.some(rt => rt.type === 'text' && rt.text?.content?.includes('image')))
    );
  }

  // Check if lesson has text content
  hasText() {
    return this.blocks.some(block => 
      ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote'].includes(block.type)
    );
  }

  // Try to extract a title from the first heading or paragraph
  extractTitle() {
    const firstBlock = this.blocks[0];
    if (!firstBlock) return `Lesson ${this.index + 1}`;

    switch (firstBlock.type) {
      case 'heading_1':
        return this.extractRichText(firstBlock.heading_1?.rich_text);
      case 'heading_2':
        return this.extractRichText(firstBlock.heading_2?.rich_text);
      case 'heading_3':
        return this.extractRichText(firstBlock.heading_3?.rich_text);
      case 'paragraph':
        const text = this.extractRichText(firstBlock.paragraph?.rich_text);
        return text.length > 50 ? text.substring(0, 50) + '...' : text;
      default:
        return `Lesson ${this.index + 1}`;
    }
  }

  // Extract plain text from rich text array
  extractRichText(richText) {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(text => text.plain_text || '').join('').trim();
  }

  // Get all images in the lesson
  getImages() {
    return this.blocks.filter(block => block.type === 'image').map(block => ({
      id: block.id,
      url: block.image?.external?.url || block.image?.file?.url,
      caption: this.extractRichText(block.image?.caption)
    }));
  }

  // Get all text blocks
  getTextBlocks() {
    return this.blocks.filter(block => 
      ['paragraph', 'heading_1', 'heading_2', 'heading_3', 'bulleted_list_item', 'numbered_list_item', 'to_do', 'quote'].includes(block.type)
    );
  }

  // Convert to JSON representation
  toJSON() {
    return {
      id: this.id,
      index: this.index,
      dividerId: this.dividerId,
      metadata: this.getMetadata(),
      blocks: this.blocks
    };
  }
}

module.exports = Lesson; 