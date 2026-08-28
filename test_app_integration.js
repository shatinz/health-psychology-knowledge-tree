const fs = require('fs');
const vm = require('vm');

const context = {
  window: {},
  console: console,
  document: { getElementById: () => null },
  localStorage: { getItem: () => null, setItem: () => null },
  setInterval: setInterval,
  clearInterval: clearInterval
};
context.window.window = context.window;
vm.createContext(context);

vm.runInContext(fs.readFileSync('./js/data-health-psychology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-sample-doc2.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-child-psychopathology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-quiz-bank.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/doc-manager.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/quiz-engine.js', 'utf8'), context);

const result = vm.runInContext(`
  const docMgr = new DocumentManager();
  const quizEng = new QuizEngine(docMgr, () => {});
  
  // Test starting 90% Mastery Challenge for Rett Disorder (cpd_ch12_sec2)
  quizEng.startMasteryChallengeForNode('cpd_ch12_sec2');
  const rettChallenge = {
    title: quizEng.state.activeQuizTitle,
    isMastery: quizEng.state.isMasteryChallenge,
    reqPercent: quizEng.state.requiredMasteryPercent,
    questionCount: quizEng.state.questions.length,
    firstQuestion: quizEng.state.questions[0].question,
    firstOptions: quizEng.state.questions[0].options
  };

  // Simulate scoring 100% on the challenge
  quizEng.state.questions.forEach(q => {
    quizEng.state.userAnswers[q.id] = q.correctIndex;
  });
  quizEng.submitQuiz(true);

  const isMasteredNow = quizEng.isNodeMastered('cpd_ch12_sec2');

  ({
    docCount: docMgr.documents.size,
    totalNodes: docMgr.countNodes(docMgr.getActiveTree()),
    rettChallenge,
    isMasteredNow
  })
`, context);

console.log(JSON.stringify(result, null, 2));
