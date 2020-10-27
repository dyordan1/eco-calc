import React from 'react';
import { getSkill, getData } from './data.js';

const DBContext = React.createContext(undefined);

class Recipe {
  constructor(station, skill, ingredients, products, price) {
    this.station = station;
    this.skill = skill;
    this.ingredients = ingredients;
    this.products = products;
    this.price = price;
  }
}

class GameItem {
  constructor(count, label) {
    this.count = count;
    this.label = label;
  }
}

export default class LocalDB {
  constructor() {
    this.initialized = false;
    this.products = {};
    this.rawMats = [];
  }

  async init() {
    return new Promise(resolve => {
      // Get them master duttas
      let masterDutta = getData();

      // Keep track of all products and ingredients seen.
      let allIngredients = new Set();
      let allProducts = new Set();

      // For each recipe
      for (let recipeName in masterDutta.recipes) {
        let recipe = masterDutta.recipes[recipeName];
        let craftingStation = recipe.craftStn[0];
        let skillNeeded = getSkill(recipe.skillNeeds);

        // For each variant
        for (let variantName in recipe.variants) {
          let variant = recipe.variants[variantName];

          let ingredientList = [];
          let productList = [];

          // Add ingredients.
          for (let i = 0; i < variant.ingredients.length; i++) {
            let ingredient = variant.ingredients[i];
            let label = ingredient[1];
            let count = ingredient[2];
            ingredientList.push(new GameItem(count, label));
            allIngredients.add(label);
          }

          // Add products.
          for (let i = 0; i < variant.products.length; i++) {
            let product = variant.products[i];
            let label = product[0];
            let count = product[1];
            productList.push(new GameItem(count, label));
            allProducts.add(label);
          }

          // All ingredients that don't come up as products are "raw".
          this.rawMats = [...allIngredients].filter(item => !allProducts.has(item));

          for (let i = 0; i < productList.length; i++) {
            let product = productList[i];
            if (!this.products[product.label]) {
              this.products[product.label] = [];
            }

            this.products[product.label].push(
              new Recipe(craftingStation, skillNeeded, ingredientList, productList, 20));
          }
        }
      }

      console.log(this.products);
      console.log(this.rawMats);
      this.initialized = true;
      resolve(this);
    });
  }
}

export { GameItem, DBContext };
