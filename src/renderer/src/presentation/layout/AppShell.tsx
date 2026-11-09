import type { ReactNode } from 'react';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import RuleIcon from '@mui/icons-material/Rule';
import InsightsIcon from '@mui/icons-material/Insights';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const DRAWER_WIDTH = 240;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon /> },
  { label: 'Escala semanal', icon: <CalendarMonthIcon /> },
  { label: 'Colaboradores', icon: <GroupIcon /> },
  { label: 'Regras e cobertura', icon: <RuleIcon /> },
  { label: 'Equilíbrio', icon: <InsightsIcon /> },
];

interface AppShellProps {
  readonly mode: 'light' | 'dark';
  readonly onToggleMode: () => void;
  readonly children: ReactNode;
}

export function AppShell({ mode, onToggleMode, children }: AppShellProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="default"
        elevation={0}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <Typography variant="h3" component="h1" sx={{ flexGrow: 1 }}>
            Sistema Hora Rotativa
          </Typography>
          <Tooltip title={mode === 'light' ? 'Tema escuro' : 'Tema claro'}>
            <IconButton onClick={onToggleMode} aria-label="Alternar tema">
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <List component="nav">
          {navItems.map((item, index) => (
            <ListItemButton key={item.label} selected={index === 0}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
