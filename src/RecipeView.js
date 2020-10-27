import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import { GameItem } from './LocalDB.js'

const useStyles = makeStyles({
  root: {
    width: 325,
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)',
  },
  title: {
    fontSize: 14,
  },
  pos: {
    marginBottom: 12,
  },
});

// Renders a single recipe.
export default function RecipeView(props) {
  const classes = useStyles();

  function formatProduct(product) {
    return <>{product.count == 1 ? "" : product.count} {product.label}</>;
  }

  function formatProducts(products) {
    if (products.length == 1) {
      return formatProduct(products[0])
    }

    return products.map(product => (
      <li>{formatProduct(product)}</li>
    ))
  }

  return (
    <Card className={classes.root} variant="outlined">
      <CardContent>
        <Grid container justify="space-between">
          <Grid item key="left">
            <Typography className={classes.title} color="textSecondary" gutterBottom>
              {props.recipe.station}
            </Typography>
          </Grid>
          <Grid item key="right">
            <Typography className={classes.title} gutterBottom>
              <strong>${props.recipe.price}</strong>
            </Typography>
          </Grid>
        </Grid>
        <Typography variant="h5" component="h2">
          {formatProducts(props.recipe.products)}
        </Typography>
        <Typography className={classes.pos} color="textSecondary">
          {props.recipe.skill}
        </Typography>
      </CardContent>
    </Card>
  );
}

export { GameItem }
