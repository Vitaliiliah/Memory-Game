export class Card {
    constructor(value, index, game) {
        this.value = value;
        this.index = index;
        this.game = game;

        // Створення карток з картинками
        this.element = document.createElement("div");
        this.element.classList.add("card");
        this.element.dataset.index = this.index;

        const img = document.createElement("img");
        img.src = this.value;
        img.alt = "Card image";
        this.element.appendChild(img);

        this.element.addEventListener("click", () => this.open());
    }

    // Відкриття картки при натисканні
    open() {
        const isBlocked = this.element.classList.contains("open") || 
                         this.element.classList.contains("matched") || 
                         this.game.openedCards.length >= 2;
        if (isBlocked) return;

        this.element.classList.add("open");
        this.game.openedCards.push(this);
        this.game.checkMatch();
    }

    // Закриття картки
    close() {
        this.element.classList.remove("open");
    }

    // Позначає картку як знайдену пару
    matchFound() {
        this.element.classList.add("matched");
    }
}