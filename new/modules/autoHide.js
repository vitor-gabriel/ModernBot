class AutoHide extends ModernUtil {
    constructor(c, s) {
        super(c, s);

        this.activePolis = this.storage.load('autohide_active', false);

        setInterval(this.main, 5000)

        const addButton = () => {
            let box = $('.order_count');
            if (box.length) {
                let butt = $('<div/>', {
                    class: 'button_new',
                    id: 'autoCaveButton',
                    style: 'float: right; margin: 0px; left: 169px; position: absolute; top: 56px; width: 66px',
                    html: '<div onclick="window.modernBot.autoHide.toggle()"><div class="left"></div><div class="right"></div><div class="caption js-caption"> Auto <div class="effect js-effect"></div></div><div>'
                });
                box.prepend(butt);
                this.updateSettings(uw.ITowns.getCurrentTown().id);
            } else {
                setTimeout(addButton, 100);
            }
        };

        uw.$.Observer(uw.GameEvents.window.open).subscribe((e, i) => {
            if (!i.attributes) return
            if (i.attributes.window_type != "hide") return
            setTimeout(addButton, 100);
        })

        uw.$.Observer(uw.GameEvents.town.town_switch).subscribe(() => {
            this.updateSettings(uw.ITowns.getCurrentTown().id);
            let cave = document.getElementsByClassName(
                'js-window-main-container classic_window hide',
            )[0];
            if (!cave) return;
            setTimeout(addButton, 1);
        });
    }

    settings = () => {
        requestAnimationFrame(() => {
            this.updateSettings(uw.ITowns.getCurrentTown().id);
        })

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
            <div id="auto_cave_title" style="cursor: pointer; filter: ${this.autogratis ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''
            }" class="game_header bold" onclick="window.modernBot.autoHide.toggle()"> Auto Hide <span class="command_count"></span>
                <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> (click to toggle) </div>
            </div>
            <div style="padding: 5px; font-weight: 600">
                Check every 5 seconds, if there 80% of the resources are available, store the remaining resources.
            </div>    
        </div>
        `;
    };

    toggle = () => {
        this.activePolis = !this.activePolis
        this.storage.save("autohide_active", this.activePolis)
        this.updateSettings()
    }

    updateSettings = () => {
        if (this.activePolis) {
            $('#auto_cave_title').css({
                'filter': 'brightness(100%) saturate(186%) hue-rotate(241deg)'
            });
            $('#autoCaveButton').css({
                'filter': ' brightness(100%) sepia(100%) hue-rotate(90deg) saturate(1500%) contrast(0.8)'
            });
        } else {
            $('#auto_cave_title, #autoCaveButton').css({
                'filter': ''
            });
        }
    }

    main = async () => {
        if (!this.activePolis) return;
        const town_list = Object.keys(uw.ITowns.towns)

        for (let town_id of town_list) {
            let town = uw.ITowns.towns[town_id]
            let { iron, storage } = town.resources();
            let hide = town.buildings().attributes.hide

            if (hide == 10 && ((iron / storage) > 0.8)) {
                let deposit = iron - (storage * 0.8)
                if (deposit > 1000) {
                    this.storeIron(town_id, deposit)
                    await this.sleep(500);
                }
            }
        }
    }

    storeIron = (town_id, count) => {
        const data = {
            "model_url": "BuildingHide",
            "action_name": "storeIron",
            "arguments": {
                "iron_to_store": count
            },
            "town_id": town_id,
        }

        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
    }

}