/**
 * Study Partner & Collaborative Peer Matchmaking Engine (Beta)
 * Matches students and researchers based on mastery scores, active chapters, and study goals.
 */

class StudyPartnerEngine {
  constructor(docManager) {
    this.docManager = docManager;
    this.userProfile = this.loadUserProfile();
    this.peerPartners = this.getInitialPeerDirectory();
    this.activeInvites = new Set();
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
      bio: 'علاقه‌مند به روانشناسی مرضی کودک و روانشناسی سلامت'
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

  calculateUserStats() {
    const quizRecords = JSON.parse(localStorage.getItem('omni_node_mastery') || '{}');
    const feynmanRecords = JSON.parse(localStorage.getItem('omni_feynman_mastery') || '{}');

    const totalQuizPassed = Object.values(quizRecords).filter(r => r.passed).length;
    const totalFeynmanPassed = Object.values(feynmanRecords).filter(r => r.passed).length;
    const allScores = [
      ...Object.values(quizRecords).map(r => r.score || 0),
      ...Object.values(feynmanRecords).map(r => r.score || 0)
    ];

    const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 50;

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
        score: 92,
        activeChapter: 'فصل ۱۲: اختلالات فراگیر رشد (اتیسم، رت، هلر)',
        strengths: ['طیف اتیسم', 'سندروم رت', 'ایکن‌باخ'],
        studyPace: '۳ ساعت در روز',
        isOnline: true,
        compatibilityReason: 'تسلط بالا بر فصول ضریب ۳ و آماده تبادل سوالات دشوار'
      },
      {
        id: 'peer_amir',
        name: 'امیرحسین کاظمی',
        avatar: '👨‍⚕️',
        role: 'دانشجوی روانشناسی دانشگاه تهران',
        targetExam: 'کنکور کارشناسی ارشد روانشناسی',
        score: 85,
        activeChapter: 'فصل ۱۳: کمبود توجه و رفتار مخرب ADHD',
        strengths: ['ADHD و ریتالین', 'اختلال سلوک', 'پیکا و نشخوار'],
        studyPace: '۲ ساعت در روز',
        isOnline: true,
        compatibilityReason: 'نمره بسیار نزدیک به شما و هم‌پوشانی کامل در سرفصل‌های مرضی کودک'
      },
      {
        id: 'peer_mehdi',
        name: 'دکتر مهدی نوری',
        avatar: '👨‍🏫',
        role: 'پژوهشگر دکتری روانشناسی سلامت',
        targetExam: 'آزمون دکتری و بورد تخصصی سلامت',
        score: 96,
        activeChapter: 'فصول سلامت: الگوهای استرس و سایکونوروایمونولوژی',
        strengths: ['هانس سلیه (GAS)', 'ریچارد لازاروس', 'سوزان کوباسا'],
        studyPace: '۴ ساعت در روز',
        isOnline: false,
        compatibilityReason: 'تسلط تخصصی بر روانشناسی سلامت و مناسب برای رفع اشکال عمیق'
      },
      {
        id: 'peer_niloufar',
        name: 'نیلوفر صادقی',
        avatar: '👩‍🔬',
        role: 'دانشجوی پیام‌نور و متقاضی ارشد بالینی کودک',
        targetExam: 'امتحانات دانشگاهی و کنکور ارشد',
        score: 78,
        activeChapter: 'فصل ۹: نارسایی‌های یادگیری (دیسلکسی و دیسگرافیا)',
        strengths: ['نارسایی یادگیری', 'اختلالات ارتباطی', 'DCD'],
        studyPace: '۱.۵ ساعت در روز',
        isOnline: true,
        compatibilityReason: 'در حال مرور مفاهیم پایه‌ای فصول یادگیری و حرکتی'
      },
      {
        id: 'peer_parham',
        name: 'پرهام یزدانی',
        avatar: '👨‍🎓',
        role: 'داوطلب کنکور ارشد و عضو گروه مطالعه بالینی',
        targetExam: 'کنکور کارشناسی ارشد روانشناسی',
        score: 88,
        activeChapter: 'فصل ۱۱: اختلالات دفع و پروتکل ماورر',
        strengths: ['شب‌ادراری و انکوپرزیس', 'معاینه وضعیت روانی MSE', 'آزمون‌های هوش'],
        studyPace: '۳ ساعت در روز',
        isOnline: true,
        compatibilityReason: 'نمره عالی در تشخیص‌های افتراقی و چالش‌های بازگویی فاینمن'
      }
    ];
  }

  /**
   * Computes matching compatibility score (0-100%) between user and peer
   */
  calculateMatchScore(peer) {
    const userStats = this.calculateUserStats();
    const scoreDiff = Math.abs(userStats.avgScore - peer.score);
    let match = 100 - (scoreDiff * 1.8);

    if (peer.targetExam === this.userProfile.targetExam) {
      match += 10;
    }

    return Math.max(40, Math.min(99, Math.round(match)));
  }

  sendInvite(peerId) {
    this.activeInvites.add(peerId);
    return true;
  }

  render(containerId = 'view-dochub') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const userStats = this.calculateUserStats();
    const rankedPeers = this.peerPartners.map(p => ({
      ...p,
      matchScore: this.calculateMatchScore(p)
    })).sort((a, b) => b.matchScore - a.matchScore);

    container.innerHTML = `
      <div class="max-w-6xl mx-auto p-6 space-y-8">
        <!-- Hero Header -->
        <div class="glass-panel p-8 rounded-2xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900">
          <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
                <span>👥</span>
                <span>تالار همتایابی و مباحثه درسی (Study Partner Hub - Beta)</span>
              </div>
              <h2 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                شبکه همتایابی بر اساس نمرات آزمون و تسلط بر فصول
              </h2>
              <p class="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                بر اساس نمرات آزمون‌های ۹۰٪ و چالش‌های فاینمن شما، بهترین هم‌مباحثه‌ها و رقبای درسی برای مطالعه مشترک و آزمون‌های دوطرفه پیشنهاد می‌شوند.
              </p>
            </div>

            <!-- User Stat Card -->
            <div class="bg-black/40 p-4 rounded-2xl border border-purple-500/30 text-center min-w-[200px]">
              <span class="text-xs text-purple-300 font-semibold">میانگین تسلط شما</span>
              <div class="text-3xl font-black text-white mt-1">${userStats.avgScore}%</div>
              <span class="text-[10px] text-emerald-400 mt-1 block">🏆 ${userStats.masteryCount} شاخه مسلط‌شده</span>
            </div>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="flex items-center justify-between gap-4 flex-wrap">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            <span>همتایان پیشنهادی با بالاترین سازگاری درسی:</span>
          </h3>
          <div class="text-xs text-slate-400">
            مرتب‌سازی بر اساس الگوریتم درصد هم‌پوشانی و نمره
          </div>
        </div>

        <!-- Peer Partner Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${rankedPeers.map(peer => {
            const hasInvited = this.activeInvites.has(peer.id);
            return `
              <div class="glass-panel p-6 rounded-2xl border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition flex flex-col justify-between space-y-4 group bg-slate-900/60">
                <div class="space-y-3">
                  <!-- Header Row -->
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
                        ${peer.avatar}
                      </div>
                      <div>
                        <div class="flex items-center gap-2">
                          <h4 class="text-sm font-bold text-white group-hover:text-purple-300 transition">${peer.name}</h4>
                          <span class="w-2 h-2 rounded-full ${peer.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}" title="${peer.isOnline ? 'آنلاین' : 'آفلاین'}"></span>
                        </div>
                        <span class="text-[11px] text-slate-400 line-clamp-1">${peer.role}</span>
                      </div>
                    </div>

                    <!-- Compatibility Match Ring -->
                    <div class="text-center shrink-0">
                      <div class="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-black">
                        ${peer.matchScore}%
                      </div>
                      <span class="text-[9px] text-slate-400 mt-0.5 block">سازگاری</span>
                    </div>
                  </div>

                  <!-- Details Badges -->
                  <div class="space-y-2 pt-2 border-t border-white/5 text-xs">
                    <div class="flex items-center justify-between text-slate-300">
                      <span class="text-slate-400 text-[11px]">مبحث فعلی:</span>
                      <span class="font-medium text-cyan-300 text-[11px]">${peer.activeChapter}</span>
                    </div>
                    <div class="flex items-center justify-between text-slate-300">
                      <span class="text-slate-400 text-[11px]">نمره تسلط آزمون‌ها:</span>
                      <span class="font-bold text-amber-400">${peer.score}%</span>
                    </div>
                  </div>

                  <!-- Strengths -->
                  <div class="space-y-1 pt-1">
                    <span class="text-[10px] text-slate-400 font-semibold">نقاط قوت و تسلط:</span>
                    <div class="flex flex-wrap gap-1">
                      ${peer.strengths.map(s => `
                        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          ${s}
                        </span>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Why Match -->
                  <p class="text-[11px] text-purple-200/80 bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20 leading-relaxed">
                    💡 ${peer.compatibilityReason}
                  </p>
                </div>

                <!-- Action Button -->
                <div class="pt-3 border-t border-white/10">
                  <button onclick="window.omniApp.studyPartnerEngine.handleInviteClick('${peer.id}', '${peer.name}')" class="w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${hasInvited ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/25'}">
                    <span>${hasInvited ? '✓ درخواست مباحثه ارسال شد' : '🤝 درخواست هم‌مباحثه و مطالعه'}</span>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  handleInviteClick(peerId, peerName) {
    this.sendInvite(peerId);
    alert(`درخواست مطالعه و مباحثه مشترک برای «${peerName}» ارسال گردید. جلسه تمرین مشترک فاینمن و آزمون فصلی برای شما رزرو شد.`);
    this.render();
  }
}

window.StudyPartnerEngine = StudyPartnerEngine;
