(function () {
  'use strict';

  const jokeText = document.getElementById('jokeText');
  const newJokeBtn = document.getElementById('newJoke');
  const copyBtn = document.getElementById('copyJoke');
  const tweetLink = document.getElementById('tweetJoke');
  const jokeMeta = document.getElementById('jokeMeta');

  if (!jokeText || !newJokeBtn) return;

  // Local fallback jokes
  const LOCAL_JOKES = [
    "Why don't scientists trust atoms? Because they make up everything!",
    "I told my computer I needed a break, and it said 'No problem — I'll go to sleep.'",
    "Why did the scarecrow win an award? He was outstanding in his field.",
    "I used to play piano by ear, but now I use my hands.",
    "Why don't programmers like nature? Too many bugs."
  ];

  function setLoading(on = true) {
    newJokeBtn.disabled = on;
    newJokeBtn.textContent = on ? 'Loading…' : 'Tell me a joke';
  }

  function showJoke(text, meta = '') {
    jokeText.textContent = text;
    if (jokeMeta) jokeMeta.textContent = meta;
    updateTweetLink(text);
  }

  function updateTweetLink(text) {
    if (!tweetLink) return;
    const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text + ' #joke');
    tweetLink.href = url;
  }

  async function fetchFromIcan() {
    const res = await fetch('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json' } , cache: 'no-cache' });
    if (!res.ok) throw new Error('icanhazdadjoke failed');
    const data = await res.json();
    if (data && data.joke) return { text: data.joke, source: 'icanhazdadjoke' };
    throw new Error('invalid icanhazdadjoke response');
  }

  async function fetchFromOfficial() {
    const res = await fetch('https://official-joke-api.appspot.com/random_joke', { cache: 'no-cache' });
    if (!res.ok) throw new Error('official-joke-api failed');
    const data = await res.json();
    if (data && (data.setup || data.joke)) {
      const text = data.setup ? `${data.setup} ${data.punchline || ''}` : (data.joke || '');
      return { text: text.trim(), source: 'official-joke-api' };
    }
    throw new Error('invalid official-joke response');
  }

  function localFallback() {
    const pick = LOCAL_JOKES[Math.floor(Math.random() * LOCAL_JOKES.length)];
    return { text: pick, source: 'local' };
  }

  async function getJoke() {
    try {
      return await fetchFromIcan();
    } catch (e1) {
      try { return await fetchFromOfficial(); } catch (e2) { return localFallback(); }
    }
  }

  async function showRandomJoke() {
    setLoading(true);
    try {
      const j = await getJoke();
      showJoke(j.text, `source: ${j.source}`);
    } catch (err) {
      showJoke('Failed to get a joke. Try again!', 'source: error');
      console.error('joke error', err);
    } finally {
      setLoading(false);
    }
  }

  async function copyCurrentJoke() {
    const text = jokeText.textContent || '';
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      const prev = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = prev), 1200);
    } catch (e) {
      showJoke('Copy failed (use your browser copy).', '');
      console.warn('copy failed', e);
    }
  }

  newJokeBtn.addEventListener('click', showRandomJoke);
  if (copyBtn) copyBtn.addEventListener('click', copyCurrentJoke);

  showRandomJoke();

})();
