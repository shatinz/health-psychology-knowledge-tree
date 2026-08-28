/**
 * Feynman Active Recall & Conceptual Explanation Engine (Beta)
 * Evaluates user's self-explanation against branch knowledge concepts.
 * Requires >= 80% concept coverage to achieve branch mastery and unlock progression.
 */

class FeynmanEngine {
  constructor(docManager, onNavigateToNode) {
    this.docManager = docManager;
    this.onNavigateToNode = onNavigateToNode;
    this.masteryRecords = this.loadMasteryRecords();
    this.speechRecognition = null;
    this.isListening = false;

    this.initSpeechRecognition();
  }

  loadMasteryRecords() {
    try {
      const saved = localStorage.getItem('omni_feynman_mastery');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('Failed to load Feynman mastery from localStorage:', e);
      return {};
    }
  }

  saveMasteryRecords() {
    try {
      localStorage.setItem('omni_feynman_mastery', JSON.stringify(this.masteryRecords));
    } catch (e) {
      console.error('Failed to save Feynman mastery records:', e);
    }
  }

  isNodeMastered(nodeId) {
    return !!(this.masteryRecords[nodeId] && this.masteryRecords[nodeId].passed);
  }

  initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.speechRecognition = new SpeechRecognition();
        this.speechRecognition.continuous = true;
        this.speechRecognition.interimResults = true;
        this.speechRecognition.lang = 'fa-IR';
      }
    }
  }

  normalizeText(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[\u200c\s]+/g, ' ')
      .replace(/[ي]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[،\.\:\؛\؟\!\(\)\[\]\"\'\-\–\—\/\\]/g, ' ')
      .trim();
  }

  extractMeaningfulKeywords(text) {
    if (!text) return [];
    const stopWords = new Set([
      'این', 'آن', 'برای', 'است', 'شد', 'شده', 'می', 'در', 'به', 'با', 'که', 'از',
      'یک', 'یا', 'و', 'نیز', 'هم', 'اما', 'اگر', 'چون', 'بین', 'روی', 'زیر', 'پس',
      'پیش', 'دارد', 'دارند', 'بود', 'بودند', 'شود', 'شوند', 'کند', 'کنند', 'باشد',
      'باشند', 'خواهد', 'مورد', 'بخش', 'صورت', 'عنوان', 'دست', 'نوع', 'گروه', 'سال',
      'باید', 'نباید', 'بوده', 'شوند', 'گردد', 'می‌شود', 'می‌باشد', 'می‌کند'
    ]);

    const norm = this.normalizeText(text);
    return norm
      .split(' ')
      .filter(w => w.length >= 2 && !stopWords.has(w));
  }

  /**
   * Extracts key conceptual clusters for a given knowledge tree node
   */
  extractTargetConcepts(node) {
    const concepts = [];

    // 1. Title Subject Keywords
    const titleWords = this.extractMeaningfulKeywords(node.title);
    if (titleWords.length > 0) {
      concepts.push({
        category: 'موضوع اصلی سرفصل',
        label: node.title,
        keywords: titleWords
      });
    }

    // 2. Researchers cluster
    if (node.researchers && Array.isArray(node.researchers)) {
      node.researchers.forEach(r => {
        const cleanR = r.replace(/\([^\)]+\)/g, '').trim();
        const tokens = this.extractMeaningfulKeywords(cleanR);
        concepts.push({
          category: 'نظریه‌پردازان و پیشگامان',
          label: r,
          keywords: tokens
        });
      });
    }

    // 3. Detailed points and core clinical characteristics
    const points = node.detailed_points || [];
    points.slice(0, 10).forEach((pt) => {
      const words = this.extractMeaningfulKeywords(pt.text);
      if (words.length >= 2) {
        concepts.push({
          category: 'ویژگی بالینی و تشخیصی',
          label: pt.text.length > 50 ? pt.text.substring(0, 45) + '...' : pt.text,
          keywords: words.slice(0, 6)
        });
      }
    });

    // Fallback if very few concepts
    if (concepts.length < 3) {
      const words = this.extractMeaningfulKeywords((node.summary || '') + ' ' + (node.full_text || ''));
      for (let i = 0; i < words.length && concepts.length < 6; i += 2) {
        const pair = words.slice(i, i + 2);
        concepts.push({
          category: 'مفاهیم اساسی درس',
          label: pair.join(' '),
          keywords: pair
        });
      }
    }

    // De-duplicate concepts by label
    const unique = [];
    const seen = new Set();
    concepts.forEach(c => {
      if (!seen.has(c.label)) {
        seen.add(c.label);
        unique.push(c);
      }
    });

    return unique.slice(0, 6); // Top 6 core concept clusters
  }

  /**
   * Evaluates the user's explanation against the target node's concepts
   * Returns a score (0-100), matched concepts, missed concepts, and actionable feedback
   */
  evaluateExplanation(node, userExplanation) {
    if (!userExplanation || userExplanation.trim().length < 15) {
      return {
        score: 0,
        passed: false,
        wordCount: 0,
        matchedConcepts: [],
        missedConcepts: this.extractTargetConcepts(node),
        feedback: 'توضیحات بسیار کوتاه است. لطفاً حداقل در چند جمله مفهوم کامل این شاخه را بازگو نمایید.'
      };
    }

    const normUserText = this.normalizeText(userExplanation);
    const userWords = normUserText.split(' ');
    const wordCount = userWords.length;
    const targetConcepts = this.extractTargetConcepts(node);

    if (targetConcepts.length === 0) {
      return {
        score: 100,
        passed: true,
        wordCount,
        matchedConcepts: [],
        missedConcepts: [],
        feedback: 'مفاهیم این بخش بررسی شدند.'
      };
    }

    const matchedConcepts = [];
    const missedConcepts = [];

    targetConcepts.forEach(concept => {
      let isConceptMatched = false;

      for (const kw of concept.keywords) {
        const normKw = this.normalizeText(kw);
        if (normKw.length >= 2 && normUserText.includes(normKw)) {
          isConceptMatched = true;
          break;
        }
      }

      if (isConceptMatched) {
        matchedConcepts.push(concept);
      } else {
        missedConcepts.push(concept);
      }
    });

    // Calculate Raw Match Ratio (0 to 100)
    const rawCoverage = (matchedConcepts.length / targetConcepts.length) * 100;

    let finalScore = Math.min(100, Math.round(rawCoverage));
    const passed = finalScore >= 80;

    if (passed) {
      this.masteryRecords[node.id] = {
        passed: true,
        score: finalScore,
        wordCount,
        timestamp: Date.now()
      };
      this.saveMasteryRecords();
      if (window.omniApp && window.omniApp.treeRenderer) {
        window.omniApp.treeRenderer.render();
      }
    }

    let feedback = '';
    if (passed) {
      feedback = `🎉 تبریک! شما با کسب نمره ${finalScore}٪ (بیشتر از ۸۰٪) تسلط مفهومی خود بر شاخه «${node.title}» را اثبات کردید. قفل شاخه‌های بعدی باز گردید.`;
    } else {
      feedback = `⚠️ پوشش مفاهیم: ${finalScore}٪ (حداقل ۸۰٪ مورد نیاز است). برای تسلط، لطفاً مفاهیم جاافتاده مشخص‌شده در زیر را مرور کرده و مجدداً بازگویی کنید.`;
    }

    return {
      score: finalScore,
      passed,
      wordCount,
      matchedConcepts,
      missedConcepts,
      feedback
    };
  }

  /**
   * Opens the interactive Feynman Challenge Modal for a given node
   */
  openFeynmanModal(nodeId) {
    const node = this.docManager.nodeIndex.get(nodeId);
    if (!node) return;

    let modal = document.getElementById('feynman-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'feynman-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md';
      document.body.appendChild(modal);
    }

    const targetConcepts = this.extractTargetConcepts(node);
    const existingMastery = this.masteryRecords[node.id];

    modal.innerHTML = `
      <div class="glass-panel w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/60 to-purple-950/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xl text-purple-300">
              🎙️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="badge bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">تکنیک فاینمن (Active Recall)</span>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">شرط قبولی: ۸۰٪ پوشش مفاهیم</span>
              </div>
              <h3 class="text-base font-bold text-white mt-1">${node.title}</h3>
            </div>
          </div>
          <button onclick="document.getElementById('feynman-modal').classList.add('hidden')" class="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1 text-sm">
          <!-- Prompt Instructions -->
          <div class="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs leading-relaxed space-y-1">
            <div class="font-bold flex items-center gap-1.5 text-purple-300">
              <span>💡</span>
              <span>دستورالعمل چالش فاینمن:</span>
            </div>
            <p class="text-justify text-slate-300">
              تصور کنید می‌خواهید این مبحث را به فرد دیگری آموزش دهید. بدون نگاه کردن به کتاب، آنچه از این سرفصل فهمیده‌اید را بنویسید یا به صورت صوتی بازگو کنید. موتور هوشمند با ارزیابی مفاهیم کلیدی، نمره تسلط شما را محاسبه می‌کند.
            </p>
          </div>

          <!-- Target Concept Hints Checklist -->
          <div class="bg-black/30 p-3.5 rounded-xl border border-white/5 space-y-2">
            <span class="text-xs font-semibold text-slate-400">مفاهیم کلیدی مورد انتظار در این مبحث (${targetConcepts.length} محور اساسی):</span>
            <div class="flex flex-wrap gap-1.5">
              ${targetConcepts.map(c => `
                <span class="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-white/10">
                  🔹 ${c.label}
                </span>
              `).join('')}
            </div>
          </div>

          <!-- Input Area -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-300">توضیحات و بازگویی شما:</label>
              <div class="flex items-center gap-2">
                <button id="btn-voice-feynman" class="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition flex items-center gap-1 cursor-pointer">
                  <span>🎤</span>
                  <span id="voice-btn-label">ورود صوتی (فارسی)</span>
                </button>
              </div>
            </div>

            <textarea id="feynman-user-input" rows="6" placeholder="مفاهیم، تعاریف، ملاک‌ها، نظریه‌پردازان و نکات مهم این شاخه را اینجا تایپ کنید یا دکمه صوتی را بزنید..." class="w-full p-3.5 rounded-xl bg-slate-950/80 border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-purple-400 transition placeholder-slate-500"></textarea>
          </div>

          <!-- Live Evaluation Result Box (Populated after submit) -->
          <div id="feynman-eval-result" class="hidden space-y-3"></div>
        </div>

        <!-- Footer Actions -->
        <div class="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between gap-3">
          <div class="text-xs text-slate-400">
            ${existingMastery ? `<span class="text-emerald-400 font-semibold">🏆 قبلاً با نمره ${existingMastery.score}٪ پاس شده است</span>` : 'در حال ارزیابی اولیه'}
          </div>

          <div class="flex items-center gap-2">
            <button onclick="document.getElementById('feynman-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer">
              انصراف
            </button>
            <button id="btn-submit-feynman" class="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition cursor-pointer flex items-center gap-1.5">
              <span>⚡</span>
              <span>ارزیابی و سنجش تسلط ۸۰٪</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');

    // Attach Voice button listener
    const voiceBtn = document.getElementById('btn-voice-feynman');
    const voiceLabel = document.getElementById('voice-btn-label');
    const inputArea = document.getElementById('feynman-user-input');

    if (this.speechRecognition && voiceBtn) {
      voiceBtn.onclick = () => {
        if (!this.isListening) {
          try {
            this.speechRecognition.start();
            this.isListening = true;
            voiceBtn.classList.add('bg-rose-500/30', 'border-rose-500/50', 'text-rose-300', 'animate-pulse');
            voiceLabel.textContent = 'در حال ضبط صدا... (توقف)';
          } catch (e) {
            console.error('Speech recognition start failed:', e);
          }
        } else {
          try {
            this.speechRecognition.stop();
            this.isListening = false;
            voiceBtn.classList.remove('bg-rose-500/30', 'border-rose-500/50', 'text-rose-300', 'animate-pulse');
            voiceLabel.textContent = 'ورود صوتی (فارسی)';
          } catch (e) {
            console.error('Speech recognition stop failed:', e);
          }
        }
      };

      this.speechRecognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        inputArea.value = (inputArea.value ? inputArea.value + ' ' : '') + transcript;
      };

      this.speechRecognition.onerror = (e) => {
        console.warn('Speech recognition error:', e);
        this.isListening = false;
        voiceBtn.classList.remove('bg-rose-500/30', 'border-rose-500/50', 'text-rose-300', 'animate-pulse');
        voiceLabel.textContent = 'ورود صوتی (فارسی)';
      };
    } else if (voiceBtn) {
      voiceBtn.onclick = () => {
        alert('تشخیص گفتار در این مرورگر پشتیبانی نمی‌شود. لطفاً متن را مستقیماً تایپ کنید.');
      };
    }

    // Attach Submit button listener
    const submitBtn = document.getElementById('btn-submit-feynman');
    const resultBox = document.getElementById('feynman-eval-result');

    submitBtn.onclick = () => {
      const userText = inputArea.value;
      const evalResult = this.evaluateExplanation(node, userText);

      resultBox.classList.remove('hidden');
      resultBox.innerHTML = `
        <div class="p-4 rounded-xl border ${evalResult.passed ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-rose-950/40 border-rose-500/40'} space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">${evalResult.passed ? '🏆' : '⚠️'}</span>
              <div>
                <div class="font-bold text-white text-sm">
                  نمره تسلط مفهومی: ${evalResult.score}٪ ${evalResult.passed ? '(قبولی در چالش فاینمن)' : '(نیازمند بازخوانی)'}
                </div>
                <div class="text-[11px] text-slate-300">${evalResult.feedback}</div>
              </div>
            </div>
            <div class="text-2xl font-black ${evalResult.passed ? 'text-emerald-400' : 'text-rose-400'}">
              ${evalResult.score}%
            </div>
          </div>

          <!-- Matched Concepts Checklist -->
          ${evalResult.matchedConcepts.length > 0 ? `
            <div class="space-y-1 pt-2 border-t border-white/10">
              <span class="text-[11px] font-semibold text-emerald-400">✅ مفاهیم پوشش‌داده‌شده (${evalResult.matchedConcepts.length} مورد):</span>
              <div class="flex flex-wrap gap-1">
                ${evalResult.matchedConcepts.map(c => `
                  <span class="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ${c.label}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Missed Concepts Checklist -->
          ${evalResult.missedConcepts.length > 0 ? `
            <div class="space-y-1 pt-2 border-t border-white/10">
              <span class="text-[11px] font-semibold text-rose-400">❌ مفاهیم جاافتاده که باید بازخوانی شوند (${evalResult.missedConcepts.length} مورد):</span>
              <div class="flex flex-wrap gap-1">
                ${evalResult.missedConcepts.map(c => `
                  <span class="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    ${c.label}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;

      if (evalResult.passed) {
        submitBtn.textContent = '✓ تسلط ثبت شد';
        submitBtn.classList.replace('from-purple-600', 'from-emerald-600');
        submitBtn.classList.replace('to-indigo-600', 'to-teal-600');
      }
    };
  }
}

window.FeynmanEngine = FeynmanEngine;
