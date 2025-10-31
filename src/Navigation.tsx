import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box,
    AppBar,
    Toolbar,
    Typography,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Stack,
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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleSignOut = () => {
        auth.signOut();
        navigate('/');
        handleMenuClose();
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        handleMenuClose();
    };

    const currentSection = location.pathname.split('/')[1] || 'presets';

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <AppBar position="fixed">
                <Toolbar>
                    <Typography
                        variant="h5"
                        component="div"
                        fontWeight={'bold'}
                        sx={{
                            flexGrow: { xs: 1, md: 0 },
                            mr: { md: 4 }
                        }}
                    >
                        Teyate
                    </Typography>

                    {/* Desktop navigation */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            flexGrow: 1
                        }}
                    >
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/sessions')}
                            startIcon={<SessionsIcon />}
                            variant={'text'}
                        >
                            <Typography fontWeight={currentSection === 'sessions' ? 'bold' : 'normal'}>Sessions</Typography>
                        </Button>
                        <Button
                            color="inherit"
                            onClick={() => handleNavigation('/presets')}
                            startIcon={<PresetsIcon />}
                            variant={'text'}
                        >
                            <Typography fontWeight={currentSection === 'presets' ? 'bold' : 'normal'}>Presets</Typography>
                        </Button>
                    </Stack>

                    {/* Desktop logout button */}
                    <Button
                        color="inherit"
                        onClick={handleSignOut}
                        startIcon={<LogoutIcon />}
                        sx={{ display: { xs: 'none', md: 'flex' } }}
                    >
                        Sign Out
                    </Button>

                    {/* Mobile menu button */}
                    <IconButton
                        color="inherit"
                        edge="end"
                        onClick={handleMenuClick}
                        sx={{ display: { xs: 'flex', md: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* Mobile menu */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        sx={{ display: { xs: 'block', md: 'none' } }}
                    >
                        <MenuItem onClick={() => handleNavigation('/sessions')}>
                            <SessionsIcon sx={{ mr: 1 }} /> Sessions
                        </MenuItem>
                        <MenuItem onClick={() => handleNavigation('/presets')}>
                            <PresetsIcon sx={{ mr: 1 }} /> Presets
                        </MenuItem>
                        <MenuItem onClick={handleSignOut}>
                            <LogoutIcon sx={{ mr: 1 }} /> Sign Out
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    mt: 4,
                    backgroundColor: 'grey.50'
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default Navigation;