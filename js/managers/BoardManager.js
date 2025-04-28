/**
 * Board Manager für das Bingo-Spiel
 * Verwaltet das Bingo-Board und dessen Interaktionen
 */
import config from '../core/config.js';
import bingoGame from '../core/game.js';
import i18n from '../services/i18n.js';
import dialogManager from './DialogManager.js';
import screenManager from './ScreenManager.js';

class BoardManager {
  constructor() {
    this.boardContainer = document.querySelector('#bingo-board');
  }
  
  /**
   * Rendert das Bingo-Board
   */
  renderBoard() {
    const { tasks, markedTasks } = bingoGame.getGameState();
    
    if (!this.boardContainer || !tasks) return;
    
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
    this.boardContainer.innerHTML = boardHTML;
    
    this.setupCellEventListeners();
  }
  
  /**
   * Richtet Event-Listener für die Bingo-Zellen ein
   */
  setupCellEventListeners() {
    // Click-Handler für normale Zellen hinzufügen
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
          dialogManager.showDialog(text, index, this.onCellClick.bind(this));
        }
      });
    });
    
    // Click-Handler für Freiraum-Zelle hinzufügen, um Beschreibungsmodal anzuzeigen
    document.querySelectorAll('.bingo-cell.free-space').forEach(cell => {
      const idx = parseInt(cell.dataset.index);
      // Freiraum-Beschreibung aus Übersetzungen verwenden
      const desc = i18n.t('help.freeSpaceDescription');
      cell.addEventListener('click', () => dialogManager.showDialog(desc, idx));
    });
  }
  
  /**
   * Behandelt Zell-Klick
   * @param {number} index - Der Index der angeklickten Zelle
   */
  onCellClick(index) {
    const wasMarked = bingoGame.toggleTask(index);
    const cell = document.querySelector(`.bingo-cell[data-index="${index}"]`);
    
    if (cell) {
      cell.classList.toggle('marked', wasMarked);
    }
    
    // Gewinnstatus direkt aus dem Spielobjekt prüfen
    const { hasWon } = bingoGame.getGameState();
    if (hasWon) {
      screenManager.showWinnerScreen();
    }
  }
  
  /**
   * Aktualisiert das Bingo-Board bei Sprachänderungen
   * Behält alle markierten Zellen bei und aktualisiert nur den Textinhalt
   */
  refreshBoard() {
    if (!this.boardContainer) return;
    
    const { tasks } = bingoGame;
    if (!tasks || tasks.length === 0) return;
    
    // Texte in den Zellen aktualisieren, markierten Status beibehalten
    document.querySelectorAll('.bingo-cell').forEach(cell => {
      const index = parseInt(cell.dataset.index);
      
      // Freiraum überspringen
      if (cell.classList.contains('free-space')) return;
      
      // Zellinhalt mit dem neuen Sprachtext aktualisieren
      if (index >= 0 && index < tasks.length) {
        const contentElement = cell.querySelector('.cell-content');
        if (contentElement) {
          contentElement.textContent = tasks[index];
        }
      }
    });
  }
}

export default new BoardManager();