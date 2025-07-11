const { NotionToMarkdown } = require('notion-to-md');
const { ImageDescriptionPrompt } = require('./prompts');

class LessonToMarkdownConverter {
  constructor(notionClient) {
    this.notionClient = notionClient;
    this.n2m = new NotionToMarkdown({ notionClient });
    this.imagePrompt = new ImageDescriptionPrompt();
  }

  async convertLessonToMarkdown(lesson) {
    try {
      console.log(`Converting lesson ${lesson.id} to markdown...`);
      
      // Step 1: Separate image blocks from other blocks
      const { imageBlocks, regularBlocks } = this.separateBlocks(lesson.blocks);
      
      console.log(`Found ${imageBlocks.length} images and ${regularBlocks.length} regular blocks`);
      
      // Step 2: Convert regular blocks to markdown
      let regularMarkdown = '';
      if (regularBlocks.length > 0) {
        regularMarkdown = await this.convertRegularBlocksToMarkdown(regularBlocks);
      }
      
      // Step 3: Process all images in parallel
      let imageMarkdown = '';
      if (imageBlocks.length > 0) {
        imageMarkdown = await this.processImagesInParallel(imageBlocks);
      }
      
      // Step 4: Combine regular markdown and image descriptions
      const finalMarkdown = this.combineMarkdown(regularMarkdown, imageMarkdown);
      
      console.log(`✅ Converted lesson ${lesson.id} to markdown (${finalMarkdown.length} characters)`);
      return finalMarkdown;
      
    } catch (error) {
      console.error(`Error converting lesson ${lesson.id} to markdown:`, error.message);
      throw error;
    }
  }

  separateBlocks(blocks) {
    const imageBlocks = [];
    const regularBlocks = [];
    
    blocks.forEach(block => {
      if (block.type === 'image') {
        imageBlocks.push(block);
      } else {
        regularBlocks.push(block);
      }
    });
    
    // Debug: Log what we're separating
    console.log('Block separation debug:');
    console.log(`- Total blocks: ${blocks.length}`);
    console.log(`- Image blocks: ${imageBlocks.length}`);
    console.log(`- Regular blocks: ${regularBlocks.length}`);
    console.log(`- Regular block types: ${regularBlocks.map(b => b.type).join(', ')}`);
    
    return { imageBlocks, regularBlocks };
  }

  async convertRegularBlocksToMarkdown(blocks) {
    try {
      if (!blocks || blocks.length === 0) {
        return '';
      }

      // Convert blocks to markdown using notion-to-md
      const mdblocks = await this.n2m.blocksToMarkdown(blocks);
      const mdResult = this.n2m.toMarkdownString(mdblocks);
      
      // Extract the actual markdown string
      let markdown = typeof mdResult === 'string' ? mdResult : mdResult.parent;
      
      if (!markdown) {
        return '';
      }
      
      // Post-process: Remove image markdown references
      // This handles images that are nested inside column_list or other container blocks
      const originalLength = markdown.length;
      
      // Remove image markdown patterns: ![alt text](url)
      markdown = markdown.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
      
      // Remove empty lines that might be left after removing images
      markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // Trim whitespace
      markdown = markdown.trim();
      
      // Debug: Log what we removed
      const removedLength = originalLength - markdown.length;
      if (removedLength > 0) {
        console.log(`✅ Removed ${removedLength} characters of image markdown from regular content`);
      }
      
      return markdown;
    } catch (error) {
      console.error('Error converting regular blocks to markdown:', error.message);
      return '';
    }
  }

  async processImagesInParallel(imageBlocks) {
    try {
      console.log(`Processing ${imageBlocks.length} images in parallel...`);
      
      // Process all images in parallel
      const imagePromises = imageBlocks.map((block, index) => 
        this.processImageBlock(block, index)
      );
      
      const processedImages = await Promise.all(imagePromises);
      
      // Filter out failed processed images and combine into markdown
      const validImages = processedImages.filter(img => img !== null);
      
      if (validImages.length === 0) {
        return '';
      }
      
      // Format all images into XML-style markdown
      let imageMarkdown = '\n\n---\n\n# Images in this Lesson\n\n';
      
      validImages.forEach((imageData, index) => {
        imageMarkdown += this.formatImageAsXML(imageData);
      });
      
      return imageMarkdown;
      
    } catch (error) {
      console.error('Error processing images in parallel:', error.message);
      return '';
    }
  }

  async processImageBlock(imageBlock, index) {
    try {
      const imageUrl = imageBlock.image?.external?.url || imageBlock.image?.file?.url;
      const caption = this.extractRichText(imageBlock.image?.caption);
      
      if (!imageUrl) {
        console.warn(`Image block ${index} has no URL, skipping`);
        return null;
      }
      
      console.log(`Processing image ${index}: ${imageUrl.substring(0, 50)}...`);
      
      // Extract content from image using ImageDescriptionPrompt
      const extractedContent = await this.imagePrompt.extractFromImage(
        imageUrl, 
        `Lebanese Arabic lesson image ${index + 1}${caption ? ` with caption: ${caption}` : ''}`
      );
      
      return {
        index,
        blockId: imageBlock.id,
        url: imageUrl,
        caption,
        extractedContent
      };
      
    } catch (error) {
      console.error(`Error processing image ${index}:`, error.message);
      return null;
    }
  }

  formatImageAsXML(imageData) {
    return `
<image id="${imageData.blockId}">
  <extracted-content>
${this.indentContent(imageData.extractedContent, 4)}
  </extracted-content>
</image>

`;
  }

  indentContent(content, spaces) {
    const indent = ' '.repeat(spaces);
    return content
      .split('\n')
      .map(line => line.trim() ? indent + line : line)
      .join('\n');
  }

  combineMarkdown(regularMarkdown, imageMarkdown) {
    let combined = '';
    
    // Add regular content first
    if (regularMarkdown && regularMarkdown.trim()) {
      combined += regularMarkdown.trim();
    }
    
    // Add image content at the bottom
    if (imageMarkdown && imageMarkdown.trim()) {
      combined += imageMarkdown;
    }
    
    return combined.trim();
  }

  extractRichText(richText) {
    if (!richText || !Array.isArray(richText)) return '';
    return richText.map(text => text.plain_text || '').join('').trim();
  }
}

module.exports = LessonToMarkdownConverter; 