import React from 'react';
import {getSkill, getRecipeData} from './recipe_data.js';
import {getItemData} from './item_data.js';
import {v4} from 'uuid';

const defaultPricing = {
  "Acorn": 10,
	"Clay": 10,
	"Agave Leaves": 10,
	"Dirt": 10,
	"Amanita Mushrooms": 10,
	"Basalt": 10,
	"Gneiss": 10,
	"Granite": 10,
	"Limestone": 10,
	"Sandstone": 10,
	"Shale": 10,
	"Beet": 10,
	"Corn": 10,
	"Heart Of Palm": 10,
	"Wood Pulp": 10,
	"Taro Root": 10,
	"Tomato": 10,
	"Wheat": 10,
	"Beans": 10,
	"Beet Greens": 10,
	"Bison Carcass": 10,
	"Rice": 10,
	"Bolete Mushrooms": 10,
	"Camas Bulb": 10,
	"Bass": 10,
	"Blue Shark": 10,
	"Cod": 10,
	"Crab Carcass": 10,
	"Moon Jellyfish": 10,
	"Pacific Sardine": 10,
	"Salmon": 10,
	"Trout": 10,
	"Tuna": 10,
	"Pumpkin": 10,
	"Giant Cactus Fruit": 10,
	"Fireweed Shoots": 10,
	"Papaya": 10,
	"Pineapple": 10,
	"Urchin": 10,
	"Birch Log": 10,
	"Cedar Log": 10,
	"Ceiba Log": 10,
	"Fir Log": 10,
	"Joshua Log": 10,
	"Oak Log": 10,
	"Palm Log": 10,
	"Redwood Log": 10,
	"Saguaro Rib": 10,
	"Spruce Log": 10,
	"Compost": 10,
	"Cookeina Mushrooms": 10,
	"Crimini Mushrooms": 10,
	"Copper Ore": 10,
	"Gold Ore": 10,
	"Iron Ore": 10,
	"Elk Carcass": 10,
	"Prickly Pear Fruit": 10,
	"Fiddleheads": 10,
	"Huckleberries": 10,
	"Mountain Goat Carcass": 10,
	"Kelp": 10,
	"Bighorn Carcass": 10,
	"Clam": 10,
	"Alligator Carcass": 10,
	"Jaguar Carcass": 10,
	"Wolf Carcass": 10,
	"Big Bluestem Seed": 10,
	"Deer Carcass": 10,
	"Stone": 10,
	"Coyote Carcass": 10,
	"Fox Carcass": 10,
	"Agouti Carcass": 10,
	"Hare Carcass": 10,
	"Otter Carcass": 10,
	"Snapping Turtle Carcass": 10,
	"Turkey Carcass": 10,
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

/** Master database for all Eco data. */
export default class LocalDB {
  /***/
  constructor(cookies) {
    this.initialized = false;
    this.recipes = new Map();
    this.products = new Map();
    this.rawMats = new Map();
    this.items = new Map();
    this.backgroundWorker = new Worker('worker.js');
    this.backgroundWorker.onmessage = (e) => {
      console.log('Master', e, e.data);
    }
    if (cookies.get("consent") === "true") {
      this.cookies = cookies;
      let cookiePricing = cookies.get('rawGoodsPricing', {doNotParse: true});
      if (cookiePricing === undefined) {
        this.sessionPricing = defaultPricing;
      } else {
        this.sessionPricing = JSON.parse(cookiePricing);
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
                  this.products.set(product.item.label, []);
                }

                this.recipes.set(newRecipe.id, newRecipe);
                this.products.get(product.item.label).push(newRecipe);
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
    this.backgroundWorker.postMessage({type: 'recalculate', payload: {recipes: this.recipes, items: this.items}});
  }
}

const DBContext = React.createContext(undefined);

export {GameItem, DBContext};
