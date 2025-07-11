const fs = require('fs');
const path = require('path');

class StateManager {
  constructor(stateFile = 'lesson-state.json') {
    this.stateFile = path.join(__dirname, '..', stateFile);
    this.state = this.loadState();
  }

  // Initialize default state structure
  getDefaultState() {
    return {
      version: '1.0',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      processedLessons: {},
      stats: {
        totalLessonsProcessed: 0,
        totalLessonsFound: 0,
        lastPageTitle: null,
        processingStarted: null,
        processingCompleted: null
      }
    };
  }

  // Load state from file or create new one
  loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = fs.readFileSync(this.stateFile, 'utf8');
        const state = JSON.parse(data);
        console.log(`📖 Loaded state: ${state.stats.totalLessonsProcessed} lessons processed`);
        return state;
      }
    } catch (error) {
      console.error('❌ Error loading state file:', error.message);
    }
    
    console.log('📝 Creating new state file');
    return this.getDefaultState();
  }

  // Save state to file
  saveState() {
    try {
      this.state.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2));
      console.log(`💾 State saved: ${this.state.stats.totalLessonsProcessed} lessons processed`);
    } catch (error) {
      console.error('❌ Error saving state file:', error.message);
    }
  }

  // Check if a lesson has been processed
  isLessonProcessed(lessonId) {
    return this.state.processedLessons.hasOwnProperty(lessonId);
  }

  // Mark a lesson as processed
  markLessonAsProcessed(lessonId, lessonData = {}) {
    if (!this.isLessonProcessed(lessonId)) {
      this.state.processedLessons[lessonId] = {
        processedAt: new Date().toISOString(),
        title: lessonData.title || 'Unknown',
        blockCount: lessonData.blockCount || 0,
        hasImages: lessonData.hasImages || false,
        hasText: lessonData.hasText || false,
        blockTypes: lessonData.blockTypes || [],
        ...lessonData
      };
      
      this.state.stats.totalLessonsProcessed++;
      this.saveState();
      
      console.log(`✅ Lesson marked as processed: ${lessonId}`);
      return true;
    }
    
    console.log(`⚠️  Lesson already processed: ${lessonId}`);
    return false;
  }

  // Remove a lesson from processed (for reprocessing)
  unmarkLessonAsProcessed(lessonId) {
    if (this.isLessonProcessed(lessonId)) {
      delete this.state.processedLessons[lessonId];
      this.state.stats.totalLessonsProcessed--;
      this.saveState();
      
      console.log(`🔄 Lesson unmarked for reprocessing: ${lessonId}`);
      return true;
    }
    
    console.log(`⚠️  Lesson was not processed: ${lessonId}`);
    return false;
  }

  // Update stats when processing starts
  startProcessing(pageTitle, totalLessons) {
    this.state.stats.lastPageTitle = pageTitle;
    this.state.stats.totalLessonsFound = totalLessons;
    this.state.stats.processingStarted = new Date().toISOString();
    this.state.stats.processingCompleted = null;
    this.saveState();
    
    console.log(`🚀 Processing started: ${totalLessons} lessons in "${pageTitle}"`);
  }

  // Update stats when processing completes
  completeProcessing() {
    this.state.stats.processingCompleted = new Date().toISOString();
    this.saveState();
    
    console.log(`🎉 Processing completed: ${this.state.stats.totalLessonsProcessed} lessons processed`);
  }

  // Get processed lesson IDs
  getProcessedLessonIds() {
    return Object.keys(this.state.processedLessons);
  }

  // Get unprocessed lessons from a list
  filterUnprocessedLessons(lessons) {
    return lessons.filter(lesson => !this.isLessonProcessed(lesson.id));
  }

  // Get processing stats
  getStats() {
    const processed = this.state.stats.totalLessonsProcessed;
    const total = this.state.stats.totalLessonsFound;
    const remaining = total - processed;
    const progress = total > 0 ? (processed / total * 100).toFixed(1) : 0;
    
    return {
      ...this.state.stats,
      remaining,
      progress: `${progress}%`,
      isComplete: remaining === 0 && total > 0
    };
  }

  // Get detailed lesson info
  getLessonInfo(lessonId) {
    return this.state.processedLessons[lessonId] || null;
  }

  // Get all processed lessons
  getProcessedLessons() {
    return this.state.processedLessons;
  }

  // Reset state (clear all processed lessons)
  resetState() {
    console.log('🔄 Resetting state...');
    this.state = this.getDefaultState();
    this.saveState();
  }

  // Get summary for display
  getSummary() {
    const stats = this.getStats();
    const recentLessons = Object.entries(this.state.processedLessons)
      .sort((a, b) => new Date(b[1].processedAt) - new Date(a[1].processedAt))
      .slice(0, 3);
    
    return {
      stats,
      recentLessons: recentLessons.map(([id, data]) => ({
        id,
        title: data.title,
        processedAt: data.processedAt
      }))
    };
  }
}

module.exports = StateManager; 