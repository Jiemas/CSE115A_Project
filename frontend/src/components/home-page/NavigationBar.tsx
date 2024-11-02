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
  ListItemIcon
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu'; 
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

export const NavigationBar: React.FC = () => {

  const navigate = useNavigate();

  const pageIcons = [ 
    <LogoutIcon />,
  ];
  const pageLabels = ['Logout'];

  const adminOptions = [false];

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

  const handleLogout = () => {
    sessionStorage.removeItem('accessToken');
    navigate('/login');
  };

  const handleClick = () => {
    navigate('/');
  }

  const listMenuOptions = () => (
    <Box
      sx={{ width: 'auto' }}
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {pageIcons.map((icon, index) =>
          !adminOptions[index] ? (
            <ListItem button key={index} onClick={handleLogout}
            >
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
          <Typography variant="h5">Rapid Review</Typography>
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
          <Button
            onClick={handleLogout}
            sx={{ color: 'white', marginRight: 2 }}
          >
            Logout 
            <LogoutIcon />
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};