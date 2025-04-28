document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const app = document.getElementById('app');
    const counterElement = document.getElementById('counter');
    const mainTimerElement = document.getElementById('main-timer');
    const cooldownTimerElement = document.getElementById('cooldown-timer');

    // Create Web Audio API context for ping sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Function to create a ping sound
    function createPingSound() {
        // Create oscillator
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Set oscillator type and frequency
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note

        // Set volume envelope
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Start and stop oscillator
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    }

    // State variables
    let isRunning = false;
    let counter = 0;
    let mainTimerSeconds = 0;
    let cooldownTimerSeconds = 0;
    let inCooldown = false;
    let mainTimerInterval;
    let cooldownTimerInterval;

    // Format time as HH:MM:SS
    function formatMainTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }

    // Format time as MM:SS
    function formatCooldownTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return [
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    }

    // Update the display
    function updateDisplay() {
        counterElement.textContent = counter;
        mainTimerElement.textContent = formatMainTime(mainTimerSeconds);

        if (inCooldown) {
            cooldownTimerElement.textContent = formatCooldownTime(cooldownTimerSeconds);
            cooldownTimerElement.classList.remove('hidden');
        } else {
            cooldownTimerElement.classList.add('hidden');
        }
    }

    // Flash the screen green
    function flashGreen() {
        app.classList.add('flash');
        createPingSound();

        setTimeout(() => {
            app.classList.remove('flash');
        }, 500);
    }

    // Start the cooldown timer
    function startCooldown() {
        inCooldown = true;
        cooldownTimerSeconds = 120; // 2 minutes in seconds
        updateDisplay();

        cooldownTimerInterval = setInterval(() => {
            cooldownTimerSeconds--;
            updateDisplay();

            if (cooldownTimerSeconds <= 0) {
                clearInterval(cooldownTimerInterval);
                inCooldown = false;
                resumeMainTimer();
            }
        }, 1000);
    }

    // Pause the main timer
    function pauseMainTimer() {
        clearInterval(mainTimerInterval);
    }

    // Resume the main timer
    function resumeMainTimer() {
        if (!isRunning) return;

        mainTimerInterval = setInterval(() => {
            mainTimerSeconds++;
            updateDisplay();

            // Check if we've reached a 3-minute mark (180 seconds)
            if (mainTimerSeconds > 0 && mainTimerSeconds % 180 === 0) {
                pauseMainTimer();
                startCooldown();
            }

            // Check if we've reached a 6-second mark
            if (mainTimerSeconds > 0 && mainTimerSeconds % 6 === 0) {
                flashGreen();
                counter++;
                updateDisplay();
            }
        }, 1000);
    }

    // Toggle timer on click
    app.addEventListener('click', () => {
        // Resume audio context if it's suspended (browser requirement)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        if (inCooldown) return; // Don't allow toggling during cooldown

        isRunning = !isRunning;

        if (isRunning) {
            resumeMainTimer();
        } else {
            pauseMainTimer();
        }
    });

    // Initial display update
    updateDisplay();
});
