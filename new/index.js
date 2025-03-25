/*



*/


class ModernBot {
    STOP_TIME = 1000 * 5;
    ACTION_DELAY = 1000 * 0;

    constructor() {
        this.lastInteraction = Date.now();
        this.lastAction = Date.now();
        this.loopActive = false;

        this.console = new BotConsole();
        this.storage = new ModernStorage();

        this.$ui = $("#ui_box");
        // Create the quick menu and the divider element
        this.$menu = this.createModernMenu();
        const $divider = $('<div class="divider"></div>');

        // Add AutoFarm to the new menu
        this.autoFarm = new AutoFarm(this.console, this.storage);
        this.$menu.append(this.autoFarm.$activity)
        this.$ui.append(this.autoFarm.$popup)

        this.autoGratis = new AutoGratis(this.console, this.storage);
        this.autoRuralLevel = new AutoRuralLevel(this.console, this.storage);
        this.autoBuild = new AutoBuild(this.console, this.storage);
        this.autoRuralTrade = new AutoRuralTrade(this.console, this.storage);
        this.autoBootcamp = new AutoBootcamp(this.console, this.storage);
        this.autoParty = new AutoParty(this.console, this.storage);
        this.autoTrain = new AutoTrain(this.console, this.storage);
        this.autoHide = new AutoHide(this.console, this.storage);
        this.antiRage = new AntiRage(this.console, this.storage);
        this.autoTrade = new AutoTrade(this.console, this.storage);

        this.settingsFactory = new createGrepoWindow({
            id: 'MODERN_BOT',
            title: 'ModernBot',
            size: [845, 300],
            tabs: [
                {
                    title: 'Farm',
                    id: 'farm',
                    render: this.settingsFarm,
                },
                {
                    title: 'Build',
                    id: 'build',
                    render: this.settingsBuild,
                },
                {
                    title: 'Train',
                    id: 'train',
                    render: this.settingsTrain,
                },
                {
                    title: 'Mix',
                    id: 'mix',
                    render: this.settingsMix,
                },
                {
                    title: 'Console',
                    id: 'console',
                    render: this.console.renderSettings,
                },
            ],
            start_tab: 0,
        });

        this.setup();
    }


    enableListeners() {
        $(document).on('mousemove', () => {
            this.lastInteraction = Date.now();
            $("#modern_settings").removeClass("rotate-forever")
        });

        $(document).on('keydown', (e) => {
            this.lastInteraction = Date.now();
            $("#modern_settings").removeClass("rotate-forever")
        });
    }

    async loop() {
        // Check if the captcha is active or the user has interacted with the page
        if (Date.now() - this.lastInteraction < this.STOP_TIME) return;
        if ($('.botcheck').length || $('#recaptcha_window').length) {
            if (!this.resolveCaptcha()) return;
        }
        if (Date.now() - this.lastAction < this.ACTION_DELAY) return;
        // recaptcha_window / g-recaptcha / recaptcha_container / captcha_curtain

        if (this.loopActive) return;
        this.loopActive = true;

        // The bot is active, ensure the settings icon is rotating
        $("#modern_settings").addClass("rotate-forever")

        // After each action, wait for the delay to pass
        const randomDelay = Math.floor(Math.random() * 500) + 250; // Between 250ms and 750ms
        await new Promise(resolve => setTimeout(resolve, randomDelay));

        // Check if the farm is available
        // Farm can be done in every island / Current town
        const hasFarm = await this.autoFarm.execute();
        if (hasFarm) {
            console.log("Farm was executed");
            this.lastAction = Date.now();
            this.loopActive = false;
            return;
        };

        // TODO: Check for building upgrades
        // TODO: Check for research upgrades
        // TODO: Check for rural trades / upgrades
        // TODO: Check if the town has the bootcamp?
        // TODO: Check if the gratis can be claimed
        // TODO: Cave?
        // TODO: Train & Heros?
        this.loopActive = false;
    }

    resolveCaptcha() {
        const captchaResponse = $('#g-recaptcha-response').val();
        if (captchaResponse !== '') {
            $('#recaptcha_window > div.btn_confirm.button_new').trigger('click');
            return true;
        }
        return false;
    }

    settingsFarm = () => {
        let html = '';
        // html += this.autoFarm.settings();
        html += this.autoRuralLevel.settings();
        html += this.autoRuralTrade.settings();
        return html;
    };

    settingsBuild = () => {
        let html = '';
        html += this.autoGratis.settings();
        html += this.autoBuild.settings();
        return html;
    };

    settingsMix = () => {
        let html = '';
        html += this.autoBootcamp.settings();
        html += this.autoParty.settings();
        html += this.autoHide.settings();
        return html;
    };

    settingsTrain = () => {
        let html = '';
        html += this.autoTrain.settings();
        return html;
    };

    settingsTrade = () => {
        let html = ``;
        html += this.autoTrade.settings();
        return html;
    };

    setup = () => {
        /* Activate */
        this.settingsFactory.activate();
        console.log('ModernBot is ready!', this.settingsFactory);
        uw.$('.gods_area_buttons').append("<div class='circle_button modern_bot_settings' onclick='window.modernBot.settingsFactory.openWindow()'><div style='width: 27px; height: 27px; background: url(https://raw.githubusercontent.com/vitor-gabriel/ModernBot/main/img/gear.png) no-repeat 6px 5px' class='icon js-caption'></div></div>");

        /* Add event to polis list menu */
        const editController = () => {
            const townController = uw.layout_main_controller.sub_controllers.find(controller => controller.name === 'town_name_area');
            if (!townController) {
                setTimeout(editController, 2500);
                return;
            }

            const oldRender = townController.controller.town_groups_list_view.render;
            townController.controller.town_groups_list_view.render = function () {
                oldRender.call(this);
                const both = `<div style='position: absolute; background-image: url(https://raw.githubusercontent.com/vitor-gabriel/ModernBot/main/img/hammer_wrench.png); background-size: 19px 19px; margin: 1px; background-repeat: no-repeat; position: absolute; height: 20px; width: 25px; right: 18px;'></div>`;
                const build = `<div style='background-image: url(https://raw.githubusercontent.com/vitor-gabriel/ModernBot/main/img/hammer_only.png); background-size: 19px 19px; margin: 1px; background-repeat: no-repeat; position: absolute; height: 20px; width: 25px; right: 18px;'></div>`;
                const troop = `<div style='background-image: url(https://raw.githubusercontent.com/vitor-gabriel/ModernBot/main/img/wrench.png); background-size: 19px 19px; margin: 1px; background-repeat: no-repeat; position: absolute; height: 20px; width: 25px; right: 18px;'></div>`;
                const townIds = Object.keys(uw.modernBot.autoBuild.towns_buildings);
                const troopsIds = uw.modernBot.autoTrain.getActiveList().map(entry => entry.toString());
                uw.$('.town_group_town').each(function () {
                    const townId = parseInt(uw.$(this).attr('data-townid'));
                    const is_build = townIds.includes(townId.toString());
                    const id_troop = troopsIds.includes(townId.toString());
                    if (!id_troop && !is_build) return;
                    if (id_troop && !is_build) uw.$(this).prepend(troop);
                    else if (is_build && !id_troop) uw.$(this).prepend(build);
                    else uw.$(this).prepend(both);
                });
            };
        };

        setTimeout(editController, 2500);
    };

    /* New quick menu */
    // Create the html of an activity in the new quick menu
    createModernMenu = () => {
        const $menu = $('<div id="modern_menu" class="toolbar_activities"></div>');
        $menu.css({
            'position': 'absolute',
            'top': '3px',
            'left': '400px',
            'z-index': '1000',
        });

        // Add left, middle, right
        const $left = $('<div class="left"></div>');
        const $middle = $('<div class="middle"></div>');
        const $right = $('<div class="right"></div>');

        $menu.append($left, $middle, $right);
        $("#ui_box").prepend($menu);

        return $middle
    }

}

const loader = setInterval(() => {
    if ($("#loader").length > 0) return;
    clearInterval(loader);

    uw.modernBot = new ModernBot();
    uw.modernBot.enableListeners();

    setInterval(() => {
        uw.modernBot.loop();
    }, 250);

}, Math.round((Math.random() * (8 - 3) + 3)) * 1000);
