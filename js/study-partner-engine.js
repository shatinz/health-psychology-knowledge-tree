/**
 * Study Partner & Mutual Feynman Cross-Teaching Engine (Beta)
 * 
 * Core Philosophy:
 * - Two students studying the same sources team up.
 * - One partner explains (using the Feynman Technique) a branch they have mastered 
 *   to the other partner who hasn't read it yet or has low grades on it.
 * - Both commit to specific chapters and teach each other to achieve mutual 100% mastery.
 */

class StudyPartnerEngine {
  constructor(docManager) {
    this.docManager = docManager;
    this.userProfile = this.loadUserProfile();
    this.peerPartners = this.getInitialPeerDirectory();
    this.activePartnerships = this.loadActivePartnerships();
    this.activeFilterDocId = 'all';
  }

  loadUserProfile() {
    try {
      const saved = localStorage.getItem('omni_user_study_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load user study profile:', e);
    }

    return {
      name: 'داوطلب آزمون (شما)',
      targetExam: 'کنکور کارشناسی ارشد روانشناسی',
      studyPace: 'روزانه ۲ فصل',
      bio: 'علاقه‌مند به تسلط بر روانشناسی مرضی کودک و روانشناسی سلامت'
    };
  }

  saveUserProfile(profile) {
    this.userProfile = { ...this.userProfile, ...profile };
    try {
      localStorage.setItem('omni_user_study_profile', JSON.stringify(this.userProfile));
    } catch (e) {
      console.error('Failed to save study profile:', e);
    }
  }

  loadActivePartnerships() {
    try {
      const saved = localStorage.getItem('omni_active_study_partnerships');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load active partnerships:', e);
    }
    return [];
  }

  saveActivePartnerships() {
    try {
      localStorage.setItem('omni_active_study_partnerships', JSON.stringify(this.activePartnerships));
    } catch (e) {
      console.error('Failed to save active partnerships:', e);
    }
  }

  getUserMasteredNodes() {
    const quizRecords = JSON.parse(localStorage.getItem('omni_node_mastery') || '{}');
    const feynmanRecords = JSON.parse(localStorage.getItem('omni_feynman_mastery') || '{}');
    
    const mastered = new Set();
    Object.keys(quizRecords).forEach(id => { if (quizRecords[id].passed) mastered.add(id); });
    Object.keys(feynmanRecords).forEach(id => { if (feynmanRecords[id].passed) mastered.add(id); });
    return mastered;
  }

  calculateUserStats() {
    const quizRecords = JSON.parse(localStorage.getItem('omni_node_mastery') || '{}');
    const feynmanRecords = JSON.parse(localStorage.getItem('omni_feynman_mastery') || '{}');

    const totalQuizPassed = Object.values(quizRecords).filter(r => r.passed).length;
    const totalFeynmanPassed = Object.values(feynmanRecords).filter(r => r.passed).length;
    const allScores = [
      ...Object.values(quizRecords).map(r => r.score || 0),
      ...Object.values(feynmanRecords).map(r => r.score || 0)
    ];

    const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 65;

    return {
      totalQuizPassed,
      totalFeynmanPassed,
      avgScore,
      masteryCount: totalQuizPassed + totalFeynmanPassed
    };
  }

  getInitialPeerDirectory() {
    return [
      {
        id: 'peer_sara',
        name: 'سارا رادمهر',
        avatar: '👩‍🎓',
        role: 'داوطلب ارشد روانشناسی بالینی (رتبه ۴۵ آزمون آزمایشی)',
        targetExam: 'کنکور کارشناسی ارشد روانشناسی',
        docId: 'doc_child_psychopathology',
        docTitle: 'روانشناسی مرضی کودک',
        score: 92,
        masteredChapters: [
          { id: 'cpd_ch12', title: 'فصل ۱۲: اختلالات فراگیر رشد (اتیسم، رت، هلر)', weight: 'ضریب ۳' },
          { id: 'cpd_ch2', title: 'فصل ۲: سنجش و طبقه‌بندی ایکن‌باخ', weight: 'ضریب ۲' }
        ],
        weakChapters: [
          { id: 'cpd_ch13', title: 'فصل ۱۳: کمبود توجه و رفتار مخرب ADHD', weight: 'ضریب ۳' },
          { id: 'cpd_ch11', title: 'فصل ۱۱: اختلالات دفع و شب‌ادراری', weight: 'ضریب ۱' }
        ],
        studyPace: '۳ ساعت در روز',
        isOnline: true,
        feynmanStyle: 'توضیحات بسیار دقیق بر اساس ملاک‌های DSM و درمان‌ها',
        sampleExplanation: 'سندروم رت ناشی از جهش در ژن MECP2 روی کروموزوم X است که با کاهش دور سر و حرکات قالبی شستن دست‌ها پس از ۵ ماه رشد طبیعی پدیدار می‌شود.'
      },
      {
        id: 'peer_amir',
        name: 'امیرحسین کاظمی',
        avatar: '👨‍⚕️',
        role: 'دانشجوی روانشناسی دانشگاه تهران',
        targetExam: 'کنکور کارشناسی ارشد روانشناسی',
        docId: 'doc_child_psychopathology',
        docTitle: 'روانشناسی مرضی کودک',
        score: 86,
        masteredChapters: [
          { id: 'cpd_ch13', title: 'فصل ۱۳: کمبود توجه و بیش‌فعالی ADHD و ریتالین', weight: 'ضریب ۳' },
          { id: 'cpd_ch14', title: 'فصل ۱۴: اختلال سلوک و نافرمانی مقابله‌ای ODD', weight: 'ضریب ۲' }
        ],
        weakChapters: [
          { id: 'cpd_ch12', title: 'فصل ۱۲: سندروم رت، هلر و آسپرگر', weight: 'ضریب ۳' },
          { id: 'cpd_ch9', title: 'فصل ۹: نارسایی‌های ویژه یادگیری و دیسلکسی', weight: 'ضریب ۲' }
        ],
        studyPace: '۲ ساعت در روز',
        isOnline: true,
        feynmanStyle: 'تمرکز بر مثال‌های بالینی و داروهای محرک دستگاه عصبی',
        sampleExplanation: 'در ADHD سه زیرنوع بی‌توجهی، تکانشگری و ترکیبی داریم که ناشی از نقص در قشر پیش‌پیشانی و دوپامین است و متیل‌فنیدات (ریتالین) خط اول درمان است.'
      },
      {
        id: 'peer_mehdi',
        name: 'دکتر مهدی نوری',
        avatar: '👨‍🏫',
        role: 'پژوهشگر دکتری روانشناسی سلامت',
        targetExam: 'آزمون دکتری و بورد تخصصی سلامت',
        docId: 'doc_health_psychology',
        docTitle: 'روانشناسی سلامت',
        score: 96,
        masteredChapters: [
          { id: 'ch2', title: 'فصل ۲: الگوهای استرس سلیه (GAS) و لازاروس', weight: 'ضریب ۳' },
          { id: 'ch4', title: 'فصل ۴: رفتارهای سلامت، سرسختی کوباسا و تیپ‌های شخصیتی', weight: 'ضریب ۲' }
        ],
        weakChapters: [
          { id: 'ch5', title: 'فصل ۵: دردهای مزمن و نظریه کنترل دروازه ملزاک و وال', weight: 'ضریب ۲' },
          { id: 'ch3', title: 'فصل ۳: سایکونوروایمونولوژی و سایتوکاین‌ها', weight: 'ضریب ۳' }
        ],
        studyPace: '۴ ساعت در روز',
        isOnline: false,
        feynmanStyle: 'رویکرد عمیق فیزیولوژیک و سایکونوروایمونولوژی',
        sampleExplanation: 'هانس سلیه سندرم انطباق عمومی (GAS) را در سه مرحله هشدار (Alarm)، مقاومت (Resistance) و فرسودگی (Exhaustion) تعریف کرد که در مرحله اول محور SAM و سپس HPA فعال می‌شود.'
      },
      {
        id: 'peer_niloufar',
        name: 'نیلوفر صادقی',
        avatar: '👩‍🔬',
        role: 'دانشجوی متقاضی ارشد بالینی کودک',
        targetExam: 'کنکور کارشناسی ارشد روانشناسی',
        docId: 'doc_child_psychopathology',
        docTitle: 'روانشناسی مرضی کودک',
        score: 79,
        masteredChapters: [
          { id: 'cpd_ch9', title: 'فصل ۹: نارسایی‌های یادگیری (دیسلکسی و دیسگرافیا)', weight: 'ضریب ۲' },
          { id: 'cpd_ch10', title: 'فصل ۱۰: اختلالات حرکتی و تیک و توره', weight: 'ضریب ۱' }
        ],
        weakChapters: [
          { id: 'cpd_ch2', title: 'فصل ۲: سنجش ایکن‌باخ و عوامل درون‌ساخت', weight: 'ضریب ۲' },
          { id: 'cpd_ch12', title: 'فصل ۱۲: اختلالات فراگیر رشد PDD', weight: 'ضریب ۳' }
        ],
        studyPace: '۱.۵ ساعت در روز',
        isOnline: true,
        feynmanStyle: 'خلاصه‌نویسی دقیق و کدگذاری کلیدواژه‌های طلایی',
        sampleExplanation: 'در نارساخوانی یا دیسلکسی نقص اصلی در پردازش واج‌شناختی است، نه در بینایی؛ و آزمون‌های هوش کلامی و غیرکلامی عملکرد متفاوتی نشان می‌دهند.'
      },
      {
        id: 'peer_parham',
        name: 'پرهام یزدانی',
        avatar: '👨‍🎓',
        role: 'داوطلب کنکور ارشد بالینی',
        targetExam: 'کنکور کارشناسی ارشد روانشناسی',
        docId: 'doc_child_psychopathology',
        docTitle: 'روانشناسی مرضی کودک',
        score: 89,
        masteredChapters: [
          { id: 'cpd_ch11', title: 'فصل ۱۱: اختلالات دفع و پروتکل زنگ و تشک ماورر', weight: 'ضریب ۱' },
          { id: 'cpd_ch1', title: 'فصل ۱: تاریخچه آسیب‌شناسی کودک و روش‌های تحقیق', weight: 'ضریب ۱' }
        ],
        weakChapters: [
          { id: 'cpd_ch13', title: 'فصل ۱۳: بیش‌فعالی و اختلال سلوک', weight: 'ضریب ۳' },
          { id: 'cpd_ch14', title: 'فصل ۱۴: اضطراب و وسواس در کودکان', weight: 'ضریب ۲' }
        ],
        studyPace: '۳ ساعت در روز',
        isOnline: true,
        feynmanStyle: 'مرور تطبیقی ساید‌بای‌ساید تفاوت‌های تشخیصی DSM-5',
        sampleExplanation: 'پروتکل زنگ و تشک (Bell and Pad) توسط ماورر بر پایه شرطی‌سازی کلاسیک ابداع شد که در آن پر شدن مثانه محرک شرطی و زنگ محرک غیرشرطی است.'
      }
    ];
  }

  /**
   * Analyzes mutual teaching synergy between User and Peer:
   * - Chapters User can teach Peer (User is strong / Peer is weak)
   * - Chapters Peer can teach User (Peer is strong / User is weak)
   */
  analyzeCrossTeachingSynergy(peer) {
    const userMastered = this.getUserMasteredNodes();
    
    // Chapters peer can teach user
    const peerCanTeach = peer.masteredChapters.map(ch => ({
      ...ch,
      isUserMastered: userMastered.has(ch.id)
    }));

    // Chapters user can teach peer
    const userCanTeach = peer.weakChapters.map(ch => ({
      ...ch,
      isUserMastered: userMastered.has(ch.id)
    }));

    // Calculate match score based on complementarity (high synergy when both can teach each other)
    const teachCount = peerCanTeach.filter(c => !c.isUserMastered).length;
    const learnCount = userCanTeach.filter(c => c.isUserMastered).length;
    
    let synergyScore = 70 + (teachCount * 10) + (learnCount * 10);
    synergyScore = Math.min(99, Math.max(65, synergyScore));

    return {
      peerCanTeach,
      userCanTeach,
      synergyScore
    };
  }

  createPartnershipContract(peerId, userCommitChapterIds, peerCommitChapterIds) {
    const peer = this.peerPartners.find(p => p.id === peerId);
    if (!peer) return null;

    const contract = {
      id: 'contract_' + Date.now(),
      peerId: peer.id,
      peerName: peer.name,
      peerAvatar: peer.avatar,
      docTitle: peer.docTitle,
      userCommittedChapters: userCommitChapterIds,
      peerCommittedChapters: peerCommitChapterIds,
      createdAt: new Date().toLocaleDateString('fa-IR'),
      status: 'active', // active, completed
      userTeachingSessionsCompleted: 0,
      peerTeachingSessionsCompleted: 0
    };

    this.activePartnerships.unshift(contract);
    this.saveActivePartnerships();
    return contract;
  }

  render(containerId = 'view-partners') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const userStats = this.calculateUserStats();
    const userMastered = this.getUserMasteredNodes();

    const filteredPeers = this.peerPartners.filter(p => {
      if (this.activeFilterDocId === 'all') return true;
      return p.docId === this.activeFilterDocId;
    });

    container.innerHTML = `
      <div class="max-w-6xl mx-auto p-6 space-y-8">
        <!-- Hero Header -->
        <div class="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 shadow-2xl">
          <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
                <span>👥</span>
                <span>همتایابی درسی و مباحثه متقابل فاینمن (Study Partner Hub)</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                تدریس متقابل فاینمن: شما یاد بدهید، همتایتان به شما یاد دهد!
              </h2>
              <p class="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed text-justify">
                بر اساس این اصل که <b>بهترین راه یادگیری، یاد دادن به دیگران است</b>؛ داوطلبانی که همان منابع شما را می‌خوانند پیدا کنید، فصول را تقسیم کنید و در جلسات دونفره مفاهیم را برای یکدیگر با تکنیک فاینمن بازگو نمایید.
              </p>
            </div>

            <!-- User Stat Card -->
            <div class="bg-black/50 p-5 rounded-2xl border border-purple-500/30 text-center min-w-[220px] shadow-xl">
              <span class="text-xs text-purple-300 font-semibold">وضعیت تسلط و آمادگی شما</span>
              <div class="text-3xl font-black text-white mt-1">${userStats.avgScore}%</div>
              <div class="text-[11px] text-emerald-400 mt-1 font-medium">
                🏆 ${userMastered.size} سرفصل مسلط‌شده برای تدریس
              </div>
              <button onclick="window.omniApp.studyPartnerEngine.openProfileEditor()" class="mt-3 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] transition">
                ✏️ ویرایش مشخصات من
              </button>
            </div>
          </div>
        </div>

        <!-- Active Contracts Section (if any) -->
        ${this.activePartnerships.length > 0 ? `
          <div class="space-y-4">
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>🤝</span>
              <span>قراردادها و جلسات مباحثه فعال من (${this.activePartnerships.length} قرارداد):</span>
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${this.activePartnerships.map(contract => `
                <div class="glass-panel p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-4">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <span class="text-2xl">${contract.peerAvatar}</span>
                      <div>
                        <div class="font-bold text-white text-sm">${contract.peerName}</div>
                        <span class="text-xs text-emerald-400">منبع مشترک: ${contract.docTitle}</span>
                      </div>
                    </div>
                    <span class="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                      قرارداد فعال
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-white/10">
                    <div class="bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
                      <span class="text-[11px] text-purple-300 font-semibold block mb-1">شما تدریس می‌کنید:</span>
                      <span class="text-slate-200">${contract.userCommittedChapters.join('، ') || 'فصل‌های انتخابی'}</span>
                    </div>
                    <div class="bg-black/30 p-2.5 rounded-xl border border-cyan-500/20">
                      <span class="text-[11px] text-cyan-300 font-semibold block mb-1">همتا تدریس می‌کند:</span>
                      <span class="text-slate-200">${contract.peerCommittedChapters.join('، ') || 'فصل‌های انتخابی'}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 pt-1">
                    <button onclick="window.omniApp.studyPartnerEngine.launchSession('${contract.id}', 'teach')" class="flex-1 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <span>🎙️</span>
                      <span>نوبت من برای تدریس فاینمن</span>
                    </button>
                    <button onclick="window.omniApp.studyPartnerEngine.launchSession('${contract.id}', 'listen')" class="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1.5 cursor-pointer">
                      <span>👂</span>
                      <span>گوش دادن و ارزیابی همتا</span>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Filter By Source Textbook -->
        <div class="flex items-center justify-between gap-4 flex-wrap pt-2">
          <div class="flex items-center gap-2">
            <span class="text-sm text-slate-300 font-semibold">فیلتر بر اساس کتاب منبع:</span>
            <div class="flex gap-2">
              <button onclick="window.omniApp.studyPartnerEngine.setDocFilter('all')" class="px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${this.activeFilterDocId === 'all' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                همه منابع
              </button>
              <button onclick="window.omniApp.studyPartnerEngine.setDocFilter('doc_child_psychopathology')" class="px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${this.activeFilterDocId === 'doc_child_psychopathology' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                📖 روانشناسی مرضی کودک
              </button>
              <button onclick="window.omniApp.studyPartnerEngine.setDocFilter('doc_health_psychology')" class="px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${this.activeFilterDocId === 'doc_health_psychology' ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-white'}">
                📖 روانشناسی سلامت
              </button>
            </div>
          </div>
          <span class="text-xs text-slate-400">
            یافتن همتا با تحلیل هوشمند نقاط قوت و ضعف مکمل
          </span>
        </div>

        <!-- Peer Partner Cards Grid with Mutual Cross-Teaching Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${filteredPeers.map(peer => {
            const synergy = this.analyzeCrossTeachingSynergy(peer);
            return `
              <div class="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition flex flex-col justify-between space-y-5 group bg-slate-900/70 shadow-xl">
                <div class="space-y-4">
                  <!-- Header Row -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-500/40 flex items-center justify-center text-3xl shadow-inner">
                        ${peer.avatar}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="text-base font-bold text-white group-hover:text-purple-300 transition">${peer.name}</h4>
                          <span class="w-2.5 h-2.5 rounded-full ${peer.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}" title="${peer.isOnline ? 'آنلاین برای مباحثه' : 'آفلاین'}"></span>
                        </div>
                        <span class="text-xs text-slate-400 block mt-0.5">${peer.role}</span>
                        <span class="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] border border-slate-700">
                          📖 منبع: ${peer.docTitle}
                        </span>
                      </div>
                    </div>

                    <!-- Synergy Score Badge -->
                    <div class="text-center shrink-0">
                      <div class="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-sm font-black shadow">
                        ${synergy.synergyScore}%
                      </div>
                      <span class="text-[10px] text-slate-400 mt-1 block">هم‌پوشانی و تقارن</span>
                    </div>
                  </div>

                  <!-- Mutual Teaching Swap Matrix -->
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <!-- Column 1: Peer Teaches You -->
                    <div class="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-2">
                      <div class="flex items-center gap-1.5 text-cyan-300 text-xs font-bold">
                        <span>🎓</span>
                        <span>او به شما تدریس می‌کند:</span>
                      </div>
                      <div class="space-y-1">
                        ${peer.masteredChapters.map(ch => `
                          <div class="p-1.5 rounded bg-black/40 text-[11px] text-slate-200 border border-white/5 flex items-center justify-between">
                            <span class="truncate ml-1">${ch.title}</span>
                            <span class="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">${ch.weight}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>

                    <!-- Column 2: You Teach Peer -->
                    <div class="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                      <div class="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
                        <span>🎙️</span>
                        <span>شما به او تدریس می‌کنید:</span>
                      </div>
                      <div class="space-y-1">
                        ${peer.weakChapters.map(ch => `
                          <div class="p-1.5 rounded bg-black/40 text-[11px] text-slate-200 border border-white/5 flex items-center justify-between">
                            <span class="truncate ml-1">${ch.title}</span>
                            <span class="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300">${ch.weight}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>

                  <!-- Teaching Style & Sample Prompt -->
                  <div class="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1.5">
                    <div class="text-[11px] text-slate-400">
                      <b>سبک بازگویی فاینمن همتا:</b> <span class="text-slate-300">${peer.feynmanStyle}</span>
                    </div>
                    <div class="text-[11px] text-purple-300/90 italic bg-purple-900/20 p-2 rounded-lg border border-purple-500/10">
                      💬 «${peer.sampleExplanation}»
                    </div>
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-2">
                  <button onclick="window.omniApp.studyPartnerEngine.openCommitmentModal('${peer.id}')" class="w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30">
                    <span>📜</span>
                    <span>انعقاد قرارداد مباحثه متقابل و تقسیم فصول</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  setDocFilter(docId) {
    this.activeFilterDocId = docId;
    this.render();
  }

  /**
   * Opens Modal to create a Mutual Commitment Contract
   */
  openCommitmentModal(peerId) {
    const peer = this.peerPartners.find(p => p.id === peerId);
    if (!peer) return;

    let modal = document.getElementById('partnership-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'partnership-modal';
      modal.className = 'fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <!-- Header -->
        <div class="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📜</span>
            <div>
              <h3 class="text-base font-bold text-white">قرارداد تعهد مباحثه و تدریس متقابل فاینمن</h3>
              <p class="text-xs text-purple-400">هم‌مباحثه: ${peer.name} (${peer.docTitle})</p>
            </div>
          </div>
          <button onclick="document.getElementById('partnership-modal').classList.add('hidden')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center font-bold">
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-300">
          <div class="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-justify leading-relaxed">
            💡 در این قرارداد، شما و <b>${peer.name}</b> متعهد می‌شوید هر کدام فصول مشخصی از کتاب <b>«${peer.docTitle}»</b> را با دقت بخوانید و در جلسات بازگویی فاینمن، مانند یک استاد آن را به زبان ساده برای طرف مقابل توضیح دهید تا هر دو به تسلط ۱۰۰٪ برسید.
          </div>

          <!-- Chapter Commitments -->
          <div class="space-y-3">
            <label class="font-bold text-white text-sm block">۱. فصولی که شما متعهد می‌شوید به همتا تدریس کنید:</label>
            <div class="space-y-2">
              ${peer.weakChapters.map(ch => `
                <label class="flex items-center gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 hover:border-purple-500/40 cursor-pointer transition">
                  <input type="checkbox" checked value="${ch.title}" class="user-commit-chk w-4 h-4 text-purple-600 rounded bg-slate-800 border-slate-700">
                  <span class="text-slate-200 font-medium">${ch.title}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 mr-auto">${ch.weight}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="space-y-3">
            <label class="font-bold text-white text-sm block">۲. فصولی که همتا متعهد می‌شود به شما تدریس کند:</label>
            <div class="space-y-2">
              ${peer.masteredChapters.map(ch => `
                <label class="flex items-center gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 hover:border-cyan-500/40 cursor-pointer transition">
                  <input type="checkbox" checked value="${ch.title}" class="peer-commit-chk w-4 h-4 text-cyan-600 rounded bg-slate-800 border-slate-700">
                  <span class="text-slate-200 font-medium">${ch.title}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 mr-auto">${ch.weight}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-3">
          <button onclick="document.getElementById('partnership-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
            انصراف
          </button>
          <button onclick="window.omniApp.studyPartnerEngine.confirmPartnership('${peer.id}')" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer">
            <span>🤝</span>
            <span>تایید قرارداد و افتتاح اتاق مباحثه</span>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  confirmPartnership(peerId) {
    const userChks = Array.from(document.querySelectorAll('.user-commit-chk:checked')).map(el => el.value);
    const peerChks = Array.from(document.querySelectorAll('.peer-commit-chk:checked')).map(el => el.value);

    const contract = this.createPartnershipContract(peerId, userChks, peerChks);
    const modal = document.getElementById('partnership-modal');
    if (modal) modal.classList.add('hidden');

    alert(`🎉 قرارداد مطالعه متقابل با موفقیت منعقد شد!\nفصول انتخابی ثبت شدند و اتاق مباحثه برای شما آماده است.`);
    this.render();
  }

  /**
   * Launches an Interactive Peer-Feynman Live Room
   * Mode: 'teach' (You explain to Peer) | 'listen' (Peer explains to You)
   */
  launchSession(contractId, mode = 'teach') {
    const contract = this.activePartnerships.find(c => c.id === contractId);
    if (!contract) return;

    let roomModal = document.getElementById('peer-room-modal');
    if (!roomModal) {
      roomModal = document.createElement('div');
      roomModal.id = 'peer-room-modal';
      roomModal.className = 'fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4';
      document.body.appendChild(roomModal);
    }

    if (mode === 'teach') {
      // You are teaching the committed chapter to the peer
      const targetChapter = contract.userCommittedChapters[0] || 'سرفصل تعهدشده';
      roomModal.innerHTML = `
        <div class="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${contract.peerAvatar}</span>
              <div>
                <h3 class="text-base font-bold text-white">اتاق تدریس فاینمن: نوبت شما برای تدریس</h3>
                <p class="text-xs text-purple-400">شنونده و ارزیاب: ${contract.peerName} | مبحث: ${targetChapter}</p>
              </div>
            </div>
            <button onclick="document.getElementById('peer-room-modal').classList.add('hidden')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center font-bold">
              ✕
            </button>
          </div>

          <div class="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div class="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 text-slate-300 leading-relaxed text-justify">
              🎙️ <b>${contract.peerName}</b> آماده شنیدن توضیحات شما درباره <b>«${targetChapter}»</b> است. مفاهیم را طوری توضیح دهید که گویی به یک مبتدی آموزش می‌دهید.
            </div>

            <textarea id="peer-teach-input" rows="6" placeholder="توضیحات خود را در اینجا به زبان ساده بازگو نمایید یا دکمه ضبط صدا را بزنید..." class="w-full p-4 rounded-xl bg-slate-950/80 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition resize-none leading-relaxed text-sm"></textarea>

            <div class="flex items-center justify-between gap-3 pt-2">
              <button onclick="window.omniApp.feynmanEngine.openFeynmanModal('cpd_ch12_sec2')" class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer">
                <span>⚡</span>
                <span>ارزیابی هوشمند و تایید تدریس توسط همتا</span>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      // Peer is teaching you!
      const targetChapter = contract.peerCommittedChapters[0] || 'سرفصل تعهدشده همتا';
      const peer = this.peerPartners.find(p => p.id === contract.peerId);
      const explanation = peer ? peer.sampleExplanation : 'توضیحات جامع مبحث به صورت دسته‌بندی‌شده...';

      roomModal.innerHTML = `
        <div class="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          <div class="p-4 border-b border-white/10 flex items-center justify-between bg-slate-950">
            <div class="flex items-center gap-3">
              <span class="text-2xl">${contract.peerAvatar}</span>
              <div>
                <h3 class="text-base font-bold text-white">اتاق تدریس فاینمن: نوبت ${contract.peerName} برای تدریس</h3>
                <p class="text-xs text-cyan-400">شما نقش شنونده و ارزیاب را دارید | مبحث: ${targetChapter}</p>
              </div>
            </div>
            <button onclick="document.getElementById('peer-room-modal').classList.add('hidden')" class="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center font-bold">
              ✕
            </button>
          </div>

          <div class="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
            <div class="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-slate-300 leading-relaxed text-justify">
              👂 <b>${contract.peerName}</b> مبحث <b>«${targetChapter}»</b> را برای شما بازگو کرده است. توضیحات او را بخوانید و کیفیت انتقال مفهوم را ارزیابی کنید:
            </div>

            <div class="p-5 rounded-xl bg-slate-950 border border-white/10 space-y-3">
              <div class="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <span>💬</span>
                <span>توضیحات بازگویی‌شده توسط ${contract.peerName}:</span>
              </div>
              <p class="text-slate-200 text-sm leading-relaxed text-justify font-serif">
                «${explanation}»
              </p>
            </div>

            <div class="space-y-2 pt-2">
              <span class="font-bold text-white block">چک‌لیست ارزیابی شما از توضیحات همتا:</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked class="text-cyan-500">
                  <span class="text-slate-300 text-xs">بیان دقیق ملاک‌های تشخیصی</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked class="text-cyan-500">
                  <span class="text-slate-300 text-xs">ذکر اسامی نظریه‌پردازان و سال‌ها</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked class="text-cyan-500">
                  <span class="text-slate-300 text-xs">سادگی و روانی بدون ابهام</span>
                </label>
                <label class="flex items-center gap-2 p-2.5 rounded-lg bg-black/40 border border-white/10 cursor-pointer">
                  <input type="checkbox" checked class="text-cyan-500">
                  <span class="text-slate-300 text-xs">پوشش درمان‌ها و تمایزات افتراقی</span>
                </label>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-3">
            <button onclick="document.getElementById('peer-room-modal').classList.add('hidden')" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">
              بستن
            </button>
            <button onclick="alert('امتیاز شما به ${contract.peerName} ثبت شد و تسلط دوطرفه ارتقا یافت!'); document.getElementById('peer-room-modal').classList.add('hidden')" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition flex items-center gap-2 cursor-pointer">
              <span>⭐</span>
              <span>تایید تسلط همتا و ثبت نمره عالی</span>
            </button>
          </div>
        </div>
      `;
    }

    roomModal.classList.remove('hidden');
  }

  openProfileEditor() {
    const newName = prompt('نام و عنوان شما در شبکه همتایابی:', this.userProfile.name);
    if (newName) {
      this.saveUserProfile({ name: newName });
      this.render();
    }
  }
}

window.StudyPartnerEngine = StudyPartnerEngine;
