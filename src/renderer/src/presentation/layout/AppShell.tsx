import type { ReactNode } from 'react';
import {
  Avatar,
  Box,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/GridView';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import RuleIcon from '@mui/icons-material/Rule';
import InsightsIcon from '@mui/icons-material/Insights';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton } from '@mui/material';
import { palette } from '@presentation/theme/tokens';

const SIDEBAR_WIDTH = 236;

export type PageKey = 'dashboard' | 'schedule' | 'employees' | 'rules' | 'balance' | 'diagnostics';

const navItems: { readonly label: string; readonly icon: ReactNode; readonly page: PageKey }[] = [
  { label: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
  { label: 'Escala semanal', icon: <CalendarMonthIcon />, page: 'schedule' },
  { label: 'Colaboradores', icon: <GroupIcon />, page: 'employees' },
  { label: 'Regras e cobertura', icon: <RuleIcon />, page: 'rules' },
  { label: 'Equilíbrio', icon: <InsightsIcon />, page: 'balance' },
  { label: 'Diagnóstico', icon: <MonitorHeartIcon />, page: 'diagnostics' },
];

interface AppShellProps {
  readonly mode: 'light' | 'dark';
  readonly onToggleMode: () => void;
  readonly activePage: PageKey;
  readonly onNavigate: (page: PageKey) => void;
  readonly children: ReactNode;
}

export function AppShell({
  mode,
  onToggleMode,
  activePage,
  onNavigate,
  children,
}: AppShellProps): JSX.Element {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Topbar mode={mode} onToggleMode={onToggleMode} />
        <Box component="main" sx={{ p: 3, flex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

interface SidebarProps {
  readonly activePage: PageKey;
  readonly onNavigate: (page: PageKey) => void;
}

function Sidebar({ activePage, onNavigate }: SidebarProps): JSX.Element {
  return (
    <Box
      component="nav"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: palette.brand.sidebar,
        color: palette.brand.onSidebar,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 2 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1.5,
            bgcolor: '#ffffff',
            color: palette.primary.dark,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
          }}
        >
          H
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Hora Rotativa</Typography>
      </Box>

      <List sx={{ mt: 2, flex: 1 }}>
        {navItems.map((item) => {
          const active = activePage === item.page;
          return (
            <ListItemButton
              key={item.label}
              selected={active}
              onClick={() => onNavigate(item.page)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: active ? palette.brand.activePillText : palette.brand.onSidebarMuted,
                bgcolor: active ? '#ffffff' : 'transparent',
                '&.Mui-selected': { bgcolor: '#ffffff' },
                '&.Mui-selected:hover': { bgcolor: '#ffffff' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 500 }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <ListItemButton sx={{ borderRadius: 2, color: palette.brand.onSidebarMuted }}>
        <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
          <LogoutIcon />
        </ListItemIcon>
        <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: 14 }} />
      </ListItemButton>
    </Box>
  );
}

interface TopbarProps {
  readonly mode: 'light' | 'dark';
  readonly onToggleMode: () => void;
}

function Topbar({ mode, onToggleMode }: TopbarProps): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: 'background.paper',
          borderRadius: 999,
          px: 2,
          py: 1,
          width: 320,
          maxWidth: '40%',
          boxShadow: '0 1px 3px rgba(34,43,69,0.06)',
        }}
      >
        <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
        <InputBase placeholder="Buscar colaborador…" sx={{ fontSize: 14, flex: 1 }} />
      </Box>

      <Box sx={{ flex: 1 }} />

      <Tooltip title={mode === 'light' ? 'Tema escuro' : 'Tema claro'}>
        <IconButton onClick={onToggleMode} aria-label="Alternar tema">
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>
      <IconButton aria-label="Notificações">
        <NotificationsNoneIcon />
      </IconButton>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          sx={{
            width: 34,
            height: 34,
            bgcolor: palette.primary.light,
            color: palette.primary.dark,
            fontSize: 14,
          }}
        >
          GN
        </Avatar>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>Gabriel Novaes</Typography>
      </Box>
    </Box>
  );
}
