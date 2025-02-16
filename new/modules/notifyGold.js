class NotifyGold extends ModernUtil {
    constructor(c, s) {
        super(c, s);

        this.token_telegram = this.storage.load("telegram_api_key");
        this.url = `https://api.telegram.org/bot${this.token_telegram}/getUpdates`;
        this.urlMessage = `https://api.telegram.org/bot${this.token_telegram}/sendMessage`;
        this.town_id = uw.ITowns.getCurrentTown().id;
        this.town_name = uw.ITowns.getCurrentTown().name;
        this.activePolis = this.storage.load('gold_notifier', false);
        this.countdown = 120; // Tempo inicial em segundos (2 minutos)

        if (this.activePolis) {
            this.startNotificationInterval();
        }
    }

    fetchData() {
        const data = {
            model_url: `PremiumExchange`,
            action_name: 'read',
            town_id: this.town_id,
            nl_init: true
        };

        uw.gpAjax.ajaxGet('frontend_bridge', 'execute', data)
            .done(response => this.handleResponse(response))
            .fail(e => this.console.log('Erro ao buscar dados:', e));
    }

    handleResponse(response) {
        try {
            const parsedData = JSON.parse(response);
            const message = this.calculatedMarket(this.town_name, parsedData.json);
            this.checkTelegramAvailability(message);
        } catch (e) {
            this.console.log("Erro ao parsear JSON:", e);
        }
    }

    checkTelegramAvailability(message) {
        if (message === null || message === '') {
            this.console.log("Nada para enviar ao Telegram.");
            return;
        }
        $.ajax({
            url: this.url,
            type: "GET",
            success: response => this.handleTelegramResponse(response, message),
            error: () => uw.HumanMessage.error("Erro ao verificar Telegram.")
        });

    }

    handleTelegramResponse(response, message) {
        if (response.result.length === 0) {
            this.console.log("Bot Telegram indisponível.");
            return;
        }

        this.setChatIdIfNeeded(response);
        this.sendMessageToTelegram(message);
    }

    setChatIdIfNeeded(response) {
        if (this.storage.load("telegram_chat_id") === null || this.storage.load("telegram_chat_id") === 0) {
            const chatId = response.result[0].message.chat.id.toString();
            this.storage.save("telegram_chat_id", chatId);
        }
    }

    sendMessageToTelegram(message) {
        const urlMessageWithParams = `${this.urlMessage}?chat_id=${this.storage.load("telegram_chat_id")}&text=${encodeURIComponent(message)}`;

        $.ajax({
            url: urlMessageWithParams,
            type: "POST",
            success: () => uw.HumanMessage.success("Mensagem enviada com sucesso ao Telegram."),
            error: () => uw.HumanMessage.error("Erro ao enviar mensagem ao Telegram.")
        });
    }

    calculatedMarket(nameTown, items) {
        const woodTotal = items.wood.capacity;
        const stoneTotal = items.stone.capacity;
        const ironTotal = items.iron.capacity;
        const wood = items.wood.stock;
        const stone = items.stone.stock;
        const iron = items.iron.stock;

        const woodPercent = (wood / woodTotal) * 100;
        const stonePercent = (stone / stoneTotal) * 100;
        const ironPercent = (iron / ironTotal) * 100;

        const woodToSell = (woodTotal - wood).toFixed(0);
        const stoneToSell = (stoneTotal - stone).toFixed(0);
        const ironToSell = (ironTotal - iron).toFixed(0);

        let message = '';

        if (woodPercent < 99 || stonePercent < 99 || ironPercent < 99) {
            message += `Alerta de Venda no Mercado! \nRecursos disponíveis para venda no Oceano ${items.sea_id}, ${nameTown}: \n`;
        }

        if (woodPercent < 99) message += `🌲 Madeira: ${woodToSell} unidades \n`;
        if (stonePercent < 99) message += `🪨 Pedra: ${stoneToSell} unidades \n`;
        if (ironPercent < 99) message += `💰 Prata: ${ironToSell} unidades \n`;

        return message;
    }

    settings() {
        requestAnimationFrame(() => this.updateSettings(uw.ITowns.getCurrentTown().id));

        return `
            <div class="game_border" style="margin-bottom: 20px">
                <div class="game_border_top"></div>
                <div class="game_border_bottom"></div>
                <div class="game_border_left"></div>
                <div class="game_border_right"></div>
                <div class="game_border_corner corner1"></div>
                <div class="game_border_corner corner2"></div>
                <div class="game_border_corner corner3"></div>
                <div class="game_border_corner corner4"></div>
                <div id="auto_gold_notify" style="cursor: pointer; filter: ${this.activePolis ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''}" class="game_header bold" onclick="window.modernBot.notifyGold.toggle()"> Gold Notifier <span class="command_count"></span>
                    <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> (click to toggle) </div>
                </div>
                <div style="padding: 5px; font-weight: 800">
                    Enter the API key of your bot telegram:
                    <input type="text" id="telegram_api_key" value="${this.storage.load("telegram_api_key")}" style="width: 99%">
                </div> 
                ${this.getButtonHtml('auto_gold_savekey', 'Save Key', this.trigger, 'save')}
                ${this.getButtonHtml('auto_gold_reset', 'Reset Key', this.trigger, 'reset')}
                <div id="countdown_timer" style="position: absolute; right: 10px; font-size:14px;"></div>
            </div>
        `;
    }

    toggle() {
        this.activePolis = !this.activePolis;
        this.storage.save("gold_notifier", this.activePolis);
        this.updateSettings();

        if (this.activePolis) {
            this.startNotificationInterval();
        } else {
            this.stopInterval();
        }
    }

    startNotificationInterval() {
        this.updateCountdownDisplay();

        this.notificationInterval = setInterval(() => {
            if (this.countdown <= 0) {
                this.fetchData();  // Chama a API e envia notificação
                this.countdown = 120;  // Reinicia o contador para 2 minutos
            } else {
                this.countdown--; // Decrementa o contador
                this.updateCountdownDisplay();
            }
        }, 1000); // Atualiza a cada segundo
    }

    stopInterval() {
        if (this.notificationInterval) {
            clearInterval(this.notificationInterval);
            this.notificationInterval = null;
            this.countdown = 120; // Reseta o contador quando desativado
            this.updateCountdownDisplay();
        }
    }

    updateCountdownDisplay() {
        const minutes = Math.floor(this.countdown / 60);
        const seconds = this.countdown % 60;
        $('#countdown_timer').text(`Próximo envio em: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    updateSettings() {
        $('#auto_gold_notify').css({
            'filter': this.activePolis ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''
        });
    }

    trigger(option) {
        if (option === 'reset') {
            this.storage.save('telegram_api_key', '');
            this.storage.save('telegram_chat_id', 0);
            $('#telegram_api_key').val('');
        } else if (option === 'save') {
            this.storage.save('telegram_api_key', $('#telegram_api_key').val());
        }
    }
}