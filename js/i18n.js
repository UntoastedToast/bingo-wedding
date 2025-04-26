/**
 * Internationalization module for the Wedding Bingo App
 * Handles language detection, switching and text loading
 */
import bingoGame from './bingoGame.js';
import uiController from './uiController.js';

const i18n = {
  // Current language code
  currentLang: 'de',
  
  // Available languages
  languages: {
    de: { name: 'Deutsch', flag: 'de' },
    en: { name: 'English', flag: 'gb' },
    pl: { name: 'Polski', flag: 'pl' }
  },
  
  // Translations storage
  translations: {},
  
  /**
   * Initialize the internationalization module
   * Detects browser language and loads appropriate translations
   */
  init: async function() {
    // Add language switcher to footer
    this.addLanguageSwitcher();
    
    // Detect browser language or get from cookie
    const savedLang = this.getSavedLanguage();
    const browserLang = this.getBrowserLanguage();
    
    // Set initial language (saved language or browser language or default to German)
    const initialLang = savedLang || (this.isLanguageSupported(browserLang) ? browserLang : 'de');
    
    // Load translations and update UI
    await this.setLanguage(initialLang);
  },
  
  /**
   * Get browser language
   * @returns {string} Language code (2 characters)
   */
  getBrowserLanguage: function() {
    const fullLang = navigator.language || navigator.userLanguage || 'de';
    return fullLang.substring(0, 2).toLowerCase();
  },
  
  /**
   * Check if a language is supported
   * @param {string} lang - Language code to check
   * @returns {boolean} True if language is supported
   */
  isLanguageSupported: function(lang) {
    return Object.keys(this.languages).includes(lang);
  },
  
  /**
   * Get saved language from cookie
   * @returns {string|null} Saved language code or null
   */
  getSavedLanguage: function() {
    const match = document.cookie.match(/(^|;)\s*bingoLang=([^;]+)/);
    return match ? match[2] : null;
  },
  
  /**
   * Save language preference to cookie
   * @param {string} lang - Language code to save
   */
  saveLanguage: function(lang) {
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.cookie = `bingoLang=${lang};expires=${expiryDate.toUTCString()};path=/`;
  },
  
  /**
   * Load translations for a specific language
   * @param {string} lang - Language code
   * @returns {Promise} Promise that resolves when translations are loaded
   */
  loadTranslations: async function(lang) {
    try {
      const response = await fetch(`./json/i18n/ui/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
      this.translations = await response.json();
      return this.translations;
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to German if translation file is missing
      if (lang !== 'de') {
        return this.loadTranslations('de');
      }
      return {};
    }
  },
  
  /**
   * Set the current language and update the UI
   * @param {string} lang - Language code
   * @returns {Promise} Promise that resolves when language is set
   */
  setLanguage: async function(lang) {
    if (!this.isLanguageSupported(lang)) {
      lang = 'de'; // Fallback to German
    }
    
    // Load translations
    await this.loadTranslations(lang);
    
    // Update current language
    this.currentLang = lang;
    
    // Save language preference
    this.saveLanguage(lang);
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update UI
    this.updateUI();
    
    // Update language switcher active state
    this.updateLanguageSwitcherState();
    
    // Reload game content if we're in the game view
    this.reloadGameContent();
    
    return this.translations;
  },
  
  /**
   * Get translation for a key
   * @param {string} key - Translation key (dot notation supported)
   * @param {Object} params - Optional parameters for string interpolation
   * @returns {string} Translated text or key if translation not found
   */
  t: function(key, params = {}) {
    // Split key by dots to access nested properties
    const keys = key.split('.');
    let translation = this.translations;
    
    // Navigate through nested objects
    for (const k of keys) {
      translation = translation?.[k];
      if (translation === undefined) break;
    }
    
    // Return key if translation not found
    if (typeof translation !== 'string') return key;
    
    // Replace parameters in translation
    return translation.replace(/\{(\w+)\}/g, (_, param) => {
      return params[param] !== undefined ? params[param] : `{${param}}`;
    });
  },
  
  /**
   * Update all UI elements with translations
   */
  updateUI: function() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });
    
    // Update all elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });
    
    // Update all elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      element.title = this.t(key);
    });
  },
  
  /**
   * Add language switcher to footer or splash-footnote
   */
  addLanguageSwitcher: function() {
    // Die Sprachumschalter werden jetzt direkt im HTML definiert
    // Diese Funktion aktualisiert nur die Event-Listener
    
    // Event-Listener zu allen Sprachumschaltern hinzufügen
    document.querySelectorAll('.lang-button').forEach(button => {
      const langCode = button.getAttribute('data-lang');
      
      // Click-Event hinzufügen
      button.addEventListener('click', () => this.setLanguage(langCode));
      
      // Titel mit Sprachnamen setzen
      if (this.languages[langCode]) {
        button.title = this.languages[langCode].name;
      }
    });
    
    // Da die Sprachumschalter bereits im HTML definiert sind,
    // müssen wir sie nicht mehr dynamisch hinzufügen
    // Die folgenden Zeilen wurden entfernt, da sie auf eine nicht definierte Variable 'switcher' verweisen
  },
  
  /**
   * Update language switcher active state
   */
  updateLanguageSwitcherState: function() {
    document.querySelectorAll('.lang-button').forEach(button => {
      const buttonLang = button.getAttribute('data-lang');
      if (buttonLang === this.currentLang) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  },
  
  /**
   * Reload the game content when language changes
   * This will update the bingo card tasks with the new language
   */
  reloadGameContent: function() {
    // Überprüfe, ob wir uns im Spielbereich befinden
    if (!document.getElementById('game-screen') || 
        !document.getElementById('game-screen').classList.contains('active')) {
      return; // Nicht im Spielbereich, nichts zu tun
    }

    try {
      // Aktuelle Team-ID abrufen
      const teamId = bingoGame.currentTeamId;
      
      // Wenn eine gültige Team-ID vorhanden ist, das Spiel neu initialisieren
      if (teamId) {
        // Speichere den aktuellen Spielstand
        const markedTasks = [...bingoGame.markedTasks]; // Kopie erstellen
        const hasWon = bingoGame.hasWon;
        
        console.log('Neuladen der Bingo-Karten für Sprache:', this.currentLang);
        
        // Spiel mit aktueller Sprache neu initialisieren
        bingoGame.initializeGame(teamId).then(() => {
          console.log('Bingo-Karten erfolgreich neu geladen');
          
          // UI aktualisieren
          if (uiController && typeof uiController.refreshBoard === 'function') {
            uiController.refreshBoard();
            console.log('UI erfolgreich aktualisiert');
          }
        });
      }
    } catch (e) {
      console.error('Fehler beim Neuladen der Bingo-Karten:', e);
    }
  }
};

export default i18n;