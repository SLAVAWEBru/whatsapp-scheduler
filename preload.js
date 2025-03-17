const { contextBridge, ipcRenderer } = require('electron');
const moment = require('moment-timezone');

// Экспортируем API для использования в рендерере с улучшенной обработкой событий
contextBridge.exposeInMainWorld('whatsappAPI', {
  scheduleMessage: (phone, message, sendTime, timezone) => {
    // Валидация входных данных перед отправкой в основной процесс
    if (!phone || typeof phone !== 'string') {
      return Promise.reject(new Error('Неверный формат номера телефона'));
    }
    
    if (!message || typeof message !== 'string') {
      return Promise.reject(new Error('Сообщение не может быть пустым'));
    }
    
    if (!sendTime || !timezone) {
      return Promise.reject(new Error('Необходимо указать время и часовой пояс'));
    }
    
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
    if (!messageId) {
      return Promise.reject(new Error('Не указан ID сообщения'));
    }
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
  
  // Улучшенные обработчики событий с однократным подключением и удалением
  onQrCode: (callback) => {
    const newCallback = (_, qrCode) => callback(qrCode);
    ipcRenderer.on('qr-code', newCallback);
    return () => ipcRenderer.removeListener('qr-code', newCallback);
  },
  
  onQrRegenerateNeeded: (callback) => {
    const newCallback = () => callback();
    ipcRenderer.on('qr-regenerate-needed', newCallback);
    return () => ipcRenderer.removeListener('qr-regenerate-needed', newCallback);
  },
  
  onWhatsAppReady: (callback) => {
    const newCallback = () => callback();
    ipcRenderer.on('whatsapp-ready', newCallback);
    return () => ipcRenderer.removeListener('whatsapp-ready', newCallback);
  },
  
  onWhatsAppDisconnected: (callback) => {
    const newCallback = (_, reason) => callback(reason);
    ipcRenderer.on('whatsapp-disconnected', newCallback);
    return () => ipcRenderer.removeListener('whatsapp-disconnected', newCallback);
  },
  
  onAuthFailure: (callback) => {
    const newCallback = (_, message) => callback(message);
    ipcRenderer.on('auth-failure', newCallback);
    return () => ipcRenderer.removeListener('auth-failure', newCallback);
  },
  
  onMessageSent: (callback) => {
    const newCallback = (_, messageId) => callback(messageId);
    ipcRenderer.on('message-sent', newCallback);
    return () => ipcRenderer.removeListener('message-sent', newCallback);
  },
  
  onSendError: (callback) => {
    const newCallback = (_, error) => callback(error);
    ipcRenderer.on('send-error', newCallback);
    return () => ipcRenderer.removeListener('send-error', newCallback);
  }
});