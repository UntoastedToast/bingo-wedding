/**
 * UI Controller for the Bingo Game
 */
import config from './config.js';
import bingoGame from './bingoGame.js';
import dataService from './dataService.js';

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
      restartButton: '#restart-button'
    };
    
    this.initElements();
    this.setupEventListeners();
    
    // Bind methods to ensure correct 'this' context
    this.restartGame = this.restartGame.bind(this);
    this.showCellDialog = this.showCellDialog.bind(this);
    this.hideCellDialog = this.hideCellDialog.bind(this);
    
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
    if (!this.validateTeamInput(teamValue)) return;
    
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
    const teamName = `Tisch ${teamId}`;
    
    this.elements.winnerTeam.textContent = teamName;
    this.elements.winnerScreen.classList.add('active');
    
    // Ensure restart button is properly set up each time the winner screen shows
    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      // Remove any existing listeners to avoid duplicates
      restartButton.replaceWith(restartButton.cloneNode(true));
      // Add the listener again
      document.getElementById('restart-button').addEventListener('click', this.restartGame);
    }
    
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
   * Update the displayed team name
   */
  updateTeamName() {
    const { teamId } = bingoGame.getGameState();
    if (!this.elements.teamName) return;
    
    this.elements.teamName.textContent = `${teamId}`;
  }

  /**
   * Restart the current game
   */
  restartGame() {
    // Get current team ID before resetting
    const currentTeamId = bingoGame.currentTeamId;
    
    bingoGame.resetGame();
    
    // Hide game screen and show splash screen
    if (this.elements.gameScreen) {
      this.elements.gameScreen.classList.remove('active');
    }
    
    if (this.elements.splashScreen) {
      this.elements.splashScreen.classList.remove('hidden');
    }
    
    // Pre-fill team input with last used team
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
    confirmButton.textContent = 'Markieren';
    confirmButton.id = 'dialog-confirm';
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button cancel';
    cancelButton.textContent = 'Abbrechen';
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
}

export default new UIController();
