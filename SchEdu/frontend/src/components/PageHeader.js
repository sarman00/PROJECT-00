import React from 'react';
import { Paper, Box, Typography, useTheme } from '@mui/material';

export default function PageHeader({ icon, title, subtitle, action }) {
  const theme = useTheme();
  return (
    <Paper elevation={0} sx={{
      p: 3,
      mb: 3,
      borderRadius: 3,
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, backgroundColor: theme.palette.primary.main }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ fontSize: 0, color: theme.palette.primary.main }}>{icon}</Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="secondary">{subtitle}</Typography>
            )}
          </Box>
        </Box>
        {action && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>{action}</Box>}
      </Box>
    </Paper>
  );
}

