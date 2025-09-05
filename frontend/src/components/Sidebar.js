// frontend/src/components/Sidebar.js
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import ChatIcon from '@mui/icons-material/Chat';
import InputIcon from '@mui/icons-material/Input';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

const onDragStart = (event, nodeType) => {
  event.dataTransfer.setData('application/reactflow', nodeType);
  event.dataTransfer.effectAllowed = 'move';
};

const components = [
  { type: 'userInput', name: 'User Input', icon: <InputIcon fontSize="small" /> },
  { type: 'llmGemini', name: 'LLM (GeminiAI)', icon: <SmartToyIcon fontSize="small" /> },
  { type: 'knowledgeBase', name: 'Knowledge Base', icon: <LibraryBooksIcon fontSize="small" /> },
  { type: 'output', name: 'Output', icon: <DescriptionOutlinedIcon fontSize="small" /> },
];

// The onClick prop is now passed from the parent (BuilderPage)
const Sidebar = ({ onChatWithAiClick }) => {
  return (
    <Paper sx={{ width: 280, padding: 2, borderRight: '1px solid #eee', height: '100%' }}>
      <Button variant="outlined" fullWidth startIcon={<ChatIcon />} onClick={onChatWithAiClick}>
        Chat With AI
      </Button>
      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Components</Typography>
      {components.map((comp) => (
        <Paper
          key={comp.type}
          onDragStart={(event) => onDragStart(event, comp.type)}
          draggable
          variant="outlined"
          sx={{ p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'grab' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {comp.icon}
            <Typography>{comp.name}</Typography>
          </Box>
          <DragIndicatorIcon color="action" />
        </Paper>
      ))}
    </Paper>
  );
};

export default Sidebar;