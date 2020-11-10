import React from 'react';
import {fade, withStyles} from '@material-ui/core/styles';
import {Autocomplete} from '@material-ui/lab';
import {AppBar, Tabs, Popper, InputBase, Tab, Select, MenuItem, Backdrop, CircularProgress, Card, CardContent, Toolbar, Typography, IconButton, Dialog, DialogTitle, DialogContent, Grid, TextField} from '@material-ui/core';
import {Menu, Settings, Search} from '@material-ui/icons';
import {DBContext} from './LocalDB.js';

const styles = (theme) => ({
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing(3),
      width: 'auto',
    },
  },
  searchIcon: {
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
});

class SearchBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      autocompleteVisible: true,
      anchorEl: undefined,
    };
  }

  handleChange(event) {
    this.setState({
      anchorEl: event.currentTarget,
      autocompleteVisible: true
    })
  };

  render() {
    const {classes} = this.props;
    const {autocompleteVisible, anchorEl} = this.state;

    return <><div className={classes.search}>
            <div className={classes.searchIcon}>
              <Search />
            </div>
            <InputBase
              placeholder="Search…"
              classes={{
                root: classes.inputRoot,
                input: classes.inputInput,
              }}
              onChange={(e) => this.handleChange(e)}
              inputProps={{ 'aria-label': 'search' }}
            />
          </div>
          <Popper open={autocompleteVisible} anchorEl={anchorEl}>
            <div className={classes.paper}>The content of the Popper.</div>
          </Popper></>;
  }
}

SearchBar.contextType = DBContext;
export default withStyles(styles, {withTheme: true})(SearchBar);
