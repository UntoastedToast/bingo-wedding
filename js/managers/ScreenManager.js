/**
 * Screen Manager für das Bingo-Spiel
 * Verwaltet die verschiedenen Bildschirme und deren Übergänge
 */
import bingoGame from '../core/game.js';
import dataService from '../core/storage.js';
import i18n from '../services/i18n.js';
import audioManager from './AudioManager.js';

class ScreenManager {
  constructor() {
    this.screens = {
      splash: document.querySelector('#splash-screen'),
      game: document.querySelector('#game-screen'),
      winner: document.querySelector('#winner-screen')
    };
    
    this.elements = {
      teamInput: document.querySelector('#team-input'),
      startButton: document.querySelector('#start-button'),
      errorMessage: document.querySelector('#error-message'),
      teamName: document.querySelector('#team-name'),
      winnerTeam: document.querySelector('#winner-team'),
      restartButton: document.querySelector('#restart-button'),
      hornEmoji: document.querySelector('#horn-emoji')
    };
    
    // Methoden binden
    this.restartGame = this.restartGame.bind(this);
    this.returnToTeamSelection = this.returnToTeamSelection.bind(this);
  }
  
  /**
   * Zeigt den Gewinner-Bildschirm an
   */
  showWinnerScreen() {
    if (!this.screens.winner || !this.elements.winnerTeam) return;
    
    const { teamId } = bingoGame.getGameState();
    
    // Initialer Text setzen, wird später übersetzt
    this.elements.winnerTeam.setAttribute('data-team-id', teamId);
    this.updateWinnerTeamText();
    
    this.screens.winner.classList.add('active');
    
    // Nur den Air Horn Sound abspielen, ohne Animation
    audioManager.playAirHornSound();
    
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
      document.getElementById('horn-emoji').addEventListener('click', audioManager.playAirHorn);
    }
    
    // Play the winner music with looping and fade out
    audioManager.playWinnerMusic();
    
    if (typeof window.showWinningConfetti === 'function') {
      window.showWinningConfetti();
    }
  }

  /**
   * Versteckt den Gewinner-Bildschirm
   */
  hideWinnerScreen() {
    if (this.screens.winner) {
      this.screens.winner.classList.remove('active');
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
  }
  
  /**
   * Aktualisiert den angezeigten Team-Namen
   */
  updateTeamName() {
    const { teamId } = bingoGame.getGameState();
    if (!this.elements.teamName) return;
    
    this.elements.teamName.textContent = `${teamId}`;
  }
  
  /**
   * Startet das Spiel mit dem ausgewählten Team
   * @param {boolean} isAutoStart - Ob dies ein automatischer Start ist
   * @returns {Promise<boolean>} - Ob der Start erfolgreich war
   */
  async startGame(isAutoStart = false) {
    if (!this.elements.teamInput) return false;
    
    const teamValue = this.elements.teamInput.value;
    
    // Überprüfen, ob die Team-Eingabe gültig ist
    if (!this.validateTeamInput(teamValue)) {
      // Nur Fehler-Tooltip anzeigen, wenn dies kein Auto-Start ist
      if (!isAutoStart) {
        // Übersetzten Fehler in einem Tooltip anzeigen
        this.showTooltip(this.elements.startButton, i18n.t('splash.errorMessage'));
      }
      return false;
    }
    
    const teamId = parseInt(teamValue);
    const success = await bingoGame.initializeGame(teamId);
    
    if (success) {
      // Team-ID für zukünftige Sitzungen speichern
      dataService.saveLastTeamId(teamId);
      
      // Splash-Screen ausblenden und Game-Screen anzeigen
      if (this.screens.splash) {
        this.screens.splash.classList.add('hidden');
      }
      
      if (this.screens.game) {
        this.screens.game.classList.add('active');
      }
      
      this.updateTeamName();
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Validiert die Team-Eingabe
   * @param {string} value - Der Eingabewert
   * @returns {boolean} - Ob die Eingabe gültig ist
   */
  validateTeamInput(value) {
    const teamId = parseInt(value);
    const isValid = !isNaN(teamId) && teamId >= 1 && teamId <= 10;
    
    // Fehlermeldung anzeigen/ausblenden
    if (this.elements.errorMessage) {
      this.elements.errorMessage.classList.toggle('show', !isValid && value.trim() !== '');
    }
    
    // Start-Button aktivieren/deaktivieren
    if (this.elements.startButton) {
      this.elements.startButton.disabled = !isValid;
    }
    
    return isValid;
  }
  
  /**
   * Startet das Spiel neu
   */
  restartGame() {
    // Aktuelle Team-ID vor dem Zurücksetzen speichern
    const currentTeamId = bingoGame.currentTeamId;
    
    bingoGame.resetGame();
    
    // Wichtig: Entferne die gespeicherte Team-ID, damit beim Neuladen der Seite 
    // nicht automatisch das Spiel des vorherigen Teams geladen wird
    dataService.clearLastTeamId();
    
    // Game-Screen ausblenden und Splash-Screen anzeigen
    if (this.screens.game) {
      this.screens.game.classList.remove('active');
    }
    
    if (this.screens.splash) {
      this.screens.splash.classList.remove('hidden');
    }
    
    // Team-Eingabe mit zuletzt verwendetem Team vorausfüllen (nur in der aktuellen Sitzung)
    if (this.elements.teamInput && currentTeamId) {
      this.elements.teamInput.value = currentTeamId;
      this.validateTeamInput(currentTeamId.toString());
    }
    
    // Gewinner-Screen ausblenden
    this.hideWinnerScreen();
  }
  
  /**
   * Kehrt von Game-Screen zur Team-Auswahl zurück
   */
  returnToTeamSelection() {
    // Subtile Exit-Animation hinzufügen
    if (this.screens.game) {
      this.screens.game.style.opacity = '0';
      
      setTimeout(() => {
        // Game-Screen ausblenden und Splash-Screen anzeigen
        this.screens.game.classList.remove('active');
        this.screens.game.style.opacity = '1';
        
        if (this.screens.splash) {
          this.screens.splash.classList.remove('hidden');
        }
        
        // Spielstatus zurücksetzen, aber Team-Auswahl beibehalten
        const currentTeamId = bingoGame.currentTeamId;
        bingoGame.resetGame();
        
        // Aktuelles Team zur Bequemlichkeit vorauswählen
        if (this.elements.teamInput && currentTeamId) {
          this.elements.teamInput.value = currentTeamId;
          this.validateTeamInput(currentTeamId);
        }
      }, 300);
    }
  }
  
  /**
   * Zeigt einen Tooltip/Sprechblase in der Nähe eines Elements mit mehrsprachiger Unterstützung an
   * @param {HTMLElement} element - Das Element, in dessen Nähe der Tooltip angezeigt werden soll
   * @param {string} message - Die im Tooltip anzuzeigende Nachricht (bereits übersetzt)
   * @param {number} duration - Wie lange der Tooltip in ms angezeigt werden soll (standardmäßig 3000ms)
   */
  showTooltip(element, message, duration = 3000) {
    // Vorhandene Tooltips und deren Timeouts entfernen
    this._clearExistingTooltips();
    
    // Tooltip-Element erstellen
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip top';
    tooltip.textContent = message;
    tooltip.id = 'bingo-tooltip-' + Date.now();
    document.body.appendChild(tooltip);
    
    // Layout-Berechnung erzwingen
    void tooltip.offsetWidth;
    
    // Position relativ zum Button berechnen
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Tooltip-Abmessungen nach dem Rendern abrufen
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    
    // Zentrierte Position über dem Button mit sicheren Rändern berechnen
    let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
    let top = rect.top - tooltipHeight - 15; // Zusätzlicher Rand für Sichtbarkeit
    
    // Tooltip innerhalb der Viewport-Grenzen halten
    left = Math.min(Math.max(10, left), viewportWidth - tooltipWidth - 10);
    
    // Wenn der Tooltip über dem Viewport wäre, platziere ihn stattdessen unter dem Button
    if (top < 10) {
      top = rect.bottom + 15;
      tooltip.classList.remove('top');
      tooltip.classList.add('bottom');
    }
    
    // Position anwenden
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    
    // Tooltip mit Animation sichtbar machen
    requestAnimationFrame(() => {
      tooltip.classList.add('show', 'pulse');
    });
    
    // Timeout-ID für potenzielle frühzeitige Entfernung speichern
    this._tooltipTimeoutId = setTimeout(() => {
      tooltip.classList.remove('show');
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.remove();
        }
      }, 300); // Auf Fade-Out-Übergang warten
    }, duration);
    
    return tooltip;
  }
  
  /**
   * Entfernt alle vorhandenen Tooltips, um Duplikate zu vermeiden
   * @private
   */
  _clearExistingTooltips() {
    // Vorhandenen Timeout löschen, falls vorhanden
    if (this._tooltipTimeoutId) {
      clearTimeout(this._tooltipTimeoutId);
      this._tooltipTimeoutId = null;
    }
    
    // Alle vorhandenen Tooltips entfernen
    const existingTooltips = document.querySelectorAll('.tooltip');
    existingTooltips.forEach(tooltip => {
      tooltip.classList.remove('show');
      setTimeout(() => tooltip.remove(), 10);
    });
  }
}

export default new ScreenManager();