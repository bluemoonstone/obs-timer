function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const totalTimeMin = parseFloat(params.get('time')) || 25; // Default to 25 minutes if not provided
  const startSoundNum = parseInt(params.get('startSound')) || 0;
  const startSoundVol = parseFloat(params.get('startSoundVol')) || 1;
  const endSoundNum = parseInt(params.get('endSound')) || 0;
  const endSoundVol = parseFloat(params.get('endSoundVol')) || 1;
  const loopEndSound = parseInt(params.get('loopEndSound')) || 0;
  const voice = parseInt(params.get('voice')) || 0;
  const voiceVol = parseFloat(params.get('voiceVol')) || 1;
  const preChimeNum = parseInt(params.get('preChime')) || 0;
  const preChimeVol = parseFloat(params.get('preChimeVol')) || 1;
  const hideProgBar = parseInt(params.get('hideProgBar')) || 0;
  const hideTimer = parseInt(params.get('hideTimer')) || 0;
  const countUpProgBar = parseInt(params.get('countUpProgBar')) || 0;
  const hideShadow = parseInt(params.get('hideShadow')) || 0;

  return {
    totalTimeMin,
    startSoundNum,
    startSoundVol,
    endSoundNum,
    endSoundVol,
    loopEndSound,
    voice,
    voiceVol,
    preChimeNum,
    preChimeVol,
    hideProgBar,
    hideTimer,
    countUpProgBar,
    hideShadow
  };
}

const {
  totalTimeMin,
  startSoundNum,
  startSoundVol,
  endSoundNum,
  endSoundVol,
  loopEndSound,
  voice,
  voiceVol,
  preChimeNum,
  preChimeVol,
  hideProgBar,
  hideTimer,
  countUpProgBar,
  hideShadow
} = getQueryParams();

const totalTime = totalTimeMin * 60;
const halfTime = totalTime / 2;
const fiveMinsPassedTime = (totalTimeMin - 5) * 60;
let endTime;
let timerInterval;

const isBreakSession = voice === 2;

const timerDisplay = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');

if (hideProgBar) {
  progressBar.style.display = 'none';
  progressContainer.style.display = 'none';
}

if (hideTimer) {
  timerDisplay.style.display = 'none';
}

if (hideShadow) {
  document.documentElement.style.setProperty('--shadow', '0 0 0 #00000000');
}

function getSoundPath(soundNum) {
  switch (soundNum) {
    case 1:
      return 'sounds/small-bell01.mp3';
    case 2:
      return 'sounds/small-bell01-3-long.mp3';
    case 3:
      return 'sounds/shop-door-bell-6405.mp3';
    case 4:
      return 'sounds/shop-door-bell-6405-3.mp3';
    case 5:
      return 'sounds/soft-chime.mp3';
    default:
      return null;
  }
}

const startSoundPath = getSoundPath(startSoundNum);
const endSoundPath = getSoundPath(endSoundNum);
const preChimePath = getSoundPath(preChimeNum);

const startSound = startSoundPath ? new Audio(startSoundPath) : null;
const endSound = endSoundPath ? new Audio(endSoundPath) : null;
const preChime = preChimePath ? new Audio(preChimePath) : null;

// Inaudible noise to prepare the sound device
const noise = new Audio('sounds/noise.mp3');

// Voice navigation sounds
const voices = getVoices();

// Don't preload sounds that are not needed at start
// The default value for preload is 'auto'
if (voice) {
  for (const key in voices) {
    if (key === 'letsBegin') {
      voices[key].preload = 'auto';
    } else {
      voices[key].preload = 'none';
    }
  }
}
if (preChime) preChime.preload = 'none';
if (endSound) endSound.preload = 'none';

// Set volume
setVoiceVolume(voiceVol);
if (startSound) startSound.volume = startSoundVol;
if (endSound) endSound.volume = endSoundVol;
if (preChime) preChime.volume = preChimeVol;

// set loop
if (endSound && loopEndSound) {
  // Keep repeating endSound until the scene is changed in OBS
  endSound.loop = true;
}

function getVoices() {
  if (voice && !isBreakSession) {
    return {
      letsBegin: new Audio('sounds/lets-begin.mp3'),
      fiveMinsPassed: new Audio('sounds/5-minutes-passed.mp3'),
      halfWay: new Audio('sounds/half-way.mp3'),
      fiveMins: new Audio('sounds/5-minutes-left.mp3'),
      oneMin: new Audio('sounds/1-minute-left.mp3'),
      timesUp: new Audio('sounds/times-up.mp3')
    };
  } else if (voice && isBreakSession) {
    return {
      letsBegin: new Audio('sounds/take-a-moment.mp3'),
      oneMin: new Audio('sounds/1-minute-left-break.mp3'),
      timesUp: new Audio('sounds/times-up-break.mp3')
    };
  } else {
    return {};
  }
}

function setVoiceVolume(volume) {
  for (const key in voices) {
    voices[key].volume = volume;
  }
}

function prepareSoundDevice(callback) {
  if (startSound || endSound || voice) {
    noise.play() // Inaudible noise to prepare the sound device
    setTimeout(() => {
      callback();
    }, 1000); // Wait for 1 second before executing the callback
  }
}

function playSound(soundFile) {
  soundFile.pause();
  soundFile.currentTime = 0; // Ensure the sound to play from the start
  soundFile.play();
}

function playVoice(voiceFile, preChime) {
  if (preChime) {
    playSound(preChime);
    setTimeout(() => {
      voiceFile.play();
    }, 800)
  } else {
    voiceFile.play();
  }
}

// Timer
function startTimer() {
  const now = Date.now();
  endTime = now + totalTime * 1000; // Set end time
  timerInterval = setInterval(updateTimer, 1000);

  prepareSoundDevice(() => {
    if (startSound && voice) {
      playVoice(voices.letsBegin, startSound);
    } else if (startSound) {
      playSound(startSound);
    } else if (voice) {
      playVoice(voices.letsBegin);
    }
  });
}

function stopTimer() {
  clearInterval(timerInterval);
  prepareSoundDevice(() => {
    if (endSound && voice) {
      playVoice(voices.timesUp, endSound);
    } else if (endSound) {
      playSound(endSound);
    } else if (voice) {
      playVoice(voices.timesUp);
    }
  });
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
  if (countUpProgBar) {
    progressBar.style.width = `${progress}%`;
  } else {
    // This is default
    progressBar.style.width = `${100 - progress}%`;
  }

  prepareSoundDevice(() => {
    if (voice) {
      // Read aloud messages at certain times
      if (!isBreakSession && timeLeft === Math.floor(halfTime)) {
        playVoice(voices.halfWay, preChime);
      } else if (!isBreakSession && totalTime >= 20 * 60 && timeLeft === fiveMinsPassedTime) {
        playVoice(voices.fiveMinsPassed, preChime);
      } else if (!isBreakSession && totalTime >= 10 * 60 && timeLeft === 5 * 60) {
        playVoice(voices.fiveMins, preChime);
      } else if (totalTime >= 2 * 60 && timeLeft === 1 * 60) {
        playVoice(voices.oneMin, preChime);
      }
    }
  });
}

window.onload = function () {
  setTimeout(startTimer, 1000); // Wait for 1 second before starting the timer
};

// When the scene is changed in OBS, stop the sounds.
// This is to prevent the sounds from playing when switching back to the previous scene.
window.addEventListener('obsSceneChanged', function(event) {
  endSound.pause();
  endSound.currentTime = 0;
})

var modal = document.getElementById("helpModal");
var span = document.getElementsByClassName("close")[0];

// When the user clicks anywhere on the page, open the modal
document.addEventListener('click', function() {
  modal.style.display = "block";
});

// When the user clicks on <span> (x), close the modal
span.onclick = function(event) {
  event.stopPropagation(); // Stop the click event from propagating to the document
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    event.stopPropagation(); // Stop the click event from propagating to the document
    modal.style.display = "none";
  }
}
