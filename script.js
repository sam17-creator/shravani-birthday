/* Premium birthday experience: transitions, audio, confetti and fireworks. */
const screens = [...document.querySelectorAll('.screen')];
const gift = document.getElementById('giftButton');
const introGift = document.getElementById('introGiftButton');
const musicToggle = document.getElementById('musicControl');
const musicPanel = document.getElementById('musicPanel');
const playPauseButton = document.getElementById('playPauseButton');
const muteButton = document.getElementById('muteButton');
const birthdayMusic = document.getElementById('birthdayMusic');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const DEFAULT_MUSIC_VOLUME = .7;
const VOLUME_STORAGE_KEY = 'birthday-surprise-music-volume';
const PLAYBACK_STORAGE_KEY = 'birthday-surprise-music-state';
const MUTE_STORAGE_KEY = 'birthday-surprise-music-muted';
let giftHasOpened = false;
let fadeFrame;
let selectedMusicVolume = loadSavedVolume();
let savedPlaybackState = loadSavedPlaybackState();

// Configure the one persistent audio element. It is never recreated between sections.
birthdayMusic.loop = true;
birthdayMusic.preload = 'auto';
birthdayMusic.volume = selectedMusicVolume;
birthdayMusic.muted = loadSavedMuteState();
syncVolumeControl();
syncMusicInterface();
createMagicalBackground();
const photoSources = Array.from({ length: 30 }, (_, index) => `assets/images/photo${index + 1}.jpeg`);
const memoryCaptions = [
  'Our Little Sunshine \u2600\ufe0f', 'Smiles That Brighten Every Day \u2764\ufe0f', 'Growing With Dreams \u2728', 'A Heart Full of Joy',
  'The Sweetest Little Moments', 'Forever Our Happy Place', 'A Sparkle All Your Own', 'Laughing Into Beautiful Days',
  'Tiny Steps, Big Dreams', 'Made of Love and Sunshine', 'A Memory to Keep Forever', 'Your Magic Never Fades',
  'So Much Love in One Frame', 'A Beautiful Soul Growing Up', 'The Kindest Smile', 'A Little Star on Her Way',
  'Every Day, More Wonderful', 'Soft Moments, Strong Heart', 'Keep Dancing Through Life', 'A Wish for Every Dream',
  'The Joy You Bring Us', 'Brave, Bright, and Beautiful', 'A Thousand Reasons to Smile', 'Our Favourite Kind of Magic',
  'You Make Life More Colourful', 'A Future Full of Wonder', 'Keep Shining, Little Dreamer', 'Growing Into Greatness',
  'Loved Beyond Every Word', 'Happy 13th Birthday, Beautiful \u2728'
];
const puzzles = {
  funnyPuzzle: { boardId: 'funnyPuzzleBoard', statusId: 'funnyPuzzleStatus', image: 'assets/images/puzzle-funny.jpeg', solvedText: 'Okay... you actually fixed this one. \uD83D\uDE02', nextText: 'Next memory \u2192', nextScreen: 'specialPuzzle' },
  specialPuzzle: { boardId: 'specialPuzzleBoard', statusId: 'specialPuzzleStatus', image: 'assets/images/puzzle-special.jpeg', solvedText: 'Some memories are worth putting back together.', nextText: '', nextScreen: 'finalMessage' }
};
const puzzleState = {};

function showScreen(id) {
  screens.forEach((screen) => screen.classList.toggle('active', screen.id === id));
  document.getElementById('experience').scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'birthday') createConfetti();
  if (puzzles[id]) initialisePuzzle(id);
  if (id === 'finalMessage') playFinalMessage();
  if (id === 'final') createFireworks();
}

// Hold the cinematic loading screen for three seconds before revealing the gift.
window.addEventListener('load', () => setTimeout(() => showScreen('introGift'), 3000));
document.querySelectorAll('[data-next]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.next)));

gift.addEventListener('click', () => {
  if (gift.classList.contains('open')) return;
  gift.classList.add('open');
  createConfetti();
  unlockMusicFromGift();
  setTimeout(() => showScreen('birthday'), 1450);
});

// The first interaction is kept separate from the homepage, so the original journey stays unchanged.
introGift.addEventListener('click', () => {
  if (introGift.classList.contains('opened')) return;
  introGift.classList.add('opened');
  releaseIntroMagic();
  unlockMusicFromGift();
  setTimeout(startMemorySequence, 1500);
});

musicToggle.addEventListener('click', () => setMusicPanelOpen(!musicPanel.classList.contains('is-open')));
playPauseButton.addEventListener('click', () => birthdayMusic.paused ? startMusic() : pauseMusic());
muteButton.addEventListener('click', toggleMute);
volumeSlider.addEventListener('input', () => setMusicVolume(Number(volumeSlider.value) / 100));

function createConfetti() {
  const container = document.querySelector('.confetti');
  if (container.children.length) return;
  for (let i = 0; i < 72; i++) {
    const piece = document.createElement('span');
    piece.style.left = `${Math.random() * 100}%`; piece.style.animationDelay = `${Math.random() * -5}s`;
    piece.style.animationDuration = `${3 + Math.random() * 3}s`; container.appendChild(piece);
  }
}

function releaseIntroMagic() {
  const container = document.getElementById('introParticles');
  for (let i = 0; i < 64; i++) {
    const particle = document.createElement('i');
    const angle = Math.random() * 360;
    const distance = 90 + Math.random() * 250;
    particle.style.setProperty('--angle', `${angle}deg`);
    particle.style.setProperty('--distance', `${distance}px`);
    particle.style.setProperty('--delay', `${Math.random() * .28}s`);
    particle.className = i % 3 === 0 ? 'magic-star' : 'magic-confetti';
    container.appendChild(particle);
  }
}

// Part 1: an energetic 30-photo flash montage, then Part 2: a calm cinematic slideshow.
function startMemorySequence() {
  showScreen('memories');
  const flash = document.getElementById('memoryFlash');
  const flashImage = document.getElementById('flashImage');
  let index = 0;
  const showFlash = () => {
    flashImage.src = photoSources[index];
    flashImage.style.setProperty('--x', `${(Math.random() - .5) * 80}vw`);
    flashImage.style.setProperty('--y', `${(Math.random() - .5) * 60}vh`);
    flashImage.style.setProperty('--rotate', `${(Math.random() - .5) * 22}deg`);
    flashImage.style.setProperty('--scale', `${.72 + Math.random() * .45}`);
    flashImage.classList.remove('flash-in');
    void flashImage.offsetWidth; // restart the CSS animation without layout work per frame
    flashImage.classList.add('flash-in');
    index += 1;
    if (index < photoSources.length) { setTimeout(showFlash, 215); }
    else { setTimeout(() => { flash.classList.add('hide'); startSlideshow(); }, 360); }
  };
  showFlash();
}

function startSlideshow() {
  const slideshow = document.getElementById('memorySlideshow');
  const image = document.getElementById('slideshowImage');
  const caption = document.getElementById('memoryCaption');
  const backdrop = document.getElementById('memoryBackdrop');
  slideshow.classList.add('show');
  let index = 0;
  const showSlide = () => {
    image.src = photoSources[index];
    backdrop.style.backgroundImage = `url("${photoSources[index]}")`;
    caption.textContent = memoryCaptions[index];
    image.classList.remove('slide-in'); caption.classList.remove('caption-in');
    void image.offsetWidth;
    image.classList.add('slide-in'); caption.classList.add('caption-in');
    index += 1;
    if (index < photoSources.length) setTimeout(showSlide, 3000);
    else setTimeout(() => showScreen('welcome'), 3000);
  };
  showSlide();
}

function createFireworks() {
  const box = document.getElementById('fireworks'); if (box.children.length) return;
  const colors = ['#ef9fbb', '#9ccfea', '#b19ae3', '#f6ce8d'];
  for (let i = 0; i < 52; i++) { const dot = document.createElement('i'); dot.className = 'burst';
    dot.style.setProperty('--x', `${8 + Math.random() * 84}%`); dot.style.setProperty('--y', `${8 + Math.random() * 72}%`);
    dot.style.setProperty('--a', `${Math.random() * 360}deg`); dot.style.setProperty('--c', colors[i % colors.length]); dot.style.setProperty('--d', `${Math.random() * 1.5}s`); box.appendChild(dot); }
}

/* Click-to-swap makes the 3×3 photo puzzles dependable for touch, mouse, and TV browsers. */
function initialisePuzzle(id) {
  const config = puzzles[id];
  const board = document.getElementById(config.boardId);
  const status = document.getElementById(config.statusId);
  const order = shuffle([...Array(9).keys()]);
  puzzleState[id] = { order, selected: null, solved: false };
  board.classList.remove('is-solved', 'cinematic-complete');
  board.innerHTML = '';
  status.innerHTML = '';
  order.forEach((piece, slot) => board.appendChild(createPuzzlePiece(id, piece, slot)));
}

function createPuzzlePiece(id, piece, slot) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'puzzle-piece'; button.dataset.slot = slot; button.dataset.piece = piece;
  button.style.backgroundImage = `url("${puzzles[id].image}")`;
  button.style.backgroundPosition = `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%`;
  button.setAttribute('aria-label', `Puzzle piece ${piece + 1}`);
  button.addEventListener('click', () => selectPuzzlePiece(id, slot));
  return button;
}

function selectPuzzlePiece(id, slot) {
  const state = puzzleState[id];
  if (!state || state.solved) return;
  const board = document.getElementById(puzzles[id].boardId);
  if (state.selected === null) {
    state.selected = slot;
    board.children[slot].classList.add('is-selected');
    return;
  }
  if (state.selected === slot) {
    board.children[slot].classList.remove('is-selected'); state.selected = null; return;
  }
  const first = state.selected;
  [state.order[first], state.order[slot]] = [state.order[slot], state.order[first]];
  state.selected = null;
  renderPuzzle(id);
  if (state.order.every((piece, index) => piece === index)) solvePuzzle(id);
  else { board.classList.remove('soft-shake'); void board.offsetWidth; board.classList.add('soft-shake'); }
}

function renderPuzzle(id) {
  const board = document.getElementById(puzzles[id].boardId);
  [...board.children].forEach((element, slot) => {
    const piece = puzzleState[id].order[slot];
    element.dataset.piece = piece;
    element.style.backgroundPosition = `${(piece % 3) * 50}% ${Math.floor(piece / 3) * 50}%`;
    element.classList.remove('is-selected');
  });
}

function solvePuzzle(id) {
  const config = puzzles[id];
  const state = puzzleState[id];
  const board = document.getElementById(config.boardId);
  const status = document.getElementById(config.statusId);
  state.solved = true;
  board.classList.add('is-solved');
  [...board.children].forEach((piece) => { piece.disabled = true; });
  createPuzzleSparkles(board);
  status.innerHTML = `<p>${config.solvedText}</p>${config.nextText ? `<button class="puzzle-next" type="button">${config.nextText}</button>` : ''}`;
  if (config.nextText) status.querySelector('button').addEventListener('click', () => showScreen(config.nextScreen));
  else window.setTimeout(() => {
    board.classList.add('cinematic-complete');
    window.setTimeout(() => showScreen(config.nextScreen), 2800);
  }, 1900);
}

function createPuzzleSparkles(board) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 18; index += 1) { const sparkle = document.createElement('i'); sparkle.className = 'puzzle-sparkle'; sparkle.style.setProperty('--x', `${Math.random() * 100}%`); sparkle.style.setProperty('--y', `${Math.random() * 100}%`); sparkle.style.setProperty('--delay', `${Math.random() * .5}s`); fragment.appendChild(sparkle); }
  board.appendChild(fragment);
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) { const next = Math.floor(Math.random() * (index + 1)); [values[index], values[next]] = [values[next], values[index]]; }
  if (values.every((value, index) => value === index)) [values[0], values[1]] = [values[1], values[0]];
  return values;
}

function playFinalMessage() {
  const section = document.getElementById('finalMessage');
  section.classList.remove('reveal-message');
  void section.offsetWidth;
  section.classList.add('reveal-message');
  window.setTimeout(() => showScreen('final'), 12500);
}

/* Audio is gift-gated and always resumes the same element at its existing playback position. */
function unlockMusicFromGift() {
  giftHasOpened = true;
  playPauseButton.disabled = false;
  if (savedPlaybackState !== 'paused') startMusic();
  else syncMusicInterface();
}
function setMusicPanelOpen(open) {
  musicPanel.classList.toggle('is-open', open);
  musicPanel.setAttribute('aria-hidden', String(!open));
  musicToggle.setAttribute('aria-expanded', String(open));
}

// Store a valid user preference only; a missing or invalid value uses the 70% default.
function loadSavedVolume() {
  try {
    const storedValue = localStorage.getItem(VOLUME_STORAGE_KEY);
    const saved = Number(storedValue);
    return storedValue !== null && Number.isFinite(saved) && saved >= 0 && saved <= 1 ? saved : DEFAULT_MUSIC_VOLUME;
  } catch { return DEFAULT_MUSIC_VOLUME; }
}
function loadSavedPlaybackState() {
  try { return localStorage.getItem(PLAYBACK_STORAGE_KEY) === 'paused' ? 'paused' : 'playing'; } catch { return 'playing'; }
}
function loadSavedMuteState() {
  try { return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'; } catch { return false; }
}
function setMusicVolume(value) {
  selectedMusicVolume = Math.min(1, Math.max(0, value));
  cancelAnimationFrame(fadeFrame);
  birthdayMusic.volume = selectedMusicVolume;
  try { localStorage.setItem(VOLUME_STORAGE_KEY, selectedMusicVolume); } catch { /* Storage may be unavailable. */ }
  syncVolumeControl();
}
function syncVolumeControl() {
  const percentage = Math.round(selectedMusicVolume * 100);
  volumeSlider.value = percentage;
  volumeValue.textContent = `${percentage}%`;
}

function startMusic() {
  if (!giftHasOpened || !birthdayMusic.paused) return;
  cancelAnimationFrame(fadeFrame);
  birthdayMusic.volume = 0;
  birthdayMusic.play().then(() => {
    fadeMusicTo(selectedMusicVolume, 1000);
  }).catch(() => {
    syncMusicInterface();
  });
}
function pauseMusic() {
  if (birthdayMusic.paused) return;
  fadeMusicTo(0, 1000, () => { birthdayMusic.pause(); birthdayMusic.volume = selectedMusicVolume; });
}
function toggleMute() {
  birthdayMusic.muted = !birthdayMusic.muted;
  try { localStorage.setItem(MUTE_STORAGE_KEY, String(birthdayMusic.muted)); } catch { /* Storage may be unavailable. */ }
  syncMusicInterface();
}
function syncMusicInterface() {
  const playing = !birthdayMusic.paused;
  musicToggle.classList.toggle('playing', playing);
  playPauseButton.textContent = playing ? 'Pause' : 'Play';
  playPauseButton.setAttribute('aria-label', playing ? 'Pause background music' : 'Play background music');
  muteButton.textContent = birthdayMusic.muted ? '🔇' : '🔊';
  muteButton.setAttribute('aria-label', birthdayMusic.muted ? 'Unmute music' : 'Mute music');
}
// Native media events keep playback controls and the saved pause state correct.
birthdayMusic.addEventListener('play', () => { savedPlaybackState = 'playing'; savePlaybackState(); syncMusicInterface(); });
birthdayMusic.addEventListener('pause', () => { if (giftHasOpened) { savedPlaybackState = 'paused'; savePlaybackState(); } syncMusicInterface(); });
function savePlaybackState() { try { localStorage.setItem(PLAYBACK_STORAGE_KEY, savedPlaybackState); } catch { /* Storage may be unavailable. */ } }
function fadeMusicTo(target, duration, onComplete) {
  cancelAnimationFrame(fadeFrame); const start = performance.now(); const initial = birthdayMusic.volume;
  const fade = (now) => { const progress = Math.min((now - start) / duration, 1); birthdayMusic.volume = initial + (target - initial) * progress;
    if (progress < 1) fadeFrame = requestAnimationFrame(fade); else if (onComplete) onComplete(); };
  fadeFrame = requestAnimationFrame(fade);
}

/* Global background effects use only composited CSS animations; they never handle pointer events. */
function createMagicalBackground() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  createMagicElements('magicStars', 'magic-star', 150, (star) => {
    star.style.setProperty('--x', `${Math.random() * 100}%`); star.style.setProperty('--y', `${Math.random() * 100}%`);
    star.style.setProperty('--size', `${1 + Math.random() * 2.5}px`); star.style.setProperty('--delay', `${Math.random() * -5}s`);
    star.style.setProperty('--duration', `${2.2 + Math.random() * 4}s`);
  });
  createMagicElements('magicFireflies', 'magic-firefly', 15, (firefly) => {
    firefly.style.setProperty('--x', `${Math.random() * 100}%`); firefly.style.setProperty('--y', `${45 + Math.random() * 52}%`);
    firefly.style.setProperty('--delay', `${Math.random() * -12}s`); firefly.style.setProperty('--duration', `${9 + Math.random() * 10}s`);
  });
  createMagicElements('magicParticles', 'gold-particle', 28, (particle) => {
    particle.style.setProperty('--x', `${Math.random() * 100}%`); particle.style.setProperty('--y', `${Math.random() * 100}%`);
    particle.style.setProperty('--delay', `${Math.random() * -12}s`); particle.style.setProperty('--duration', `${8 + Math.random() * 10}s`);
  });
  createMagicElements('magicBalloons', 'magic-balloon', 5, (balloon, index) => {
    balloon.style.setProperty('--x', `${5 + Math.random() * 90}%`); balloon.style.setProperty('--y', `${58 + Math.random() * 34}%`);
    balloon.style.setProperty('--delay', `${-index * 1.7}s`); balloon.style.setProperty('--duration', `${10 + index * 2.2}s`);
    balloon.style.setProperty('--hue', `${[336, 207, 267, 42, 190][index]}`);
  });
  if (!reducedMotion) scheduleShootingStar();
}
function createMagicElements(containerId, className, count, configure) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) { const item = document.createElement('i'); item.className = className; configure(item, index); fragment.appendChild(item); }
  document.getElementById(containerId).appendChild(fragment);
}
function scheduleShootingStar() {
  const delay = 8000 + Math.random() * 7000;
  window.setTimeout(() => {
    const star = document.createElement('i'); star.className = 'shooting-star';
    star.style.setProperty('--x', `${10 + Math.random() * 65}%`); star.style.setProperty('--y', `${5 + Math.random() * 35}%`);
    document.getElementById('shootingStarLayer').appendChild(star);
    star.addEventListener('animationend', () => star.remove(), { once: true });
    scheduleShootingStar();
  }, delay);
}
