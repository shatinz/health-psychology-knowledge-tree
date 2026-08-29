const fs = require('fs');
const vm = require('vm');

const context = {
  window: {},
  console: console,
  document: { getElementById: () => ({ innerHTML: '' }), createElement: () => ({ classList: { add: () => {}, remove: () => {} }, appendChild: () => {} }) },
  localStorage: { getItem: () => null, setItem: () => null },
  setInterval: setInterval,
  clearInterval: clearInterval
};
context.window.window = context.window;
vm.createContext(context);

vm.runInContext(fs.readFileSync('./js/data-health-psychology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-sample-doc2.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-child-psychopathology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-addiction-psychology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-quiz-bank.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/doc-manager.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/similarity-engine.js'), context);
vm.runInContext(fs.readFileSync('./js/theorist-engine.js'), context);
vm.runInContext(fs.readFileSync('./js/quiz-engine.js'), context);
vm.runInContext(fs.readFileSync('./js/feynman-engine.js'), context);
vm.runInContext(fs.readFileSync('./js/study-partner-engine.js'), context);

const testResult = vm.runInContext(`
  const docMgr = new DocumentManager();
  const docs = docMgr.listDocuments();
  const addictDoc = docMgr.documents.get('doc_addiction_psychology');

  // Test Node: TC Model in Addiction (addict_ch6_sec1)
  const tcNode = docMgr.getNodeById('addict_ch6_sec1');
  const feynman = new FeynmanEngine(docMgr, () => {});
  const concepts = feynman.extractTargetConcepts(tcNode);

  // Test Quiz Engine Dynamic Generation for Addiction Node
  const quizEngine = new QuizEngine(docMgr, () => {});
  quizEngine.startQuickQuizForNode('addict_ch6_sec1');
  const questionsCount = quizEngine.state.questions.length;
  if (quizEngine.state.timerInterval) clearInterval(quizEngine.state.timerInterval);

  // Test Feynman Evaluation on Addiction
  const feynmanExplanation = "جامعه درمان‌مدار یا TC یک روش بازتوانی اقامتی بدون دارو است که بر یادگیری اجتماعی، خودیاری، جلسات رویارویی و نقش‌های سلسله‌مراتبی استوار است و توسط لئون و روسال تبیین شد.";
  const feynmanEval = feynman.evaluateExplanation(tcNode, feynmanExplanation);

  ({
    totalDocs: docs.length,
    docTitles: docs.map(d => d.title),
    addictChapters: addictDoc.tree.children.length,
    addictTotalNodes: docMgr.countNodes(addictDoc.tree),
    tcNodeFound: !!tcNode,
    tcTheorists: tcNode ? tcNode.researchers : [],
    quizQuestionsCount: questionsCount,
    feynmanConceptsCount: concepts.length,
    feynmanScore: feynmanEval.score,
    feynmanPassed: feynmanEval.passed
  })
`, context);

console.log(JSON.stringify(testResult, null, 2));
