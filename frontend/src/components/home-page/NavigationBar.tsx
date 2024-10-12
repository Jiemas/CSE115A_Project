import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  Button,
  ButtonBase,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AddCardIcon from '@mui/icons-material/AddCard';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth, UserRole } from '../../auth/AuthContext';

export const NavigationBar: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user && user.role === UserRole.Admin;

  const pageIcons = [
    <AddCardIcon />,
    <FilterListIcon />,
    <AccountCircleIcon />,
  ];
  const pageLabels = ['Add Item', 'Filter', 'Account Info'];

  const adminOptions = [true, false, false];

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleDrawer =
    (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === 'keydown' &&
        ((event as React.KeyboardEvent).key === 'Tab' ||
          (event as React.KeyboardEvent).key === 'Shift')
      ) {
        return;
      }
      setDrawerOpen(open);
    };

  const handleClick = () => {
    console.log('Button Clicked.');
  };

  const listMenuOptions = () => (
    <Box
      sx={{ width: 'auto' }}
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {pageIcons.map((icon, index) =>
          isAdmin || !adminOptions[index] ? (
            <ListItem button key={index}>
              <ListItemIcon sx={{ minWidth: 'auto', marginRight: '8px' }}>
                {icon}
              </ListItemIcon>
              <ListItemText primary={pageLabels[index]} />
            </ListItem>
          ) : null
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="static">
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <ButtonBase
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0.5,
            borderRadius: '4px',
          }}
        >
          <Typography variant="h5">DSN App Dashboard</Typography>
        </ButtonBase>
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="small"
            onClick={toggleDrawer(true)}
            color="inherit"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Drawer anchor="top" open={drawerOpen} onClose={toggleDrawer(false)}>
            {listMenuOptions()}
          </Drawer>
        </Box>
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'center',
          }}
        >
          {pageIcons.map((icon, index) =>
            isAdmin || !adminOptions[index] ? (
              <Button
                key={index}
                onClick={handleClick}
                startIcon={icon}
                sx={{ color: 'white', marginRight: 2 }}
              >
                {pageLabels[index]}
              </Button>
            ) : null
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};