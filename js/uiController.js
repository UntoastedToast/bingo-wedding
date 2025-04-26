/**
 * UI Controller for the Bingo Game
 */
import config from './config.js';
import bingoGame from './bingoGame.js';
import dataService from './dataService.js';
import i18n from './i18n.js';

class UIController {
  constructor() {
    this.selectors = {
      // Splash screen elements
      splashScreen: '#splash-screen',
      teamInput: '#team-input',
      startButton: '#start-button',
      errorMessage: '#error-message',
      
      // Game screen elements
      gameScreen: '#game-screen',
      boardContainer: '#bingo-board',
      teamName: '#team-name',
      
      // Winner screen elements
      winnerScreen: '#winner-screen',
      winnerTeam: '#winner-team',
      restartButton: '#restart-button',
      hornEmoji: '#horn-emoji'
    };
    
    this.initElements();
    this.setupEventListeners();
    
    // Bind methods to ensure correct 'this' context
    this.restartGame = this.restartGame.bind(this);
    this.showCellDialog = this.showCellDialog.bind(this);
    this.hideCellDialog = this.hideCellDialog.bind(this);
    this.playAirHorn = this.playAirHorn.bind(this);
    
    // Initialize the air horn audio
    this.airHornSound = new Audio('assets/sound/air-horn-273892.mp3');
    
    // Initialize the winner music
    this.winnerMusic = new Audio('assets/music/410578__manuelgraf__game-win-screen-background-music.mp3');
    this.winnerMusic.volume = 0.8; // Lautstärke auf 80%
    
    // Flag for animation
    this.hornAnimationActive = false;
    this.confettiCooldown = false;
    this.confettiCooldownDuration = 2000; // 2 Sekunden Cooldown
    
    // Check for saved team ID and auto-start game if available
    this.checkForSavedTeam();
    
    // Create dialog overlay for cell content
    this.createCellDialog();
  }

  /**
   * Initialize DOM elements
   */
  initElements() {
    this.elements = {};
    for (const [key, selector] of Object.entries(this.selectors)) {
      this.elements[key] = document.querySelector(selector);
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Team input validation
    if (this.elements.teamInput) {
      this.elements.teamInput.addEventListener('input', (e) => {
        this.validateTeamInput(e.target.value);
      });
    }
    
    // Start button
    if (this.elements.startButton) {
      this.elements.startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
    
    // Team input enter key
    if (this.elements.teamInput) {
      this.elements.teamInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.startGame();
        }
      });
    }
    
    // Add event listener directly to the document to ensure it works
    document.addEventListener('click', (e) => {
      // Restart button handler
      if (e.target && e.target.id === 'restart-button') {
        this.restartGame();
      }
      
      // Back to team selection button
      if (e.target && (e.target.id === 'back-to-team' || e.target.closest('#back-to-team'))) {
        this.returnToTeamSelection();
      }
    });
  }

  /**
   * Validate the team input
   * @param {string} value - The input value
   * @returns {boolean} Whether the input is valid
   */
  validateTeamInput(value) {
    const teamId = parseInt(value);
    const isValid = !isNaN(teamId) && teamId >= 1 && teamId <= 10;
    
    // Show/hide error message
    if (this.elements.errorMessage) {
      this.elements.errorMessage.classList.toggle('show', !isValid && value.trim() !== '');
    }
    
    // Enable/disable start button
    if (this.elements.startButton) {
      this.elements.startButton.disabled = !isValid;
    }
    
    return isValid;
  }

  /**
   * Check for saved team ID and auto-start game if available
   */
  async checkForSavedTeam() {
    const savedTeamId = dataService.getLastTeamId();
    
    if (savedTeamId) {
      // Pre-fill the team input
      if (this.elements.teamInput) {
        this.elements.teamInput.value = savedTeamId;
        this.validateTeamInput(savedTeamId.toString());
      }
      
      // Auto-start the game with the saved team
      await this.startGame(true);
    }
  }
  
  /**
   * Start the game with the selected team
   * @param {boolean} isAutoStart - Whether this is an automatic start
   */
  async startGame(isAutoStart = false) {
    if (!this.elements.teamInput) return;
    
    const teamValue = this.elements.teamInput.value;
    
    // Check if the team input is valid
    if (!this.validateTeamInput(teamValue)) {
      // Only show error tooltip if this is not an auto-start
      if (!isAutoStart) {
        // Show translated error message in a tooltip
        this.showTooltip(this.elements.startButton, i18n.t('splash.errorMessage'));
      }
      return;
    }
    
    const teamId = parseInt(teamValue);
    const success = await bingoGame.initializeGame(teamId);
    
    if (success) {
      // Save the team ID for future sessions
      dataService.saveLastTeamId(teamId);
      
      // Hide splash screen and show game screen
      if (this.elements.splashScreen) {
        this.elements.splashScreen.classList.add('hidden');
      }
      
      if (this.elements.gameScreen) {
        this.elements.gameScreen.classList.add('active');
      }
      
      // Render game board
      this.renderBoard();
      this.updateTeamName();
      
      // Check if the team has already won and show winner screen
      const { hasWon } = bingoGame.getGameState();
      if (hasWon) {
        this.showWinnerScreen();
      }
    }
  }

  /**
   * Render the bingo board
   */
  renderBoard() {
    const { tasks, markedTasks } = bingoGame.getGameState();
    
    if (!this.elements.boardContainer || !tasks) return;
    
    let boardHTML = '<div class="bingo-grid">';
    
    for (let i = 0; i < config.boardSize * config.boardSize; i++) {
      const isFreeSpace = i === config.freeSpace.position;
      const taskText = isFreeSpace ? config.freeSpace.text : tasks[i] || '';
      const isMarked = markedTasks.includes(i) || isFreeSpace;
      
      boardHTML += `
        <div class="bingo-cell ${isMarked ? 'marked' : ''} ${isFreeSpace ? 'free-space' : ''}" 
             data-index="${i}">
          <div class="cell-content">${taskText}</div>
        </div>`;
    }
    
    boardHTML += '</div>';
    this.elements.boardContainer.innerHTML = boardHTML;
    
    // Add click handlers to cells
    document.querySelectorAll('.bingo-cell:not(.free-space)').forEach(cell => {
      cell.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        const text = e.currentTarget.querySelector('.cell-content').textContent;
        const isMarked = e.currentTarget.classList.contains('marked');
        
        // Wenn bereits markiert, direkt umschalten
        if (isMarked) {
          this.onCellClick(index);
        } else {
          // Ansonsten Dialog anzeigen
          this.showCellDialog(text, index);
        }
      });
    });
  }

  /**
   * Handle cell click
   * @param {number} index - The index of the clicked cell
   */
  onCellClick(index) {
    const wasMarked = bingoGame.toggleTask(index);
    const cell = document.querySelector(`.bingo-cell[data-index="${index}"]`);
    
    if (cell) {
      cell.classList.toggle('marked', wasMarked);
    }
    
    // Prüfe den Gewinnstatus direkt aus dem Spielobjekt
    const { hasWon } = bingoGame.getGameState();
    if (hasWon) {
      this.showWinnerScreen();
    }
  }

  /**
   * Show the winner screen
   */
  showWinnerScreen() {
    if (!this.elements.winnerScreen || !this.elements.winnerTeam) return;
    
    const { teamId } = bingoGame.getGameState();
    
    // Initialer Text setzen, wird später übersetzt
    this.elements.winnerTeam.setAttribute('data-team-id', teamId);
    this.updateWinnerTeamText();
    
    this.elements.winnerScreen.classList.add('active');
    
    // Nur den Air Horn Sound abspielen, ohne Animation
    this.playAirHornSound();
    
    // Ensure restart button is properly set up each time the winner screen shows
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      // Remove any existing listeners to avoid duplicates
      restartButton.replaceWith(restartButton.cloneNode(true));
      // Add the listener again
      document.getElementById('restart-button').addEventListener('click', this.restartGame);
    }
    
    // Set up horn emoji
    const hornEmoji = document.getElementById('horn-emoji');
    if (hornEmoji) {
      // Remove any existing listeners to avoid duplicates
      hornEmoji.replaceWith(hornEmoji.cloneNode(true));
      // Add the listener again
      document.getElementById('horn-emoji').addEventListener('click', this.playAirHorn);
    }
    
    // Play the winner music with looping and fade out
    this.playWinnerMusic();
    
    if (typeof window.showWinningConfetti === 'function') {
      window.showWinningConfetti();
    }
  }

  /**
   * Hide the winner screen
   */
  hideWinnerScreen() {
    if (this.elements.winnerScreen) {
      this.elements.winnerScreen.classList.remove('active');
    }
  }
  
  /**
   * Aktualisiert den übersetzten Tisch-Text im Gewinner-Screen
   */
  updateWinnerTeamText() {
    // Überprüfen, ob der winner-team-Element existiert
    const winnerTeamElement = document.getElementById('winner-team');
    if (!winnerTeamElement) return;
    
    // Team-ID aus dem data-Attribut holen
    const teamId = winnerTeamElement.getAttribute('data-team-id');
    if (!teamId) return;
    
    // Übersetzten Text basierend auf der aktuellen Sprache erzeugen
    let tableText = '';
    
    // Tabellen-Übersetzung basierend auf der aktuellen Sprache
    switch (i18n.currentLang) {
      case 'en':
        tableText = 'Table';
        break;
      case 'pl':
        tableText = 'Stół';
        break;
      case 'de':
      default:
        tableText = 'Tisch';
        break;
    }
    
    // Text im Element aktualisieren
    winnerTeamElement.textContent = `${tableText} ${teamId}`;
    
    console.log(`Tisch-Text aktualisiert auf: ${tableText} ${teamId} (Sprache: ${i18n.currentLang})`);
  }
  
  /**
   * Aktualisiert die Texte im Dialog-Fenster entsprechend der gewählten Sprache
   */
  updateDialogTexts() {
    // Dialog-Buttons mit Übersetzungen aktualisieren
    const confirmButton = document.getElementById('dialog-confirm');
    if (confirmButton) {
      confirmButton.textContent = i18n.t('game.dialogConfirm');
    }
    
    const cancelButton = document.getElementById('dialog-cancel');
    if (cancelButton) {
      cancelButton.textContent = i18n.t('game.dialogCancel');
    }
  }

  /**
   * Update the displayed team name
   */
  updateTeamName() {
    const { teamId } = bingoGame.getGameState();
    if (!this.elements.teamName) return;
    
    this.elements.teamName.textContent = `${teamId}`;
  }
  
  /**
   * Refresh the bingo board when language changes
   * This preserves all marked cells and just updates the text content
   */
  refreshBoard() {
    if (!this.elements.boardContainer) return;
    
    const { tasks } = bingoGame;
    if (!tasks || tasks.length === 0) return;
    
    // Aktualisiere die Texte in den Zellen, behalte aber den markierten Status bei
    document.querySelectorAll('.bingo-cell').forEach(cell => {
      const index = parseInt(cell.dataset.index);
      
      // Skip the free space
      if (cell.classList.contains('free-space')) return;
      
      // Update the cell content with the new language text
      if (index >= 0 && index < tasks.length) {
        const contentElement = cell.querySelector('.cell-content');
        if (contentElement) {
          contentElement.textContent = tasks[index];
        }
      }
    });
    
    // Dialog-Buttons aktualisieren
    this.updateDialogTexts();
    
    // Auch den Tisch-Text im Gewinner-Screen aktualisieren, falls er angezeigt wird
    this.updateWinnerTeamText();
  }

  /**
   * Restart the current game
   */
  restartGame() {
    // Get current team ID before resetting
    const currentTeamId = bingoGame.currentTeamId;
    
    bingoGame.resetGame();
    
    // Wichtig: Entferne die gespeicherte Team-ID, damit beim Neuladen der Seite 
    // nicht automatisch das Spiel des vorherigen Teams geladen wird
    dataService.clearLastTeamId();
    
    // Hide game screen and show splash screen
    if (this.elements.gameScreen) {
      this.elements.gameScreen.classList.remove('active');
    }
    
    if (this.elements.splashScreen) {
      this.elements.splashScreen.classList.remove('hidden');
    }
    
    // Pre-fill team input with last used team (nur in der aktuellen Sitzung)
    if (this.elements.teamInput && currentTeamId) {
      this.elements.teamInput.value = currentTeamId;
      this.validateTeamInput(currentTeamId.toString());
    }
    
    // Hide winner screen
    this.hideWinnerScreen();
  }
  
  /**
   * Return to team selection from game screen
   */
  returnToTeamSelection() {
    // Add a subtle exit animation
    if (this.elements.gameScreen) {
      this.elements.gameScreen.style.opacity = '0';
      
      setTimeout(() => {
        // Hide game screen and show splash screen
        this.elements.gameScreen.classList.remove('active');
        this.elements.gameScreen.style.opacity = '1';
        
        if (this.elements.splashScreen) {
          this.elements.splashScreen.classList.remove('hidden');
        }
        
        // Reset game state but preserve team selection
        const currentTeamId = bingoGame.currentTeamId;
        bingoGame.resetGame();
        
        // Pre-select the current team for convenience
        if (this.elements.teamInput && currentTeamId) {
          this.elements.teamInput.value = currentTeamId;
          this.validateTeamInput(currentTeamId);
        }
      }, 300);
    }
  }
  
  /**
   * Create the cell dialog overlay
   */
  createCellDialog() {
    // Check if the dialog already exists
    if (document.getElementById('cell-dialog-overlay')) return;
    
    const dialogOverlay = document.createElement('div');
    dialogOverlay.id = 'cell-dialog-overlay';
    dialogOverlay.className = 'cell-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'cell-dialog';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'dialog-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', this.hideCellDialog);
    
    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.id = 'dialog-content';
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'dialog-button confirm';
    confirmButton.id = 'dialog-confirm';
    confirmButton.setAttribute('data-i18n', 'game.dialogConfirm'); // Übersetzungsschlüssel hinzufügen
    confirmButton.textContent = i18n.t('game.dialogConfirm'); // Text mit Übersetzung setzen
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button cancel';
    cancelButton.id = 'dialog-cancel';
    cancelButton.setAttribute('data-i18n', 'game.dialogCancel'); // Übersetzungsschlüssel hinzufügen
    cancelButton.textContent = i18n.t('game.dialogCancel'); // Text mit Übersetzung setzen
    cancelButton.addEventListener('click', this.hideCellDialog);
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    dialog.appendChild(closeButton);
    dialog.appendChild(content);
    dialog.appendChild(buttonContainer);
    
    dialogOverlay.appendChild(dialog);
    document.body.appendChild(dialogOverlay);
    
    // Close dialog when clicking on overlay background
    dialogOverlay.addEventListener('click', (e) => {
      if (e.target === dialogOverlay) {
        this.hideCellDialog();
      }
    });
  }
  
  /**
   * Show cell dialog with content
   * @param {string} text - The text to display
   * @param {number} index - The cell index
   */
  showCellDialog(text, index) {
    const dialogOverlay = document.getElementById('cell-dialog-overlay');
    const dialogContent = document.getElementById('dialog-content');
    const confirmButton = document.getElementById('dialog-confirm');
    
    if (!dialogOverlay || !dialogContent || !confirmButton) return;
    
    // Set dialog content
    dialogContent.textContent = text;
    
    // Update confirm button with the cell index
    confirmButton.dataset.index = index;
    
    // Remove old event listener to avoid duplicates
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    
    // Add new event listener
    document.getElementById('dialog-confirm').addEventListener('click', () => {
      this.onCellClick(index);
      this.hideCellDialog();
    });
    
    // Show dialog
    dialogOverlay.classList.add('active');
    
    // Prevent scrolling on the body
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Hide cell dialog
   */
  hideCellDialog() {
    const dialogOverlay = document.getElementById('cell-dialog-overlay');
    if (!dialogOverlay) return;
    
    dialogOverlay.classList.remove('active');
    
    // Re-enable scrolling
    document.body.style.overflow = '';
  }
  
  /**
   * Display a tooltip/speech bubble near an element with multilingual support
   * @param {HTMLElement} element - The element to show the tooltip near
   * @param {string} message - The message to display in the tooltip (already translated)
   * @param {number} duration - How long to show the tooltip in ms (defaults to 3000ms)
   */
  showTooltip(element, message, duration = 3000) {
    // Remove any existing tooltips and their timeouts
    this._clearExistingTooltips();
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip top';
    tooltip.textContent = message;
    tooltip.id = 'bingo-tooltip-' + Date.now();
    document.body.appendChild(tooltip);
    
    // Force layout calculation
    void tooltip.offsetWidth;
    
    // Calculate position relative to button
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Get tooltip dimensions after rendering
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    // Calculate centered position above button with safe margins
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    let top = rect.top - tooltipHeight - 15; // Extra margin for visibility
    
    // Keep tooltip within viewport boundaries
    left = Math.min(Math.max(10, left), viewportWidth - tooltipWidth - 10);
    
    // If tooltip would be above viewport, place it below the button instead
    if (top < 10) {
      top = rect.bottom + 15;
      tooltip.classList.remove('top');
      tooltip.classList.add('bottom');
    }
    
    // Apply position
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    // Make tooltip visible with animation
    requestAnimationFrame(() => {
      tooltip.classList.add('show', 'pulse');
    });
    
    // Store timeout ID for potential early removal
    this._tooltipTimeoutId = setTimeout(() => {
      tooltip.classList.remove('show');
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.remove();
        }
      }, 300); // Wait for fade-out transition
    }, duration);
    
    return tooltip;
  }
  
  /**
   * Clear any existing tooltips to prevent duplicates
   * @private
   */
  _clearExistingTooltips() {
    // Clear existing timeout if any
    if (this._tooltipTimeoutId) {
      clearTimeout(this._tooltipTimeoutId);
      this._tooltipTimeoutId = null;
    }
    
    // Remove any existing tooltips
    const existingTooltips = document.querySelectorAll('.tooltip');
    existingTooltips.forEach(tooltip => {
      tooltip.classList.remove('show');
      setTimeout(() => tooltip.remove(), 10);
    });
  }
  
  /**
   * Play just the air horn sound without animation
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
   * Play the air horn sound effect with animation
   */
  playAirHorn() {
    // Prevent multiple activations
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
    
    console.log('Animation starten:', {
      container: animationContainer,
      horn: animatedHorn,
      waves: soundWaves.length
    });
    
    if (animationContainer && animatedHorn && soundWaves.length > 0) {
      // Animation-Container einblenden
      animationContainer.classList.add('active');
      
      // Air Horn einblenden und animieren
      setTimeout(() => {
        animatedHorn.classList.add('active');
        console.log('Horn aktiviert');
      }, 50);
      
      // Schallwellen nacheinander starten
      soundWaves.forEach((wave, index) => {
        setTimeout(() => {
          wave.classList.add('active');
          console.log(`Welle ${index + 1} aktiviert`);
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

export default new UIController();
