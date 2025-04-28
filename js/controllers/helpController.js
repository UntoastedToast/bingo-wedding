/**
 * Help Controller for the Bingo Game
 * Provides instructions and guidance for players
 */
import i18n from '../services/i18n.js';

class HelpController {
  constructor() {
    this.helpModalId = 'help-modal';
    this.helpButtonId = 'help-button';
    this.closeButtonId = 'close-help';
    this.initialized = false;
    
    // Referenz auf updateHelpContent-Methode binden
    this.updateHelpContentBound = this.updateHelpContent.bind(this);
    
    // Create the help button and modal elements
    this.createHelpElements();
    this.setupEventListeners();
    
    // Auf Sprachänderungen hören
    document.addEventListener('languageChanged', this.updateHelpContentBound);
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
    helpButton.setAttribute('aria-label', i18n.t('help.buttonLabel'));
    helpButton.setAttribute('title', i18n.t('help.buttonLabel'));
    
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
    closeButton.setAttribute('aria-label', i18n.t('help.closeLabel'));
    
    // Title
    const title = document.createElement('h2');
    title.textContent = i18n.t('help.title');
    
    // Content
    const content = document.createElement('div');
    content.className = 'help-content';
    
    // How to play title
    const howToPlayTitle = document.createElement('h3');
    howToPlayTitle.textContent = i18n.t('help.howToPlayTitle');
    content.appendChild(howToPlayTitle);
    
    // Erstelle HTML mit Inline-Text statt dynamischen Listen
    content.innerHTML = `
      <h3>${i18n.t('help.howToPlayTitle')}</h3>
      <ol>
        <li>${i18n.t('help.howToPlaySteps.0')}</li>
        <li>${i18n.t('help.howToPlaySteps.1')}</li>
        <li>${i18n.t('help.howToPlaySteps.2')}</li>
        <li>${i18n.t('help.howToPlaySteps.3')}</li>
        <li>${i18n.t('help.howToPlaySteps.4')}</li>
        <li>${i18n.t('help.howToPlaySteps.5')}</li>
      </ol>
      
      <h3>${i18n.t('help.tipsTitle')}</h3>
      <ul>
        <li>${i18n.t('help.tipsList.0')}</li>
        <li>${i18n.t('help.tipsList.1')}</li>
        <li>${i18n.t('help.tipsList.2')}</li>
        <li>${i18n.t('help.tipsList.3')}</li>
      </ul>
    `;
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'help-footer-container';
    
    // Footer text
    const footerText = document.createElement('p');
    footerText.className = 'help-footer';
    footerText.textContent = i18n.t('help.footer');
    footer.appendChild(footerText);
    
    // Language switcher kopieren
    const originalSwitcher = document.querySelector('.language-switcher');
    if (originalSwitcher) {
      const langSwitcher = originalSwitcher.cloneNode(true);
      
      // Vor dem Klonen hinzugefügte Event-Listener werden nicht mitkopiert,
      // daher müssen wir sie neu hinzufügen
      langSwitcher.querySelectorAll('.lang-button').forEach(button => {
        const langCode = button.getAttribute('data-lang');
        if (langCode) {
          // Wir entfernen zuerst alle vorhandenen Event-Listener (falls vorhanden)
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          // Neuen Event-Listener hinzufügen - Hilfefenster bleibt offen
          newButton.addEventListener('click', () => {
            i18n.setLanguage(langCode);
          });
        }
      });
      
      footer.appendChild(langSwitcher);
    } else {
      console.warn('Konnte Language Switcher nicht finden und kopieren');
    }
    
    content.appendChild(footer);
    
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
    // Update text content with current language before showing
    this.updateHelpContent();
    
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
  
  /**
   * Update help content with current language translations
   */
  updateHelpContent() {
    const modal = document.getElementById(this.helpModalId);
    if (!modal) return;
    
    // Update title
    const title = modal.querySelector('h2');
    if (title) title.textContent = i18n.t('help.title');
    
    // Update how to play title
    const howToPlayTitle = modal.querySelector('.help-content > h3:first-of-type');
    if (howToPlayTitle) howToPlayTitle.textContent = i18n.t('help.howToPlayTitle');
    
    // Update steps (einzeln zugreifen)
    const olItems = modal.querySelectorAll('.help-content > ol > li');
    if (olItems[0]) olItems[0].textContent = i18n.t('help.howToPlaySteps.0');
    if (olItems[1]) olItems[1].textContent = i18n.t('help.howToPlaySteps.1');
    if (olItems[2]) olItems[2].textContent = i18n.t('help.howToPlaySteps.2');
    if (olItems[3]) olItems[3].textContent = i18n.t('help.howToPlaySteps.3');
    if (olItems[4]) olItems[4].textContent = i18n.t('help.howToPlaySteps.4');
    if (olItems[5]) olItems[5].textContent = i18n.t('help.howToPlaySteps.5');
    
    // Update tips title
    const tipsTitle = modal.querySelector('.help-content > h3:nth-of-type(2)');
    if (tipsTitle) tipsTitle.textContent = i18n.t('help.tipsTitle');
    
    // Update tips (einzeln zugreifen)
    const ulItems = modal.querySelectorAll('.help-content > ul > li');
    if (ulItems[0]) ulItems[0].textContent = i18n.t('help.tipsList.0');
    if (ulItems[1]) ulItems[1].textContent = i18n.t('help.tipsList.1');
    if (ulItems[2]) ulItems[2].textContent = i18n.t('help.tipsList.2');
    if (ulItems[3]) ulItems[3].textContent = i18n.t('help.tipsList.3');
    
    // Update footer
    const footer = modal.querySelector('.help-footer');
    if (footer) footer.textContent = i18n.t('help.footer');
    
    // Update button labels
    const closeButton = document.getElementById(this.closeButtonId);
    if (closeButton) {
      closeButton.setAttribute('aria-label', i18n.t('help.closeLabel'));
      closeButton.title = i18n.t('help.closeLabel');
    }
    
    // Update help buttons labels
    document.querySelectorAll('.help-button').forEach(button => {
      button.setAttribute('aria-label', i18n.t('help.buttonLabel'));
      button.title = i18n.t('help.buttonLabel');
    });
  }
}

// Create and export a singleton instance
const helpController = new HelpController();
// Ressourcen freigeben, wenn Klasse zerstört wird
window.addEventListener('unload', () => {
  document.removeEventListener('languageChanged', helpController.updateHelpContentBound);
});

export default helpController;