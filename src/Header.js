import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {AppBar, Card, CardContent, Toolbar, Typography, IconButton, Dialog, DialogTitle, Grid, ListItemText, TextField} from '@material-ui/core';
import {Menu, Settings} from '@material-ui/icons';
import {DBContext} from './LocalDB.js';

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
  card: {
    width: 120,
  },
  popup: {
    width: 600,
  },
}));

function Header() {
  const [open, setOpen] = React.useState(false);
  const classes = useStyles();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = (value) => {
    setOpen(false);
  };

  return <div className={classes.root}>
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" className={classes.menuButton} aria-label="menu">
          <Menu />
        </IconButton>
        <Typography variant="h6" className={classes.title}>
          Eco Calculator
        </Typography>
        <IconButton edge="end" color="inherit" onClick={handleClickOpen}><Settings/></IconButton>
      </Toolbar>
    </AppBar>
    <Dialog className={classes.popup} onClose={handleClose} aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">Set raw goods pricing</DialogTitle>
      <Grid containuer direction="row">
        <DBContext.Consumer>
          {(localdb) => Array.from(localdb.rawMats.keys()).map((rawMat) => (
            <Grid item>
              <Card className={classes.card} variant="outlined">
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    {rawMat}
                  </Typography>
                  <TextField
                    label="Price"
                    type="number"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="outlined"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </DBContext.Consumer>
      </Grid>
    </Dialog>
  </div>;
}

export default Header;
