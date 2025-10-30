import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider,
} from '@mui/material';
import {
    Menu as MenuIcon,
    ViewList as PresetsIcon,
    PlayCircle as SessionsIcon,
    Logout as LogoutIcon,
} from '@mui/icons-material';
import { auth } from './firebase';

type NavigationProps = {
    children: React.ReactNode;
};

function Navigation({ children }: NavigationProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleSignOut = () => {
        auth.signOut();
        navigate('/');
    };

    const menuItems = [
        { text: 'Presets', icon: <PresetsIcon />, path: '/presets' },
        { text: 'Sessions', icon: <SessionsIcon />, path: '/sessions' },
    ];

    // Get the current section (presets or sessions) for highlighting
    const currentSection = location.pathname.split('/')[1] || 'presets';

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => setDrawerOpen(v => !v)}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        Teyate
                    </Typography>
                    <Button
                        color="inherit"
                        onClick={handleSignOut}
                        startIcon={<LogoutIcon />}
                    >
                        Sign Out
                    </Button>
                </Toolbar>
            </AppBar>

            {/* Permanent drawer for larger screens */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                    },
                }}
                open
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={currentSection === item.path.slice(1)}
                                    onClick={() => navigate(item.path)}
                                >
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            </Drawer>

            {/* Temporary drawer for mobile */}
            <Drawer
                variant="temporary"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        width: 240,
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={currentSection === item.path.slice(1)}
                                    onClick={() => {
                                        navigate(item.path);
                                        setDrawerOpen(false);
                                    }}
                                >
                                    <ListItemIcon>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                    <Divider />
                </Box>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - 240px)` },
                    minHeight: '100vh',
                    backgroundColor: 'grey.50'
                }}
            >
                <Toolbar /> {/* Spacer for AppBar */}
                {children}
            </Box>
        </Box>
    );
}

export default Navigation;