const NotionService = require('./src/notion');
const { CardsGenerationPrompt } = require('./src/prompts');
const NojiService = require('./src/anki');
const StateManager = require('./src/state');
const LessonToMarkdownConverter = require('./src/LessonToMarkdownConverter');
const config = require('./src/config');

class LebanesAnkiGenerator {
  constructor() {
    this.notionService = new NotionService();
    this.cardsPrompt = new CardsGenerationPrompt();
    this.nojiService = new NojiService();
    this.stateManager = new StateManager();
    this.markdownConverter = new LessonToMarkdownConverter(this.notionService.notion);
  }

  async run() {
    console.log('🇱🇧 Starting Lebanese Anki Generator...\n');
    
    try {
      // Step 1: Validate configuration
      console.log('🔧 Step 1: Validating configuration...');
      config.validateConfig(); // Full validation including Notion
      
      // Step 2: Test Noji API connection
      console.log('📋 Step 2: Testing Noji API connection...');
      const nojiConnected = await this.nojiService.testConnection();
      if (!nojiConnected) {
        console.error('❌ Cannot connect to Noji API. Please check your configuration.');
        process.exit(1);
      }
      console.log('✅ Noji API connection successful\n');

      // Step 3: Fetch lessons from Notion
      console.log('📝 Step 3: Fetching lessons from Notion...');
      const lessons = await this.notionService.fetchLessons();
      console.log(`Found ${lessons.length} lessons`);
      
      // Step 4: Filter out already processed lessons
      console.log('\n🔍 Step 4: Filtering unprocessed lessons...');
      const unprocessedLessons = this.stateManager.filterUnprocessedLessons(lessons);
      console.log(`Found ${unprocessedLessons.length} unprocessed lessons (${lessons.length - unprocessedLessons.length} already processed)`);
      
      if (unprocessedLessons.length === 0) {
        console.log('🎉 All lessons have been processed! Nothing to do.');
        return;
      }
      
      // Step 5: Start processing
      this.stateManager.startProcessing('Lebanese Arabic Lessons', lessons.length);
      
      let totalCardsCreated = 0;
      let totalLessonsProcessed = 0;
      let totalErrors = 0;
      
      // Step 6: Process each lesson
      for (const [index, lesson] of unprocessedLessons.entries()) {
        console.log(`\n📖 Processing lesson ${index + 1}/${unprocessedLessons.length}: ${lesson.id}`);
        console.log(`   Blocks: ${lesson.blocks.length}`);
        
        let result = null;
        let cards = [];
        
        try {
          // Convert lesson to markdown
          console.log('   📄 Converting to markdown...');
          const markdown = await this.markdownConverter.convertLessonToMarkdown(lesson);
          console.log(`   ✅ Converted (${markdown.length} characters)`);
          
          // Skip if markdown is too short (likely empty lesson)
          if (markdown.length < 50) {
            console.log('   ⚠️  Lesson content too short, skipping card generation');
            cards = [];
          } else {
            // Generate cards from the lesson
            console.log('   🤖 Generating cards...');
            cards = await this.cardsPrompt.generateCards(markdown);
            console.log(`   ✅ Generated ${cards.length} cards`);
            
            if (cards.length > 0) {
              // Create cards in Noji
              console.log('   📚 Adding cards to Noji...');
              result = await this.nojiService.addCards(cards);
              console.log(`   ✅ Added ${result.success} cards to Noji`);
              
              if (result.failed > 0) {
                console.log(`   ⚠️  ${result.failed} cards failed to add`);
                totalErrors += result.failed;
              }
              
              totalCardsCreated += result.success;
            }
          }
          
        } catch (error) {
          console.error(`   ❌ Error processing lesson ${lesson.id}:`, error.message);
          console.error(`   Error details:`, error.stack);
          totalErrors++;
          
          // Set default values for failed processing
          result = { success: 0, failed: 0 };
          cards = [];
        }
        
        // Always mark lesson as processed (even if it failed)
        const lessonData = {
          title: `Lesson ${lesson.id}`,
          blockCount: lesson.blocks.length,
          hasImages: lesson.blocks.some(block => block.type === 'image'),
          hasText: lesson.blocks.some(block => block.type === 'paragraph' || block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3'),
          blockTypes: [...new Set(lesson.blocks.map(block => block.type))],
          cardsGenerated: cards.length,
          cardsAdded: result?.success || 0,
          cardsFailed: result?.failed || 0,
          processingSuccessful: result !== null && result.success >= 0
        };
        
        console.log(`   💾 Marking lesson as processed...`);
        this.stateManager.markLessonAsProcessed(lesson.id, lessonData);
        totalLessonsProcessed++;
        
        console.log(`   ✅ Lesson processed and marked as complete`);
      }
      
      // Step 7: Complete processing and show summary
      this.stateManager.completeProcessing();
      
      console.log('\n🎉 Processing Complete!');
      console.log('='.repeat(60));
      console.log(`📊 Summary:`);
      console.log(`   Lessons processed: ${totalLessonsProcessed}`);
      console.log(`   Cards created: ${totalCardsCreated}`);
      console.log(`   Errors: ${totalErrors}`);
      console.log('='.repeat(60));
      
      const stats = this.stateManager.getStats();
      console.log(`📈 Overall Progress: ${stats.progress} (${stats.totalLessonsProcessed}/${stats.totalLessonsFound})`);
      
      if (stats.isComplete) {
        console.log('🏆 All lessons have been processed!');
      }
      
    } catch (error) {
      console.error('❌ Error during execution:', error.message);
      
      // Provide helpful error messages
      if (error.message.includes('Invalid page ID')) {
        console.error('💡 Check your NOTION_PAGE_ID in the .env file');
      } else if (error.message.includes('Unauthorized')) {
        console.error('💡 Check your API keys in the .env file');
      }
      
      process.exit(1);
    }
  }


}

// Run the application
const generator = new LebanesAnkiGenerator();
generator.run(); 