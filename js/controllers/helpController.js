/**
 * Help Controller for the Bingo Game
 * Provides instructions and guidance for players
 */

class HelpController {
  constructor() {
    this.helpModalId = 'help-modal';
    this.helpButtonId = 'help-button';
    this.closeButtonId = 'close-help';
    this.initialized = false;
    
    // Create the help button and modal elements
    this.createHelpElements();
    this.setupEventListeners();
  }

  /**
   * Create help button and modal elements
   */
  createHelpElements() {
    // Create help button for splash screen
    this.createHelpButton('splash-help-button', 'splash-screen');
    
    // Create help button for game screen
    this.createHelpButton('game-help-button', 'game-screen');
    
    // Create the modal dialog
    this.createHelpModal();
    
    this.initialized = true;
  }

  /**
   * Create a help button and append it to the specified container
   * @param {string} id - The ID for the help button
   * @param {string} containerId - The ID of the container to append to
   */
  createHelpButton(id, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Check if button already exists
    if (document.getElementById(id)) return;
    
    const helpButton = document.createElement('button');
    helpButton.id = id;
    helpButton.className = 'help-button';
    helpButton.innerHTML = '?';
    helpButton.setAttribute('aria-label', 'Hilfe anzeigen');
    helpButton.setAttribute('title', 'Hilfe anzeigen');
    
    // Add to container
    if (containerId === 'splash-screen') {
      const splashContent = container.querySelector('.splash-content');
      if (splashContent) {
        splashContent.appendChild(helpButton);
      }
    } else {
      const gameContainer = container.querySelector('.container');
      if (gameContainer) {
        const header = gameContainer.querySelector('header');
        if (header) {
          header.appendChild(helpButton);
        }
      }
    }
  }

  /**
   * Create the help modal dialog
   */
  createHelpModal() {
    // Check if modal already exists
    if (document.getElementById(this.helpModalId)) return;
    
    const modal = document.createElement('div');
    modal.id = this.helpModalId;
    modal.className = 'help-modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'help-modal-content';
    
    // Close button
    const closeButton = document.createElement('button');
    closeButton.id = this.closeButtonId;
    closeButton.className = 'close-help';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Hilfe schließen');
    
    // Title
    const title = document.createElement('h2');
    title.textContent = 'Spielanleitung';
    
    // Content
    const content = document.createElement('div');
    content.className = 'help-content';
    content.innerHTML = `
      <h3>So spielst du Hochzeits-Bingo:</h3>
      <ol>
        <li>Wähle deine Tischnummer (1-10) auf dem Startbildschirm.</li>
        <li>Jeder Tisch erhält eine einzigartige Bingo-Karte mit verschiedenen Aufgaben.</li>
        <li>Fotografiere die auf deiner Karte beschriebenen Situationen während der Hochzeit.</li>
        <li>Tippe auf ein Feld, um es zu markieren, wenn du die Aufgabe erledigt hast.</li>
        <li>Ziel ist es, eine komplette Reihe (horizontal, vertikal oder diagonal) zu fotografieren.</li>
        <li>Sobald du eine Reihe vollständig markiert hast, hast du gewonnen!</li>
      </ol>
      
      <h3>Tipps:</h3>
      <ul>
        <li>Das mittlere Feld ist ein Freifeld und automatisch markiert.</li>
        <li>Dein Spielstand wird automatisch gespeichert.</li>
        <li>Du kannst jederzeit zur Tischauswahl zurückkehren.</li>
        <li>Teile deine Fotos mit dem Brautpaar nach der Hochzeit!</li>
      </ul>
      
      <p class="help-footer">Viel Spaß beim Spielen und Fotografieren!</p>
    `;
    
    // Assemble modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(content);
    modal.appendChild(modalContent);
    
    // Add to body
    document.body.appendChild(modal);
  }

  /**
   * Set up event listeners for help buttons and close button
   */
  setupEventListeners() {
    // Use event delegation for dynamically created elements
    document.addEventListener('click', (e) => {
      // Help buttons
      if (e.target && (e.target.id === 'splash-help-button' || e.target.id === 'game-help-button')) {
        this.showHelpModal();
      }
      
      // Close button
      if (e.target && e.target.id === this.closeButtonId) {
        this.hideHelpModal();
      }
      
      // Close when clicking outside the modal content
      if (e.target && e.target.id === this.helpModalId) {
        this.hideHelpModal();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideHelpModal();
      }
    });
  }

  /**
   * Show the help modal
   */
  showHelpModal() {
    const modal = document.getElementById(this.helpModalId);
    if (modal) {
      modal.classList.add('active');
      // Trap focus inside modal for accessibility
      const closeButton = document.getElementById(this.closeButtonId);
      if (closeButton) {
        closeButton.focus();
      }
    }
  }

  /**
   * Hide the help modal
   */
  hideHelpModal() {
    const modal = document.getElementById(this.helpModalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }
}

// Create and export a singleton instance
const helpController = new HelpController();
export default helpController;