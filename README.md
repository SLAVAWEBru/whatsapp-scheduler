# WhatsApp Scheduler

Приложение для отложенной отправки сообщений в WhatsApp с простым и удобным интерфейсом.

## Возможности

- Отправка отложенных сообщений в WhatsApp
- Планирование сообщений с учетом часовых поясов
- Автоматическая отправка в заданное время
- Отображение списка запланированных сообщений
- Возможность отмены запланированной отправки
- Авторизация через QR-код
- Сохранение сессии для повторного использования

## Требования

- Windows 7/8/10/11
- Активная учетная запись WhatsApp на мобильном устройстве
- Подключение к интернету

## Установка и запуск

### Способ 1: Установка из исходников (для разработчиков)

1. Убедитесь, что у вас установлен [Node.js](https://nodejs.org/) версии 14 или выше
2. Клонируйте этот репозиторий или создайте папку с перечисленными ниже файлами
3. Перейдите в папку проекта и установите зависимости:
   ```
   npm install
   ```
4. Запустите приложение в режиме разработки:
   ```
   npm start
   ```
5. Для сборки исполняемого файла:
   ```
   npm run build
   ```

### Способ 2: Установка готового приложения

1. Скачайте последнюю версию установщика из раздела релизов
2. Запустите установщик и следуйте инструкциям
3. Запустите приложение и отсканируйте QR-код для авторизации

## Использование

1. При первом запуске отсканируйте QR-код в приложении WhatsApp на вашем телефоне
2. Введите номер телефона получателя (формат: +7XXXXXXXXXX или XXXXXXXXXX)
3. Введите текст сообщения
4. Выберите дату и время отправки
5. Выберите часовой пояс (по умолчанию используется ваш локальный часовой пояс)
6. Нажмите кнопку "Запланировать отправку"
7. Запланированные сообщения будут отображаться на вкладке "Запланированные"

## Примечания

- Приложение должно быть запущено в момент запланированной отправки сообщения
- При первой авторизации WhatsApp потребуется отсканировать QR-код
- После отправки сообщения оно автоматически удаляется из списка запланированных
- Для корректной работы не закрывайте приложение, если у вас есть запланированные сообщения

## Возможные проблемы и их решение

1. **Ошибка авторизации**
   - Переустановите приложение или удалите папку с данными сессии WhatsApp
   - Убедитесь, что ваш телефон подключен к интернету во время сканирования QR-кода

2. **Сообщения не отправляются**
   - Проверьте подключение к интернету
   - Убедитесь, что WhatsApp Web авторизован (статус должен быть "Подключено")
   - Проверьте правильность формата номера телефона (рекомендуется формат +7XXXXXXXXXX)

3. **Проблемы с установкой**
   - Убедитесь, что у вас установлен Node.js (для установки из исходников)
   - Временно отключите антивирус при установке, так как он может блокировать процесс
