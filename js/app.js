/**
 * Main application entry point
 */
import uiController from './uiController.js';
import bingoGame from './bingoGame.js';
import helpController from './helpController.js';

// Initialize confetti
function initConfetti() {
  // Check if the confetti script is already loaded
  if (typeof confetti === 'undefined') {
    // Load confetti library dynamically
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
    script.async = true;
    script.onload = () => {
      console.log('Confetti library loaded');
    };
    document.head.appendChild(script);
  }
}

// Function to show confetti when a team wins
window.showWinningConfetti = function() {
  if (typeof confetti !== 'undefined') {
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { 
      startVelocity: 30, 
      spread: 360, 
      ticks: 60, 
      zIndex: 9999, // Very high to be on top of everything
      colors: ['#f3a8c7', '#b976af', '#e65c9c', '#ffffff', '#e0c2d7'],
      disableForReducedMotion: false
    };
    
    // Make confetti particles not block mouse events
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = 'canvas.confetti-canvas { pointer-events: none !important; }';
      document.head.appendChild(style);
    });

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      // Create confetti from multiple origins
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      }));
      
      confetti(Object.assign({}, defaults, {
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      }));
      
      // Add some from the center for a more immersive effect
      confetti(Object.assign({}, defaults, {
        particleCount: particleCount * 0.5,
        origin: { x: 0.5, y: 0.5 }
      }));
    }, 250);
  }
};

// Background shimmer effect for splash screen
function createShimmerEffect() {
  const splashScreen = document.getElementById('splash-screen');
  if (!splashScreen) return;
  
  // Create shimmer particles
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'shimmer-particle';
    
    // Random position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    // Random size
    const size = 3 + Math.random() * 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random animation delay
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    splashScreen.appendChild(particle);
  }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  console.log('Wedding Bingo application initialized');
  initConfetti();
  createShimmerEffect();
  
  // Set up direct URL team access
  const urlParams = new URLSearchParams(window.location.search);
  const teamId = urlParams.get('team');
  
  if (teamId && !isNaN(parseInt(teamId)) && parseInt(teamId) >= 1 && parseInt(teamId) <= 10) {
    // Auto-select team if valid team ID is provided in URL
    const teamInput = document.getElementById('team-input');
    if (teamInput) {
      teamInput.value = teamId;
      // Simulate click on start button after a short delay
      setTimeout(() => {
        const startButton = document.getElementById('start-button');
        if (startButton) {
          startButton.click();
        }
      }, 500);
    }
  }
  
  // UI controller is instantiated on import
});
