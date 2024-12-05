const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Ваш API ключ OMDb
const omdbApiKey = '81463425'; 

// Створення нового бота з token
const bot = new TelegramBot('8022978486:AAGVadfBpAZBaKRW8kiDPoQGMVArC9G_TTk', { polling: true });

// Головні параметри фільтрації
const genres = ['Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 'Sci-Fi'];
const years = ['2023', '2022', '2021', '2020', '2019', '2018', '2017'];
const ratings = ['7+', '8+', '9+']; // Рейтинг IMDb

// Команда для старту
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      keyboard: [
        ['Жанр', 'Рейтинг IMDb'],
        ['Рік виходу', 'Пошук фільмів']
      ],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };

  bot.sendMessage(chatId, 'Привіт! Я можу порекомендувати фільми. Обери одну з опцій для початку:', options);
});

// Команда для вибору жанру
bot.onText(/Жанр/, (msg) => {
  const chatId = msg.chat.id;

  const genreOptions = {
    reply_markup: {
      keyboard: genres.map((genre) => [genre]),
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };

  bot.sendMessage(chatId, 'Оберіть жанр:', genreOptions);
});

// Команда для вибору рейтингу
bot.onText(/Рейтинг IMDb/, (msg) => {
  const chatId = msg.chat.id;

  const ratingOptions = {
    reply_markup: {
      keyboard: ratings.map((rating) => [rating]),
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };

  bot.sendMessage(chatId, 'Оберіть мінімальний рейтинг IMDb:', ratingOptions);
});

// Команда для вибору року
bot.onText(/Рік виходу/, (msg) => {
  const chatId = msg.chat.id;

  const yearOptions = {
    reply_markup: {
      keyboard: years.map((year) => [year]),
      one_time_keyboard: true,
      resize_keyboard: true
    }
  };

  bot.sendMessage(chatId, 'Оберіть рік виходу фільму:', yearOptions);
});

// Обробка вибору жанру
bot.onText(new RegExp(genres.join('|')), (msg) => {
  const chatId = msg.chat.id;
  const genre = msg.text;

  // Запит фільмів за жанром
  getMovieRecommendation(chatId, genre);
});

// Обробка вибору рейтингу IMDb
bot.onText(new RegExp(ratings.join('|')), (msg) => {
  const chatId = msg.chat.id;
  const ratingText = msg.text;

  // Визначаємо мінімальний рейтинг
  const rating = parseFloat(ratingText.replace('+', ''));

  getMovieRecommendation(chatId, null, rating);
});

// Обробка вибору року
bot.onText(new RegExp(years.join('|')), (msg) => {
  const chatId = msg.chat.id;
  const year = msg.text;

  getMovieRecommendation(chatId, null, null, year);
});

// Основна функція для отримання рекомендацій
const getMovieRecommendation = (chatId, genre = null, rating = null, year = null) => {
  let query = '';

  // Створення запиту для API
  if (genre) {
    query += `&genre=${genre}`;
  }
  if (year) {
    query += `&y=${year}`;
  }

  // Обробка рейтингу IMDb
  if (rating) {
    query += `&imdbRating=${rating}`;
  }

  axios.get(`http://www.omdbapi.com/?apikey=${omdbApiKey}&s=${genre || 'movie'}${query}`)
    .then(response => {
      if (response.data.Response === 'True') {
        const movies = response.data.Search;

        if (movies.length === 0) {
          bot.sendMessage(chatId, 'Не знайдено фільмів за вашим запитом. Спробуйте змінити параметри.');
        } else {
          const movie = movies[Math.floor(Math.random() * movies.length)];

          bot.sendMessage(chatId, `Ось рекомендований фільм:\n\nНазва: ${movie.Title}\nРік: ${movie.Year}\nРейтинг IMDb: ${movie.imdbRating}\n\n[Деталі на IMDb](https://www.imdb.com/title/${movie.imdbID})`, { parse_mode: 'Markdown' });
        }
      } else {
        bot.sendMessage(chatId, `Помилка: ${response.data.Error}`);
      }
    })
    .catch(error => {
      console.error('Помилка при запиті до OMDb API:', error);
      bot.sendMessage(chatId, 'Сталася помилка при отриманні фільмів. Спробуйте пізніше.');
    });
};

// Логування помилок
bot.on("polling_error", (err) => console.log(err));
