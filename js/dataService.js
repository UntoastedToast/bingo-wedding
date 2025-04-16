/**
 * Data service for fetching and managing bingo card data
 */
import config from './config.js';

class DataService {
  /**
   * Fetch all bingo cards from the JSON file
   * @returns {Promise<Array>} Array of bingo cards
   */
  async fetchBingoCards() {
    try {
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
   */
  saveGameState(teamId, markedTasks) {
    localStorage.setItem(`bingoState_${teamId}`, JSON.stringify(markedTasks));
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
   * Clear game state for a team
   * @param {number} teamId - The team ID
   */
  clearGameState(teamId) {
    localStorage.removeItem(`bingoState_${teamId}`);
  }
}

export default new DataService();
