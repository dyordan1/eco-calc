import React from 'react';
import {getSkill, getRecipeData} from './recipe_data.js';
import {getItemData} from './item_data.js';
import {v4} from 'uuid';

const defaultPricing = {
  	"Acorn": .001,
	"Clay": .1,
	"Agave Leaves": .25,
	"Dirt": .01,
	"Amanita Mushrooms": .25,
	"Basalt": .01,
	"Gneiss": .01,
	"Granite": .01,
	"Limestone": .1,
	"Sandstone": .1,
	"Shale": .1,
	"Beet": .25,
	"Corn": .25,
	"Heart Of Palm": .25,
	"Wood Pulp": .1,
	"Taro Root": .25,
	"Tomato": .25,
	"Wheat": .25,
	"Beans": .25,
	"Beet Greens": .5,
	"Bison Carcass": 10,
	"Rice": .25,
	"Bolete Mushrooms": .25,
	"Camas Bulb": .25,
	"Bass": 2,
	"Blue Shark": 4,
	"Cod": 2,
	"Crab Carcass": 2,
	"Moon Jellyfish": 2,
	"Pacific Sardine": 2,
	"Salmon": 2,
	"Trout": 2,
	"Tuna": 2.5,
	"Pumpkin": .25,
	"Giant Cactus Fruit": .25,
	"Fireweed Shoots": .25,
	"Papaya": .25,
	"Pineapple": .5,
	"Urchin": .5,
	"Birch Log": 1,
	"Cedar Log": 1,
	"Ceiba Log": 1,
	"Fir Log": 1,
	"Joshua Log": 1,
	"Oak Log": 1,
	"Palm Log": 1,
	"Redwood Log": 1,
	"Saguaro Rib": 1,
	"Spruce Log": 1,
	"Compost": .01,
	"Cookeina Mushrooms": .25,
	"Crimini Mushrooms": .25,
	"Copper Ore": .01,
	"Gold Ore": .01,
	"Iron Ore": .01,
	"Elk Carcass": 10,
	"Prickly Pear Fruit": .25,
	"Fiddleheads": .25,
	"Huckleberries": .25,
	"Mountain Goat Carcass": 6,
	"Kelp": .25,
	"Bighorn Carcass": 6,
	"Clam": .25,
	"Alligator Carcass": 6,
	"Jaguar Carcass": 6,
	"Wolf Carcass": 4,
	"Big Bluestem Seed": .001,
	"Deer Carcass": 6,
	"Stone": .01,
	"Coyote Carcass": 6,
	"Fox Carcass": 4,
	"Agouti Carcass": 4,
	"Hare Carcass": 4,
	"Otter Carcass": 4,
	"Snapping Turtle Carcass": 4,
	"Turkey Carcass": 4,
}

class CraftingTable {
  constructor(label, installedUpgradeTier = 0) {
   this.label = label;
   this.installedUpgradeTier = installedUpgradeTier;
  }
}

/** An in-game recipe that consumes certain items and produces other items. */
class Recipe {
  /**
   * @constructor
   * @param {string} id uuid to lookup recipe by.
   * @param {string} station where it's made
   * @param {string} skill what skill it requires
   * @param {number} craftTime time in minutes it takes to craft recipe
   * @param {GameItemInstance[]} ingredients the ingredients required
   * @param {GameItemInstance[]} products the products made
   * @param {number} [price] (cached) price for this item.
   */
  constructor(id, station, skill, craftTime, ingredients, products, price = undefined) {
    this.id = id;
    this.station = station;
    this.skill = skill;
    this.craftTime = craftTime
    this.ingredients = ingredients;
    this.products = products;
    this.price = price;
  }
}

/** An instance of a game item consumed or produced by a recipe. */
class GameItemInstance {
  /**
   * @constructor
   * @param {int} count number of items used in instance
   * @param {GameItem} item number of items used in instance
   */
  constructor(count, item) {
    this.count = count;
    this.item = item;
  }
}

/**
 * Enum for type of game item.
 * @readonly
 * @enum {string}
 */
const ItemType = {
  ITEM: 'ITEM',
  TAG: 'TAG',
};

/** An in-game item. Could be a single item, or a tag (group of items). */
class GameItem {
  /**
   * @constructor
   * @param {string} label name of the item
   * @param {ItemType} type type of item: ITEM for a single one, TAG for group
   */
  constructor(label, type) {
    this.label = label;
    this.type = type;
    this.children = [];
    this.parents = [];
    this.price = undefined;
  }

  /**
   * Adds a child GameItem - only allowed if this GameItem is a tag.
   * @param {GameItem} child A child game item
   */
  addChild(child) {
    if (this.type !== ItemType.TAG) {
      return;
    }

    this.children.push(child);
    child.parents.push(this);
  }

  setPrice(price) {
    this.price = price
  }
}

class Product {
  constructor(recipes, bestRecipe = undefined) {
   this.recipes = recipes;
   this.bestRecipe = bestRecipe;
  }
}

/** Master database for all Eco data. */
export default class LocalDB {
  /***/
  constructor(app, cookies) {
    this.app = app;
    this.initialized = false;
    this.recipes = new Map();
    this.products = new Map();
    this.rawMats = new Map();
    this.items = new Map();
    this.tables = new Map();
    // Change this to debug all the crap going on in background worker.
    this.debugWorker = false;
    this.updateInterval = undefined;
    this.backgroundWorker = new Worker('worker.js');
    this.backgroundWorker.onmessage = (e) => {
      if (e.data.type === 'calculatedPrice') {
        let payload = e.data.payload;
        let targetItem = this.products.get(payload.item.label);
        if (targetItem !== undefined) {
          targetItem.price = payload.item.price;
          if (payload.bestRecipe !== undefined) {
            targetItem.bestRecipe = payload.bestRecipe;
          }
        }
      } else if (e.data.type === 'recalculationComplete') {
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
        }
        this.updateInterval = undefined;
        this.app.forceUpdate();
      }
    }
    if (cookies.get("consent") === "true") {
      this.cookies = cookies;
      let cookiePricing = cookies.get('rawGoodsPricing', {doNotParse: true});
      if (cookiePricing === undefined) {
        this.sessionPricing = defaultPricing;
      } else {
        this.sessionPricing = JSON.parse(cookiePricing);
      }
      this.sessionTableData = cookies.get('tableUpgrades', {doNotParse: true});
      if (this.sessionTableData !== undefined) {
        this.sessionTableData = JSON.parse(this.sessionTableData);
      }
    } else {
      this.sessionPricing = defaultPricing;
    }
  }

  /** Initialize the DB */
  async init() {
    return new Promise((resolve) => {
      // Get them master duttas
      const masterDutta = getRecipeData();

      // Keep track of all products and ingredients seen.
      const allIngredients = new Map();
      const allProducts = new Map();

      // For each recipe
      for (const recipeName in masterDutta.recipes) {
        if ({}.hasOwnProperty.call(masterDutta.recipes, recipeName)) {
          const recipe = masterDutta.recipes[recipeName];
          const craftingStation = recipe.craftStn[0];
          const skillNeeded = getSkill(recipe.skillNeeds);
          const craftTime = recipe.baseCraftTime;

          // For each variant
          for (const variantName in recipe.variants) {
            if ({}.hasOwnProperty.call(recipe.variants, variantName)) {
              const variant = recipe.variants[variantName];

              const ingredientList = [];
              const productList = [];

              // Add ingredients.
              for (let i = 0; i < variant.ingredients.length; i++) {
                const ingredient = variant.ingredients[i];
                const type = ingredient[0];
                const label = ingredient[1];
                const count = ingredient[2];
                if (!this.items.has(label)) {
                  this.items.set(label, new GameItem(label, ItemType[type]));
                }
                const item = this.items.get(label);
                ingredientList.push(new GameItemInstance(count, item));
                allIngredients.set(label, item);
              }

              // Add products.
              for (let i = 0; i < variant.products.length; i++) {
                const product = variant.products[i];
                const label = product[0];
                const count = product[1];
                if (!this.items.has(label)) {
                  this.items.set(label, new GameItem(label, ItemType.ITEM));
                }
                const item = this.items.get(label);
                productList.push(new GameItemInstance(count, item));
                allProducts.set(label, item);
              }

              if (!this.tables.has(craftingStation)) {
                let upgradeLevel = 0;
                if (this.sessionTableData !== undefined) {
                  upgradeLevel = this.sessionTableData[craftingStation];
                }
                this.tables.set(craftingStation, new CraftingTable(craftingStation, upgradeLevel));
              }

              let newRecipe = new Recipe(
                  v4(),
                  craftingStation,
                  skillNeeded,
                  craftTime,
                  ingredientList,
                  productList);

              for (let i = 0; i < productList.length; i++) {
                const product = productList[i];
                if (!this.products.has(product.item.label)) {
                  this.products.set(product.item.label, new Product([]));
                }

                this.recipes.set(newRecipe.id, newRecipe);
                this.products.get(product.item.label).recipes.push(newRecipe);
              }
            }
          }
        }
      }

      const itemDutta = getItemData();
      for (const tagLabel in itemDutta.tags) {
        if ({}.hasOwnProperty.call(itemDutta.tags, tagLabel)) {
          if (!this.items.has(tagLabel)) {
            this.items.set(tagLabel, new GameItem(tagLabel, ItemType.TAG));
          }
          const tag = this.items.get(tagLabel);

          const tagItems = itemDutta.tags[tagLabel];
          for (let i=0; i < tagItems.length; i++) {
            const itemLabel = tagItems[i];
            if (!this.items.has(itemLabel)) {
              let item = new GameItem(itemLabel, ItemType.ITEM)
              this.items.set(itemLabel, item);
            }
            const item = this.items.get(itemLabel);
            if (allIngredients.has(tagLabel)) {
              allIngredients.set(itemLabel, item);
            }
            tag.addChild(item);
          }
        }
      }

      // All ingredients that don't come up as products are considered
      // "raw", i.e. harvested
      const rawMats = [...allIngredients.values()].filter(
          (item) =>
            !allProducts.has(item.label) && item.type !== ItemType.TAG);
      for (let i=0; i < rawMats.length; i++) {
        const item = rawMats[i];
        item.setPrice(this.sessionPricing[item.label]);
        this.rawMats.set(item.label, item);
      }

      this.updating = false;
      this.initialized = true;
      this.flushRawMatPricing();
      resolve(this);
    });
  }

  updateRawMatPricing(label, value) {
    this.rawMats.get(label).setPrice(value);
    this.sessionPricing[label] = value;
  }

  updateTableTier(label, value) {
    this.tables.get(label).installedUpgradeTier = value;
  }

  setCookie(name,value,days) {
    if (!this.cookies) {
      return;
    }

    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (JSON.stringify(value) || "")  + expires + "; path=/";
  }

  flushRawMatPricing() {
    this.setCookie('rawGoodsPricing', this.sessionPricing);
    this.setCookie('tableUpgrades', Object.fromEntries([...this.tables.values()].map((table) => [table.label, table.installedUpgradeTier])));
    this.backgroundWorker.postMessage({type: 'recalculate', debug: this.debugWorker, payload: {recipes: this.recipes, items: this.items, tables: this.tables}});
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    let app = this.app;
    this.updateInterval = setInterval(function() {
      app.forceUpdate();
    }, 2000);
  }
}

const DBContext = React.createContext(undefined);

export {GameItem, DBContext};
