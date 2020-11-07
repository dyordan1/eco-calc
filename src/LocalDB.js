import React from 'react';
import {getSkill, getRecipeData} from './recipe_data.js';
import {getItemData} from './item_data.js';

const DBContext = React.createContext(undefined);

/** An in-game recipe that consumes certain items and produces other items. */
class Recipe {
  /**
   * @constructor
   * @param {string} station where it's made
   * @param {string} skill what skill it requires
   * @param {GameItemInstance[]} ingredients the ingredients required
   * @param {GameItemInstance[]} products the products made
   * @param {number} [price] (cached) price for this item.
   */
  constructor(station, skill, ingredients, products, price = 20) {
    this.station = station;
    this.skill = skill;
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
}

/** Master database for all Eco data. */
export default class LocalDB {
  /***/
  constructor() {
    this.initialized = false;
    this.recipes = new Map();
    this.rawMats = new Map();
    this.items = new Map();
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

      console.log(this.recipes);
      console.log(this.rawMats);
      console.log(this.items);

      this.initialized = true;
      resolve(this);
    });
  }
}

export {GameItem, DBContext};
