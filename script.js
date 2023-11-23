let display = document.getElementById('display');
let roundTimeSetting = document.getElementById('round-time-setting');
let startButton = document.getElementById('start');
let stopButton = document.getElementById('stop');

let startTime, updatedTime, difference, tInterval;
let running = false;
let roundTime = 5 * 60 * 1000; // 5 minutes

function updateSetting() {
  let minutes = Math.floor(roundTime / (60 * 1000));
  let seconds = (roundTime % (60 * 1000)) / 1000;
  seconds = seconds < 10 ? '0' + seconds : seconds;
  roundTimeSetting.innerText = minutes + ':' + seconds;
  display.innerText = roundTimeSetting.innerText;
}

function changeTime(amount) {
  roundTime += amount;
  if (roundTime < 30 * 1000) {
      roundTime = 30 * 1000; // Minimum time is 30 seconds
  }
  updateSetting();
}

function startTimer() {
  if (!running) {
    running = true;
    startTime = new Date().getTime();
    tInterval = setInterval(getShowTime, 1000);
    startButton.style.display = "none";
    stopButton.style.display = "inline-block";
  }
}

function stopTimer() {
  if (running) {
    clearInterval(tInterval);
    running = false;
    startButton.style.display = "inline-block";
    stopButton.style.display = "none";
    updateSetting(); // Reset display to initial round time
  }
}

function getShowTime() {
  updatedTime = new Date().getTime();
  difference = roundTime - (updatedTime - startTime);

  if (difference <= 0) {
    startTime = new Date().getTime(); // Restart the timer for next round
  }

  let minutes = Math.floor(difference / (1000 * 60));
  let seconds = Math.floor((difference % (1000 * 60)) / 1000);

  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  display.innerText = minutes + ':' + seconds;
}

document.getElementById('increase-round').addEventListener('click', () => changeTime(30 * 1000)); // Increase by 30 seconds
document.getElementById('decrease-round').addEventListener('click', () => changeTime(-30 * 1000)); // Decrease by 30 seconds
startButton.addEventListener('click', startTimer);
stopButton.addEventListener('click', stopTimer);

updateSetting(); // Initialize time display
