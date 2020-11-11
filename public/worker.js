upgradeMultiplier = function(tables, recipe) {
  switch(tables.get(recipe.station.label).installedUpgradeTier) {
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

var debugEnabled = false;

logRecipe = function(message, recipe) {
  if (debugEnabled) {
    console.log(message + ' - Recipe | ' + recipe.station + ' | ' + recipe.products[0].item.label);
  }
}

logItem = function(message, item) {
  if (debugEnabled) {
    console.log(message + ' - Item | ' + item.label);
  }
}

logTask = function(message, task) {
  if (debugEnabled) {
    console.log(message + ' | ' + task.type + ' | ' + task.label ? task.label : task.products[0].item.label);
  }
}

onmessage = function(e) {
  debugEnabled = e.data.debug;
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

    payload.items.forEach((topLevelItem) => {
      recipesInStack = new Set();
      itemsInStack = new Set();
      calculationTasks = [];
      calculationTasks.push({type: 'item', o: topLevelItem});
      while (calculationTasks.length) {
        task = calculationTasks[calculationTasks.length - 1];
        if (task.type === 'recipe') {
          let recipe = task.o;
          logRecipe('[' + calculationTasks.length + '] ' + topLevelItem.label, recipe);
          recipesInStack.add(recipe);
          if (recipe.price !== undefined) {
            logRecipe('<Already calculated>', recipe);
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
              recipesInStack.delete(recipe);
            }
            logRecipe('<Price ' + price + '>', recipe);
            calculationTasks.pop();
          }
        } else if (task.type === 'item') {
          let item = task.o;
          logItem('[' + calculationTasks.length + '] ' + topLevelItem.label, item);
          itemsInStack.add(item);
          if (item.price !== undefined) {
            logItem('<Already calculated>', item);
            calculationTasks.pop();
            continue;
          }

          let minPrice = undefined;
          let bestRecipe = undefined;
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
            if (item.recipes) {
              for (let i = 0; i < item.recipes.length; i++) {
                let recipe = item.recipes[i];
                if (recipe.price === undefined) {
                  if (!recipesInStack.has(recipe)) {
                    calculationTasks.push({type: 'recipe', o: recipe});
                    minPrice = NaN;
                  }
                } else {
                  let itemPrice = recipe.price;
                  for (let i = 0; i < recipe.products.length; i++) {
                    let product = recipe.products[i];
                    if (product.item.label === item.label) {
                      itemPrice /= product.count;
                      break;
                    }
                  }
                  if (minPrice === undefined || minPrice > itemPrice) {
                    bestRecipe = recipe;
                    minPrice = itemPrice;
                  }
                }
              }
            }
          }

          if (minPrice === undefined || !isNaN(minPrice)) {
            logItem('<Price ' + minPrice + '>', item);
            if (minPrice !== undefined) {
              if (bestRecipe !== undefined) {
                item.bestRecipe = bestRecipe;
              }
              item.price = minPrice;
              itemsInStack.delete(item);
            }
            calculationTasks.pop();
          }
        }

        if (task == calculationTasks[calculationTasks.length - 1]) {
          // Can't do much with this one, just pop it and move on.
          logTask('<Dropping task', task);
          calculationTasks.pop();
        }
      }

      postMessage({type: 'calculatedPrice', payload: {item: topLevelItem, bestRecipe: topLevelItem.bestRecipe}});
    });

    postMessage({type: 'recalculationComplete'});
  }
}
