/**
 * Anki Flashcard Engine & Spaced-Repetition Studio
 * Provides interactive in-browser card flips, spaced-repetition ratings, search, filtering,
 * and direct .apkg / .txt downloads.
 */

class AnkiEngine {
  constructor() {
    this.cards = window.ANKI_CHILD_PSYCHOLOGY_CARDS || [];
    this.currentIndex = 0;
    this.isFlipped = false;
    this.activeFilterChapter = 'all';
    this.activeFilterWeight = 'all';
    this.searchQuery = '';
    this.filteredCards = [...this.cards];
    this.reviewedCardIds = new Set(this.loadReviewHistory());
  }

  loadReviewHistory() {
    try {
      const saved = localStorage.getItem('omni_anki_reviewed_cards');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveReviewHistory() {
    try {
      localStorage.setItem('omni_anki_reviewed_cards', JSON.stringify(Array.from(this.reviewedCardIds)));
    } catch (e) {
      console.warn('Failed to save Anki review history:', e);
    }
  }

  applyFilters() {
    this.filteredCards = this.cards.filter(card => {
      // Chapter filter
      if (this.activeFilterChapter !== 'all' && !card.chapter.includes(this.activeFilterChapter)) {
        return false;
      }
      // Weight filter
      if (this.activeFilterWeight !== 'all' && !card.weight.includes(this.activeFilterWeight)) {
        return false;
      }
      // Search Query
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const text = (card.front + ' ' + card.back + ' ' + (card.hint || '') + ' ' + (card.exam_note || '')).toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });

    if (this.currentIndex >= this.filteredCards.length) {
      this.currentIndex = 0;
    }
    this.isFlipped = false;
  }

  render(containerId = 'view-anki') {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.applyFilters();
    const currentCard = this.filteredCards[this.currentIndex];
    const total = this.filteredCards.length;
    const progressPercent = total > 0 ? Math.round(((this.currentIndex + 1) / total) * 100) : 0;

    // Unique Chapters
    const chapters = Array.from(new Set(this.cards.map(c => c.chapter)));

    container.innerHTML = `
      <div class="max-w-4xl mx-auto p-6 space-y-6">
        <!-- Header Banner -->
        <div class="glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-xl">
          <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
                <span>🎴</span>
                <span>استودیو مرور فاصله‌دار Anki (Spaced Repetition)</span>
              </div>
              <h2 class="text-xl md:text-2xl font-black text-white tracking-tight">
                فلش‌کارت‌های تحلیلی روانشناسی مرضی کودک (${this.cards.length} کارت جامع)
              </h2>
              <p class="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                پوشش ۱۰۰٪ تمام فصول، ملاک‌های تشخیصی DSM-5، نظریه‌پردازان، تمایزات افتراقی و تست‌های احتمالی کنکور ارشد و دکتری.
              </p>
            </div>

            <!-- Download Buttons -->
            <div class="flex flex-col sm:flex-row gap-2 shrink-0">
              <a href="روانشناسی_مرضی_کودک_Anki.apkg" download="روانشناسی_مرضی_کودک_Anki.apkg" class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>📥</span>
                <span>دانلود پکیج Anki (.apkg)</span>
              </a>
              <a href="روانشناسی_مرضی_کودک_Anki.txt" download="روانشناسی_مرضی_کودک_Anki.txt" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-white/10 transition flex items-center justify-center gap-1.5 cursor-pointer">
                <span>📄</span>
                <span>فایل TXT</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Controls, Filter & Search Bar -->
        <div class="glass-panel p-4 rounded-xl border border-white/10 bg-slate-900/80 space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <!-- Search -->
            <div class="relative">
              <input type="text" id="anki-search-input" value="${this.searchQuery}" placeholder="🔍 جستجو در سوالات و مفاهیم..." class="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition">
            </div>

            <!-- Chapter Filter -->
            <div>
              <select id="anki-chapter-select" class="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition cursor-pointer">
                <option value="all">📚 همه فصول (۹ فصل کامل)</option>
                ${chapters.map(ch => `
                  <option value="${ch}" ${this.activeFilterChapter === ch ? 'selected' : ''}>${ch}</option>
                `).join('')}
              </select>
            </div>

            <!-- Weight Filter -->
            <div>
              <select id="anki-weight-select" class="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition cursor-pointer">
                <option value="all">🎯 همه ضرایب پیش‌بینی</option>
                <option value="ضریب ۳" ${this.activeFilterWeight === 'ضریب ۳' ? 'selected' : ''}>🔴 ضریب ۳ (بالاترین احتمال کنکور)</option>
                <option value="ضریب ۲" ${this.activeFilterWeight === 'ضریب ۲' ? 'selected' : ''}>🟠 ضریب ۲ (احتمال متوسط به بالا)</option>
                <option value="ضریب ۱" ${this.activeFilterWeight === 'ضریب ۱' ? 'selected' : ''}>🟡 ضریب ۱ (استاندارد)</option>
              </select>
            </div>
          </div>

          <!-- Progress Bar & Counter -->
          <div class="flex items-center justify-between gap-4 text-xs pt-1">
            <span class="text-slate-400">
              کارت <b>${total > 0 ? this.currentIndex + 1 : 0}</b> از <b>${total}</b>
            </span>
            <div class="flex-1 max-w-xs bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5">
              <div class="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300" style="width: ${progressPercent}%;"></div>
            </div>
            <span class="text-indigo-300 font-bold font-mono">${progressPercent}%</span>
          </div>
        </div>

        <!-- Flashcard Viewport Area -->
        ${currentCard ? `
          <div class="relative perspective-1000 select-none">
            <div id="anki-flashcard" onclick="window.omniApp.ankiEngine.toggleFlip()" class="glass-panel p-6 sm:p-8 rounded-2xl border ${this.isFlipped ? 'border-emerald-500/50 bg-slate-900/95 shadow-emerald-950/40' : 'border-white/15 bg-slate-900/90 hover:border-indigo-500/50'} shadow-2xl transition-all duration-300 cursor-pointer min-h-[300px] flex flex-col justify-between space-y-4">
              
              <!-- Card Meta Badges -->
              <div>
                <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-4 flex-wrap">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
                      ${currentCard.chapter}
                    </span>
                    ${currentCard.page ? `
                      <span class="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        📄 ص ${currentCard.page}
                      </span>
                    ` : ''}
                    <span class="px-2 py-0.5 rounded-md ${currentCard.weight_class === 'badge-weight-high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'} text-[11px] font-semibold">
                      ${currentCard.weight}
                    </span>
                    <span class="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px]">
                      ${currentCard.type}
                    </span>
                  </div>

                  <span class="text-xs text-slate-500 font-mono">
                    ${this.isFlipped ? '👁️ پشت کارت (پاسخ)' : '👆 کلیک برای نمایش پاسخ'}
                  </span>
                </div>

                <!-- Front Side: Question -->
                <div class="text-base sm:text-lg font-bold text-white leading-relaxed text-justify">
                  ${currentCard.front}
                </div>

                ${!this.isFlipped && currentCard.hint ? `
                  <div class="mt-4 p-3 rounded-xl bg-slate-800/60 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2">
                    <span>💡</span>
                    <span>راهنمایی: ${currentCard.hint}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Back Side: Answer (Revealed on flip) -->
              ${this.isFlipped ? `
                <div class="space-y-4 pt-4 border-t border-dashed border-white/15 animate-fadeIn">
                  <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                    <span class="text-xs font-bold text-emerald-400 block">✓ پاسخ تشریحی و کلیدی:</span>
                    <div class="text-sm text-slate-100 leading-relaxed text-justify font-normal">
                      ${currentCard.back}
                    </div>
                  </div>

                  ${currentCard.key_points ? `
                    <div class="space-y-1 text-xs text-slate-300">
                      <span class="font-bold text-cyan-400 block">📌 نکات و ملاک‌های تفکیکی:</span>
                      <ul class="list-disc list-inside space-y-1 text-slate-300 text-xs pr-2">
                        ${currentCard.key_points}
                      </ul>
                    </div>
                  ` : ''}

                  ${currentCard.exam_note ? `
                    <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 leading-relaxed">
                      🎯 <b>تحلیل کنکوری و تله تستی:</b> ${currentCard.exam_note}
                    </div>
                  ` : ''}
                </div>
              ` : `
                <div class="text-center pt-8 text-xs text-slate-400">
                  برای مشاهده پاسخ تشریحی و تحلیل تستی، روی کارت کلیک کنید یا دکمه <b>نمایش پاسخ (Space)</b> را بزنید.
                </div>
              `}
            </div>
          </div>

          <!-- Spaced Repetition Rating Buttons -->
          <div class="flex items-center justify-between gap-2 flex-wrap pt-2">
            <button onclick="window.omniApp.ankiEngine.prevCard()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1">
              <span>➔</span>
              <span>قبلی</span>
            </button>

            ${this.isFlipped ? `
              <div class="flex items-center gap-2 flex-1 justify-center flex-wrap">
                <button onclick="window.omniApp.ankiEngine.rateCard('again')" class="px-3.5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600 text-rose-200 border border-rose-500/40 text-xs font-bold transition cursor-pointer flex flex-col items-center">
                  <span>تکرار مجدد</span>
                  <span class="text-[9px] opacity-70 font-mono">۱ دقیقه</span>
                </button>
                <button onclick="window.omniApp.ankiEngine.rateCard('hard')" class="px-3.5 py-2 rounded-xl bg-amber-600/30 hover:bg-amber-600 text-amber-200 border border-amber-500/40 text-xs font-bold transition cursor-pointer flex flex-col items-center">
                  <span>سخت</span>
                  <span class="text-[9px] opacity-70 font-mono">۱۰ دقیقه</span>
                </button>
                <button onclick="window.omniApp.ankiEngine.rateCard('good')" class="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-200 border border-blue-500/40 text-xs font-bold transition cursor-pointer flex flex-col items-center">
                  <span>خوب</span>
                  <span class="text-[9px] opacity-70 font-mono">۱ روز</span>
                </button>
                <button onclick="window.omniApp.ankiEngine.rateCard('easy')" class="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 border border-emerald-500/40 text-xs font-bold transition cursor-pointer flex flex-col items-center">
                  <span>آسان</span>
                  <span class="text-[9px] opacity-70 font-mono">۴ روز</span>
                </button>
              </div>
            ` : `
              <button onclick="window.omniApp.ankiEngine.toggleFlip()" class="flex-1 max-w-xs py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-950 transition cursor-pointer">
                👁️ نمایش پاسخ (Space)
              </button>
            `}

            <button onclick="window.omniApp.ankiEngine.nextCard()" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer flex items-center gap-1">
              <span>بعدی</span>
              <span>⬅</span>
            </button>
          </div>
        ` : `
          <div class="glass-panel p-12 text-center rounded-2xl border border-white/10 space-y-3">
            <span class="text-3xl">🔍</span>
            <div class="font-bold text-white text-sm">هیچ کارتی با فیلتر انتخابی یافت نشد!</div>
            <p class="text-xs text-slate-400">لطفاً فیلتر فصل یا عبارت جستجو را تغییر دهید.</p>
          </div>
        `}
      </div>
    `;

    // Attach event listeners for controls
    const chapterSelect = document.getElementById('anki-chapter-select');
    chapterSelect?.addEventListener('change', (e) => {
      this.activeFilterChapter = e.target.value;
      this.render();
    });

    const weightSelect = document.getElementById('anki-weight-select');
    weightSelect?.addEventListener('change', (e) => {
      this.activeFilterWeight = e.target.value;
      this.render();
    });

    const searchInput = document.getElementById('anki-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim();
      this.render();
    });
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.render();
  }

  nextCard() {
    if (this.filteredCards.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.filteredCards.length;
    this.isFlipped = false;
    this.render();
  }

  prevCard() {
    if (this.filteredCards.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.filteredCards.length) % this.filteredCards.length;
    this.isFlipped = false;
    this.render();
  }

  rateCard(rating) {
    const card = this.filteredCards[this.currentIndex];
    if (card) {
      this.reviewedCardIds.add(card.id);
      this.saveReviewHistory();
    }
    this.nextCard();
  }
}

window.AnkiEngine = AnkiEngine;
