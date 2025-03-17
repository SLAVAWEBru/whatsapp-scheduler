const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const qrcode_terminal = require('qrcode-terminal'); // Добавлен терминальный QR-код
const schedule = require('node-schedule');
const Store = require('electron-store');
const moment = require('moment-timezone');

// Хранилище для сохранения запланированных сообщений
const store = new Store({
  name: 'scheduled-messages',
  defaults: {
    messages: []
  }
});

// Глобальные переменные для доступа к окну и клиенту WhatsApp
let mainWindow;
let whatsappClient;
let scheduledJobs = {};

// Функция для создания основного окна приложения
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadFile('index.html');
  
  // Открываем DevTools в режиме разработки
  mainWindow.webContents.openDevTools();
}

// Инициализация клиента WhatsApp
function initWhatsAppClient() {
  console.log('Инициализация WhatsApp клиента...');
  
  whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ]
    }
  });

  whatsappClient.on('qr', async (qr) => {
    console.log('QR-код получен от WhatsApp Web');
    
    // Отображаем QR-код в терминале для отладки
    qrcode_terminal.generate(qr, {small: true});
    console.log('QR-код отображен в терминале - можно сканировать отсюда');
    
    try {
      // Генерация QR-кода как изображения Data URL
      console.log('Генерация графического QR-кода...');
      const qrDataUrl = await qrcode.toDataURL(qr);
      console.log('QR-код сгенерирован, отправка в UI...');
      
      if (mainWindow) {
        mainWindow.webContents.send('qr-code', qrDataUrl);
        console.log('QR-код отправлен в интерфейс');
      } else {
        console.error('Главное окно не определено!');
      }
    } catch (err) {
      console.error('Ошибка при генерации QR-кода:', err);
    }
  });

  whatsappClient.on('ready', () => {
    console.log('WhatsApp клиент готов');
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-ready');
    }
    
    // Восстановление запланированных сообщений после перезапуска
    restoreScheduledMessages();
  });

  whatsappClient.on('authenticated', () => {
    console.log('Аутентификация успешна');
  });

  whatsappClient.on('auth_failure', (msg) => {
    console.error('Ошибка аутентификации:', msg);
    if (mainWindow) {
      mainWindow.webContents.send('auth-failure', msg);
    }
  });

  whatsappClient.on('disconnected', (reason) => {
    console.log('Клиент WhatsApp отключен:', reason);
    if (mainWindow) {
      mainWindow.webContents.send('whatsapp-disconnected', reason);
    }
    // Перезапуск клиента после отключения
    whatsappClient.initialize();
  });

  console.log('Запуск инициализации клиента WhatsApp...');
  whatsappClient.initialize()
    .then(() => {
      console.log('WhatsApp клиент успешно инициализирован');
    })
    .catch(err => {
      console.error('Ошибка при инициализации WhatsApp клиента:', err);
    });
}

// Функция для восстановления запланированных сообщений после перезапуска
function restoreScheduledMessages() {
  const scheduledMessages = store.get('messages', []);
  
  scheduledMessages.forEach(msg => {
    const sendTime = new Date(msg.sendTime);
    
    // Проверяем, не прошло ли уже время отправки
    if (sendTime > new Date()) {
      scheduleMessage(msg.phone, msg.message, sendTime, msg.id);
    } else {
      // Удаляем сообщения, время которых уже прошло
      removeScheduledMessage(msg.id);
    }
  });
}

// Функция для планирования отправки сообщения
function scheduleMessage(phone, message, sendTime, messageId) {
  const job = schedule.scheduleJob(sendTime, async function() {
    try {
      if (whatsappClient && whatsappClient.info) {
        // Форматируем номер телефона
        const formattedNumber = formatPhoneNumber(phone);
        
        // Проверяем, существует ли чат с этим номером
        const chatId = `${formattedNumber}@c.us`;
        
        // Отправляем сообщение
        await whatsappClient.sendMessage(chatId, message);
        console.log(`Сообщение отправлено на ${phone} в ${sendTime}`);
        
        // Удаляем отправленное сообщение из хранилища
        removeScheduledMessage(messageId);
        
        // Уведомляем интерфейс
        if (mainWindow) {
          mainWindow.webContents.send('message-sent', messageId);
        }
      } else {
        console.error('WhatsApp клиент не готов');
        if (mainWindow) {
          mainWindow.webContents.send('send-error', 'WhatsApp клиент не готов');
        }
      }
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      if (mainWindow) {
        mainWindow.webContents.send('send-error', error.message);
      }
    }
  });
  
  // Сохраняем задание для возможной отмены
  scheduledJobs[messageId] = job;
}

// Форматирование номера телефона
function formatPhoneNumber(phone) {
  // Удаляем все нецифровые символы
  let cleaned = phone.replace(/\D/g, '');
  
  // Убеждаемся, что номер начинается с кода страны
  if (cleaned.length > 10) {
    // Предполагаем, что номер уже содержит код страны
    return cleaned;
  } else {
    // Добавляем код России по умолчанию, если его нет
    return '7' + cleaned;
  }
}

// Удаление запланированного сообщения
function removeScheduledMessage(messageId) {
  // Отменяем запланированную задачу
  if (scheduledJobs[messageId]) {
    scheduledJobs[messageId].cancel();
    delete scheduledJobs[messageId];
  }
  
  // Удаляем из хранилища
  const messages = store.get('messages', []);
  const updatedMessages = messages.filter(msg => msg.id !== messageId);
  store.set('messages', updatedMessages);
}

// Обработчики IPC для взаимодействия с рендерером
ipcMain.handle('schedule-message', (event, data) => {
  try {
    const { phone, message, sendTime, timezone, messageId } = data;
    
    // Преобразуем время отправки с учетом часового пояса
    const localTime = moment.tz(sendTime, timezone).toDate();
    
    // Сохраняем сообщение в хранилище
    const messages = store.get('messages', []);
    messages.push({
      id: messageId,
      phone,
      message,
      sendTime: localTime,
      timezone
    });
    store.set('messages', messages);
    
    // Планируем отправку
    scheduleMessage(phone, message, localTime, messageId);
    
    return { success: true, scheduledTime: localTime };
  } catch (error) {
    console.error('Ошибка при планировании сообщения:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-scheduled-messages', () => {
  return store.get('messages', []);
});

ipcMain.handle('cancel-message', (event, messageId) => {
  try {
    removeScheduledMessage(messageId);
    return { success: true };
  } catch (error) {
    console.error('Ошибка при отмене сообщения:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restart-whatsapp', () => {
  try {
    console.log('Перезапуск WhatsApp клиента...');
    if (whatsappClient) {
      whatsappClient.destroy().then(() => {
        console.log('Клиент уничтожен, создаем новый...');
        initWhatsAppClient();
      });
    } else {
      initWhatsAppClient();
    }
    return { success: true };
  } catch (error) {
    console.error('Ошибка при перезапуске WhatsApp:', error);
    return { success: false, error: error.message };
  }
});

// Запуск приложения
app.whenReady().then(() => {
  console.log('Приложение готово к запуску');
  createWindow();
  console.log('Главное окно создано');
  initWhatsAppClient();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Обработка закрытия приложения
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Обработка закрытия приложения для сохранения данных
app.on('before-quit', () => {
  // Дополнительная логика перед выходом (если нужна)
  if (whatsappClient) {
    try {
      whatsappClient.destroy();
    } catch (error) {
      console.error('Ошибка при уничтожении клиента:', error);
    }
  }
});