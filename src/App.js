import React from 'react';
import './App.css';
import Header from './Header.js';
import RecipeView from './RecipeView.js';
import { Grid, CircularProgress } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { v4 } from 'uuid'
import LocalDB from './LocalDB.js'
import { DBContext } from './LocalDB.js'

const styles = (theme) => ({
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
});

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      localdb: new LocalDB()
    }
  }

  render() {
    const { classes } = this.props;
    const { localdb } = this.state;

    var appContent
    if (!localdb.initialized) {
      let app = this
      appContent = <CircularProgress />
      localdb.init().then(() => {
        app.forceUpdate()
      })
    } else {
      let listItems = [];

      for (let product in localdb.products) {
        let recipe = localdb.products[product][0]
        listItems.push(<Grid item key={v4()}>
          <RecipeView recipe={recipe}/>
        </Grid>)
      }
      appContent = <Grid container justify="center" className={classes.root} spacing={2}>
        {listItems}
      </Grid>
    }

    return (<>
      <DBContext.Provider value={localdb}>
        <Header />
        {appContent}
      </DBContext.Provider>
    </>)
  }
}

export default withStyles(styles, { withTheme: true })(App);
