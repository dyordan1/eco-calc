import React from 'react';
import {getSkill, getRecipeData} from './recipe_data.js';
import {getItemData} from './item_data.js';

const defaultPricing = {
  "Acorn": 1.0,
	"Clay": 1.0,
	"Agave Leaves": 1.0,
	"Dirt": 1.0,
	"Amanita Mushrooms": 1.0,
	"Basalt": 1.0,
	"Gneiss": 1.0,
	"Granite": 1.0,
	"Limestone": 1.0,
	"Sandstone": 1.0,
	"Shale": 1.0,
	"Beet": 1.0,
	"Corn": 1.0,
	"Heart Of Palm": 1.0,
	"Wood Pulp": 1.0,
	"Taro Root": 1.0,
	"Tomato": 1.0,
	"Wheat": 1.0,
	"Beans": 1.0,
	"Beet Greens": 1.0,
	"Bison Carcass": 1.0,
	"Rice": 1.0,
	"Bolete Mushrooms": 1.0,
	"Camas Bulb": 1.0,
	"Bass": 1.0,
	"Blue Shark": 1.0,
	"Cod": 1.0,
	"Crab Carcass": 1.0,
	"Moon Jellyfish": 1.0,
	"Pacific Sardine": 1.0,
	"Salmon": 1.0,
	"Trout": 1.0,
	"Tuna": 1.0,
	"Pumpkin": 1.0,
	"Giant Cactus Fruit": 1.0,
	"Fireweed Shoots": 1.0,
	"Papaya": 1.0,
	"Pineapple": 1.0,
	"Urchin": 1.0,
	"Birch Log": 1.0,
	"Cedar Log": 1.0,
	"Ceiba Log": 1.0,
	"Fir Log": 1.0,
	"Joshua Log": 1.0,
	"Oak Log": 1.0,
	"Palm Log": 1.0,
	"Redwood Log": 1.0,
	"Saguaro Rib": 1.0,
	"Spruce Log": 1.0,
	"Compost": 1.0,
	"Cookeina Mushrooms": 1.0,
	"Crimini Mushrooms": 1.0,
	"Copper Ore": 1.0,
	"Gold Ore": 1.0,
	"Iron Ore": 1.0,
	"Elk Carcass": 1.0,
	"Prickly Pear Fruit": 1.0,
	"Fiddleheads": 1.0,
	"Huckleberries": 1.0,
	"Mountain Goat Carcass": 1.0,
	"Kelp": 1.0,
	"Bighorn Carcass": 1.0,
	"Clam": 1.0,
	"Alligator Carcass": 1.0,
	"Jaguar Carcass": 1.0,
	"Wolf Carcass": 1.0
}

/** An in-game recipe that consumes certain items and produces other items. */
class Recipe {
  /**
   * @constructor
   * @param {string} station where it's made
   * @param {string} skill what skill it requires
   * @param {number} craftTime time in minutes it takes to craft recipe
   * @param {GameItemInstance[]} ingredients the ingredients required
   * @param {GameItemInstance[]} products the products made
   * @param {number} [price] (cached) price for this item.
   */
  constructor(station, skill, craftTime, ingredients, products, price = 20) {
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
    this.price = 0.0;
  }

  /**
   * Adds a child GameItem - only allowed if this GameItem is a tag.
   * @param {GameItem} child A child game item
   */
  addChild(child) {
    if (this.type != ItemType.TAG) {
      return;
    }

    this.children.push(child);
  }

  setPrice(price) {
    this.price = price
  }
}

/** Master database for all Eco data. */
export default class LocalDB {
  /***/
  constructor(cookies) {
    this.initialized = false;
    this.recipes = new Map();
    this.rawMats = new Map();
    this.items = new Map();
    this.backgroundWorker = new Worker('worker.js');
    this.backgroundWorker.onmessage = (e) => {
      console.log('Master', e);
    }
    if (cookies.get("consent") === "true") {
      this.cookies = cookies;
      this.sessionPricing = JSON.parse(cookies.get('rawGoodsPricing', {doNotParse: true}));
      if (this.sessionPricing === undefined) {
        this.sessionPricing = defaultPricing;
        this.sessionPricing = cookies.set('rawGoodsPricing', JSON.stringify(defaultPricing));
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

              for (let i = 0; i < productList.length; i++) {
                const product = productList[i];
                if (!this.recipes.has(product.item.label)) {
                  this.recipes.set(product.item.label, []);
                }

                this.recipes.get(product.item.label).push(
                    new Recipe(
                        craftingStation,
                        skillNeeded,
                        craftTime,
                        ingredientList,
                        productList));
              }
            }
          }
        }
      }

      // All ingredients that don't come up as products are considered
      // "raw", i.e. harvested
      const rawMats = [...allIngredients.values()].filter(
          (item) =>
            !allProducts.has(item.label) && item.type == ItemType.ITEM);
      for (let i=0; i < rawMats.length; i++) {
        const item = rawMats[i];
        item.setPrice(this.sessionPricing[item.label]);
        this.rawMats.set(item.label, item);
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
              this.items.set(itemLabel, new GameItem(itemLabel, ItemType.ITEM));
            }
            const item = this.items.get(itemLabel);
            tag.addChild(item);
          }
        }
      }

      console.log(this.rawMats);

      this.initialized = true;
      resolve(this);
    });
  }

  updateRawMatPricing(label, value) {
    this.rawMats.get(label).setPrice(value);
    this.sessionPricing[label] = value;
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
    this.setCookie('rawGoodsPricing', this.sessionPricing)
  }
}

const DBContext = React.createContext(undefined);

export {GameItem, DBContext};
