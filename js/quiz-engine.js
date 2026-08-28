/**
 * Interactive Exam & Quiz Intelligence Engine (Quiz Studio)
 * Provides comprehensive testing, timed exams, instant grading, performance analytics,
 * explanatory answers, 90% Mastery Lock Challenges, and direct jump links into the Knowledge Tree.
 */

class QuizEngine {
  constructor(docManager, onNavigateToNode) {
    this.docManager = docManager;
    this.onNavigateToNode = onNavigateToNode;
    this.questionBank = window.QUIZ_QUESTION_BANK || [];
    
    // Load custom questions & mastery records from localStorage
    this.loadCustomQuestions();
    this.masteryRecords = this.loadMasteryRecords();
    this.isExamModeActive = localStorage.getItem('omni_exam_mode_active') === 'true';

    this.state = {
      view: 'home', // 'home' | 'active' | 'result'
      activeQuizTitle: '',
      questions: [],
      currentIndex: 0,
      userAnswers: {}, // questionId -> optionIndex
      flagged: new Set(),
      timerSeconds: 0,
      timerInterval: null,
      timeSpentSeconds: 0,
      isMasteryChallenge: false,
      targetMasteryNodeId: null,
      requiredMasteryPercent: 90
    };
  }

  loadMasteryRecords() {
    try {
      const saved = localStorage.getItem('omni_node_mastery');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn('Failed to load node mastery from localStorage:', e);
      return {};
    }
  }

  saveMasteryRecords() {
    try {
      localStorage.setItem('omni_node_mastery', JSON.stringify(this.masteryRecords));
    } catch (e) {
      console.error('Failed to save mastery records:', e);
    }
  }

  isNodeMastered(nodeId) {
    return !!(this.masteryRecords[nodeId] && this.masteryRecords[nodeId].passed);
  }

  toggleExamMode() {
    this.isExamModeActive = !this.isExamModeActive;
    localStorage.setItem('omni_exam_mode_active', this.isExamModeActive.toString());
    this.updateExamModeButtonUI();
    if (window.omniApp && window.omniApp.treeRenderer) {
      window.omniApp.treeRenderer.render();
    }
    return this.isExamModeActive;
  }

  updateExamModeButtonUI() {
    const btn = document.getElementById('btn-toggle-exam-mode');
    if (btn) {
      if (this.isExamModeActive) {
        btn.classList.add('bg-amber-500', 'text-slate-950', 'font-bold', 'shadow-lg', 'shadow-amber-500/30');
        btn.classList.remove('bg-amber-500/10', 'text-amber-400');
        btn.innerHTML = `<span>🔒</span><span>چالش ۹۰٪: فعال</span>`;
      } else {
        btn.classList.remove('bg-amber-500', 'text-slate-950', 'font-bold', 'shadow-lg', 'shadow-amber-500/30');
        btn.classList.add('bg-amber-500/10', 'text-amber-400');
        btn.innerHTML = `<span>🔓</span><span>چالش ۹۰٪: غیرفعال</span>`;
      }
    }
  }

  loadCustomQuestions() {
    try {
      const saved = localStorage.getItem('omni_custom_quiz_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.questionBank = [...window.QUIZ_QUESTION_BANK, ...parsed];
        }
      }
    } catch (e) {
      console.warn('Failed to load custom quiz questions from localStorage:', e);
    }
  }

  saveCustomQuestion(q) {
    try {
      this.questionBank.push(q);
      const customOnly = this.questionBank.filter(x => x.isCustom);
      localStorage.setItem('omni_custom_quiz_questions', JSON.stringify(customOnly));
      return true;
    } catch (e) {
      console.error('Failed to save custom question:', e);
      return false;
    }
  }

  /**
   * Starts a comprehensive exam across all questions
   */
  startComprehensiveQuiz() {
    const shuffled = [...this.questionBank].sort(() => Math.random() - 0.5);
    this.initQuiz('آزمون جامع و شبیه‌ساز کنکور و امتحانات تخصصی', shuffled, 30 * 60, false, null);
  }

  /**
   * Starts a quiz filtered by document
   */
  startDocQuiz(docId, docTitle) {
    const filtered = this.questionBank.filter(q => q.docId === docId);
    const questions = filtered.length > 0 ? filtered : this.questionBank;
    this.initQuiz(`آزمون تخصصی ${docTitle}`, questions, Math.max(10, questions.length * 90), false, null);
  }

  /**
   * Starts a quiz for a specific chapter
   */
  startChapterQuiz(chapterId, chapterTitle) {
    const filtered = this.questionBank.filter(q => q.chapterId === chapterId);
    if (filtered.length === 0) {
      const dynamicQs = this.generateDynamicQuestionsForChapter(chapterId, chapterTitle);
      this.initQuiz(`آزمون فصلی: ${chapterTitle}`, dynamicQs, dynamicQs.length * 90, false, null);
      return;
    }
    this.initQuiz(`آزمون فصلی: ${chapterTitle}`, filtered, filtered.length * 90, false, null);
  }

  /**
   * Starts a 90% Mastery Challenge for a specific branch node
   */
  startMasteryChallengeForNode(nodeId) {
    const node = this.docManager.nodeIndex.get(nodeId);
    if (!node) return;

    // Calculate required question count based on weight
    const count = node.required_quiz_count || (node.exam_weight === 'high' ? 8 : (node.exam_weight === 'medium' ? 5 : 3));
    
    // Find pre-authored questions + generate dynamic questions from detailed_points
    let matched = this.questionBank.filter(q => q.nodeId === nodeId || q.chapterId === node.id || q.chapterId === node.chapterId);
    
    if (matched.length < count && node.detailed_points && node.detailed_points.length > 0) {
      const dynamicQs = this.generateDynamicQuestionsFromDetailedPoints(node, count - matched.length);
      matched = [...matched, ...dynamicQs];
    }
    
    if (matched.length === 0) {
      matched = this.generateDynamicQuestionsForNode(node);
    }

    const finalQuestions = matched.slice(0, count);
    this.initQuiz(`چالش تسلط ۹۰٪: ${node.title}`, finalQuestions, finalQuestions.length * 90, true, nodeId, 90);
  }

  startQuickQuizForNode(nodeId) {
    this.startMasteryChallengeForNode(nodeId);
  }

  generateDynamicQuestionsFromDetailedPoints(node, countNeeded) {
    const points = node.detailed_points || [];
    if (points.length === 0) return [];
    
    const shuffledPoints = [...points].sort(() => Math.random() - 0.5);
    const qs = [];

    shuffledPoints.slice(0, countNeeded).forEach((p, idx) => {
      const pText = p.text.replace(/^[•\-\d\.\:\s]+/, '').trim();
      if (pText.length < 25) return;

      qs.push({
        id: `dyn_pt_${node.id}_${idx}_${Date.now()}`,
        docId: node.docId,
        chapterId: node.chapterId || node.id,
        chapterTitle: node.title,
        nodeId: node.id,
        page: p.page || node.page || 1,
        difficulty: node.exam_weight === 'high' ? 'سخت' : 'متوسط',
        question: `بر اساس مبحث «${node.title}» (ص ${p.page || node.page || 1})، کدام عبارت صحیح است؟`,
        options: [
          pText.length > 160 ? pText.substring(0, 150) + '...' : pText,
          "این خصیصه صرفاً یک نشانه گذرا بوده و در معاینه بالینی مدنظر قرار نمی‌گیرد.",
          "نشانه‌های فوق بر اساس راهنمای DSM نیازمند درمان بستری اجباری هستند.",
          "این حالت هیچ‌گونه زیربنای رشدی، شناختی یا زیست‌شناختی ندارد."
        ],
        correctIndex: 0,
        explanation: `متن دقیق مرجع کتاب (ص ${p.page || node.page || 1}): «${pText}»`
      });
    });

    return qs;
  }

  generateDynamicQuestionsForNode(node) {
    const text = node.full_text || node.summary || '';
    return [{
      id: `dyn_${node.id}_1`,
      docId: node.docId,
      chapterId: node.chapterId || node.id,
      chapterTitle: node.title,
      nodeId: node.id,
      page: node.page || 1,
      difficulty: "متوسط",
      question: `بر اساس متن کتاب در مبحث «${node.title}»، کدام عبارت بیانگر مفهوم صحیح است؟`,
      options: [
        text.length > 150 ? text.substring(0, 140) + '...' : text,
        "این اختلال صرفاً ناشی از خطای اندازه‌گیری آماری است و ارتباطی با عملکرد بالینی ندارد.",
        "درمان این اختلال منحصراً به صورت بستری طولانی‌مدت در آسایشگاه انجام می‌شود.",
        "این حالت هیچ‌گونه ملاک تشخیصی در راهنماهای DSM و ICD ندارد."
      ],
      correctIndex: 0,
      explanation: `متن دقیق مرجع کتاب: «${text}»`
    }];
  }

  generateDynamicQuestionsForChapter(chapterId, chapterTitle) {
    const allNodes = Array.from(this.docManager.nodeIndex.values()).filter(n => n.chapterId === chapterId || n.id === chapterId);
    const qs = [];
    const contentNodes = allNodes.filter(n => n.full_text && n.full_text.length > 50).slice(0, 6);
    
    contentNodes.forEach((node, idx) => {
      qs.push({
        id: `dyn_ch_${chapterId}_${idx}`,
        docId: node.docId,
        chapterId: chapterId,
        chapterTitle: chapterTitle,
        nodeId: node.id,
        page: node.page || 1,
        difficulty: "متوسط",
        question: `بر اساس مباحث ${chapterTitle}، در مورد «${node.title}» کدام گزینه صحیح است؟`,
        options: [
          node.full_text.length > 150 ? node.full_text.substring(0, 140) + '...' : node.full_text,
          "این خصیصه از سنین پس از ۳۰ سالگی پدیدار شده و فاقد ریشه تحولی است.",
          "نشانه‌های این مورد بدون نیاز به ارزیابی بالینی به صورت خودبه‌خودی درمان می‌شوند.",
          "این مفهوم صرفاً در رویکردهای زیست‌شناختی مطرح بوده و در روانشناسی کاربرد ندارد."
        ],
        correctIndex: 0,
        explanation: `متن کامل کتاب: «${node.full_text}»`
      });
    });

    return qs.length > 0 ? qs : this.questionBank.slice(0, 5);
  }

  initQuiz(title, questions, durationSeconds = 1800, isMastery = false, targetNodeId = null, requiredPercent = 90) {
    if (!questions || questions.length === 0) {
      alert("سوالی برای این آزمون یافت نشد.");
      return;
    }

    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }

    this.state = {
      view: 'active',
      activeQuizTitle: title,
      questions: questions,
      currentIndex: 0,
      userAnswers: {},
      flagged: new Set(),
      timerSeconds: durationSeconds,
      timeSpentSeconds: 0,
      timerInterval: null,
      isMasteryChallenge: isMastery,
      targetMasteryNodeId: targetNodeId,
      requiredMasteryPercent: requiredPercent
    };

    // Start countdown timer
    this.state.timerInterval = setInterval(() => {
      this.state.timeSpentSeconds++;
      if (this.state.timerSeconds > 0) {
        this.state.timerSeconds--;
        this.updateTimerDisplay();
        if (this.state.timerSeconds <= 0) {
          this.submitQuiz(true);
        }
      }
    }, 1000);

    this.render();
  }

  selectOption(optionIndex) {
    const q = this.state.questions[this.state.currentIndex];
    if (!q) return;
    this.state.userAnswers[q.id] = optionIndex;
    this.render();
  }

  toggleFlagCurrent() {
    const q = this.state.questions[this.state.currentIndex];
    if (!q) return;
    if (this.state.flagged.has(q.id)) {
      this.state.flagged.delete(q.id);
    } else {
      this.state.flagged.add(q.id);
    }
    this.render();
  }

  nextQuestion() {
    if (this.state.currentIndex < this.state.questions.length - 1) {
      this.state.currentIndex++;
      this.render();
    }
  }

  prevQuestion() {
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      this.render();
    }
  }

  jumpToQuestion(index) {
    if (index >= 0 && index < this.state.questions.length) {
      this.state.currentIndex = index;
      this.render();
    }
  }

  submitQuiz(isAuto = false) {
    if (!isAuto) {
      const answeredCount = Object.keys(this.state.userAnswers).length;
      const total = this.state.questions.length;
      if (answeredCount < total) {
        if (!confirm(`شما به ${answeredCount} سوال از ${total} سوال پاسخ داده‌اید. آیا از ثبت نهایی اطمینان دارید؟`)) {
          return;
        }
      }
    }

    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }

    // Process Mastery Challenge Results if applicable
    if (this.state.isMasteryChallenge && this.state.targetMasteryNodeId) {
      const res = this.calculateResults();
      if (res.percentage >= this.state.requiredMasteryPercent) {
        this.masteryRecords[this.state.targetMasteryNodeId] = {
          passed: true,
          score: res.percentage,
          timestamp: Date.now()
        };
        this.saveMasteryRecords();
        if (window.omniApp && window.omniApp.treeRenderer) {
          window.omniApp.treeRenderer.render();
        }
      }
    }

    this.state.view = 'result';
    this.render();
  }

  calculateResults() {
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    const chapterStats = {};

    this.state.questions.forEach(q => {
      const ans = this.state.userAnswers[q.id];
      const ch = q.chapterTitle || "سایر مباحث";

      if (!chapterStats[ch]) {
        chapterStats[ch] = { total: 0, correct: 0 };
      }
      chapterStats[ch].total++;

      if (ans === undefined) {
        unanswered++;
      } else if (ans === q.correctIndex) {
        correct++;
        chapterStats[ch].correct++;
      } else {
        incorrect++;
      }
    });

    const total = this.state.questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      total,
      correct,
      incorrect,
      unanswered,
      percentage,
      timeSpent: this.formatTime(this.state.timeSpentSeconds),
      chapterStats
    };
  }

  formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  updateTimerDisplay() {
    const el = document.getElementById('quiz-timer-display');
    if (el) {
      el.textContent = this.formatTime(this.state.timerSeconds);
      if (this.state.timerSeconds < 180) {
        el.classList.add('text-rose-400', 'animate-pulse');
      }
    }
  }

  render() {
    const container = document.getElementById('view-quiz');
    if (!container) return;

    if (this.state.view === 'home') {
      this.renderHomeView(container);
    } else if (this.state.view === 'active') {
      this.renderActiveView(container);
    } else if (this.state.view === 'result') {
      this.renderResultView(container);
    }
  }

  // --- 1. Home Dashboard View ---
  renderHomeView(container) {
    const totalQuestions = this.questionBank.length;
    const chaptersMap = new Map();

    this.questionBank.forEach(q => {
      const key = q.chapterId || 'other';
      if (!chaptersMap.has(key)) {
        chaptersMap.set(key, { id: key, title: q.chapterTitle || 'فصل نامشخص', count: 0 });
      }
      chaptersMap.get(key).count++;
    });

    const chapters = Array.from(chaptersMap.values());
    const totalMastered = Object.values(this.masteryRecords).filter(r => r.passed).length;

    container.innerHTML = `
      <div class="max-w-6xl mx-auto p-6 space-y-8">
        <!-- Hero Header -->
        <div class="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div class="absolute -left-10 -bottom-10 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
          <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3 border border-cyan-500/30">
                <span>📝</span>
                <span>استودیوی آزمون و سنجش هوشمند</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                سامانه آزمون‌های تخصصی، کنکور و شبیه‌ساز تسلط ۹۰٪
              </h2>
              <p class="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                آزمون‌های جامع و فصلی همراه با کارنامه هوشمند، شرط تسلط ۹۰٪ برای گشودن شاخه‌ها، و محاسبه ضرایب احتمال آزمون (Exam Forecast).
              </p>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 shrink-0">
              <button onclick="window.omniApp.quizEngine.startComprehensiveQuiz()" class="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer whitespace-nowrap">
                <span>🚀</span>
                <span>شروع آزمون جامع ۳۰ سوالی</span>
              </button>
            </div>
          </div>

          <!-- Quick Stats Bar -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div class="bg-black/30 p-3.5 rounded-xl border border-white/5">
              <span class="text-xs text-slate-400">بانک کل سوالات</span>
              <div class="text-xl font-bold text-cyan-400 mt-1">${totalQuestions} تست استاندارد</div>
            </div>
            <div class="bg-black/30 p-3.5 rounded-xl border border-white/5">
              <span class="text-xs text-slate-400">شاخه‌های مسلط‌شده (۹۰٪+)</span>
              <div class="text-xl font-bold text-emerald-400 mt-1">${totalMastered} شاخه 🏆</div>
            </div>
            <div class="bg-black/30 p-3.5 rounded-xl border border-white/5">
              <span class="text-xs text-slate-400">حالت چالش ۹۰٪</span>
              <div class="text-xl font-bold ${this.isExamModeActive ? 'text-amber-400' : 'text-slate-400'} mt-1">
                ${this.isExamModeActive ? '🔒 فعال' : '🔓 غیرفعال'}
              </div>
            </div>
            <div class="bg-black/30 p-3.5 rounded-xl border border-white/5">
              <span class="text-xs text-slate-400">الگوریتم پیش‌بینی</span>
              <div class="text-xl font-bold text-purple-400 mt-1">وزن‌دهی Exam-Forecast</div>
            </div>
          </div>
        </div>

        <!-- Mode Selectors: 2 Master Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Card 1: روانشناسی مرضی کودک -->
          <div class="glass-panel p-6 rounded-2xl border border-amber-500/30 hover:border-amber-400/60 transition flex flex-col justify-between bg-gradient-to-b from-amber-950/20 to-transparent">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid rgba(245,158,11,0.4);">
                  📚 آزمون جامع مرضی کودک
                </span>
                <span class="text-xs text-slate-400">۶۰ صفحه کتاب</span>
              </div>
              <h3 class="text-lg font-bold text-white mb-2">آزمون جامع اختلالات روانشناسی مرضی کودک</h3>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">
                شامل تمامی مباحث تاریخچه، ایکن‌باخ، مهارت‌های حرکتی، ارتباطی، تغذیه، یادگیری، دفع، اوتیسم، رت، هلر، آسپرگر، ADHD و سلوک.
              </p>
            </div>
            <button onclick="window.omniApp.quizEngine.startDocQuiz('doc_child_psychopathology', 'روانشناسی مرضی کودک')" class="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
              <span>🎯</span>
              <span>شروع آزمون مرضی کودک</span>
            </button>
          </div>

          <!-- Card 2: روانشناسی سلامت -->
          <div class="glass-panel p-6 rounded-2xl border border-cyan-500/30 hover:border-cyan-400/60 transition flex flex-col justify-between bg-gradient-to-b from-cyan-950/20 to-transparent">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="badge" style="background:rgba(0,212,255,0.2); color:#00d4ff; border:1px solid rgba(0,212,255,0.4);">
                  📚 آزمون جامع روانشناسی سلامت
                </span>
                <span class="text-xs text-slate-400">۱۰ فصل کتاب</span>
              </div>
              <h3 class="text-lg font-bold text-white mb-2">آزمون جامع مبانی روانشناسی سلامت</h3>
              <p class="text-xs text-slate-300 leading-relaxed mb-4">
                شامل نظریات هانس سلیه (GAS)، ریچارد لازاروس، آنتونوسکی (SOC)، سوزان کوباسا (سخت‌رویی)، تیپ A و فیزیولوژی استرس.
              </p>
            </div>
            <button onclick="window.omniApp.quizEngine.startDocQuiz('doc_health_psychology', 'روانشناسی سلامت')" class="w-full py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer">
              <span>🎯</span>
              <span>شروع آزمون روانشناسی سلامت</span>
            </button>
          </div>
        </div>

        <!-- Section: Chapter by Chapter Quizzes -->
        <div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>📂</span>
              <span>آزمون‌های تفکیکی بر اساس فصول کتاب:</span>
            </h3>
            <span class="text-xs text-slate-400">روی هر فصل کلیک کنید تا آزمون آن شروع شود</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            ${chapters.map(ch => `
              <div class="glass-panel p-4 rounded-xl border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition flex flex-col justify-between group">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[11px] font-mono text-indigo-400 font-semibold">${ch.id}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">${ch.count} تست</span>
                  </div>
                  <h4 class="text-xs font-bold text-white group-hover:text-cyan-300 transition leading-snug mb-3">
                    ${ch.title}
                  </h4>
                </div>
                <button onclick="window.omniApp.quizEngine.startChapterQuiz('${ch.id}', '${ch.title}')" class="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer">
                  <span>📝</span>
                  <span>شروع تست این فصل</span>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // --- 2. Active Quiz Runner View ---
  renderActiveView(container) {
    const total = this.state.questions.length;
    const currentQ = this.state.questions[this.state.currentIndex];
    const currentSelectedOption = this.state.userAnswers[currentQ.id];
    const isFlagged = this.state.flagged.has(currentQ.id);

    container.innerHTML = `
      <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <!-- Quiz HUD Header -->
        <div class="glass-panel p-4 rounded-2xl border ${this.state.isMasteryChallenge ? 'border-amber-500/50 bg-amber-950/30' : 'border-white/10 bg-slate-950/80'} flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <button onclick="window.omniApp.quizEngine.cancelQuiz()" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition cursor-pointer" title="انصراف">
              ✕ انصراف
            </button>
            <div>
              <div class="flex items-center gap-2">
                ${this.state.isMasteryChallenge ? `<span class="badge bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">🔒 چالش تسلط ۹۰٪</span>` : ''}
                <h3 class="text-sm font-bold text-white">${this.state.activeQuizTitle}</h3>
              </div>
              <p class="text-xs text-slate-400">سوال ${this.state.currentIndex + 1} از ${total} ${this.state.isMasteryChallenge ? '(شرط قبولی: حداقل ۹۰٪ پاسخ درست)' : ''}</p>
            </div>
          </div>

          <!-- Timer & Action Buttons -->
          <div class="flex items-center gap-3">
            <!-- Timer Badge -->
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-400 font-mono text-sm font-bold shadow-inner">
              <span>⏱️</span>
              <span id="quiz-timer-display">${this.formatTime(this.state.timerSeconds)}</span>
            </div>

            <!-- Flag Button -->
            <button onclick="window.omniApp.quizEngine.toggleFlagCurrent()" class="px-3 py-1.5 rounded-xl border ${isFlagged ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'} text-xs font-semibold transition flex items-center gap-1 cursor-pointer">
              <span>${isFlagged ? '📌 نشان‌شده' : '📍 نشان‌کردن'}</span>
            </button>

            <!-- Submit Final Button -->
            <button onclick="window.omniApp.quizEngine.submitQuiz()" class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition cursor-pointer">
              ✓ ثبت و پایان آزمون
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <!-- Main Question Box (3 cols) -->
          <div class="lg:col-span-3 space-y-6">
            <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-6 bg-slate-900/60">
              <!-- Meta Badges -->
              <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="badge bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                    ${currentQ.chapterTitle || 'فصل'}
                  </span>
                  ${currentQ.page ? `<span class="badge bg-slate-800 text-slate-300 border border-slate-700">📄 ص ${currentQ.page}</span>` : ''}
                  <span class="badge bg-slate-800 text-slate-400 border border-slate-700">درجه: ${currentQ.difficulty || 'متوسط'}</span>
                </div>
                <span class="text-xs text-cyan-400 font-bold font-mono">سوال #${this.state.currentIndex + 1}</span>
              </div>

              <!-- Question Text -->
              <h3 class="text-base md:text-lg font-bold text-white leading-relaxed text-justify">
                ${currentQ.question}
              </h3>

              <!-- 4 Options -->
              <div class="space-y-3 pt-2">
                ${currentQ.options.map((opt, optIdx) => {
                  const isSelected = currentSelectedOption === optIdx;
                  const optLabels = ['الف', 'ب', 'ج', 'د'];
                  return `
                    <div onclick="window.omniApp.quizEngine.selectOption(${optIdx})" class="p-4 rounded-xl border transition flex items-start gap-3 cursor-pointer ${isSelected ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-500/10 text-white font-medium' : 'bg-slate-950/40 border-white/10 hover:border-white/20 text-slate-300 hover:bg-white/5'}">
                      <div class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition ${isSelected ? 'bg-cyan-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400'}">
                        ${optLabels[optIdx]}
                      </div>
                      <span class="text-sm leading-relaxed mt-0.5 text-justify">${opt}</span>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Navigation Footer -->
              <div class="flex items-center justify-between pt-4 border-t border-white/10">
                <button onclick="window.omniApp.quizEngine.prevQuestion()" ${this.state.currentIndex === 0 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="cursor-pointer hover:bg-slate-700"'} class="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5">
                  <span>◀</span> سوال قبلی
                </button>

                <div class="text-xs text-slate-400">
                  ${Object.keys(this.state.userAnswers).length} از ${total} پاسخ داده شده
                </div>

                <button onclick="window.omniApp.quizEngine.nextQuestion()" ${this.state.currentIndex === total - 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : 'class="cursor-pointer hover:bg-cyan-500 hover:text-slate-950"'} class="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-semibold transition flex items-center gap-1.5">
                  سوال بعدی <span>▶</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Question Palette Matrix (1 col) -->
          <div class="lg:col-span-1 glass-panel p-4 rounded-2xl border border-white/10 space-y-4 bg-slate-900/80">
            <h4 class="text-xs font-bold text-white pb-2 border-b border-white/10 flex items-center justify-between">
              <span>جدول سوالات</span>
              <span class="text-[10px] text-slate-400">${total} تست</span>
            </h4>

            <div class="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto pr-1">
              ${this.state.questions.map((q, idx) => {
                const isAnswered = this.state.userAnswers[q.id] !== undefined;
                const isFlag = this.state.flagged.has(q.id);
                const isCurrent = this.state.currentIndex === idx;

                let bgClass = "bg-slate-950/60 text-slate-400 border-white/10";
                if (isAnswered) bgClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold";
                if (isFlag) bgClass = "bg-amber-500/30 text-amber-300 border-amber-400 font-bold";
                if (isCurrent) bgClass += " ring-2 ring-cyan-400";

                return `
                  <button onclick="window.omniApp.quizEngine.jumpToQuestion(${idx})" class="h-9 rounded-lg border text-xs flex items-center justify-center transition cursor-pointer hover:scale-105 ${bgClass}" title="سوال ${idx + 1}">
                    ${idx + 1}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Legend -->
            <div class="text-[10px] space-y-1.5 pt-2 border-t border-white/10 text-slate-400">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>پاسخ‌داده‌شده</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                <span>نشان‌گذاری‌شده</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block"></span>
                <span>پاسخ‌داده‌نشده</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  cancelQuiz() {
    if (this.state.isMasteryChallenge && this.isExamModeActive) {
      if (!confirm("در حالت چالش ۹۰٪، تا زمان پاسخگویی به سوالات نمی‌توانید شاخه را باز کنید. آیا قصد خروج دارید؟")) {
        return;
      }
    }
    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = null;
    }
    this.state.view = 'home';
    this.render();
  }

  // --- 3. Results & Explanations Review View ---
  renderResultView(container) {
    const res = this.calculateResults();
    const reqPercent = this.state.isMasteryChallenge ? this.state.requiredMasteryPercent : 60;
    const isPassed = res.percentage >= reqPercent;

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        <!-- Score Card Hero -->
        <div class="glass-panel p-6 md:p-8 rounded-2xl border ${isPassed ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/30 to-slate-900' : 'border-rose-500/40 bg-gradient-to-b from-rose-950/30 to-slate-900'} relative overflow-hidden">
          <div class="flex flex-col md:flex-row items-center justify-between gap-6">
            <!-- Left: Score Ring & Summary -->
            <div class="flex items-center gap-6">
              <div class="w-28 h-28 rounded-full border-4 ${isPassed ? 'border-emerald-400 bg-emerald-500/10' : 'border-rose-400 bg-rose-500/10'} flex flex-col items-center justify-center shadow-2xl shrink-0">
                <span class="text-3xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}">${res.percentage}%</span>
                <span class="text-[10px] text-slate-300 mt-0.5">درصد کل</span>
              </div>

              <div>
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="badge ${isPassed ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40'} font-bold">
                    ${isPassed ? (this.state.isMasteryChallenge ? '🏆 تبریک! تسلط ۹۰٪ کسب شد و شاخه باز گردید' : '🎉 قبولی در آزمون') : (this.state.isMasteryChallenge ? '🔒 عدم احراز تسلط ۹۰٪ (شاخه قفل باقی ماند)' : '⚠️ نیازمند مرور بیشتر')}
                  </span>
                  <span class="text-xs text-slate-400">مدت زمان: ${res.timeSpent}</span>
                </div>
                <h2 class="text-xl font-bold text-white mb-2">کارنامه تحلیلی: ${this.state.activeQuizTitle}</h2>
                <p class="text-xs text-slate-300">
                  شما از مجموع <b>${res.total}</b> سوال، به <b>${res.correct}</b> سوال پاسخ صحیح دادید.
                  ${this.state.isMasteryChallenge ? `<br/><span class="${isPassed ? 'text-emerald-400' : 'text-amber-400'} font-semibold">شرط قبولی چالش: حداقل ${this.state.requiredMasteryPercent}٪ پاسخ صحیح.</span>` : ''}
                </p>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-wrap gap-2 shrink-0">
              ${this.state.isMasteryChallenge && this.state.targetMasteryNodeId ? `
                <button onclick="window.omniApp.quizEngine.startMasteryChallengeForNode('${this.state.targetMasteryNodeId}')" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-lg transition cursor-pointer">
                  🔄 تلاش مجدد برای تسلط ۹۰٪
                </button>
              ` : `
                <button onclick="window.omniApp.quizEngine.startComprehensiveQuiz()" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-lg transition cursor-pointer">
                  🔄 آزمون مجدد
                </button>
              `}
              <button onclick="window.omniApp.quizEngine.state.view='home'; window.omniApp.quizEngine.render();" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer">
                🏠 لیست آزمون‌ها
              </button>
            </div>
          </div>

          <!-- Stats 3-Col Bar -->
          <div class="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-center">
            <div class="bg-black/30 p-3 rounded-xl border border-emerald-500/20">
              <div class="text-xs text-emerald-400">پاسخ‌های صحیح</div>
              <div class="text-xl font-bold text-white mt-1">${res.correct} ✅</div>
            </div>
            <div class="bg-black/30 p-3 rounded-xl border border-rose-500/20">
              <div class="text-xs text-rose-400">پاسخ‌های نادرست</div>
              <div class="text-xl font-bold text-white mt-1">${res.incorrect} ❌</div>
            </div>
            <div class="bg-black/30 p-3 rounded-xl border border-slate-500/20">
              <div class="text-xs text-slate-400">پاسخ‌داده‌نشده</div>
              <div class="text-xl font-bold text-white mt-1">${res.unanswered} ⚪</div>
            </div>
          </div>
        </div>

        <!-- Section: Detailed Question by Question Explanations -->
        <div class="space-y-4">
          <h3 class="text-base font-bold text-white flex items-center justify-between">
            <span class="flex items-center gap-2">
              <span>📖</span>
              <span>تحلیل تشریحی و ارجاع به درخت دانش:</span>
            </span>
            <span class="text-xs text-slate-400 font-normal">کلیک روی دکمه «پرش به درخت» صفحه و پاراگراف کتاب را باز می‌کند</span>
          </h3>

          <div class="space-y-4">
            ${this.state.questions.map((q, idx) => {
              const userAns = this.state.userAnswers[q.id];
              const isCorrect = userAns === q.correctIndex;
              const isUnanswered = userAns === undefined;
              const optLabels = ['الف', 'ب', 'ج', 'د'];

              let statusBorder = "border-rose-500/30 bg-rose-950/10";
              let statusBadge = `<span class="badge bg-rose-500/20 text-rose-300 border-rose-500/40">❌ نادرست</span>`;
              if (isCorrect) {
                statusBorder = "border-emerald-500/30 bg-emerald-950/10";
                statusBadge = `<span class="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/40">✅ صحیح</span>`;
              } else if (isUnanswered) {
                statusBorder = "border-slate-700 bg-slate-900/30";
                statusBadge = `<span class="badge bg-slate-800 text-slate-400 border-slate-700">⚪ نزده</span>`;
              }

              return `
                <div class="glass-panel p-5 rounded-xl border ${statusBorder} space-y-4">
                  <!-- Header row -->
                  <div class="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-bold text-slate-400">#${idx + 1}</span>
                      ${statusBadge}
                      <span class="badge bg-slate-800 text-slate-300 border border-slate-700">${q.chapterTitle || 'فصل'}</span>
                      ${q.page ? `<span class="badge bg-slate-800 text-slate-400 border border-slate-700">📄 ص ${q.page}</span>` : ''}
                    </div>

                    ${q.nodeId ? `
                      <button onclick="window.omniApp.navigateToNodeFromModal('${q.nodeId}')" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 text-xs font-semibold transition flex items-center gap-1 cursor-pointer">
                        <span>📍</span>
                        <span>پرش به این مبحث در درخت دانش</span>
                      </button>
                    ` : ''}
                  </div>

                  <!-- Question Text -->
                  <h4 class="text-sm font-bold text-white leading-relaxed text-justify">
                    ${q.question}
                  </h4>

                  <!-- Options Review -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    ${q.options.map((opt, optIdx) => {
                      const isUserChoice = userAns === optIdx;
                      const isRealCorrect = q.correctIndex === optIdx;

                      let optClass = "bg-slate-950/40 border-white/5 text-slate-400";
                      if (isRealCorrect) {
                        optClass = "bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold";
                      } else if (isUserChoice && !isRealCorrect) {
                        optClass = "bg-rose-500/20 border-rose-400 text-rose-200 font-bold";
                      }

                      return `
                        <div class="p-2.5 rounded-lg border flex items-start gap-2 ${optClass}">
                          <span class="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] shrink-0 ${isRealCorrect ? 'bg-emerald-500 text-slate-950' : (isUserChoice ? 'bg-rose-500 text-white' : 'bg-slate-800')}">
                            ${optLabels[optIdx]}
                          </span>
                          <span class="leading-relaxed mt-0.5">${opt}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <!-- Explanatory Answer Box -->
                  ${q.explanation ? `
                    <div class="p-3.5 rounded-xl bg-white/5 border border-cyan-500/20 text-xs leading-relaxed text-slate-200 space-y-1">
                      <div class="font-bold text-cyan-300 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>پاسخ تشریحی و تحلیل علمی:</span>
                      </div>
                      <p class="text-justify text-slate-300">${q.explanation}</p>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

window.QuizEngine = QuizEngine;
