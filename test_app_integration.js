const fs = require('fs');
const vm = require('vm');

const context = { window: {}, console: console, document: { getElementById: () => null } };
context.window.window = context.window;
vm.createContext(context);

vm.runInContext(fs.readFileSync('./js/data-health-psychology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-sample-doc2.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/data-child-psychopathology.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/doc-manager.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('./js/theorist-engine.js', 'utf8'), context);

const result = vm.runInContext(`
  const docMgr = new DocumentManager();
  const theoristEng = new TheoristEngine(docMgr);
  const achenbachDossier = theoristEng.getTheoristDossier('ایکن باخ');
  achenbachDossier.nodes.map(n => ({ id: n.id, title: n.title, full_text: n.full_text, page: n.page }))
`, context);

console.log(JSON.stringify(result, null, 2));
