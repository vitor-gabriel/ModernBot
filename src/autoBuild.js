/* 
    Ideas:
    - show current status
        - done
        - missing resouces (why type)
        - missing population
        - queee full
    - pause a specific polis
    - show end point
    - special buildings 
*/

// var r = Math.round(e.building.points * Math.pow(e.building.points_factor, e.next_level)) - Math.round(e.building.points * Math.pow(e.building.points_factor, e.level))

class AutoBuild extends ModernUtil {
	constructor() {
		super();

		/* Load settings, the polis in the settins are the active */
		this.towns_buildings = this.load('auto_build_levels', {});

		/* Check if shift is pressed */
		this.shiftHeld = false;

		//if (this.load('enable_autobuild')) this.triggerAutoBuild();
		if (this.load('enable_autogratis', false)) this.triggerAutoGratis();

		/* Active always, check if the towns are in the active list */
		this.enable = setInterval(this.main, 20000);

		/* Attach event to towns list */
		setTimeout(() => {
			var i = 0;
			while (layout_main_controller.sub_controllers[i].name != 'town_name_area') {
				i++;
			}

			layout_main_controller.sub_controllers[
				i
			].controller.town_groups_list_view.render_old_modern =
				layout_main_controller.sub_controllers[i].controller.town_groups_list_view.render;

			layout_main_controller.sub_controllers[i].controller.town_groups_list_view.render =
				function () {
					layout_main_controller.sub_controllers[
						i
					].controller.town_groups_list_view.render_old_modern();
					var town_ids = Object.keys(autoBuild.towns_buildings);
					$('.town_group_town').each(function () {
						var townId = parseInt($(this).attr('data-townid'));
						if (!town_ids.includes(townId.toString())) return;
						$(this).append(
							"<div style='background-image: url(https://i.ibb.co/G5DfgbZ/gear.png); scale: 0.9; background-repeat: no-repeat; position: relative; height: 20px; width: 25px; float: left;'></div>",
						);
					});
				};
		}, 2500);
	}

	renderSettings = () => {
		/* Apply event to shift */
		requestAnimationFrame(() => {
			$('#buildings_lvl_buttons').on('mousedown', (e) => {
				this.shiftHeld = e.shiftKey;
			});

			this.setPolisInSettings(ITowns.getCurrentTown().id);
			this.updateTitle();

			$.Observer(GameEvents.town.town_switch).subscribe(() => {
				this.setPolisInSettings(ITowns.getCurrentTown().id);
				this.updateTitle();
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
            <div id="auto_gratis_title" style="cursor: pointer; filter: ${
				this.autogratis ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''
			}" class="game_header bold" onclick="window.autoBuild.triggerAutoGratis()"> Auto Build <span class="command_count"></span>
                <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> (click to toggle) </div>
            </div>
            <div style="padding: 5px; font-weight: 600">
                Trigger to automatically press the <div id="dummy_free" class="btn_time_reduction button_new js-item-btn-premium-action js-tutorial-queue-item-btn-premium-action type_building_queue type_instant_buy instant_buy type_free">
                <div class="left"></div>
                <div class="right"></div>
                <div class="caption js-caption">Gratis<div class="effect js-effect"></div></div>
        </div> button (try every 4 seconds)
            </div>    
        </div>

        <div class="game_border" style="margin-bottom: 20px">
            <div class="game_border_top"></div>
            <div class="game_border_bottom"></div>
            <div class="game_border_left"></div>
            <div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div>
            <div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div>
            <div class="game_border_corner corner4"></div>
            <div id="auto_build_title" style="cursor: pointer; filter: ${
				this.enable ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''
			}" class="game_header bold" onclick="window.autoBuild.triggerAutoBuild()"> Auto Build <span class="command_count"></span>
                <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> (click to toggle) </div>
            </div>
            <div id="buildings_lvl_buttons"></div>    
        </div> `;
	};

	/* Given the town id, set the polis in the settings menu */
	setPolisInSettings = (town_id) => {
		let town = ITowns.towns[town_id];

		/* If the town is in the active list set*/
		let town_buildings =
			this.towns_buildings?.[town_id] ?? { ...town.buildings()?.attributes } ?? {};
		let buildings = { ...town.buildings().attributes };

		const getBuildingHtml = (building, bg) => {
			let color = 'lime';
			if (buildings[building] > town_buildings[building]) color = 'red';
			else if (buildings[building] < town_buildings[building]) color = 'orange';

			return `
                <div class="auto_build_box">
                <div class="item_icon auto_build_building" style="background-position: -${bg[0]}px -${bg[1]}px;">
                    <div class="auto_build_up_arrow" onclick="window.autoBuild.editBuildingLevel(${town_id}, '${building}', 1)" ></div>
                    <div class="auto_build_down_arrow" onclick="window.autoBuild.editBuildingLevel(${town_id}, '${building}', -1)"></div>
                    <p style="color: ${color}" id="build_lvl_${building}" class="auto_build_lvl"> ${town_buildings[building]} <p>
                </div>
            </div>`;
		};

		/* If the town is in a group, the the groups */
		const groups =
			`(${Object.values(ITowns.getTownGroups())
				.filter((group) => group.id > 0 && group.id !== -1 && group.towns[town_id])
				.map((group) => group.name)
				.join(', ')})` || '';

		$('#buildings_lvl_buttons').html(`
        <div id="build_settings_${town_id}">
            <div style="width: 600px; margin-bottom: 3px; display: inline-flex">
            <a class="gp_town_link" href="${town.getLinkFragment()}">${town.getName()}</a> 
            <p style="font-weight: bold; margin: 0px 5px"> [${town.getPoints()} pts] </p>
            <p style="font-weight: bold; margin: 0px 5px"> ${groups} </p>
            </div>
            <div style="width: 766px; display: inline-flex; gap: 1px;">
                ${getBuildingHtml('main', [450, 0])}
                ${getBuildingHtml('storage', [250, 50])}
                ${getBuildingHtml('farm', [150, 0])}
                ${getBuildingHtml('academy', [0, 0])}
                ${getBuildingHtml('temple', [300, 50])}
                ${getBuildingHtml('barracks', [50, 0])}
                ${getBuildingHtml('docks', [100, 0])}
                ${getBuildingHtml('market', [0, 50])}
                ${getBuildingHtml('hide', [200, 0])}
                ${getBuildingHtml('lumber', [400, 0])}
                ${getBuildingHtml('stoner', [200, 50])}
                ${getBuildingHtml('ironer', [250, 0])}
                ${getBuildingHtml('wall', [50, 100])}
            </div>
        </div>`);
	};

	/* Call to trigger the autogratis */
	triggerAutoGratis = () => {
		if (!this.autogratis) {
			$('#auto_gratis_title').css(
				'filter',
				'brightness(100%) saturate(186%) hue-rotate(241deg)',
			);
			this.autogratis = setInterval(this.autogratisMain, 4000);
			botConsole.log('Auto Gratis -> On');
		} else {
			$('#auto_gratis_title').css('filter', '');
			clearInterval(this.autogratis);
			this.autogratis = null;
			botConsole.log('Auto Gratis -> Off');
		}
		this.save('enable_autogratis', !!this.autogratis);
	};

	/* Main loop for the autogratis bot */
	autogratisMain = () => {
		let el = $('.type_building_queue.type_free').not('#dummy_free');
		if (!el.length) return;
		el.click();
		botConsole.log('Clicked gratis button');
	};

	/* call with town_id, building type and level to be added */
	editBuildingLevel = (town_id, name, d) => {
		/* if shift is pressed, add or remove 10 */
		const current_lvl = parseInt($(`#build_lvl_${name}`).text());
		d = this.shiftHeld ? d * 10 : d;

		const { max_level, min_level } = GameData.buildings[name];

		const town = ITowns.towns[town_id];

		const town_buildings =
			this.towns_buildings?.[town_id] ?? { ...town.buildings()?.attributes } ?? {};
		const townBuildings = town.buildings().attributes;

		/* Check if bottom or top overflow */
		town_buildings[name] = Math.min(Math.max(current_lvl + d, min_level), max_level);

		const color =
			town_buildings[name] > townBuildings[name]
				? 'orange'
				: town_buildings[name] < townBuildings[name]
				? 'red'
				: 'lime';

		$(`#build_settings_${town_id} #build_lvl_${name}`)
			.css('color', color)
			.text(town_buildings[name]);

		if (town_id.toString() in this.towns_buildings) {
			this.towns_buildings[town_id] = town_buildings;
			this.save('auto_build_levels', this.towns_buildings);
		}
	};

	isActive = (town_id) => {
		let town = ITowns.towns[town_id];
		return !this.towns_buildings?.[town.id];
	};

	updateTitle = () => {
		let town = ITowns.getCurrentTown();
		if (town.id.toString() in this.towns_buildings) {
			$('#auto_build_title').css(
				'filter',
				'brightness(100%) saturate(186%) hue-rotate(241deg)',
			);
		} else {
			$('#auto_build_title').css('filter', '');
		}
	};

	/* Call to toggle on and off (trigger the current town */
	triggerAutoBuild = () => {
		let town = ITowns.getCurrentTown();

		if (!(town.id.toString() in this.towns_buildings)) {
			botConsole.log(`${town.name}: Auto Build On`);
			this.towns_buildings[town.id] = {};
			let buildins = [
				'main',
				'storage',
				'farm',
				'academy',
				'temple',
				'barracks',
				'docks',
				'market',
				'hide',
				'lumber',
				'stoner',
				'ironer',
				'wall',
			];
			buildins.forEach((e) => {
				let lvl = parseInt($(`#build_lvl_${e}`).text());
				this.towns_buildings[town.id][e] = lvl;
			});
			this.save('auto_build_levels', this.towns_buildings);
		} else {
			delete this.towns_buildings[town.id];
			botConsole.log(`${town.name}: Auto Build Off`);
		}

		this.updateTitle();
	};

	/* Usage async this.sleep(ms) -> stop the code for ms */
	sleep = (ms) => {
		return new Promise((resolve) => setTimeout(resolve, ms));
	};

	/* Main loop for building */
	main = async () => {
		for (let town_id of Object.keys(this.towns_buildings)) {
			if (this.isFullQueue(town_id)) continue;
			/* If town is done, remove from the list */
			if (this.isDone(town_id)) {
				delete this.towns_buildings[town_id];
				this.save('auto_build_levels', this.towns_buildings);
				this.updateTitle();
				const town = ITowns.towns[town_id];
				botConsole.log(`${town.name}: Auto Build Done`);
				continue;
			}
			await this.getNextBuild(town_id);
		}
	};

	/* Make post request to the server to buildup the building */
	postBuild = async (type, town_id) => {
		let town = ITowns.towns[town_id];
		let { wood, stone, iron } = town.resources();
		let { resources_for, population_for } =
			MM.getModels().BuildingBuildData[town_id].attributes.building_data[type];

		if (town.getAvailablePopulation() < population_for) return;
		if (wood < resources_for.wood || stone < resources_for.stone || iron < resources_for.iron)
			return;
		let data = {
			model_url: 'BuildingOrder',
			action_name: 'buildUp',
			arguments: { building_id: type },
			town_id: town_id,
		};
		gpAjax.ajaxPost('frontend_bridge', 'execute', data);
		botConsole.log(`${town.getName()}: buildUp ${type}`);
		await this.sleep(500);
	};

	/* Make post request to tear building down */
	postTearDown = async (type, town_id) => {
		let town = ITowns.towns[town_id];
		let data = {
			model_url: 'BuildingOrder',
			action_name: 'tearDown',
			arguments: { building_id: type },
			town_id: town_id,
		};
		gpAjax.ajaxPost('frontend_bridge', 'execute', data);
		await this.sleep(500);
	};

	/* return true if the quee is full */
	isFullQueue = (town_id) => {
		let town = ITowns.towns[town_id];
		if (GameDataPremium.isAdvisorActivated('curator') && town.buildingOrders().length >= 7)
			return true;
		if (!GameDataPremium.isAdvisorActivated('curator') && town.buildingOrders().length >= 2)
			return true;
		return false;
	};

	/* return true if building match polis */
	isDone = (town_id) => {
		let town = ITowns.towns[town_id];
		let buildings = town.getBuildings().attributes;
		for (let build of Object.keys(this.towns_buildings[town_id])) {
			if (this.towns_buildings[town_id][build] != buildings[build]) {
				return false;
			}
		}
		return true;
	};

	/* */
	getNextBuild = async (town_id) => {
		let town = ITowns.towns[town_id];

		/* livello attuale */
		let buildings = { ...town.getBuildings().attributes };

		/* Add the the list the current building progress */
		for (let order of town.buildingOrders().models) {
			if (order.attributes.tear_down) {
				buildings[order.attributes.building_type] -= 1;
			} else {
				buildings[order.attributes.building_type] += 1;
			}
		}
		/* livello in cui deve arrivare */
		let target = this.towns_buildings[town_id];

		/* Check if the building is duable, if yes build it and return true, else false  */
		const check = async (build, level) => {
			/* if the given is an array, randomically try all of the array */
			if (Array.isArray(build)) {
				build.sort(() => Math.random() - 0.5);
				for (let el of build) {
					if (await check(el, level)) return true;
				}
				return false;
			}
			if (target[build] <= buildings[build]) return false;
			else if (buildings[build] < level) {
				await this.postBuild(build, town_id);
				return true;
			}
			return false;
		};

		const tearCheck = async (build) => {
			if (Array.isArray(build)) {
				build.sort(() => Math.random() - 0.5);
				for (let el of build) {
					if (await tearCheck(el)) return true;
				}
				return false;
			}
			if (target[build] < buildings[build]) {
				await this.postTearDown(build, town_id);
				return true;
			}
			return false;
		};

		/* IF the docks is not build yet, then follow the tutorial */
		if (buildings.docks < 1) {
			if (await check('lumber', 3)) return;
			if (await check('stoner', 3)) return;
			if (await check('farm', 4)) return;
			if (await check('ironer', 3)) return;
			if (await check('storage', 4)) return;
			if (await check('temple', 3)) return;
			if (await check('main', 5)) return;
			if (await check('barracks', 5)) return;
			if (await check('storage', 5)) return;
			if (await check('stoner', 6)) return;
			if (await check('lumber', 6)) return;
			if (await check('ironer', 6)) return;
			if (await check('main', 8)) return;
			if (await check('farm', 8)) return;
			if (await check('market', 6)) return;
			if (await check('storage', 8)) return;
			if (await check('academy', 7)) return;
			if (await check('temple', 5)) return;
			if (await check('farm', 12)) return;
			if (await check('main', 15)) return;
			if (await check('storage', 12)) return;
			if (await check('main', 25)) return;
			if (await check('hide', 10)) return;
		}

		/* Resouces */
		// WALLS!
		if (await check('farm', 15)) return;
		if (await check(['storage', 'main'], 25)) return;
		if (await check('hide', 10)) return;
		if (await check(['lumber', 'stoner', 'ironer'], 15)) return;
		if (await check(['academy', 'farm'], 36)) return;
		if (await check(['docks', 'barracks'], 10)) return;
		if (await check('wall', 25)) return;
		// terme
		if (await check(['docks', 'barracks', 'market'], 20)) return;
		if (await check('farm', 45)) return;
		if (await check(['docks', 'barracks', 'market'], 30)) return;
		if (await check(['lumber', 'stoner', 'ironer'], 40)) return;
		if (await check('temple', 30)) return;

		/* Demolish */
		let lista = [
			'lumber',
			'stoner',
			'ironer',
			'docks',
			'barracks',
			'market',
			'temple',
			'academy',
			'farm',
			'hide',
			'storage',
			'wall',
		];
		if (await tearCheck(lista)) return;
		if (await tearCheck('main')) return;
	};
}