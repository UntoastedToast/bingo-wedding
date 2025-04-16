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
   * Start the game with the selected team
   */
  async startGame() {
    if (!this.elements.teamInput) return;
    
    const teamValue = this.elements.teamInput.value;
    if (!this.validateTeamInput(teamValue)) return;
    
    const teamId = parseInt(teamValue);
    const success = await bingoGame.initializeGame(teamId);
    
    if (success) {
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
        this.onCellClick(index);
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
    
    if (bingoGame.checkForWin()) {
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
    bingoGame.resetGame();
    
    // Hide game screen and show splash screen
    if (this.elements.gameScreen) {
      this.elements.gameScreen.classList.remove('active');
    }
    
    if (this.elements.splashScreen) {
      this.elements.splashScreen.classList.remove('hidden');
    }
    
    // Reset team input
    if (this.elements.teamInput) {
      this.elements.teamInput.value = '';
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
}

export default new UIController();
