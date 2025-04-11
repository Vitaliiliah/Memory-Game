import { Card } from "./card.js";

export class MemoryGame {
  constructor() {
    // Основні DOM-елементи гри
    this.board = document.getElementById("game-board");
    this.restartBtn = document.getElementById("restart");
    this.bestTimeSpan = document.getElementById("best-time");
    this.startScreen = document.getElementById("start-screen");

    // Стан гри: масив карток, відкрита пара, кількість збігів
    this.cards = [];
    this.openedCards = [];
    this.matches = 0;
    this.startTime = null;
    this.size = null;

    // Найкращі результати для режимів 4x4 та 6x6
    this.bestTimes = {
      4: this.loadBestTime(4),
      6: this.loadBestTime(6),
    };

    // API-ключ для отримання зображень
    this.apiKey =
      "live_BIJVBfr1YvtpFzTKYSeIwgdnXrDknMoBf9USbjszfhg4KXC13llrsAfrDxVGPnJf";

    // Аудіо для старту та виграшу
    this.startSound = new Audio("./sounds/start.mp3");
    this.winSound = new Audio("./sounds/win.mp4");
    this.startSound.volume = 0.4;
    this.winSound.volume = 0.5;

    // Підключення обробників подій
    this.setupEventListeners();
    this.updateBestTimeText();
  }

  // Реєстрація подій на кнопках інтерфейсу
  setupEventListeners() {
    document.getElementById("easy-mode").addEventListener("click", () => {
      this.playStartSound();
      this.startGame(4);
    });

    document.getElementById("hard-mode").addEventListener("click", () => {
      this.playStartSound();
      this.startGame(6);
    });

    this.restartBtn.addEventListener("click", () => this.startGame(this.size));
    document
      .getElementById("back-to-menu")
      .addEventListener("click", () => this.backToMenu());
  }

  // Відтворення звуку перед стартом гри
  playStartSound() {
    this.startSound.pause();
    this.startSound.currentTime = 0;
    this.startSound.play();
  }

  // Основна ініціалізація гри
  async startGame(size) {
    this.size = size;
    this.bestTimes[size] = this.loadBestTime(size);
    this.updateBestTimeText();

    this.toggleVisibility(true);

    this.board.innerHTML = "";
    this.matches = 0;
    this.openedCards = [];
    this.startTime = Date.now();

    try {
      const icons = await this.fetchIcons();
      const totalCards = (size * size) / 2;
      const cardValues = icons.slice(0, totalCards);
      const shuffledValues = [...cardValues, ...cardValues].sort(
        () => Math.random() - 0.5
      );

      this.cards = shuffledValues.map(
        (value, index) => new Card(value, index, this)
      );
      this.cards.forEach((card) => this.board.appendChild(card.element));

      // Встановлення розміру карток залежно від екрана
      const isMobile = window.innerWidth < 500;
      const cardSize = isMobile ? 60 : 100;

      this.board.style.gridTemplateColumns = `repeat(${size}, ${cardSize}px)`;
      this.board.style.gridTemplateRows = `repeat(${size}, ${cardSize}px)`;
    } catch (error) {
      this.backToMenu();
    }
  }

  // Повернення до головного меню
  backToMenu() {
    this.toggleVisibility(false);
  }

  // Перемикання між початковим екраном та ігровим полем
  toggleVisibility(isGame) {
    this.startScreen.classList.toggle("hidden", isGame);
    this.board.classList.toggle("hidden", !isGame);
    this.restartBtn.classList.toggle("hidden", !isGame);
    this.bestTimeSpan.classList.toggle("hidden", !isGame);
    document.getElementById("back-to-menu").classList.toggle("hidden", !isGame);
  }

  // Отримання зображень котів із API
  async fetchIcons() {
    const neededImages = (this.size * this.size) / 2;

    if (!this.apiKey || this.apiKey === "your-api-key-here") {
      alert("API-ключ відсутній. Гра не може завантажити зображення.");
      throw new Error("API-ключ не вказано");
    }

    try {
      const response = await fetch(
        `https://api.thecatapi.com/v1/images/search?limit=${neededImages}`,
        {
          headers: { "x-api-key": this.apiKey },
        }
      );

      if (!response.ok) {
        throw new Error(`Помилка API: ${response.status}`);
      }

      const data = await response.json();

      if (data.length < neededImages) {
        throw new Error("Недостатньо зображень від API");
      }

      return data.map((cat) => cat.url);
    } catch (error) {
      console.error("Помилка завантаження зображень:", error);
      alert(
        "Не вдалося завантажити зображення котів. Перевірте підключення до інтернету або API-ключ."
      );
      throw error;
    }
  }

  // Логіка перевірки парності відкритих карток
  checkMatch() {
    if (this.openedCards.length !== 2) return;

    const [card1, card2] = this.openedCards;

    if (card1.value === card2.value) {
      card1.matchFound();
      card2.matchFound();
      this.matches++;

      if (this.matches === this.cards.length / 2) {
        this.endGame();
      }
    } else {
      setTimeout(() => {
        card1.close();
        card2.close();
      }, 1000);
    }

    this.openedCards = [];
  }

  // Обробка завершення гри
  endGame() {
    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);

    this.winSound.pause();
    this.winSound.currentTime = 0;
    this.winSound.play();

    alert(`Ви виграли за ${timeTaken} секунд!`);

    const currentBest = this.bestTimes[this.size];
    if (!currentBest || timeTaken < currentBest) {
      this.bestTimes[this.size] = timeTaken;
      localStorage.setItem(`bestTime_${this.size}`, timeTaken);
      this.updateBestTimeText();
    }
  }

  // Оновлення тексту найкращого часу
  updateBestTimeText() {
    const currentBest = this.bestTimes[this.size];
    this.bestTimeSpan.textContent = `Найкращий час (${this.size}x${this.size}): ${currentBest || "-"}`;
  }

  // Отримання найкращого результату з localStorage
  loadBestTime(size) {
    return Number(localStorage.getItem(`bestTime_${size}`)) || 0;
  }
}
