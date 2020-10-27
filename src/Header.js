import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { AppBar, Toolbar, Typography, IconButton  } from '@material-ui/core';
import { Menu, Settings } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
}));

function Header() {
  const classes = useStyles();

  return <div className={classes.root}>
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" className={classes.menuButton} aria-label="menu">
          <Menu />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          Eco Calculator
        </Typography>
        <IconButton edge="end" color="inherit"><Settings/></IconButton>
      </Toolbar>
    </AppBar>
  </div>
}

export default Header
