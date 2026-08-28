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
  
  // Test starting a chapter quiz for chapter 2 (Achenbach)
  quizEng.startChapterQuiz('cpd_ch2', 'فصل دوم: سنجش و ارزیابی');
  const ch2QCount = quizEng.state.questions.length;
  
  // Answer first question correctly
  const q1 = quizEng.state.questions[0];
  quizEng.selectOption(q1.correctIndex);
  
  const scoreResult = quizEng.calculateResults();
  if (quizEng.state.timerInterval) clearInterval(quizEng.state.timerInterval);
  
  ({
    totalBankQuestions: quizEng.questionBank.length,
    ch2Questions: ch2QCount,
    firstQuestionText: q1.question,
    scoreResult: scoreResult
  })
`, context);

console.log(JSON.stringify(result, null, 2));
