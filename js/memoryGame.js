import { Card } from './card.js';

export class MemoryGame {
    constructor() {
        // Ініціалізація основних DOM-елементів гри
        this.board = document.getElementById('game-board');
        this.restartBtn = document.getElementById('restart');
        this.bestTimeSpan = document.getElementById('best-time');
        this.startScreen = document.getElementById('start-screen');

        // Стан гри: картки, відкриті картки, кількість збігів
        this.cards = [];
        this.openedCards = [];
        this.matches = 0;
        this.startTime = null;
        this.size = null;

        // Зберігає найкращі результати для режимів 4x4 і 6x6
        this.bestTimes = {
            4: this.loadBestTime(4),
            6: this.loadBestTime(6)
        };

        // API-ключ для доступу до The Cat API
        this.apiKey = 'live_BIJVBfr1YvtpFzTKYSeIwgdnXrDknMoBf9USbjszfhg4KXC13llrsAfrDxVGPnJf';

        // Ініціалізація аудіо для звукових ефектів
        this.startSound = new Audio('./sounds/start.mp3');
        this.winSound = new Audio('./sounds/win.mp4');
        this.startSound.volume = 0.4;
        this.winSound.volume = 0.5;

        // Налаштування обробників подій та відображення найкращого часу
        this.setupEventListeners();
        this.updateBestTimeText();
    }

    // Налаштовує обробники подій для кнопок вибору режиму, рестарту та повернення до меню
    setupEventListeners() {
        document.getElementById('easy-mode').addEventListener('click', () => {
            this.playStartSound();
            this.startGame(4);
        });

        document.getElementById('hard-mode').addEventListener('click', () => {
            this.playStartSound();
            this.startGame(6);
        });

        this.restartBtn.addEventListener('click', () => this.startGame(this.size));
        document.getElementById('back-to-menu').addEventListener('click', () => this.backToMenu());
    }

    // Відтворює звук початку гри, скидаючи попереднє відтворення
    playStartSound() {
        this.startSound.pause();
        this.startSound.currentTime = 0;
        this.startSound.play();
    }

    // Запускає нову гру з указаним розміром поля (4x4 або 6x6)
    async startGame(size) {
        // Зберігає розмір поля та завантажує найкращий час для нього
        this.size = size;
        this.bestTimes[size] = this.loadBestTime(size);
        this.updateBestTimeText();

        // Перемикає інтерфейс на екран гри
        this.toggleVisibility(true);

        // Скидає стан гри перед початком
        this.board.innerHTML = '';
        this.matches = 0;
        this.openedCards = [];
        this.startTime = Date.now();

        try {
            // Завантажує зображення з API та створює картки
            const icons = await this.fetchIcons();
            const totalCards = (size * size) / 2;
            const cardValues = icons.slice(0, totalCards);
            const shuffledValues = [...cardValues, ...cardValues].sort(() => Math.random() - 0.5);

            // Створює екземпляри карток і додає їх на дошку
            this.cards = shuffledValues.map((value, index) => new Card(value, index, this));
            this.cards.forEach(card => this.board.appendChild(card.element));

            // Налаштовує CSS-грід для відображення карток
            this.board.style.gridTemplateColumns = `repeat(${size}, 100px)`;
            this.board.style.gridTemplateRows = `repeat(${size}, 100px)`;
        } catch (error) {
            // Повертається до меню у разі помилки завантаження зображень
            this.backToMenu();
        }
    }

    // Повертає користувача до початкового екрану вибору режиму
    backToMenu() {
        this.toggleVisibility(false);
    }

    // Перемикає видимість між початковим екраном і дошкою гри
    toggleVisibility(isGame) {
        this.startScreen.classList.toggle('hidden', isGame);
        this.board.classList.toggle('hidden', !isGame);
        this.restartBtn.classList.toggle('hidden', !isGame);
        this.bestTimeSpan.classList.toggle('hidden', !isGame);
        document.getElementById('back-to-menu').classList.toggle('hidden', !isGame);
    }

    // Завантажує зображення котів із The Cat API для використання на картках
    async fetchIcons() {
        const neededImages = (this.size * this.size) / 2;

        // Перевіряє наявність валідного API-ключа
        if (!this.apiKey || this.apiKey === 'your-api-key-here') {
            alert('API-ключ відсутній. Гра не може завантажити зображення.');
            throw new Error('API-ключ не вказано');
        }

        try {
            // Виконує запит до API для отримання потрібної кількості зображень
            const response = await fetch(
                `https://api.thecatapi.com/v1/images/search?limit=${neededImages}`,
                {
                    headers: { 'x-api-key': this.apiKey }
                }
            );

            // Перевіряє, чи успішний запит
            if (!response.ok) {
                throw new Error(`Помилка API: ${response.status}`);
            }

            const data = await response.json();

            // Перевіряє, чи достатньо зображень повернуто
            if (data.length < neededImages) {
                throw new Error('Недостатньо зображень від API');
            }

            // Повертає масив URL зображень
            return data.map(cat => cat.url);
        } catch (error) {
            // Логує помилку та сповіщає користувача
            console.error('Помилка завантаження зображень:', error);
            alert('Не вдалося завантажити зображення котів. Перевірте підключення до інтернету або API-ключ.');
            throw error;
        }
    }

    // Перевіряє, чи дві відкриті картки є парою
    checkMatch() {
        if (this.openedCards.length !== 2) return;

        const [card1, card2] = this.openedCards;

        if (card1.value === card2.value) {
            // Якщо картки збігаються, позначає їх як знайдені
            card1.matchFound();
            card2.matchFound();
            this.matches++;

            // Перевіряє, чи всі пари знайдено
            if (this.matches === this.cards.length / 2) {
                this.endGame();
            }
        } else {
            // Якщо картки не збігаються, закриває їх після затримки
            setTimeout(() => {
                card1.close();
                card2.close();
            }, 1000);
        }

        // Очищає масив відкритих карток
        this.openedCards = [];
    }

    // Завершує гру, підраховує час і оновлює найкращий результат
    endGame() {
        // Обчислює час гри в секундах
        const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

        // Відтворює звук перемоги
        this.winSound.pause();
        this.winSound.currentTime = 0;
        this.winSound.play();

        // Сповіщає користувача про результат
        alert(`Ви виграли за ${timeTaken} секунд!`);

        // Оновлює найкращий час, якщо поточний результат кращий
        const currentBest = this.bestTimes[this.size];
        if (!currentBest || timeTaken < currentBest) {
            this.bestTimes[this.size] = timeTaken;
            localStorage.setItem(`bestTime_${this.size}`, timeTaken);
            this.updateBestTimeText();
        }
    }

    // Оновлює відображення найкращого часу для поточного режиму
    updateBestTimeText() {
        const currentBest = this.bestTimes[this.size];
        this.bestTimeSpan.textContent = `Найкращий час (${this.size}x${this.size}): ${currentBest || '-'}`;
    }

    // Завантажує найкращий час для вказаного режиму з localStorage
    loadBestTime(size) {
        return Number(localStorage.getItem(`bestTime_${size}`)) || 0;
    }
}
