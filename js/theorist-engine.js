/**
 * Theorist & Researcher Intelligence Engine (Theorist Encyclopedia)
 * Builds comprehensive, unabridged dossiers for all theorists and researchers in the books.
 * Includes complete verbatim theories, experiments, physiological pathways, contrasts, and jump links.
 */

class TheoristEngine {
  constructor(docManager) {
    this.docManager = docManager;
    this.theoristsMap = new Map();
    this.initTheoristProfiles();
  }

  // Pre-compiled academic metadata and deep contextual background for prominent theorists
  initTheoristProfiles() {
    this.curatedProfiles = {
      "هانس سلیه (Hans Selye)": {
        field: "فیزیولوژی، پزشکی و پیشگام نظریه استرس",
        title: "پدر علم مطالعه استرس",
        school: "مکتب فیزیولوژی و زیست‌شناسی استرس",
        coreConcept: "نشانگان عمومی انطباق (General Adaptation Syndrome - GAS) و پاسخ نامعین ارگانیسم",
        bio: "هانس سلیه دانشمند برجسته کانادایی-مجارستانی است که اصطلاح استرس را از علم فیزیک وارد پزشکی و زیست‌شناسی کرد. او استرس را «پاسخ نامعین ارگانیسم در برابر هر خواسته محیطی» تعریف نمود و اثبات کرد بدن انسان در برابر هر نوع استرسور (سرما، گرما، بیماری، شوک) یک الگوی ترشح هورمونی و تغییر بافتی سه‌مرحله‌ای یکنواخت نشان می‌دهد.",
        keyMechanisms: ["ترشح کورتیکواستروئیدها و گلوکوکورتیکوئیدها از قشر فوق‌کلیه", "فرسایش دستگاه ایمنی و آتروفی تیموس در فاز سوم", "ایجاد زخم‌های گوارشی معده و اثنی‌عشر", "ارتباط ترشح طولانی‌مدت کورتیزول با فشار خون و پیری زودرس"],
        famousQuote: "این استرس نیست که ما را از پای درمی‌آورد، بلکه واکنش ما به آن است."
      },
      "ریچارد لازاروس (Richard Lazarus)": {
        field: "روانشناسی شناختی، بالینی و سلامت",
        title: "بنیان‌گذار مدل شناختی-تبادلی استرس و مقابله",
        school: "مکتب شناخت‌گرایی و روانشناسی سلامت تبادلی",
        coreConcept: "نظریه ارزیابی شناختی (Cognitive Appraisal) و تمایز مقابله مسئله‌محور و هیجان‌محور",
        bio: "ریچارد لازاروس و سوزان فلکمن رویکرد مکانیکی و تک‌بعدی سلیه را به چالش کشیدند. لازاروس معتقد است استرس نه یک محرک صرف است و نه یک پاسخ صرف، بلکه حاصل رابطه پویا و تعامل میان شخص و محیط است که در آن فرد رویداد را فراتر از توانایی‌ها و منابع مقابله‌ای خود ارزیابی می‌کند.",
        keyMechanisms: ["ارزیابی اولیه: تعیین ضرر/فقدان، تهدید، یا چالش", "ارزیابی ثانویه: سنجش مهارت‌ها و منابع مقابله‌ای درونی و بیرونی", "ارزیابی مجدد (Re-appraisal) با ورود اطلاعات جدید", "مقابله مسئله‌محور (تغییر موقعیت، کنترل درونی) در برابر هیجان‌محور (تعدیل هیجان، کنترل بیرونی)"],
        famousQuote: "هیچ رویدادی ذاتاً استرس‌زا نیست مگر آنکه در ذهن فرد چنین ارزیابی شود."
      },
      "آرون آنتونوسکی (Aaron Antonovsky)": {
        field: "جامعه‌شناسی پزشکی و روانشناسی سلامت",
        title: "مبدع مفهوم حس انسجام و رویکرد سلامتی‌زا",
        school: "مکتب سالوتوژنز (Salutogenesis)",
        coreConcept: "حس انسجام (Sense of Coherence - SOC) و پیوستار سلامت-بیماری",
        bio: "آنتونوسکی با مطالعه زنان بازمانده از اردوگاه‌های کار اجباری نازی دریافت که برخی از افراد با وجود شدیدترین تروماها سلامت جسمی و روانی خود را حفظ می‌کنند. او جهت‌گیری سنتی آسیب‌شناختی (پاتوژنز) را معکوس کرد و جهت‌گیری «سلامتی‌زا» را بنا نهاد.",
        keyMechanisms: ["مؤلفه‌های سه‌گانه حس انسجام: قابل فهم بودن (Comprehensibility)، قابل مدیریت بودن (Manageability)، و معناداری (Meaningfulness)", "پیش‌بینی رفتارهای محافظ سلامت (سیگار نکشیدن)", "تسهیل فعالیت سلول‌های کشنده طبیعی (NK) و کاهش آسیب ناشی از استرس"],
        famousQuote: "به جای پرسیدن این که چرا انسان‌ها بیمار می‌شوند، باید بپرسیم چرا با وجود تمام استرسورها سالم می‌مانند؟"
      },
      "سوزان کوباسا (Suzanne Kobasa)": {
        field: "روانشناسی شخصیت و سلامت",
        title: "نظریه‌پرداز مفهوم سخت‌رویی (Hardiness)",
        school: "مکتب روانشناسی اگزیستانسیال و شناختی",
        coreConcept: "سخت‌رویی شخصیتی و ارزیابی مشقات زندگی به عنوان فرصت رشد",
        bio: "سوزان کوباسا بر اساس مبانی روانشناسی وجودی و فرآیندهای ارزیابی شناختی، سخت‌رویی را به عنوان سپری شخصیتی در برابر تبدیل استرس به بیماری معرفی کرد.",
        keyMechanisms: ["۳ مؤلفه سخت‌رویی (3Cs): کنترل (Control - باور به تأثیرگذاری)، تعهد (Commitment - اشتغال عمیق به اهداف)، چالش (Challenge - تلقی تغییرات به عنوان فرصت رشد)"],
        famousQuote: "افراد سخت‌رو تغییرات را تهدیدی برای بقا نمی‌دانند، بلکه محرکی برای بالندگی می‌شمارند."
      },
      "آرون بک (Aaron Beck)": {
        field: "روان‌پزشکی، روان‌درمانی و شناخت‌درمانی",
        title: "پدر شناخت‌درمانی و درمان شناختی-رفتاری (CBT)",
        school: "مکتب شناختی-رفتاری",
        coreConcept: "معماری سه‌سطحی شناخت، طرحواره‌های ناسازگار و پرسشگری سقراطی",
        bio: "آرون بک با ارزیابی افسردگی و بیماری‌های مزمن اثبات کرد احساسات و رفتارهای ناکارآمد محصول مستقیم تحریف‌ها و خطاهای نظام‌دار تفکر هستند نه صرف رویدادهای بیرونی.",
        keyMechanisms: ["سطح ۱: باورهای هسته‌ای (Core Beliefs - عمیق و سخت)", "سطح ۲: باورهای واسطه‌ای (قواعد، فرضیات و نگرش‌ها)", "سطح ۳: افکار خودکار (Automatic Thoughts - تصاویر و نجوای درونی در موقعیت)", "فنون پرسشگری سقراطی، آزمون فرضیه رفتاری و تکالیف خانگی"],
        famousQuote: "اگر افکارمان را تغییر دهیم، احساسات و جسممان دگرگون خواهند شد."
      },
      "آلبرت بندورا (Bandura)": {
        field: "روانشناسی یادگیری و اجتماعی",
        title: "واضع نظریه یادگیری اجتماعی و خودکارآمدی",
        school: "مکتب یادگیری اجتماعی-شناختی",
        coreConcept: "خودکارآمدی (Self-Efficacy) و یادگیری مشاهده‌ای / سرمشق‌گیری",
        bio: "بندورا نشان داد باور فرد به توانایی‌های خود در انجام یک عمل، مهم‌ترین تعیین‌کننده انگیزش، میزان تلاش و پاسخ‌های بیولوژیک به استرس است.",
        keyMechanisms: ["سرمشق‌سازی مستقیم و نمادین", "تعدیل پاسخ سمپاتیک و نورواندوکرین بر اثر خودکارآمدی بالا", "پایداری در رژیم‌های درمانی و ورزشی"],
        famousQuote: "باور انسان به توانایی‌هایش، آینده او را رقم می‌زند."
      },
      "جولیان راتر (Julian Rotter)": {
        field: "روانشناسی شخصیت",
        title: "نظریه‌پرداز منبع کنترل (Locus of Control)",
        school: "مکتب یادگیری اجتماعی",
        coreConcept: "منبع کنترل درونی در برابر منبع کنترل بیرونی",
        bio: "راتر مفهوم منبع کنترل را به عنوان یک خصیصه پایدار شخصیتی در اسناد نتایج رویدادها به تلاش درونی یا شانس و قدرت دیگران معرفی کرد.",
        keyMechanisms: ["کنترل درونی -> رفتارهای فعالانه حل مسئله و محافظت از سلامت", "کنترل بیرونی -> تسلیم، منفعل بودن و خطر بالای درماندگی آموخته‌شده"]
      },
      "شلی تایلر (Shelley Taylor)": {
        field: "روانشناسی سلامت و سازگاری با سرطان",
        title: "نظریه‌پرداز انطباق شناختی در بیماری‌های مزمن",
        school: "روانشناسی سلامت شناختی",
        coreConcept: "نظریه انطباق شناختی (Cognitive Adaptation) و توهمات مثبت سازگارانه",
        bio: "شلی تایلر با بررسی عمیق بیماران مبتلا به سرطان نشان داد سازگاری موفقیت‌آمیز وابسته به بازسازی معنا، احساس تسلط و خودارتقایی از طریق خطاهای شناختی مثبت است.",
        keyMechanisms: ["۱) جستجوی معنا (پاسخ به چرایی رخ دادن رویداد)", "۲) جستجوی تسلط (بازگرداندن کنترل با رژیم، مراقبه و تغییرات رفتاری)", "۳) خودارتقایی (بازسازی عزت‌نفس با مقایسه اجتماعی رو به پایین)"]
      },
      "رودولف موس و شافر (Moos & Schaefer)": {
        field: "روانشناسی بحران و انطباق بیماری‌های مزمن",
        title: "نظریه‌پردازان مدل بحران در بیماری‌های جسمی",
        school: "نظریه سیستم‌ها و روانشناسی بحران",
        coreConcept: "بیماری به عنوان بحران تعادل‌شکن، تکالیف انطباقی و مهارت‌های مقابله‌ای سه‌گانه",
        bio: "موس و شافر نشان دادند بیماری جسمی تعادل حیاتی روانشناختی را برهم می‌زند و ۵ تغییر اساسی در هویت، محل، نقش، حمایت اجتماعی و آینده ایجاد می‌کند.",
        keyMechanisms: ["تکالیف انطباقی ۷‌گانه (۳ مورد خاص بیماری + ۴ مورد عمومی)", "مهارت‌های مقابله‌ای: ارزیابی‌مدار (تحلیل منطقی، بازتعریف)، مسئله‌مدار (جستجوی اطلاعات)، هیجان‌مدار (تخلیه هیجانی، حفظ امید)"]
      },
      "جیمز په‌نه‌بیکر (James Pennebaker)": {
        field: "روانشناسی سلامت و ادراک نشانه‌های بیماری",
        title: "پیشگام روانشناسی ادراک بدنی و فواید افشای هیجانی",
        school: "روانشناسی شناختی-ادراکی سلامت",
        coreConcept: "عوامل ثابت و موقتی در ادراک نشانه‌های جسمانی و خطای خطی بودن آسیب-درد",
        bio: "په‌نه‌بیکر اثبات کرد تجربه بدنی ذاتاً مبهم است و ادراک علائم به جای رابطه مستقیم با آسیب بافتی، تحت تأثیر خودآگاهی، نوروزگرایی، خلق منفی و تمرکز حواس تغییر می‌کند.",
        keyMechanisms: ["عوامل ثابت: خودآگاهی درونی، نوروزگرایی، عاطفه منفی، جسمانی کردن (Somatization)", "عوامل موقتی: خلق، کاهش محرک‌های بیرونی، حواس‌پرتی و انتظارات"]
      },
      "جرج انگل (George Engel)": {
        field: "پزشکی و روان‌پزشکی",
        title: "معمار الگوی زیستی-روانی-اجتماعی (Biopsychosocial Model)",
        school: "نظریه سیستم‌ها در پزشکی",
        coreConcept: "الگوی بیوسایکوسوشیال در برابر مدل تقلیل‌گرایانه زیستی-طبی",
        bio: "جرج انگل در اواخر قرن بیستم مدل مکانیکی و تک‌بعدی پاستور را نقد کرد و سلامت را حاصل تعامل سیستم‌های بدنی، روانی و محیط اجتماعی-بوم‌شناختی تعریف نمود.",
        keyMechanisms: ["تعامل متقابل ژنتیک، آسیب بافتی، شناخت، هیجانات، هنجارهای اجتماعی و معنویت"]
      },
      "فریدمن و روزنمن (Friedman & Rosenman)": {
        field: "متخصصان قلب و عروق",
        title: "کاشفان تیپ شخصیتی A و رابطه آن با بیماری کرونر قلب",
        school: "پزشکی رفتاری و قلب و عروق",
        coreConcept: "تیپ شخصیتی A، خصومت (ویلیامز) و آسیب عروق کرونر (CHD)",
        bio: "دو متخصص قلب آمریکایی که متوجه شدند الگوی رفتاری رقابت‌جویانه، ناشکیبا و خصومت‌آمیز در بیماران قلبی به شدت بالاتر از سایرین است.",
        keyMechanisms: ["نوسانات شدید اپی‌نفرین و نوراپی‌نفرین", "تصلب شرایین و تنگی عروق کرونر", "نقش کلیدی مؤلفه خشم و خصومت پنهان"]
      },
      "مارتین سلیگمن (Martin Seligman)": {
        field: "روانشناسی بالینی و مثبت‌نگر",
        title: "کاشف درماندگی آموخته‌شده و سبک‌های اسنادی",
        school: "روانشناسی شناختی و مثبت‌نگر",
        coreConcept: "درماندگی آموخته‌شده (Learned Helplessness) و سبک اسنادی بدبینانه",
        bio: "سلیگمن نشان داد شکست مکرر در کنترل محیط باعث می‌شود فرد حتی در صورت فراهم شدن فرصت کنترل، دست از تلاش بکشد و دچار افسردگی و تضعیف ایمنی شود.",
        keyMechanisms: ["اسناد درونی، پایدار و کلی در مواجهه با شکست‌ها -> آسیب جدی به سلامت"]
      },
      "هیلدا بروچ (Hilde Bruch)": {
        field: "روان‌پزشکی و روان‌تحلیل‌گری",
        title: "پیشگام سبب‌شناسی بی‌اشتهایی روانی در نوجوانان",
        school: "روان‌تحلیل‌گری و پویایی خانواده",
        coreConcept: "بی‌اشتهایی روانی به عنوان جدال برای خودمختاری و هویت‌یابی",
        bio: "بروچ اثبات کرد بی‌اشتهایی روانی (Anorexia) ناشی از رابطه درهم‌تنیده مادر-دختر و فقر خودمختاری است که در آن نخوردن غذا تنها ابزار اعمال کنترل کودک بر زندگی خویشتن است."
      }
    };
  }

  /**
   * Normalizes theorist names to unify variants (e.g. 'سلیه', 'هانس سلیه', 'Hans Selye')
   */
  normalizeName(name) {
    if (!name) return '';
    return name.replace(/\([^\)]*\)/g, '').trim();
  }

  /**
   * Aggregates all nodes, theories, and occurrences related to a specific theorist.
   */
  getTheoristDossier(theoristQuery) {
    const normQuery = this.normalizeName(theoristQuery);
    const allNodes = Array.from(this.docManager.nodeIndex.values());

    const matchedNodes = [];
    let officialName = theoristQuery;

    for (const node of allNodes) {
      if (node.researchers && Array.isArray(node.researchers)) {
        for (const res of node.researchers) {
          if (this.normalizeName(res) === normQuery || res.includes(normQuery) || normQuery.includes(this.normalizeName(res))) {
            matchedNodes.push(node);
            officialName = res;
            break;
          }
        }
      } else {
        // Also check if theorist name is mentioned in node full text or title
        const fullText = (node.title || '') + ' ' + (node.full_text || '') + ' ' + (node.summary || '');
        if (fullText.includes(normQuery) && !matchedNodes.some(m => m.id === node.id)) {
          matchedNodes.push(node);
        }
      }
    }

    // Lookup curated profile metadata if available
    let profile = null;
    for (const [key, prof] of Object.entries(this.curatedProfiles)) {
      if (this.normalizeName(key) === normQuery || key.includes(normQuery) || normQuery.includes(this.normalizeName(key))) {
        profile = prof;
        officialName = key;
        break;
      }
    }

    // Find cross-links and contrasts involving these nodes
    const allLinks = this.docManager.getAllCrossLinks();
    const allContrasts = this.docManager.getAllContrasts();
    const matchedNodeIds = new Set(matchedNodes.map(n => n.id));

    const relatedLinks = allLinks.filter(l => matchedNodeIds.has(l.source) || matchedNodeIds.has(l.target));
    const relatedContrasts = allContrasts.filter(c => matchedNodeIds.has(c.nodeA) || matchedNodeIds.has(c.nodeB));

    // Compile distinct physiological pathways and tags
    const bioPathways = new Set();
    const tags = new Set();
    matchedNodes.forEach(n => {
      if (n.physiological_pathways) n.physiological_pathways.forEach(p => bioPathways.add(p));
      if (n.tags) n.tags.forEach(t => tags.add(t));
    });

    return {
      name: officialName,
      cleanName: normQuery,
      profile: profile || {
        field: "روانشناسی سلامت و علوم رفتاری",
        title: `پژوهشگر و نظریه‌پرداز در حوزه ${matchedNodes[0]?.docTitle || 'روانشناسی'}`,
        school: "رویکردهای علمی و بالینی",
        coreConcept: `مفاهیم و نظریات ارائه‌شده در ${matchedNodes.length} بخش از کتاب`,
        bio: `نظریات و پژوهش‌های ${officialName} در فصول مختلف کتاب به طور جامع تبیین شده است.`
      },
      nodes: matchedNodes,
      nodeCount: matchedNodes.length,
      relatedLinks: relatedLinks,
      relatedContrasts: relatedContrasts,
      bioPathways: Array.from(bioPathways),
      tags: Array.from(tags)
    };
  }

  /**
   * Returns list of all distinct theorists with summary counts.
   */
  getAllTheoristsList() {
    const map = new Map();
    const allNodes = Array.from(this.docManager.nodeIndex.values());

    allNodes.forEach(node => {
      if (node.researchers && Array.isArray(node.researchers)) {
        node.researchers.forEach(res => {
          const norm = this.normalizeName(res);
          if (!map.has(norm)) {
            map.set(norm, {
              rawName: res,
              cleanName: norm,
              nodeCount: 0,
              docs: new Set(),
              hasCuratedProfile: false
            });
          }
          const item = map.get(norm);
          item.nodeCount++;
          item.docs.add(node.docTitle || 'سند');
        });
      }
    });

    // Check curated profiles
    for (const item of map.values()) {
      for (const key of Object.keys(this.curatedProfiles)) {
        if (this.normalizeName(key) === item.cleanName) {
          item.hasCuratedProfile = true;
          item.rawName = key;
          break;
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.nodeCount - a.nodeCount);
  }
}

window.TheoristEngine = TheoristEngine;
window.theoristEngine = new TheoristEngine(window.docManager);
