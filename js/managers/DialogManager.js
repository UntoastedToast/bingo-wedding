/**
 * Dialog Manager für das Bingo-Spiel
 * Verwaltet alle Dialog-bezogenen Funktionen
 */
import i18n from '../services/i18n.js';
import config from '../core/config.js';

class DialogManager {
  constructor() {
    this.dialogOverlayId = 'cell-dialog-overlay';
    this.dialogContentId = 'dialog-content';
    this.confirmButtonId = 'dialog-confirm';
    this.cancelButtonId = 'dialog-cancel';
    
    // Methoden binden
    this.hideDialog = this.hideDialog.bind(this);
    
    // Dialog erstellen, falls noch nicht vorhanden
    this.createDialog();
  }
  
  /**
   * Erstellt den Dialog-Overlay, falls er noch nicht existiert
   */
  createDialog() {
    // Prüfen, ob der Dialog bereits existiert
    if (document.getElementById(this.dialogOverlayId)) return;
    
    const dialogOverlay = document.createElement('div');
    dialogOverlay.id = this.dialogOverlayId;
    dialogOverlay.className = 'cell-dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'cell-dialog';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'dialog-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', this.hideDialog);
    
    const content = document.createElement('div');
    content.className = 'dialog-content';
    content.id = this.dialogContentId;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'dialog-button confirm';
    confirmButton.id = this.confirmButtonId;
    confirmButton.setAttribute('data-i18n', 'game.dialogConfirm');
    confirmButton.textContent = i18n.t('game.dialogConfirm');
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button cancel';
    cancelButton.id = this.cancelButtonId;
    cancelButton.setAttribute('data-i18n', 'game.dialogCancel');
    cancelButton.textContent = i18n.t('game.dialogCancel');
    cancelButton.addEventListener('click', this.hideDialog);
    
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    
    dialog.appendChild(closeButton);
    dialog.appendChild(content);
    dialog.appendChild(buttonContainer);
    
    dialogOverlay.appendChild(dialog);
    document.body.appendChild(dialogOverlay);
    
    // Dialog schließen, wenn auf den Hintergrund geklickt wird
    dialogOverlay.addEventListener('click', (e) => {
      if (e.target === dialogOverlay) {
        this.hideDialog();
      }
    });
  }
  
  /**
   * Zeigt den Dialog mit dem angegebenen Inhalt an
   * @param {string} text - Der anzuzeigende Text
   * @param {number} index - Der Index der Zelle
   * @param {Function} onConfirm - Callback-Funktion für die Bestätigung
   */
  showDialog(text, index, onConfirm) {
    const dialogOverlay = document.getElementById(this.dialogOverlayId);
    const dialogContent = document.getElementById(this.dialogContentId);
    const confirmButton = document.getElementById(this.confirmButtonId);
    const cancelButton = document.getElementById(this.cancelButtonId);
    if (!dialogOverlay || !dialogContent || !confirmButton) return;
    
    // Dialog-Inhalt setzen
    // Text für Freiraum aus i18n neu laden, um aktuelle Übersetzung zu gewährleisten
    if (index === config.freeSpace.position) {
      dialogContent.textContent = i18n.t('help.freeSpaceDescription');
    } else {
      dialogContent.textContent = text;
    }
    
    // Index im Bestätigungsbutton speichern
    confirmButton.dataset.index = index;
    
    // Alten Event-Listener entfernen, um Duplikate zu vermeiden
    confirmButton.replaceWith(confirmButton.cloneNode(true));
    
    // Buttons für Freiraum-Zelle konfigurieren
    if (index === config.freeSpace.position) {
      cancelButton.style.display = 'none';
      const okBtn = document.getElementById(this.confirmButtonId);
      okBtn.textContent = i18n.t('help.freeSpaceConfirm');
      okBtn.addEventListener('click', this.hideDialog);
    } else {
      cancelButton.style.display = '';
      const newConfirm = document.getElementById(this.confirmButtonId);
      newConfirm.textContent = i18n.t('game.dialogConfirm');
      newConfirm.addEventListener('click', () => {
        if (typeof onConfirm === 'function') {
          onConfirm(index);
        }
        this.hideDialog();
      });
    }
    
    // Dialog anzeigen
    dialogOverlay.classList.add('active');
    
    // Scrollen auf dem Body verhindern
    document.body.style.overflow = 'hidden';
  }
  
  /**
   * Versteckt den Dialog
   */
  hideDialog() {
    const dialogOverlay = document.getElementById(this.dialogOverlayId);
    if (!dialogOverlay) return;
    
    dialogOverlay.classList.remove('active');
    
    // Scrollen wieder aktivieren
    document.body.style.overflow = '';
  }
  
  /**
   * Aktualisiert die Texte im Dialog entsprechend der gewählten Sprache
   */
  updateDialogTexts() {
    // Dialog-Buttons mit Übersetzungen aktualisieren
    const confirmButton = document.getElementById(this.confirmButtonId);
    if (confirmButton) {
      confirmButton.textContent = i18n.t('game.dialogConfirm');
    }
    
    const cancelButton = document.getElementById(this.cancelButtonId);
    if (cancelButton) {
      cancelButton.textContent = i18n.t('game.dialogCancel');
    }
  }
}

export default new DialogManager();