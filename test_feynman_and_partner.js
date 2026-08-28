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
vm.runInContext(fs.readFileSync('./js/doc-manager.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/feynman-engine.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/study-partner-engine.js', 'utf8'), context);

const result = vm.runInContext(`
  const docMgr = new DocumentManager();
  const feynman = new FeynmanEngine(docMgr, () => {});
  const partnerEng = new StudyPartnerEngine(docMgr);

  const rettNode = docMgr.getNodeById('cpd_ch12_sec2');
  const targetConcepts = feynman.extractTargetConcepts(rettNode);

  // Full explanation covering concepts:
  // 1. Topic Title: سندروم رت و هلر
  // 2. Theorists: آندریاس رت و تئودور هلر
  // 3. Symptoms: کاهش رشد سر، حرکات قالبی دست‌ها شستن، پس‌رفت ۲ سال رشد طبیعی
  // 4. Differential & genetics: جهش ژنتیکی دختران و دوره پس‌رفت
  const fullExplanation = "سندروم رت اختلالی پیش‌رونده در دختران است که آندریاس رت آن را توصیف کرد. پس از ۵ ماه رشد طبیعی، دور سر کند شده و حرکات قالبی شستن دست‌ها پدیدار می‌شود. همچنین سندروم هلر یا اختلال ازهم‌پاشیدگی دوران کودکی توسط تئودور هلر در سال ۱۹۰۸ توصیف شد که پس از حداقل ۲ سال رشد کاملاً بهنجار و طبیعی، کودک دچار پس‌رفت در تکلم و ارتباط و مهارت‌های حرکتی می‌شود.";
  const fullEval = feynman.evaluateExplanation(rettNode, fullExplanation);

  ({
    targetConcepts: targetConcepts.map(c => ({ label: c.label, keywords: c.keywords })),
    matchedCount: fullEval.matchedConcepts.length,
    score: fullEval.score,
    passed: fullEval.passed,
    missed: fullEval.missedConcepts.map(c => c.label)
  })
`, context);

console.log(JSON.stringify(result, null, 2));
