class AutoTrain extends ModernUtil {
    POWER_LIST = ['call_of_the_ocean', 'fertility_improvement'];
    GROUND_ORDER = ['catapult', 'sword', 'archer', 'hoplite', 'slinger', 'rider', 'chariot', 'satyr', 'manticore', 'minotaur', 'zyklop', 'harpy', 'medusa', 'centaur', 'pegasus', 'cerberus', 'fury', 'griffin', 'calydonian_boar', 'spartoi', 'ladon'];
    NAVAL_ORDER = ['small_transporter', 'bireme', 'trireme', 'attack_ship', 'big_transporter', 'demolition_ship', 'colonize_ship', 'sea_monster', 'siren'];
    SHIFT_LEVELS = {
        catapult: [5, 5],
        sword: [200, 50],
        archer: [200, 50],
        hoplite: [200, 50],
        slinger: [200, 50],
        rider: [100, 25],
        chariot: [100, 25],
        small_transporter: [10, 5],
        bireme: [50, 10],
        trireme: [50, 10],
        attack_ship: [50, 10],
        big_transporter: [50, 10],
        demolition_ship: [50, 10],
        colonize_ship: [5, 1],
    };

    constructor(c, s) {
        super(c, s);

        this.spell = this.storage.load('at_spell', false);
        this.percentual = this.storage.load('at_per', 1);
        this.city_troops = this.storage.load('troops', {});
        this.shiftHeld = false;
        this.simulateCaptcha = false; // Switch to simulate captcha
        this.captchaActive = false;

        this.interval = setInterval(this.main.bind(this), this.getRandomDelay(1000, 10000));

        // Check for captcha every 300ms
        this.checkCaptchaInterval = setInterval(() => {
            if (this.simulateCaptcha || $('.botcheck').length || $('#recaptcha_window').length) {
                if (!this.captchaActive) {
                    this.console.log('Captcha active, autotrain stopped working');
                    clearInterval(this.interval); // Stop autotrain
                    this.captchaActive = true;
                }
            } else {
                if (this.captchaActive) {
                    this.console.log('Captcha resolved, autotrain resumed');
                    this.startInterval(); // Restart autotrain
                    this.captchaActive = false;
                }
            }
        }, 300);
    }

    getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    startInterval() {
        const randomDelay = this.getRandomDelay(1000, 10000);
        this.interval = setInterval(this.main.bind(this), randomDelay);
    }

    settings = () => {
        requestAnimationFrame(() => {
            this.setPolisInSettings(uw.ITowns.getCurrentTown().id);
            this.updatePolisInSettings(uw.ITowns.getCurrentTown().id);
            this.handlePercentual(this.percentual);
            this.handleSpell(this.spell);

            uw.$.Observer(uw.GameEvents.town.town_switch).subscribe(() => {
                this.setPolisInSettings(uw.ITowns.getCurrentTown().id);
                this.updatePolisInSettings(uw.ITowns.getCurrentTown().id);
            });

            uw.$('#troops_lvl_buttons').on('mousedown', e => {
                this.shiftHeld = e.shiftKey;
            });
        });

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
            <div class="game_header bold" style="position: relative; cursor: pointer"> 
            <span style="z-index: 10; position: relative;"> Settings </span>
            <span class="command_count"></span></div>

            <div class="split_content">
                <div style="padding: 5px;">
                ${this.getButtonHtml('train_passive', 'Passive', this.handleSpell, 0)}
                ${this.getButtonHtml('train_spell', 'Spell', this.handleSpell, 1)}
                </div>

                <div id="train_percentuals" style="padding: 5px;">
                ${this.getButtonHtml('train_percentuals_1', '80%', this.handlePercentual, 1)}
                ${this.getButtonHtml('train_percentuals_2', '90%', this.handlePercentual, 2)}
                ${this.getButtonHtml('train_percentuals_3', '100%', this.handlePercentual, 3)}
                </div>
            </div>
        </div>

        <div class="game_border">
            <div class="game_border_top"></div>
            <div class="game_border_bottom"></div>
            <div class="game_border_left"></div>
            <div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div>
            <div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div>
            <div class="game_border_corner corner4"></div>
            <div id="auto_train_title" class="game_header bold" style="position: relative; cursor: pointer" onclick="window.modernBot.autoTrain.trigger()"> 
            <span style="z-index: 10; position: relative;">Auto Train </span>
            <div style="position: absolute; right: 10px; top: 4px; font-size: 10px; z-index: 10"> (click to reset) </div>
            <span class="command_count"></span></div>
            <div id="troops_lvl_buttons"></div>    
        </div>
    `;
    };

    handleSpell = e => {
        e = !!e;
        if (this.spell != e) {
            this.spell = e;
            this.storage.save('at_spell', e);
        }
        if (e) {
            $('#train_passive').addClass('disabled');
            $('#train_spell').removeClass('disabled');
        } else {
            $('#train_passive').removeClass('disabled');
            $('#train_spell').addClass('disabled');
        }
    };

    handlePercentual = n => {
        let box = $('#train_percentuals');
        let buttons = box.find('.button_new');
        buttons.addClass('disabled');
        $(`#train_percentuals_${n}`).removeClass('disabled');
        if (this.percentual != n) {
            this.percentual = n;
            this.storage.save('at_per', n);
        }
    };

    getTotalPopulation = town_id => {
        const town = uw.ITowns.towns[town_id];
        const data = GameData.units;
        const { models: orders } = town.getUnitOrdersCollection();

        let used = 0;
        for (let order of orders) {
            used += data[order.attributes.unit_type].population * (order.attributes.units_left / order.attributes.count) * order.attributes.count;
        }
        let units = town.units();
        for (let unit of Object.keys(units)) {
            used += data[unit].population * units[unit];
        }
        let outher = town.unitsOuter();
        for (let out of Object.keys(outher)) {
            used += data[out].population * outher[out];
        }
        return town.getAvailablePopulation() + used;
    };

    setPolisInSettings = town_id => {
        let town = uw.ITowns.towns[town_id];
        let researches = town.researches().attributes;
        let buildings = town.buildings().attributes;

        const isGray = troop => {
            if (!this.REQUIREMENTS.hasOwnProperty(troop)) {
                return true; // Troop type not recognized
            }

            const { research, building, level } = this.REQUIREMENTS[troop];
            if (research && !researches[research]) return true;
            if (building && buildings[building] < level) return true;
            return false;
        };

        const getTroopHtml = (troop, bg) => {
            let gray = isGray(troop, researches, buildings);
            let color = 'red';

            if (gray) {
                return `
                <div class="auto_build_box">
                    <div class="item_icon auto_trade_troop" style="background-position: -${bg[0]}px -${bg[1]}px; filter: grayscale(1);"></div>
                </div>
                `;
            }
            return `
                <div class="auto_build_box">
                <div class="item_icon auto_trade_troop" onclick="window.modernBot.autoTrain.editTroopCount(${town_id}, '${troop}', 0)" style="background-position: -${bg[0]}px -${bg[1]}px; cursor: pointer">
                    <div class="auto_build_up_arrow" onclick="event.stopPropagation(); window.modernBot.autoTrain.editTroopCount(${town_id}, '${troop}', 1)" ></div>
                    <div class="auto_build_down_arrow" onclick="event.stopPropagation(); window.modernBot.autoTrain.editTroopCount(${town_id}, '${troop}', -1)"></div>
                    <p style="color: ${color}" id="troop_lvl_${troop}" class="auto_build_lvl"> 0 <p>
                </div>
            </div>`;
        };

        let html_troops = `
        <div id="troops_settings_${town_id}">
            <div style="width: 600px; margin-bottom: 3px; display: inline-flex">
            <a class="gp_town_link" href="${town.getLinkFragment()}">${town.getName()}</a>
            <p style="font-weight: bold; margin: 0px 5px"> [${town.getPoints()} pts] </p>
            <p style="font-weight: bold; margin: 0px 5px"> </p>
            <div class="population_icon_bot">
                <p id="troops_lvl_population"> ${this.getTotalPopulation(town_id)} <p>
            </div>
            </div>
            <div style="width: 100%; display: inline-flex; gap: 1px;">
            ${getTroopHtml('sword', [400, 0])}
            ${getTroopHtml('archer', [50, 100])}
            ${getTroopHtml('hoplite', [300, 50])}
            ${getTroopHtml('slinger', [250, 350])}
            ${getTroopHtml('rider', [50, 350])}
            ${getTroopHtml('chariot', [200, 100])}
            ${getTroopHtml('catapult', [150, 150])}

            ${getTroopHtml('big_transporter', [0, 150])}
            ${getTroopHtml('small_transporter', [300, 350])}
            ${getTroopHtml('bireme', [50, 150])}
            ${getTroopHtml('demolition_ship', [250, 0])}
            ${getTroopHtml('attack_ship', [150, 100])}
            ${getTroopHtml('trireme', [400, 250])}
            ${getTroopHtml('colonize_ship', [50, 200])}`;
        switch (uw.ITowns.getCurrentTown().god()) {
            case 'aphrodite':
                html_troops += `${getTroopHtml('satyr', [100, 350])}`;
                html_troops += `${getTroopHtml('siren', [200, 350])}`;
                break;
            case 'hades':
                html_troops += `${getTroopHtml('cerberus', [200, 50])}`;
                html_troops += `${getTroopHtml('fury', [0, 250])}`;
                break;
            case 'artemis':
                html_troops += `${getTroopHtml('griffin', [100, 250])}`;
                html_troops += `${getTroopHtml('calydonian_boar', [100, 150])}`;
                break;
            case 'hera':
                html_troops += `${getTroopHtml('harpy', [150, 250])}`;
                html_troops += `${getTroopHtml('medusa', [100, 300])}`;
                break;
            case 'ares':
                html_troops += `${getTroopHtml('spartoi', [350, 350])}`;
                html_troops += `${getTroopHtml('ladon', [300, 150])}`;
                break;
            case 'athena':
                html_troops += `${getTroopHtml('pegasus', [350, 150])}`;
                html_troops += `${getTroopHtml('centaur', [200, 0])}`;
                break;
            case 'zeus':
                html_troops += `${getTroopHtml('manticore', [0, 300])}`;
                html_troops += `${getTroopHtml('minotaur', [300, 300])}`;
                break;
            case 'poseidon':
                html_troops += `${getTroopHtml('zyklop', [300, 400])}`;
                html_troops += `${getTroopHtml('sea_monster', [150, 350])}`;
                break;
        }
        html_troops += `</div>
       </div>`;

        uw.$('#troops_lvl_buttons').html(html_troops);
    };

    editTroopCount = (town_id, troop, count) => {
        /* restart the interval to prevent spam*/
        clearInterval(this.interval);
        this.interval = setInterval(this.main, 2345);

        const { units } = GameData;
        const { city_troops } = this;

        // Add the town to the city_troops object if it doesn't already exist
        if (!city_troops.hasOwnProperty(town_id)) city_troops[town_id] = {};

        if (count) {
            // Modify count based on whether the shift key is held down
            const index = count > 0 ? 0 : 1;
            count = this.shiftHeld ? count * this.SHIFT_LEVELS[troop][index] : count;
        } else {
            count = 10000;
        }

        // Check if the troop count can be increased without exceeding population capacity
        const total_pop = this.getTotalPopulation(town_id);
        const used_pop = this.countPopulation(this.city_troops[town_id]);
        const unit_pop = units[troop].population;
        if (total_pop - used_pop < unit_pop * count) count = parseInt((total_pop - used_pop) / unit_pop);

        // Update the troop count for the specified town and troop type
        if (troop in city_troops[town_id]) city_troops[town_id][troop] += count;
        else city_troops[town_id][troop] = count;

        /* Clenaup */
        if (city_troops[town_id][troop] <= 0) delete city_troops[town_id][troop];
        if (uw.$.isEmptyObject(city_troops[town_id])) delete this.city_troops[town_id];

        this.updatePolisInSettings(town_id);
        this.storage.save('troops', this.city_troops);
    };

    updatePolisInSettings = town_id => {
        const { units } = GameData;
        const cityTroops = this.city_troops[town_id];

        Object.keys(units).forEach(troop => {
            const guiCount = cityTroops?.[troop] ?? 0;
            const selector = `#troops_settings_${town_id} #troop_lvl_${troop}`;

            if (guiCount > 0) uw.$(selector).css('color', 'orange').text(guiCount);
            else uw.$(selector).css('color', '').text('-');
        });

        const isTownActive = this.city_troops[town_id];
        uw.$('#auto_train_title').css('filter', isTownActive ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : '');
    };

    trigger = () => {
        const town = uw.ITowns.getCurrentTown();
        const town_id = town.getId();
        if (this.city_troops[town_id]) {
            delete this.city_troops[town_id];
            [...this.NAVAL_ORDER, ...this.GROUND_ORDER].forEach(troop => {
                const selector = `#troops_settings_${town_id} #troop_lvl_${troop}`;
                uw.$(selector).css('color', '').text('-');
            });
            uw.$('#auto_train_title').css('filter', '');
            this.storage.save('troops', this.city_troops);
        }
    };

    /* return the count of the order type (naval or ground) */
    getUnitOrdersCount = (type, town_id) => {
        const town = uw.ITowns.getTown(town_id);
        return town.getUnitOrdersCollection().where({ kind: type }).length;
    };

    getNextInList = (unitType, town_id) => {
        const troops = this.city_troops[town_id];
        if (!troops) return null;

        const unitOrder = unitType === 'naval' ? this.NAVAL_ORDER : this.GROUND_ORDER;
        for (const unit of unitOrder) {
            if (troops[unit] && this.getTroopCount(unit, town_id) !== 0) return unit;
        }

        return null;
    };

    getTroopCount = (troop, town_id) => {
        const town = uw.ITowns.getTown(town_id);
        if (!this.city_troops[town_id] || !this.city_troops[town_id][troop]) return 0;
        let count = this.city_troops[town_id][troop];
        for (let order of town.getUnitOrdersCollection().models) {
            if (order.attributes.unit_type === troop) count -= order.attributes.count;
        }
        let townUnits = town.units();
        if (townUnits.hasOwnProperty(troop)) count -= townUnits[troop];
        let outerUnits = town.unitsOuter();
        if (outerUnits.hasOwnProperty(troop)) count -= outerUnits[troop];
        //TODO: in viaggio
        if (count < 0) return 0;

        /* Get the duable ammount with the current resouces of the polis */
        let resources = town.resources();
        let discount = uw.GeneralModifications.getUnitBuildResourcesModification(town_id, uw.GameData.units[troop]);
        let hero = uw.MM.getCollections().PlayerHero[0].getHeroOfTown(parseInt(town_id))
        let favor_cost_modifier = 0;

        if (hero && hero.getId() === 'anysia') {
            favor_cost_modifier += 10 + hero.getLevel() * 1;
        }

        let { wood, stone, iron } = uw.GameData.units[troop].resources;
        let favor = Math.ceil((uw.GameData.units[troop].favor * (1 - (favor_cost_modifier / 100))));
        let w = resources.wood / Math.round(wood * discount);
        let s = resources.stone / Math.round(stone * discount);
        let i = resources.iron / Math.round(iron * discount);
        let f = resources.favor / favor;
        let current = 0;
        if (uw.GameData.units[troop].favor > 0) {
            current = parseInt(Math.min(w, s, i, f));
        } else {
            current = parseInt(Math.min(w, s, i));
        }

        /* Check for free population */
        let duable_with_pop = parseInt(resources.population / uw.GameData.units[troop].population); // for each troop

        /* Get the max duable */
        let w_max = resources.storage / (wood * discount);
        let s_max = resources.storage / (stone * discount);
        let i_max = resources.storage / (iron * discount);
        let favor_max = town.getMaxFavor() / favor;
        let percent_settings = this.getPercentSettings();
        let max = 0;
        if (uw.GameData.units[troop].favor > 0) {
            max = parseInt(Math.min(w_max, s_max, i_max, favor_max) * percent_settings);
        } else {
            max = parseInt(Math.min(w_max, s_max, i_max) * percent_settings);
        }
        max = max > duable_with_pop ? duable_with_pop : max;

        if (max > count) {
            return count > current ? -1 : count;
        } else {
            if (current >= max && current < duable_with_pop) return current;
            if (current >= max && current > duable_with_pop) return duable_with_pop;
            return -1;
        }
    };

    getPercentSettings() {
        let percent_settings = 0.8;
        if (this.percentual === 1) percent_settings = 0.8;
        if (this.percentual === 2) percent_settings = 0.9;
        if (this.percentual === 3) percent_settings = 1;
        return percent_settings;
    }

    /* Check the given town, for ground or land */
    checkPolis = (type, town_id) => {
        let order_count = this.getUnitOrdersCount(type, town_id);
        if (order_count > 6) return 0;
        let count = 1;
        while (count >= 0) {
            let next = this.getNextInList(type, town_id);
            if (!next) return 0;
            count = this.getTroopCount(next, town_id);
            if (count < 0) return 0;
            if (count === 0) continue;
            if (this.spell) {
                this.castSpell(type, town_id)
            }
            this.buildPost(town_id, next, count);
            return true;
        }
    };

    castSpell = (type, town_id) => {

        if (uw.ITowns.player_gods.attributes.hera_favor < 80) return;
        if (uw.ITowns.player_gods.attributes.poseidon_favor < 60) return;

        const { fragments } = uw.MM.getFirstTownAgnosticCollectionByName('CastedPowers');
        const { models } = fragments[town_id];
        const activePowerIds = new Set(models.map(obj => obj.attributes.power_id));

        this.POWER_LIST.forEach(power => {
            if (type === 'naval' && power === 'call_of_the_ocean' && !activePowerIds.has(power)) {
                this.console.log(`Lançando poder obrigatório para NAVAL: ${power}`);
                let data = {
                    model_url: 'CastedPowers',
                    action_name: 'cast',
                    town_id: parseInt(town_id),
                    arguments: {
                        target_id: parseInt(town_id),
                        power_id: 'call_of_the_ocean',
                    },
                };
                uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
            }

            if (type === 'ground' && power === 'fertility_improvement' && !activePowerIds.has(power)) {
                this.console.log(`Lançando poder obrigatório para GROUND: ${power}`);
                let data = {
                    model_url: 'CastedPowers',
                    action_name: 'cast',
                    town_id: parseInt(town_id),
                    arguments: {
                        target_id: parseInt(town_id),
                        power_id: 'fertility_improvement',
                    },
                };
                uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
            }
        });
    }

    /* Return list of town that have power active */
    getPowerActive = () => {
        const { fragments } = MM.getFirstTownAgnosticCollectionByName('CastedPowers');
        let towns_list = [];
        for (let town_id in this.city_troops) {
            const { models } = fragments[town_id];
            for (let power of models) {
                let { attributes } = power;
                if (this.POWER_LIST.includes(attributes.power_id)) {
                    towns_list.push(town_id);
                    break;
                }
            }
        }
        return towns_list;
    };

    /* Make build request to the server */
    buildPost = (town_id, unit, count) => {
        let data = {
            unit_id: unit,
            amount: count,
            town_id: town_id,
        };

        // Add console log
        this.console.log(`${uw.ITowns.towns[town_id].getName()}: training ${count} ${unit}`);

        uw.gpAjax.ajaxPost('building_barracks', 'build', data);
    };

    /* return the active towns */
    getActiveList = () => {
        return Object.keys(this.city_troops);
    };

    /* Main function, call in the loop */
    main = () => {
        let town_list = this.getActiveList();

        for (let town_id of town_list) {
            if (town_id in uw.ITowns.towns) {
                if (this.checkPolis('naval', town_id)) return;
                if (this.checkPolis('ground', town_id)) return;
            } else {
                delete this.city_troops[town_id];
            }
        }
    };
}
