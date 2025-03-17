const { contextBridge, ipcRenderer } = require('electron');
const moment = require('moment-timezone');

// Экспортируем API для использования в рендерере
contextBridge.exposeInMainWorld('whatsappAPI', {
  scheduleMessage: (phone, message, sendTime, timezone) => {
    const messageId = Date.now().toString();
    return ipcRenderer.invoke('schedule-message', { 
      phone, 
      message, 
      sendTime, 
      timezone, 
      messageId 
    });
  },
  
  getScheduledMessages: () => {
    return ipcRenderer.invoke('get-scheduled-messages');
  },
  
  cancelMessage: (messageId) => {
    return ipcRenderer.invoke('cancel-message', messageId);
  },
  
  restartWhatsApp: () => {
    return ipcRenderer.invoke('restart-whatsapp');
  },
  
  getTimezones: () => {
    return moment.tz.names();
  },
  
  getCurrentTimezone: () => {
    return moment.tz.guess();
  },
  
  onQrCode: (callback) => {
    ipcRenderer.on('qr-code', (event, qrCode) => callback(qrCode));
  },
  
  onWhatsAppReady: (callback) => {
    ipcRenderer.on('whatsapp-ready', () => callback());
  },
  
  onWhatsAppDisconnected: (callback) => {
    ipcRenderer.on('whatsapp-disconnected', (event, reason) => callback(reason));
  },
  
  onAuthFailure: (callback) => {
    ipcRenderer.on('auth-failure', (event, message) => callback(message));
  },
  
  onMessageSent: (callback) => {
    ipcRenderer.on('message-sent', (event, messageId) => callback(messageId));
  },
  
  onSendError: (callback) => {
    ipcRenderer.on('send-error', (event, error) => callback(error));
  }
});