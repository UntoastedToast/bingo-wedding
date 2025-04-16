/**
 * Bingo game logic module
 */
import config from './config.js';
import dataService from './dataService.js';

class BingoGame {
  constructor() {
    this.boardSize = config.boardSize;
    this.currentTeamId = null;
    this.tasks = [];
    this.markedTasks = [];
    this.hasWon = false;
  }

  /**
   * Initialize the game for a specific team
   * @param {number} teamId - The team ID
   * @returns {Promise<boolean>} Success status
   */
  async initializeGame(teamId) {
    try {
      this.currentTeamId = teamId;
      const card = await dataService.getBingoCardById(teamId);
      
      if (!card) {
        console.error(`No card found for team ID: ${teamId}`);
        return false;
      }
      
      this.tasks = card.tasks;
      this.markedTasks = dataService.loadGameState(teamId);
      this.hasWon = dataService.loadWinState(teamId);
      this.checkForWin();
      return true;
    } catch (error) {
      console.error('Error initializing game:', error);
      return false;
    }
  }

  /**
   * Toggle the marked state of a task
   * @param {number} index - The index of the task
   * @returns {boolean} The new marked state
   */
  toggleTask(index) {
    if (this.hasWon) return false;
    
    const isMarked = this.markedTasks.includes(index);
    
    if (isMarked) {
      this.markedTasks = this.markedTasks.filter(i => i !== index);
    } else {
      this.markedTasks.push(index);
    }
    
    dataService.saveGameState(this.currentTeamId, this.markedTasks, this.hasWon);
    const hasWon = this.checkForWin();
    this.hasWon = hasWon;
    return !isMarked;
  }

  /**
   * Check if a task is marked
   * @param {number} index - The index of the task
   * @returns {boolean} Whether the task is marked
   */
  isTaskMarked(index) {
    return this.markedTasks.includes(index);
  }

  /**
   * Check if the current board state has a winning pattern
   * @returns {boolean} Whether the player has won
   */
  checkForWin() {
    // Wir speichern den Spielstand erst nach der Gewinnprüfung
    // und nicht vorher, um sicherzustellen, dass der aktuelle hasWon-Status korrekt ist

    // Check rows
    for (let row = 0; row < this.boardSize; row++) {
      const rowStart = row * this.boardSize;
      let rowComplete = true;
      
      for (let col = 0; col < this.boardSize; col++) {
        const index = rowStart + col;
        if (!this.isTaskMarked(index)) {
          rowComplete = false;
          break;
        }
      }
      
      if (rowComplete) {
        this.hasWon = true;
        if (this.currentTeamId) {
          dataService.saveGameState(this.currentTeamId, this.markedTasks, true);
        }
        return true;
      }
    }
    
    // Check columns
    for (let col = 0; col < this.boardSize; col++) {
      let colComplete = true;
      
      for (let row = 0; row < this.boardSize; row++) {
        const index = row * this.boardSize + col;
        if (!this.isTaskMarked(index)) {
          colComplete = false;
          break;
        }
      }
      
      if (colComplete) {
        this.hasWon = true;
        if (this.currentTeamId) {
          dataService.saveGameState(this.currentTeamId, this.markedTasks, true);
        }
        return true;
      }
    }
    
    // Check diagonal (top-left to bottom-right)
    let diag1Complete = true;
    for (let i = 0; i < this.boardSize; i++) {
      const index = i * this.boardSize + i;
      if (!this.isTaskMarked(index)) {
        diag1Complete = false;
        break;
      }
    }
    
    if (diag1Complete) {
      this.hasWon = true;
      if (this.currentTeamId) {
        dataService.saveGameState(this.currentTeamId, this.markedTasks, true);
      }
      return true;
    }
    
    // Check diagonal (top-right to bottom-left)
    let diag2Complete = true;
    for (let i = 0; i < this.boardSize; i++) {
      const index = i * this.boardSize + (this.boardSize - 1 - i);
      if (!this.isTaskMarked(index)) {
        diag2Complete = false;
        break;
      }
    }
    
    if (diag2Complete) {
      this.hasWon = true;
      if (this.currentTeamId) {
        dataService.saveGameState(this.currentTeamId, this.markedTasks, true);
      }
      return true;
    }
    
    // Speichern des aktuellen Spielstands nach der Gewinnprüfung, wenn kein Gewinn vorliegt
    if (this.currentTeamId) {
      dataService.saveGameState(this.currentTeamId, this.markedTasks, this.hasWon);
    }
    return false;
  }

  /**
   * Reset the game state
   */
  resetGame() {
    // Store the current team ID before resetting
    const teamId = this.currentTeamId;
    
    this.tasks = [];
    this.markedTasks = [];
    this.hasWon = false;
    
    if (teamId) {
      dataService.clearGameState(teamId);
      // Keep the current team ID for reference
      this.currentTeamId = teamId;
    }
  }

  /**
   * Get the current game state
   * @returns {Object} The current game state
   */
  getGameState() {
    return {
      teamId: this.currentTeamId,
      tasks: this.tasks,
      markedTasks: this.markedTasks,
      hasWon: this.hasWon
    };
  }
}

export default new BingoGame();
