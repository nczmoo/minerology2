class DisplayManager {
    constructor(game) {
        this.game = game;
        this.selectedShopItem = null;
    }

    createDisplays() {
        // Create the money display
        const moneyDisplay = document.createElement('div');
        moneyDisplay.id = 'money-display';
        moneyDisplay.style.position = 'absolute';
        moneyDisplay.style.top = '10px';
        moneyDisplay.style.left = '10px';
        moneyDisplay.style.color = '#FFD700'; // Gold color
        moneyDisplay.style.fontSize = '24px';
        document.body.appendChild(moneyDisplay);
        this.updateMoneyDisplay();

        // Create the day display
        const dayDisplay = document.createElement('div');
        dayDisplay.id = 'day-display';
        dayDisplay.style.position = 'absolute';
        dayDisplay.style.top = '40px';
        dayDisplay.style.left = '10px';
        dayDisplay.style.color = 'white';
        dayDisplay.style.fontSize = '18px';
        document.body.appendChild(dayDisplay);
        this.updateDayDisplay();

        // Create mining progress display
        const miningDisplay = document.createElement('div');
        miningDisplay.id = 'mining-display';
        miningDisplay.style.position = 'absolute';
        miningDisplay.style.top = '70px';
        miningDisplay.style.left = '10px';
        miningDisplay.style.color = '#C0C0C0'; // Silver color
        miningDisplay.style.fontSize = '18px';
        document.body.appendChild(miningDisplay);
        this.updateMiningDisplay();

        // Create next day button (hidden initially)
        const nextButton = document.createElement('button');
        nextButton.id = 'next-day-button';
        nextButton.innerText = 'Next Day';
        nextButton.style.position = 'absolute';
        nextButton.style.top = '100px';
        nextButton.style.right = '10px';
        nextButton.style.display = 'none';
        nextButton.onclick = () => this.game.startNextDay();
        document.body.appendChild(nextButton);

        // Create shop interface (hidden initially)
        const shop = document.createElement('div');
        shop.id = 'shop';
        shop.style.position = 'absolute';
        shop.style.top = '140px';
        shop.style.right = '10px';
        shop.style.display = 'none';

        // Add shop items
        for (const [itemType, item] of Object.entries(GameConfig.SHOP_ITEMS)) {
            const itemButton = document.createElement('button');
            itemButton.innerText = `${itemType} (${item.symbol}) - $${item.price}`;
            itemButton.style.display = 'block';
            itemButton.style.marginBottom = '5px';
            itemButton.onclick = () => this.selectShopItem(itemType);
            shop.appendChild(itemButton);
        }

        document.body.appendChild(shop);
    }

    updateMoneyDisplay() {
        const display = document.getElementById('money-display');
        if (display) {
            display.innerText = `Money: $${this.game.money}`;
        }
    }

    updateDayDisplay() {
        const display = document.getElementById('day-display');
        if (display) {
            display.innerText = `Day: ${this.game.day}`;
        }
    }

    updateMiningDisplay() {
        const display = document.getElementById('mining-display');
        if (display) {
            display.innerText = `Mined: ${this.game.minedTiles}/10`;
        }
    }

    showNextDayButton() {
        const button = document.getElementById('next-day-button');
        if (button) {
            button.style.display = 'block';
        }
    }

    hideNextDayButton() {
        const button = document.getElementById('next-day-button');
        if (button) {
            button.style.display = 'none';
        }
    }

    enableShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            shop.style.display = 'block';
        }
    }

    disableShop() {
        const shop = document.getElementById('shop');
        if (shop) {
            shop.style.display = 'none';
        }
        this.selectedShopItem = null;
    }

    selectShopItem(itemType) {
        this.selectedShopItem = itemType;
    }
}