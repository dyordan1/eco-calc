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

    console.log(payload.items);
  }
}
