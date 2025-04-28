/**
 * UI Controller für das Bingo-Spiel
 * Hauptcontroller, der die verschiedenen Manager koordiniert
 */
import bingoGame from '../core/game.js';
import dataService from '../core/storage.js';
import dialogManager from '../managers/DialogManager.js';
import audioManager from '../managers/AudioManager.js';
import screenManager from '../managers/ScreenManager.js';
import boardManager from '../managers/BoardManager.js';

class UIController {
  constructor() {
    // Event-Listener einrichten
    this.setupEventListeners();
    
    // Gespeichertes Team überprüfen und ggf. Spiel automatisch starten
    this.checkForSavedTeam();
  }

  /**
   * Event-Listener einrichten
   */
  setupEventListeners() {
    // Team-Eingabe-Validierung
    const teamInput = document.querySelector('#team-input');
    if (teamInput) {
      teamInput.addEventListener('input', (e) => {
        screenManager.validateTeamInput(e.target.value);
      });
    }
    
    // Start-Button
    const startButton = document.querySelector('#start-button');
    if (startButton) {
      startButton.addEventListener('click', () => {
        this.startGame();
      });
    }
    
    // Team-Eingabe Enter-Taste
    if (teamInput) {
      teamInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.startGame();
        }
      });
    }
    
    // Event-Listener direkt am Dokument hinzufügen, um sicherzustellen, dass es funktioniert
    document.addEventListener('click', (e) => {
      // Restart-Button-Handler
      if (e.target && e.target.id === 'restart-button') {
        screenManager.restartGame();
      }
      
      // Zurück zur Team-Auswahl-Button
      if (e.target && (e.target.id === 'back-to-team' || e.target.closest('#back-to-team'))) {
        screenManager.returnToTeamSelection();
      }
    });
    
    // Auf Sprachänderungen hören
    document.addEventListener('languageChanged', () => {
      this.refreshBoard();
    });
  }

  /**
   * Überprüft, ob ein gespeichertes Team vorhanden ist und startet das Spiel automatisch
   */
  async checkForSavedTeam() {
    const savedTeamId = dataService.getLastTeamId();
    
    if (savedTeamId) {
      // Team-Eingabe vorausfüllen
      const teamInput = document.querySelector('#team-input');
      if (teamInput) {
        teamInput.value = savedTeamId;
        screenManager.validateTeamInput(savedTeamId.toString());
      }
      
      // Spiel mit dem gespeicherten Team automatisch starten
      await this.startGame(true);
    }
  }
  
  /**
   * Startet das Spiel mit dem ausgewählten Team
   * @param {boolean} isAutoStart - Ob dies ein automatischer Start ist
   */
  async startGame(isAutoStart = false) {
    const success = await screenManager.startGame(isAutoStart);
    
    if (success) {
      // Bingo-Board rendern
      boardManager.renderBoard();
      
      // Prüfen, ob das Team bereits gewonnen hat und Gewinner-Screen anzeigen
      const { hasWon } = bingoGame.getGameState();
      if (hasWon) {
        screenManager.showWinnerScreen();
      }
    }
  }


  
  /**
   * Aktualisiert das Bingo-Board bei Sprachänderungen
   */
  refreshBoard() {
    // Board aktualisieren
    boardManager.refreshBoard();
    
    // Dialog-Texte aktualisieren
    dialogManager.updateDialogTexts();
    
    // Auch den Tisch-Text im Gewinner-Screen aktualisieren, falls er angezeigt wird
    screenManager.updateWinnerTeamText();
  }
}

export default new UIController();
