(function () {
  'use strict';

  const state = {
    bank: [],
    domain: '',
    totalAnswered: 0,
    correctAnswered: 0,
    current: null,
    answered: false
  };

  function loadThemeFromStartPage() {
    const fallback = {
      bg: '#0f1117',
      panel: '#1a2334',
      text: '#dbe8ff',
      glow: '#45c7ff',
      glow2: '#8ae0ff',
      dim: '#92a8c7',
      border: '#2a3a56'
    };

    try {
      const raw = localStorage.getItem('landing_page_config_v1');
      if (!raw) return fallback;
      const cfg = JSON.parse(raw);
      const themes = Array.isArray(cfg && cfg.themes) ? cfg.themes : [];
      const active = String(cfg && cfg.activeTheme ? cfg.activeTheme : '').trim().toLowerCase();
      const selected = themes.find(function (t) {
        return String(t && t.name ? t.name : '').trim().toLowerCase() === active;
      }) || themes[0];
      const c = selected && selected.colors ? selected.colors : {};
      return {
        bg: c.bg || fallback.bg,
        panel: c.panel || fallback.panel,
        text: c.text || fallback.text,
        glow: c.glow || fallback.glow,
        glow2: c.glow2 || fallback.glow2,
        dim: c.dim || c.muted || fallback.dim,
        border: c.border || fallback.border
      };
    } catch (_err) {
      return fallback;
    }
  }

  function hexToRgba(hex, alpha) {
    const norm = String(hex || '').replace('#', '');
    if (norm.length !== 6) return 'rgba(69,199,255,' + alpha + ')';
    const r = parseInt(norm.slice(0, 2), 16);
    const g = parseInt(norm.slice(2, 4), 16);
    const b = parseInt(norm.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function applyTheme() {
    const t = loadThemeFromStartPage();
    const root = document.documentElement;
    root.style.setProperty('--bg', t.bg);
    root.style.setProperty('--bg-soft', t.panel);
    root.style.setProperty('--panel', t.panel);
    root.style.setProperty('--text', t.text);
    root.style.setProperty('--muted', t.dim);
    root.style.setProperty('--accent', t.glow);
    root.style.setProperty('--accent-soft', hexToRgba(t.glow, 0.2));
    root.style.setProperty('--border', t.border);
  }

  const els = {
    datasetSelect: document.getElementById('datasetSelect'),
    reloadBtn: document.getElementById('reloadBtn'),
    nextBtn: document.getElementById('nextBtn'),
    loadingText: document.getElementById('loadingText'),
    quizWrap: document.getElementById('quizWrap'),
    questionType: document.getElementById('questionType'),
    questionText: document.getElementById('questionText'),
    choices: document.getElementById('choices'),
    resultText: document.getElementById('resultText'),
    statDomain: document.getElementById('statDomain'),
    statQuestions: document.getElementById('statQuestions'),
    statCorrect: document.getElementById('statCorrect'),
    statAccuracy: document.getElementById('statAccuracy'),
    quizTitle: document.getElementById('quizTitle'),
    quizSubtitle: document.getElementById('quizSubtitle')
  };

  function readQuery() {
    const params = new URLSearchParams(window.location.search);
    return {
      dataset: params.get('dataset') || '',
      title: params.get('title') || '',
      subtitle: params.get('subtitle') || ''
    };
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function prettyPhase(phase) {
    return String(phase || '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function getMitreExternalId(externalReferences) {
    if (!Array.isArray(externalReferences)) return '';
    const hit = externalReferences.find(function (ref) {
      return ref && ref.source_name === 'mitre-attack' && ref.external_id;
    });
    return hit ? String(hit.external_id) : '';
  }

  function getTechniqueRecords(stixBundle) {
    const objects = Array.isArray(stixBundle && stixBundle.objects) ? stixBundle.objects : [];
    const collection = objects.find(function (obj) { return obj && obj.type === 'x-mitre-collection'; });

    const domainName = collection && collection.name ? String(collection.name) : 'ATT&CK';
    const techniques = objects
      .filter(function (obj) {
        return obj && obj.type === 'attack-pattern' && obj.x_mitre_deprecated !== true && obj.revoked !== true;
      })
      .map(function (obj) {
        const externalId = getMitreExternalId(obj.external_references);
        const phases = Array.isArray(obj.kill_chain_phases)
          ? obj.kill_chain_phases
              .filter(function (k) { return k && k.kill_chain_name === 'mitre-attack' && k.phase_name; })
              .map(function (k) { return String(k.phase_name); })
          : [];

        return {
          id: externalId || String(obj.id || ''),
          name: String(obj.name || 'Unknown Technique'),
          phases: phases,
          isSub: obj.x_mitre_is_subtechnique === true
        };
      })
      .filter(function (t) {
        return t.id && t.name && t.phases.length > 0;
      });

    return { domainName: domainName, techniques: techniques };
  }

  function uniqueSample(arr, size, skipValue) {
    const source = arr.filter(function (item) { return item !== skipValue; });
    const picked = [];

    while (source.length > 0 && picked.length < size) {
      const idx = Math.floor(Math.random() * source.length);
      picked.push(source.splice(idx, 1)[0]);
    }

    return picked;
  }

  function buildQuestion(bank) {
    const mode = Math.random() < 0.5 ? 'tactic-to-technique' : 'technique-to-tactic';
    const technique = pickRandom(bank);

    if (!technique) return null;

    const primaryPhase = technique.phases[0];

    if (mode === 'tactic-to-technique') {
      const pool = bank.map(function (b) { return b.name; });
      const options = shuffle([technique.name].concat(uniqueSample(pool, 3, technique.name)));
      return {
        mode: mode,
        prompt: 'Which technique belongs to tactic: ' + prettyPhase(primaryPhase) + '?',
        answer: technique.name,
        options: options
      };
    }

    const poolPhases = [];
    bank.forEach(function (b) {
      b.phases.forEach(function (p) {
        if (poolPhases.indexOf(p) === -1) poolPhases.push(p);
      });
    });

    const options = shuffle([prettyPhase(primaryPhase)].concat(uniqueSample(poolPhases.map(prettyPhase), 3, prettyPhase(primaryPhase))));

    return {
      mode: mode,
      prompt: 'What is the primary tactic for ' + technique.id + ' - ' + technique.name + '?',
      answer: prettyPhase(primaryPhase),
      options: options
    };
  }

  function setLoading(text) {
    els.loadingText.textContent = text;
    els.loadingText.classList.remove('hidden');
    els.quizWrap.classList.add('hidden');
  }

  function showQuiz() {
    els.loadingText.classList.add('hidden');
    els.quizWrap.classList.remove('hidden');
  }

  function updateStats() {
    const accuracy = state.totalAnswered > 0
      ? Math.round((state.correctAnswered / state.totalAnswered) * 100)
      : 0;

    els.statDomain.textContent = state.domain || '-';
    els.statQuestions.textContent = String(state.totalAnswered);
    els.statCorrect.textContent = String(state.correctAnswered);
    els.statAccuracy.textContent = accuracy + '%';
  }

  function setResult(text, type) {
    els.resultText.textContent = text;
    els.resultText.classList.remove('good', 'bad');
    if (type) els.resultText.classList.add(type);
  }

  function renderQuestion() {
    state.current = buildQuestion(state.bank);
    state.answered = false;

    if (!state.current) {
      setLoading('No valid techniques found in this dataset.');
      els.nextBtn.disabled = true;
      return;
    }

    showQuiz();
    els.questionType.textContent = state.current.mode === 'tactic-to-technique'
      ? 'Tactic -> Technique'
      : 'Technique -> Tactic';
    els.questionText.textContent = state.current.prompt;
    els.choices.innerHTML = '';

    state.current.options.forEach(function (option) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice';
      btn.textContent = option;
      btn.addEventListener('click', function () {
        if (state.answered) return;
        state.answered = true;

        const isCorrect = option === state.current.answer;
        if (isCorrect) {
          state.correctAnswered += 1;
          btn.classList.add('correct');
          setResult('Correct. Nice pick.', 'good');
        } else {
          btn.classList.add('incorrect');
          setResult('Not this one. Correct answer: ' + state.current.answer, 'bad');
        }

        state.totalAnswered += 1;
        updateStats();

        Array.from(els.choices.querySelectorAll('button')).forEach(function (choiceBtn) {
          choiceBtn.disabled = true;
          if (choiceBtn.textContent === state.current.answer) {
            choiceBtn.classList.add('correct');
          }
        });

        els.nextBtn.disabled = false;
      });
      els.choices.appendChild(btn);
    });

    els.nextBtn.disabled = true;
  }

  async function loadDataset(fileName) {
    setLoading('Loading and indexing ' + fileName + '...');
    setResult('', '');
    els.reloadBtn.disabled = true;
    els.nextBtn.disabled = true;

    try {
      const res = await fetch(fileName, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('HTTP ' + res.status + ' while loading dataset.');
      }

      const stix = await res.json();
      const parsed = getTechniqueRecords(stix);

      state.bank = parsed.techniques;
      state.domain = parsed.domainName;
      state.totalAnswered = 0;
      state.correctAnswered = 0;
      updateStats();

      if (state.bank.length < 4) {
        setLoading('Dataset loaded, but not enough techniques to build quiz options.');
        return;
      }

      renderQuestion();
    } catch (err) {
      setLoading('Failed to load dataset: ' + (err && err.message ? err.message : String(err)));
    } finally {
      els.reloadBtn.disabled = false;
    }
  }

  function applyQueryDefaults() {
    const q = readQuery();

    if (q.dataset) {
      const opt = Array.from(els.datasetSelect.options).find(function (o) { return o.value === q.dataset; });
      if (opt) {
        els.datasetSelect.value = q.dataset;
      } else {
        const custom = document.createElement('option');
        custom.value = q.dataset;
        custom.textContent = q.dataset;
        els.datasetSelect.prepend(custom);
        els.datasetSelect.value = q.dataset;
      }
    }

    if (q.title) {
      els.quizTitle.textContent = q.title;
    }
    if (q.subtitle) {
      els.quizSubtitle.textContent = q.subtitle;
    }
  }

  function bindEvents() {
    els.reloadBtn.addEventListener('click', function () {
      loadDataset(els.datasetSelect.value);
    });

    els.nextBtn.addEventListener('click', function () {
      renderQuestion();
      setResult('', '');
    });
  }

  function init() {
    applyTheme();
    applyQueryDefaults();
    bindEvents();
    loadDataset(els.datasetSelect.value);
  }

  init();
})();
