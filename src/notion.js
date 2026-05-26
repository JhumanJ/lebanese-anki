const { Client } = require('@notionhq/client');
const config = require('./config');
const Lesson = require('./lesson');

class NotionService {
  constructor() {
    this.notion = new Client({
      auth: config.notion.token,
    });
  }

  async fetchLessons(pageId = config.notion.pageId, startCursor = null) {
    try {
      console.log(`Fetching Notion page: ${pageId}`);
      
      if (startCursor) {
        console.log(`📍 Resuming from divider: ${startCursor}`);
      }
      
      // Get all blocks from the page (with pagination)
      const blocks = await this.getAllBlocks(pageId, startCursor);
    
      // Split blocks into lessons by dividers
      const lessons = this.splitBlocksIntoLessons(blocks);

      return lessons
    } catch (error) {
      console.error('Error fetching Notion page:', error.message);
      throw error;
    }
  }

  // Get all blocks from a page with pagination support and optional cursor start
  async getAllBlocks(pageId, startCursor = null) {
    const allBlocks = [];
    let cursor = startCursor;
    let hasMore = true;

    if (startCursor) {
      console.log(`Fetching blocks from page: ${pageId} (starting after cursor)`);
    } else {
      console.log(`Fetching all blocks from page: ${pageId}`);
    }

    while (hasMore) {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
        ...(cursor && { start_cursor: cursor }),
      });

      allBlocks.push(...response.results);
      
      hasMore = response.has_more;
      cursor = response.next_cursor;
      
      console.log(`Fetched ${response.results.length} blocks (total: ${allBlocks.length})`);
    }

    console.log(`✅ Fetched ${allBlocks.length} blocks from page`);
    return allBlocks;
  }

  splitBlocksIntoLessons(blocks) {
    const lessons = [];
    let currentLessonBlocks = [];
    let lessonIndex = 0;
    let currentDividerId = null;

    console.log(`Processing ${blocks.length} blocks to split into lessons`);

    for (const block of blocks) {
      // Check if this is a divider block
      if (block.type === 'divider') {
        // If we have accumulated blocks, create a lesson
        if (currentLessonBlocks.length > 0) {
          const lesson = new Lesson(currentLessonBlocks, this.notion, lessonIndex, currentDividerId);
          lessons.push(lesson);
          lessonIndex++;
          currentLessonBlocks = [];
        }
        // Store the divider ID for the next lesson
        currentDividerId = block.id;
      } else {
        // Add block to current lesson
        currentLessonBlocks.push(block);
      }
    }

    // Don't forget the last lesson if there are remaining blocks
    if (currentLessonBlocks.length > 0) {
      const lesson = new Lesson(currentLessonBlocks, this.notion, lessonIndex, currentDividerId);
      lessons.push(lesson);
    }

    console.log(`Created ${lessons.length} lessons from blocks`);
    return lessons;
  }
}

module.exports = NotionService; 