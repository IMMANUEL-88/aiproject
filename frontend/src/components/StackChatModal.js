// frontend/src/components/StackChatModal.js
import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, IconButton, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '60%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  height: '80vh',
};

const StackChatModal = ({ open, onClose, onSendMessage, messages, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">Chat With Stack (PDF Context)</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Paper variant="outlined" sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: '#f9f9f9' }}>
          <List>
            {messages.map((msg, index) => (
              <ListItem key={index} sx={{flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'}}>
                 <Paper sx={{p: 1.5, borderRadius: 2, bgcolor: msg.sender === 'user' ? '#e3f2fd' : '#fff' }}>
                    <ListItemText primary={msg.text} />
                 </Paper>
              </ListItem>
            ))}
            {isLoading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', mt: 1 }} />}
          </List>
        </Paper>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Ask a question about your document..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSend} disabled={isLoading}>
                  <SendIcon />
                </IconButton>
              ),
            }}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default StackChatModal;