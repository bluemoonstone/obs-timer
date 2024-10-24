function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  const totalTimeMin = parseFloat(params.get('time')) || 25; // Default to 25 minutes if not provided
  const startSoundNum = parseInt(params.get('startSound')) || 0;
  const endSoundNum = parseInt(params.get('endSound')) || 0;
  const loopEndSound = parseInt(params.get('loopEndSound')) || 0;
  const voice = parseInt(params.get('voice')) || 0;
  const voiceVolume = parseFloat(params.get('voiceVolume')) || 0.5;
  const hideProgBar = parseInt(params.get('hideProgBar')) || 0;
  const hideTimer = parseInt(params.get('hideTimer')) || 0;
  const countUpProgBar = parseInt(params.get('countUpProgBar')) || 0;

  // Validate user input
  const colorParam = params.get('color') || '';
  const bgColorParam = params.get('bgColor') || '';
  // Use the validated color or a default value
  const color = isValidColor(colorParam) ? `${colorParam}` : '';
  const bgColor = isValidColor(bgColorParam) ? `${bgColorParam}` : '';

  return {
    totalTimeMin,
    startSoundNum,
    endSoundNum,
    loopEndSound,
    voice,
    voiceVolume,
    hideProgBar,
    hideTimer,
    countUpProgBar,
    color,
    bgColor
  };
}

function isValidColor(colorParam) {
  // Validate the color parameter using a regular expression
  // Allow 3, 6, or 8 character hex codes
  return /^([0-9A-F]{3}){1,2}([0-9A-F]{2})?$/i.test(colorParam);
}

const {
  totalTimeMin,
  startSoundNum,
  endSoundNum,
  loopEndSound,
  voice,
  voiceVolume,
  hideProgBar,
  hideTimer,
  countUpProgBar,
  color,
  bgColor
} = getQueryParams();

let totalTime = totalTimeMin * 60;
let endTime;
let timerInterval;

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

if (color.length > 0) {
  document.documentElement.style.setProperty('--timer-color', `#${color}`);
} else {
  // Use default color
  document.documentElement.style.setProperty('--timer-color', `#fff`);
}

if (bgColor.length > 0) {
  document.documentElement.style.setProperty('--bg-color', `#${bgColor}`);
} else {
  // Use default color
  document.documentElement.style.setProperty('--bg-color', `#00000000`);
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

// Inaudible noise to prepare the sound device
const noise = new Audio('sounds/noise.mp3');

// Voice navigation sounds
const voices = {
  letsBegin: new Audio('sounds/lets-begin.mp3'),
  halfWay: new Audio('sounds/half-way.mp3'),
  fiveMins: new Audio('sounds/5-minutes-left.mp3'),
  oneMin: new Audio('sounds/1-minute-left.mp3'),
  timesUp: new Audio('sounds/times-up.mp3')
}

// Preload the audio files
if (startSound) startSound.preload = 'auto';
if (endSound) endSound.preload = 'auto';
if (startSound || endSound || voice) noise.preload = 'auto'
if (voice) {
  for (const key in voices) {
    voices[key].preload = 'auto';
  }
}

setVoiceVolume(voiceVolume);

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

function startTimer() {
  const now = Date.now();
  endTime = now + totalTime * 1000; // Set end time
  timerInterval = setInterval(updateTimer, 1000);

  prepareSoundDevice(() => {
    if (startSound) {
      startSound.pause();
      startSound.currentTime = 0; // Ensure the sound to play from the start
      startSound.play();
    }
    if (voice) {
      voices.letsBegin.play()
    }
  });
}

function stopTimer() {
  clearInterval(timerInterval);
  prepareSoundDevice(() => {
    if (voice) {
      voices.timesUp.play()
    }
    if (endSound) {
      endSound.pause();
      endSound.currentTime = 0; // Ensure the sound to play from the start
      endSound.play();
    }
    if (loopEndSound) {
      // Keep repeating endSound until the scene is changed in OBS
      endSound.loop = true;
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
      if (timeLeft === Math.floor(totalTime / 2)) {
        voices.halfWay.play();
      } else if (totalTime > 600 && timeLeft === 300) {
        voices.fiveMins.play();
      } else if (totalTime > 120 && timeLeft === 60) {
        voices.oneMin.play();
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
