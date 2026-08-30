const fs = require('fs');
const vm = require('vm');

const context = {
  window: {},
  console: console,
  document: {
    getElementById: (id) => ({
      innerHTML: '',
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {} }
    })
  },
  localStorage: { getItem: () => null, setItem: () => null }
};
context.window.window = context.window;
vm.createContext(context);

vm.runInContext(fs.readFileSync('./js/data-anki-child-psychology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/anki-engine.js', 'utf8'), context);

const testResult = vm.runInContext(`
  const cards = window.ANKI_CHILD_PSYCHOLOGY_CARDS;
  const engine = new AnkiEngine();

  // Test Chapter Filter
  engine.activeFilterChapter = 'فصل ۲';
  engine.applyFilters();
  const ch2Count = engine.filteredCards.length;

  // Test Weight Filter
  engine.activeFilterChapter = 'all';
  engine.activeFilterWeight = 'ضریب ۳';
  engine.applyFilters();
  const highWeightCount = engine.filteredCards.length;

  // Test Search Query
  engine.activeFilterWeight = 'all';
  engine.searchQuery = 'رت';
  engine.applyFilters();
  const rettCount = engine.filteredCards.length;

  // Test Flip and Next
  engine.searchQuery = '';
  engine.applyFilters();
  engine.toggleFlip();
  const flippedState = engine.isFlipped;
  engine.rateCard('good');
  const indexAfterRate = engine.currentIndex;

  ({
    totalCards: cards.length,
    sampleCard1: {
      id: cards[0].id,
      chapter: cards[0].chapter,
      front: cards[0].front,
      back: cards[0].back.slice(0, 60) + '...'
    },
    ch2Count,
    highWeightCount,
    rettCount,
    flippedState,
    indexAfterRate,
    historySavedCount: engine.reviewedCardIds.size
  })
`, context);

console.log(JSON.stringify(testResult, null, 2));
