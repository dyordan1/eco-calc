import React from 'react';
import './App.css';
import Header from './Header.js';
import RecipeView from './RecipeView.js';
import {Grid, CircularProgress} from '@material-ui/core';
import {withStyles} from '@material-ui/core/styles';
import {v4} from 'uuid';
import LocalDB from './LocalDB.js';
import {DBContext} from './LocalDB.js';

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
    super();
    this.state = {
      localdb: new LocalDB(),
    };
  }

  render() {
    const {classes} = this.props;
    const {localdb} = this.state;

    let appContent;
    if (!localdb.initialized) {
      const app = this;
      appContent = <CircularProgress />;
      localdb.init().then(() => {
        app.forceUpdate();
      });
    } else {
      const listItems = [];

      localdb.recipes.forEach((recipes) => {
        const recipe = recipes[0];
        const key = v4();
        listItems.push(<Grid item key={key}>
          <RecipeView recipe={recipe} key={key}/>
        </Grid>);
      });
      appContent = <Grid container justify="center" className={classes.root} spacing={2}>
        {listItems}
      </Grid>;
    }

    return (<>
      <DBContext.Provider value={localdb}>
        <Header />
        {appContent}
      </DBContext.Provider>
    </>);
  }
}

export default withStyles(styles, {withTheme: true})(App);
