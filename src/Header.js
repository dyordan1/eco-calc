import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import {AppBar, Tabs, Tab, Select, MenuItem, Backdrop, CircularProgress, Card, CardContent, Toolbar, Typography, IconButton, Dialog, DialogTitle, DialogContent, Grid, TextField} from '@material-ui/core';
import {Menu, Settings} from '@material-ui/icons';
import {DBContext} from './LocalDB.js';
import SearchBar from './Search.js';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  card: {
    width: 150,
  },
  gridRoot: {
    flexGrow: 1,
  },
  slowAsShitBackdrop: {
    zIndex: 1,
  },
  grow: {
    flexGrow: 1,
  },
});

class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsOpen: false,
      slowAsShitPopupOpen: false,
      settingsTabOpen: 0,
    };
  }

  handleClickOpen() {
    this.setState({settingsOpen: true});
  };

  handleClose() {
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

  updateTier(label) {
    return (event) => {
      let value = event.target.value;
      if (value !== '' && !isNaN(value)) {
        this.context.updateTableTier(label, value);
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

  handleChange(newValue) {
    this.setState({settingsTabOpen: newValue});
  };

  render() {
    const {classes} = this.props;
    const {settingsOpen, slowAsShitPopupOpen, settingsTabOpen} = this.state;

    return <div className={classes.root}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton edge="start" color="inherit" className={classes.menuButton} aria-label="menu">
            <Menu />
          </IconButton>
          <Typography variant="h6" className={classes.title}>
            Eco Calculator
          </Typography>
          <SearchBar />
          <div className={classes.grow} />
          <IconButton edge="end" color="inherit" onClick={() => this.handleClickOpen()}><Settings/></IconButton>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <Dialog fullWidth={true} maxWidth="lg" onClose={() => this.handleClose()} aria-labelledby="simple-dialog-title" open={settingsOpen}>
        <DialogTitle id="simple-dialog-title">Set raw goods pricing</DialogTitle>
        <DialogContent>
          <AppBar position="static">
            <Tabs value={settingsTabOpen} onChange={(e, val) => this.handleChange(val)} aria-label="simple tabs example">
              <Tab label="Raw Goods" />
              <Tab label="Crafting Tables" />
              <Tab label="Profit Margins" />
            </Tabs>
          </AppBar>
          {settingsTabOpen === 0 &&
            (<Grid container className={classes.gridRoot} justify="center" spacing={2}>
              <DBContext.Consumer>
                {(localdb) => Array.from(localdb.rawMats.values()).map((rawMat) => (
                  <Grid item key={rawMat.label}>
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
                          variant="outlined"
                          defaultValue={rawMat.price}
                          onChange={(event) => this.updatePricing(rawMat.label)(event)}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </DBContext.Consumer>
            </Grid>)}
            {settingsTabOpen === 1 &&
              (<Grid container className={classes.gridRoot} justify="center" spacing={2}>
                <DBContext.Consumer>
                  {(localdb) => Array.from(localdb.tables.values()).map((table) => (
                    <Grid item key={table.label}>
                      <Card className={classes.card} variant="outlined">
                        <CardContent>
                          <Typography color="textSecondary" gutterBottom>
                            {table.label}
                          </Typography>
                          <Select
                            label="Installed Upgrade"
                            defaultValue={table.installedUpgradeTier}
                            variant="outlined"
                            onChange={(event) => this.updateTier(table.label)(event)}
                          >
                            <MenuItem value={0}>
                              <em>None</em>
                            </MenuItem>
                            <MenuItem value={1}>Upgrade 1</MenuItem>
                            <MenuItem value={2}>Upgrade 2</MenuItem>
                            <MenuItem value={3}>Upgrade 3</MenuItem>
                            <MenuItem value={4}>Upgrade 4</MenuItem>
                            <MenuItem value={5}>Specialty</MenuItem>
                          </Select>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </DBContext.Consumer>
              </Grid>)}
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
