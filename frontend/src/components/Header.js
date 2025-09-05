// frontend/src/components/Header.js
import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
} from "@mui/material";
import myLogo from '../assets/my-logo.png';

const BuilderHeader = ({ stackName, onSave }) => (
  <AppBar position="static" color="default" elevation={1}>
    <Toolbar>
      <img src={myLogo} alt="IAJ Stack Logo" style={{ height: '28px', marginRight: '8px' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            GenAI Stack
          </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Button variant="outlined" onClick={onSave}>
          Save
        </Button>
        <Avatar sx={{ bgcolor: "secondary.main", ml: 2 }}>IJ</Avatar>
      </Box>
    </Toolbar>
  </AppBar>
);

export default BuilderHeader;
