upgradeMultiplier = function(tables, recipe) {
  switch(tables.get(recipe.station).installedUpgradeTier) {
    case 0:
      return 1;
    case 1:
      return 0.9;
    case 2:
      return 0.75;
    case 3:
      return 0.6;
    case 4:
      return 0.55;
    case 5:
      return 0.5;
  }
}

onmessage = function(e) {
  if(e.data.type == 'recalculate') {
    payload = e.data.payload;

    payload.recipes.forEach((recipe) => {
      for (let i = 0; i < recipe.products.length; i++) {
        let product = payload.items.get(recipe.products[i].item.label);
        if (product.recipes === undefined) {
          product.recipes = [];
        }

        product.recipes.push(recipe);
      }
    });

    payload.items.forEach((item) => {
      recipesInStack = new Set();
      itemsInStack = new Set();
      calculationTasks = [];
      calculationTasks.push({type: 'item', o: item});
      while (calculationTasks.length) {
        task = calculationTasks[calculationTasks.length - 1];
        if (task.type === 'recipe') {
          let recipe = task.o;
          recipesInStack.add(recipe);
          // Fuck it.
          if (recipe.station === 'Oil Refinery') {
            calculationTasks.pop();
            continue;
          }
          if (recipe.price !== undefined) {
            calculationTasks.pop();
            continue;
          }

          let price = 0;
          let resourceMulti = upgradeMultiplier(payload.tables, recipe);
          for (let i = 0; i < recipe.ingredients.length; i++) {
            let ingredient = recipe.ingredients[i].item;
            if (!itemsInStack.has(ingredient)) {
              if (ingredient.price === undefined) {
                calculationTasks.push({type: 'item', o: ingredient});
                price = NaN;
              } else {
                price += recipe.ingredients[i].count * resourceMulti * ingredient.price;
              }
            }
          }

          if (!isNaN(price)) {
            if (price != 0) {
              recipe.price = price;
            }
            calculationTasks.pop();
            recipesInStack.delete(recipe);
          }
        } else if (task.type === 'item') {
          let item = task.o;
          itemsInStack.add(item);
          if (item.price !== undefined) {
            calculationTasks.pop();
            continue;
          }

          let minPrice = undefined;
          if (item.type === 'TAG') {
            for (let i = 0; i < item.children.length; i++) {
              let child = item.children[i];
              if (child.price === undefined && !itemsInStack.has(child)) {
                calculationTasks.push({type: 'item', o: child});
                minPrice = NaN;
              }
              if (minPrice === undefined || minPrice > child.price) {
                minPrice = child.price;
              }
            }
          } else {
            for (let i = 0; i < item.recipes.length; i++) {
              let recipe = item.recipes[i];
              if (recipe.price === undefined && !recipesInStack.has(recipe)) {
                calculationTasks.push({type: 'recipe', o: recipe});
                minPrice = NaN;
              }
              if (minPrice === undefined || minPrice > recipe.price) {
                minPrice = recipe.price;
              }
            }
          }

          if (minPrice === undefined || !isNaN(minPrice)) {
            item.price = minPrice;
            itemsInStack.delete(item);
            calculationTasks.pop();
          }
        }
      }

      let bestRecipe = undefined;
      if (item.recipes !== undefined) {
        for (let i = 0; i < item.recipes.length; i++) {
          if (item.recipes[i].price == item.price) {
            bestRecipe = item.recipes[i];
            break;
          }
        }
      }

      postMessage({type: 'calculatedPrice', payload: {item: item, bestRecipe: bestRecipe}});
    });
  }
}
