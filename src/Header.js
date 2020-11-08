import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import {AppBar, Backdrop, CircularProgress, Card, CardContent, Toolbar, Typography, IconButton, Dialog, DialogTitle, DialogContent, InputAdornment, Grid, TextField} from '@material-ui/core';
import {Menu, Settings} from '@material-ui/icons';
import {DBContext} from './LocalDB.js';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  card: {
    width: 150,
  },
  gridRoot: {
    flexGrow: 1,
  },
  slowAsShitBackdrop: {
    zIndex: 1,
  }
});

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsOpen: false,
      slowAsShitPopupOpen: false,
    };
  }

  handleClickOpen() {
    this.setState({settingsOpen: true});
  };

  handleClose(value) {
    this.setState({settingsOpen: false, slowAsShitPopupOpen: true});
  };

  updatePricing(label) {
    return (event) => {
      let value = event.target.value;
      if (value !== '' && !isNaN(value)) {
        this.context.updateRawMatPricing(label, value);
      }
    };
  };

  componentDidUpdate() {
    if (this.state.slowAsShitPopupOpen) {
      let that = this;
      window.requestAnimationFrame(function() {
        that.context.flushRawMatPricing();
        that.setState({slowAsShitPopupOpen: false});
      });
    }
  }

  render() {
    const {classes} = this.props;
    const {settingsOpen, slowAsShitPopupOpen} = this.state;

    return <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" className={classes.menuButton} aria-label="menu">
            <Menu />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Eco Calculator
          </Typography>
          <IconButton edge="end" color="inherit" onClick={() => this.handleClickOpen()}><Settings/></IconButton>
        </Toolbar>
      </AppBar>
      <Dialog fullWidth={true} maxWidth="lg" onClose={() => this.handleClose()} aria-labelledby="simple-dialog-title" open={settingsOpen}>
        <DialogTitle id="simple-dialog-title">Set raw goods pricing</DialogTitle>
        <DialogContent>
          <Grid container className={classes.gridRoot} justify="center" spacing={2}>
            <DBContext.Consumer>
              {(localdb) => Array.from(localdb.rawMats.values()).map((rawMat) => (
                <Grid item>
                  <Card className={classes.card} variant="outlined">
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        {rawMat.label}
                      </Typography>
                      <TextField
                        label="Price"
                        type="number"
                        InputLabelProps={{
                          shrink: true,
                        }}
                        startAdornment={<InputAdornment position="start">$</InputAdornment>}
                        variant="outlined"
                        defaultValue={rawMat.price}
                        onChange={(event) => this.updatePricing(rawMat.label)(event)}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </DBContext.Consumer>
          </Grid>
        </DialogContent>
      </Dialog>
      <Backdrop open={slowAsShitPopupOpen} className={classes.slowAsShitBackdrop}>
        <CircularProgress color="primary" />
      </Backdrop>
    </div>;
  }
}

Header.contextType = DBContext;
export default withStyles(styles, {withTheme: true})(Header);
