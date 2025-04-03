/* Setup autofarm in the window object */

class ModernBot {
    constructor() {
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

        //const $farm = this.createActivity("url(https://gpit.innogamescdn.com/images/game/premium_features/feature_icons_2.08.png) no-repeat 0 -240px");
        // this.$menu.append($farm, $divider.clone());

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
            size: [950, 300],
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
                } /*
				{
					title: 'Trade',
					id: 'trade',
					render: this.settingsTrade,
				},*/,
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
        uw.$('.gods_area_buttons').append("<div class='circle_button modern_bot_settings' onclick='window.modernBot.settingsFactory.openWindow()'><div style='width: 27px; height: 27px; background: url(https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/gear.png) no-repeat 6px 5px' class='icon js-caption'></div></div>");

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
                const both = `<div style='position: absolute; background-image: url(https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/hammer_wrench.png); background-size: 19px 19px; margin: 1px; background-repeat: no-repeat; position: absolute; height: 20px; width: 25px; right: 18px;'></div>`;
                const build = `<div style='background-image: url(https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/hammer_only.png); background-size: 19px 19px; margin: 1px; background-repeat: no-repeat; position: absolute; height: 20px; width: 25px; right: 18px;'></div>`;
                const troop = `<div style='background-image: url(https://raw.githubusercontent.com/Sau1707/ModernBot/main/img/wrench.png); background-size: 19px 19px; margin: 1px; background-repeat: no-repeat; position: absolute; height: 20px; width: 25px; right: 18px;'></div>`;
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

// Load the bot when the loader is ready
const loader = setInterval(() => {
    if ($("#loader").length > 0) return;
    uw.modernBot = new ModernBot();
    clearInterval(loader);
}, 3000);