/**
 * Data service for fetching and managing bingo card data
 */
import config from './config.js';
import i18n from './i18n.js';

class DataService {
  /**
   * Fetch all bingo cards from the JSON file
   * @param {string} lang - Language code (optional, defaults to current language)
   * @returns {Promise<Array>} Array of bingo cards
   */
  async fetchBingoCards(lang) {
    try {
      // Use provided language or current language from i18n module
      const language = lang || i18n.currentLang;
      
      // Try to load from the language-specific tasks file
      try {
        const response = await fetch(`./json/i18n/tasks/${language}_tasks.json`);
        if (response.ok) {
          const data = await response.json();
          return data.bingoCards || [];
        }
      } catch (e) {
        console.warn(`Could not load tasks for language ${language}, falling back to German`);
      }
      
      // Fallback to German tasks file
      try {
        const fallbackResponse = await fetch('./json/i18n/tasks/de_tasks.json');
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          return fallbackData.bingoCards || [];
        }
      } catch (e) {
        console.warn('Could not load German tasks, falling back to default');
      }
      
      // Final fallback to the original tasks file
      const response = await fetch(config.tasksJsonPath);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      return data.bingoCards || [];
    } catch (error) {
      console.error('Error fetching bingo cards:', error);
      return [];
    }
  }

  /**
   * Get a specific bingo card by ID
   * @param {number} cardId - The ID of the card to retrieve
   * @returns {Promise<Object|null>} The bingo card or null if not found
   */
  async getBingoCardById(cardId) {
    const cards = await this.fetchBingoCards();
    return cards.find(card => card.cardId === cardId) || null;
  }

  /**
   * Get all available team names
   * @returns {Promise<Array>} Array of team names
   */
  async getTeamNames() {
    const cards = await this.fetchBingoCards();
    return cards.map(card => ({ id: card.cardId, name: card.name }));
  }

  /**
   * Save game state to local storage
   * @param {number} teamId - The team ID
   * @param {Array} markedTasks - Array of marked task indices
   * @param {boolean} hasWon - Whether the team has won
   */
  saveGameState(teamId, markedTasks, hasWon = false) {
    localStorage.setItem(`bingoState_${teamId}`, JSON.stringify(markedTasks));
    localStorage.setItem(`bingoWin_${teamId}`, JSON.stringify(hasWon));
  }

  /**
   * Load game state from local storage
   * @param {number} teamId - The team ID
   * @returns {Array} Array of marked task indices
   */
  loadGameState(teamId) {
    const savedState = localStorage.getItem(`bingoState_${teamId}`);
    return savedState ? JSON.parse(savedState) : [];
  }

  /**
   * Load win state from local storage
   * @param {number} teamId - The team ID
   * @returns {boolean} Whether the team has won
   */
  loadWinState(teamId) {
    const savedWinState = localStorage.getItem(`bingoWin_${teamId}`);
    return savedWinState ? JSON.parse(savedWinState) : false;
  }

  /**
   * Clear game state for a team
   * @param {number} teamId - The team ID
   */
  clearGameState(teamId) {
    localStorage.removeItem(`bingoState_${teamId}`);
    localStorage.removeItem(`bingoWin_${teamId}`);
  }
  
  /**
   * Save the last selected team ID
   * @param {number} teamId - The team ID
   */
  saveLastTeamId(teamId) {
    localStorage.setItem('lastSelectedTeam', teamId.toString());
  }
  
  /**
   * Get the last selected team ID
   * @returns {number|null} The last selected team ID or null if not found
   */
  getLastTeamId() {
    const lastTeam = localStorage.getItem('lastSelectedTeam');
    return lastTeam ? parseInt(lastTeam) : null;
  }

  /**
   * Clear the last selected team ID
   */
  clearLastTeamId() {
    localStorage.removeItem('lastSelectedTeam');
  }
}

export default new DataService();
