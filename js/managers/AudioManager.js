/**
 * Audio Manager für das Bingo-Spiel
 * Verwaltet alle Audio-bezogenen Funktionen
 */

class AudioManager {
  constructor() {
    // Audio-Elemente initialisieren
    this.airHornSound = new Audio('assets/sound/air-horn-273892.mp3');
    this.winnerMusic = new Audio('assets/music/410578__manuelgraf__game-win-screen-background-music.mp3');
    this.winnerMusic.volume = 0.8; // Lautstärke auf 80%
    
    // Flags für Animationen
    this.hornAnimationActive = false;
    this.confettiCooldown = false;
    this.confettiCooldownDuration = 2000; // 2 Sekunden Cooldown
    
    // Timeouts für Animationen
    this.hornAnimationTimeout = null;
    this.hornAnimationCleanupTimeout = null;
    
    // Methoden binden
    this.playAirHorn = this.playAirHorn.bind(this);
  }
  
  /**
   * Spielt nur den Air Horn Sound ohne Animation ab
   */
  playAirHornSound() {
    // Wenn der Sound noch abgespielt wird, zuerst stoppen und neu starten
    this.airHornSound.pause();
    this.airHornSound.currentTime = 0;
    
    // Ton abspielen
    this.airHornSound.play()
      .catch(error => {
        console.error('Error playing air horn sound:', error);
      });
  }
  
  /**
   * Spielt den Air Horn Sound mit Animation ab
   */
  playAirHorn() {
    // Verhindert mehrfache Aktivierungen
    if (this.hornAnimationActive) return;
    
    this.hornAnimationActive = true;
    this.playAirHornSound();
      
    // Konfetti nur anzeigen, wenn kein Cooldown aktiv ist
    if (typeof window.showWinningConfetti === 'function' && !this.confettiCooldown) {
      // Vor dem Erzeugen neuer Konfetti das alte entfernen (falls vorhanden)
      if (typeof window.clearConfetti === 'function') {
        window.clearConfetti();
      }
      
      // Konfetti anzeigen
      window.showWinningConfetti();
      
      // Cooldown aktivieren
      this.confettiCooldown = true;
      
      // Cooldown nach X Sekunden wieder deaktivieren
      setTimeout(() => {
        this.confettiCooldown = false;
      }, this.confettiCooldownDuration);
    }
    
    // Button-Animation aktivieren
    const hornEmoji = document.getElementById('horn-emoji');
    if (hornEmoji) {
      // Bestehende Animation entfernen, falls vorhanden
      hornEmoji.classList.remove('playing');
      
      // Timeout verwenden, um sicherzustellen, dass die Animation neu gestartet wird
      setTimeout(() => {
        hornEmoji.classList.add('playing');
      }, 10);
      
      // Animation nach Ende entfernen
      setTimeout(() => {
        hornEmoji.classList.remove('playing');
      }, 500);
    }
    
    // Stoppe eventuell bereits laufende Animationen
    this.stopHornAnimation();
    
    // Zentrale Air Horn Animation aktivieren
    const animationContainer = document.getElementById('horn-animation-container');
    const animatedHorn = document.getElementById('animated-horn');
    const soundWaves = document.querySelectorAll('.sound-wave');
    
    if (animationContainer && animatedHorn && soundWaves.length > 0) {
      // Animation-Container einblenden
      animationContainer.classList.add('active');
      
      // Air Horn einblenden und animieren
      setTimeout(() => {
        animatedHorn.classList.add('active');
      }, 50);
      
      // Schallwellen nacheinander starten
      soundWaves.forEach((wave, index) => {
        setTimeout(() => {
          wave.classList.add('active');
        }, 150 + (index * 100));
      });
      
      // Animation nach Abschluss ausblenden
      this.hornAnimationTimeout = setTimeout(() => {
        animatedHorn.classList.remove('active');
        this.hornAnimationCleanupTimeout = setTimeout(() => {
          animationContainer.classList.remove('active');
          // Alle Schallwellen zurücksetzen
          soundWaves.forEach(wave => {
            wave.classList.remove('active');
          });
          
          // Hier hornAnimationActive zurücksetzen, damit erneute Klicks möglich sind
          this.hornAnimationActive = false;
        }, 500);
      }, 2000);
    }
  }
  
  /**
   * Stoppt laufende Horn-Animationen
   */
  stopHornAnimation() {
    if (this.hornAnimationTimeout) {
      clearTimeout(this.hornAnimationTimeout);
      this.hornAnimationTimeout = null;
    }
    
    if (this.hornAnimationCleanupTimeout) {
      clearTimeout(this.hornAnimationCleanupTimeout);
      this.hornAnimationCleanupTimeout = null;
    }
    
    // Zurücksetzen der Animation-Elemente
    const animationContainer = document.getElementById('horn-animation-container');
    const animatedHorn = document.getElementById('animated-horn');
    const soundWaves = document.querySelectorAll('.sound-wave');
    
    if (animationContainer) animationContainer.classList.remove('active');
    if (animatedHorn) animatedHorn.classList.remove('active');
    if (soundWaves.length > 0) {
      soundWaves.forEach(wave => wave.classList.remove('active'));
    }
  }
  
  /**
   * Spielt die Gewinner-Musik im Hintergrund ab
   */
  playWinnerMusic() {
    // Musik zurücksetzen und abspielen
    this.winnerMusic.currentTime = 0;
    this.winnerMusic.play().catch(error => {
      console.error('Fehler beim Abspielen der Gewinner-Musik:', error);
    });
  }
  
  /**
   * Stoppt die Gewinner-Musik
   */
  stopWinnerMusic() {
    // Musik pausieren
    if (this.winnerMusic) {
      this.winnerMusic.pause();
      this.winnerMusic.currentTime = 0;
    }
  }
}

export default new AudioManager();