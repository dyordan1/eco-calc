import React from 'react';
import './App.css';
import { getSkill, getData } from './data.js';
import Header from './Header.js';
import { GameItem } from './Recipe.js';
import Recipe from './Recipe.js';
import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { v4 } from 'uuid'

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    marginTop: 8,
  },
  paper: {
    height: 140,
    width: 100,
  },
  control: {
    padding: theme.spacing(2),
  },
}));

function App() {
  const classes = useStyles();

  // Fetch a row of recipes.
  function getListItem(ingredients, products, skillNeeded, craftingStation) {
    let ingredientList = [];
    let productList = [];

    // Make ingredients pop
    for (let i = 0; i < ingredients.length; i++) {
      let ingredient = ingredients[i];
      ingredientList.push(new GameItem(ingredient[2], ingredient[1]));
    }

    // Make ingredients pop
    for (let i = 0; i < products.length; i++) {
      let product = products[i];
      productList.push(new GameItem(product[1], product[0]));
    }

    return (
      <Grid item key={v4()}>
        <Recipe station={craftingStation} skill={skillNeeded} ingredients={ingredientList} products={productList} price="20"/>
      </Grid>
    )
  }

  // Get them master duttas
  let masterDutta = getData()

  // Init list of items
  let listItems = []

  // For each recipe
  for (let recipeName in masterDutta['recipes']) {
    let recipe = masterDutta['recipes'][recipeName]
    let craftingStation = recipe['craftStn'][0]
    let skillNeeded = getSkill(recipe['skillNeeds'])

    // For each variant
    for (let variantName in recipe['variants']) {
      let variant = recipe['variants'][variantName]
      listItems.push(getListItem(variant['ingredients'], variant['products'], skillNeeded, craftingStation))
    }
  }

  return (<>
    <Header />
    <Grid container justify="center" className={classes.root} spacing={2}>
      {listItems}
    </Grid>
  </>)
}

export default App;
