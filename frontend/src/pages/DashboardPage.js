import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  CardContent,
  CardActions,
  Modal,
  TextField,
  Paper,
  AppBar,
  Toolbar,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import LaunchIcon from "@mui/icons-material/Launch";
import myLogo from "../assets/my-logo.png";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const DashboardPage = () => {
  const [stacks, setStacks] = useState([]);
  const [open, setOpen] = useState(false);
  const [newStackName, setNewStackName] = useState("");
  const [newStackDesc, setNewStackDesc] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStacks();
  }, []);

  const fetchStacks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/stacks`);
      setStacks(response.data);
    } catch (error) {
      console.error("Failed to fetch stacks:", error);
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCreateStack = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/stacks`, {
        name: newStackName,
        description: newStackDesc,
      });
      handleClose();
      navigate(`/stack/${response.data.id}`);
    } catch (error) {
      console.error("Failed to create stack:", error);
    }
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={1}>
        {/* FIX 1: The Container centers the header content */}
        <Container sx={{ maxWidth: "1800px !important" }}>
          <Toolbar disableGutters>
            <img
              src={myLogo}
              alt="IAJ Stack Logo"
              style={{ height: "28px", marginRight: "8px" }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ flexGrow: 1, fontWeight: 600 }}
            >
              GenAI Stack
            </Typography>
            <Avatar sx={{ bgcolor: "secondary.main" }}>IJ</Avatar>
          </Toolbar>
        </Container>
      </AppBar>

      <Container sx={{ mt: 4, maxWidth: "1800px !important" }}>
        {/* FIX 2 & 3: This content will now align perfectly under the header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            My Stacks
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            sx={{
              borderRadius: "8px", // pill style
              px: 3, // optional: wider button padding
              py: 1.2, // optional: taller button padding
            }}
          >
            New Stack
          </Button>
        </Box>

        {stacks.length > 0 ? (
          // This Box is now a CSS Grid container
          <Box
            sx={{
              display: "grid",
              // This is the key: it creates responsive columns
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 3, // Sets the space between cards
            }}
          >
            {stacks.map((stack) => (
              // The Card is now the grid item. No extra Box wrapper is needed.
              <Card
                key={stack.id}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    gutterBottom
                    variant="h6"
                    component="h2"
                    sx={{ fontWeight: "bold", overflowWrap: "break-word" }}
                  >
                    {stack.name}
                  </Typography>
                  <Typography
                    sx={{ color: "text.secondary", overflowWrap: "break-word" }}
                  >
                    {stack.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "flex-end", p: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<LaunchIcon />}
                    onClick={() => navigate(`/stack/${stack.id}`)}
                  >
                    Edit Stack
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>
        ) : (
          // Empty State
          <Paper
            variant="outlined"
            sx={{
              mt: 10,
              p: 4,
              textAlign: "start",
              // --- ADD THESE TWO LINES ---
              maxWidth: "400px", // Sets a maximum width for the container
              mx: "auto",
            }}
          >
            <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 600 }}>
              Create New Stack
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Start building your generative AI apps with our essential tools
              and frameworks
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
              sx={{
                borderRadius: "8px",
                px: 3,
                py: 1.2,
              }}
            >
              New Stack
            </Button>
          </Paper>
        )}

        {/* Create New Stack Modal */}
        <Modal open={open} onClose={handleClose}>
          <Box sx={modalStyle}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
              Create New Stack
            </Typography>
            <TextField
              fullWidth
              label="Name"
              value={newStackName}
              onChange={(e) => setNewStackName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={4}
              value={newStackDesc}
              onChange={(e) => setNewStackDesc(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
              <Button onClick={handleClose}>Cancel</Button>
              <Button variant="contained" onClick={handleCreateStack}>
                Create
              </Button>
            </Box>
          </Box>
        </Modal>
      </Container>
    </>
  );
};

export default DashboardPage;
