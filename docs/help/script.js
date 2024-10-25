// Functions for previewing sounds by clicking link
function playSound(soundId) {
  var sound = document.getElementById(soundId);
  if (sound) {
    sound.play();
  }
}

document.querySelectorAll('.play-sound').forEach(function(link) {
  link.addEventListener('click', function(event) {
    event.preventDefault();
    var soundId = event.target.getAttribute('data-sound');
    playSound(soundId);
  });
});
