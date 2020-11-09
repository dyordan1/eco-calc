import React from 'react';
import './App.css';
import Header from './Header.js';
import RecipeView from './RecipeView.js';
import {Grid, CircularProgress, Snackbar, ButtonGroup, Button} from '@material-ui/core';
import MuiAlert from '@material-ui/lab/Alert';
import {withStyles} from '@material-ui/core/styles';
import {v4} from 'uuid';
import LocalDB from './LocalDB.js';
import {DBContext} from './LocalDB.js';
import { withCookies } from 'react-cookie';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
    marginTop: 8,
  },
});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      localdb: new LocalDB(this.props.cookies),
      openCookieConsent: this.props.cookies.get("consent") === undefined,
    };
  }

  setCookieConsent(value) {
    this.props.cookies.set("consent", value);
    this.setState({
      openCookieConsent: false
    })
  }

  render() {
    const {classes} = this.props;
    const {localdb, openCookieConsent} = this.state;

    let appContent;
    if (!localdb.initialized) {
      const app = this;
      appContent = <CircularProgress />;
      localdb.init().then(() => {
        app.forceUpdate();
      });
    } else {
      const listItems = [];

      localdb.products.forEach((recipes) => {
        const recipe = recipes[0];
        const key = v4();
        listItems.push(<Grid item key={key}>
          <RecipeView recipe={recipe} recipeId={key}/>
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
      <Snackbar open={openCookieConsent} autoHideDuration={6000}>
        <MuiAlert severity="warning" elevation={6} variant="filled">
          I wanna use cookies to store your raw costs / table setups between sessions. No tracking. Is that ok?
          <ButtonGroup variant="contained">
            <Button onClick={() => this.setCookieConsent(true)}  color="primary">Yes</Button>
            <Button onClick={() => this.setCookieConsent(false)} color="secondary">No</Button>
          </ButtonGroup>
        </MuiAlert>
      </Snackbar>
    </>);
  }
}

export default withStyles(styles, {withTheme: true})(withCookies(App));
