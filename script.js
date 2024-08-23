function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const totalTimeMin = parseFloat(params.get('time')) || 25; // Default to 25 minutes if not provided
  const startSoundNum = parseInt(params.get('startSound')) || 0;
  const endSoundNum = parseInt(params.get('endSound')) || 0;
  const hideProgressBar = parseInt(params.get('hideProgressBar')) || 0;
  const hideTimer = parseInt(params.get('hideTimer')) || 0;
  return { totalTimeMin, startSoundNum, endSoundNum, hideProgressBar, hideTimer };
}

const { totalTimeMin, startSoundNum, endSoundNum, hideProgressBar, hideTimer } = getQueryParams();
let totalTime = totalTimeMin * 60;
let endTime;
let timerInterval;

const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');

if (hideProgressBar) {
  progressBar.style.display = 'none';
  progressContainer.style.display = 'none';
}

if (hideTimer) {
  timerDisplay.style.display = 'none';
}

function getSoundPath(soundNum) {
  switch (soundNum) {
    case 1:
      return 'sounds/small-bell01.mp3';
    case 2:
      return 'sounds/small-bell01-3-long.mp3';
    case 3:
      return 'sounds/shop-door-bell-6405-3.mp3';
    default:
      return null;
  }
}

const startSoundPath = getSoundPath(startSoundNum);
const endSoundPath = getSoundPath(endSoundNum);

const startSound = startSoundPath ? new Audio(startSoundPath) : null;
const endSound = endSoundPath ? new Audio(endSoundPath) : null;
// Preload the audio files
if (startSound) startSound.preload = 'auto';
if (endSound) endSound.preload = 'auto';

function startTimer() {
  const now = Date.now();
  endTime = now + totalTime * 1000; // Set end time
  if (startSound) {
    startSound.pause();
    startSound.currentTime = 0; // Ensure the sound to play from the start
    startSound.play();
  }
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  if (endSound) {
    endSound.pause();
    endSound.currentTime = 0; // Ensure the sound to play from the start
    endSound.play();
  }
}

function updateTimer() {
  const now = Date.now();
  const timeLeft = Math.round((endTime - now) / 1000); // Calculate remaining time in seconds

  if (timeLeft < 0) {
    stopTimer();
    return;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  progressBar.style.width = `${progress}%`;
}

startTimer();
