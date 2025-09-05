import React from "react";
import { Handle, Position } from "reactflow";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Divider,
  Switch,
  Button,
  Box,
  IconButton,
  Paper,
} from "@mui/material";
import axios from "axios";
import CloseIcon from "@mui/icons-material/Close";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import InputIcon from "@mui/icons-material/Input";
import SmartToyIcon from '@mui/icons-material/SmartToy';
// This is the shared wrapper for all nodes
const NodeWrapper = ({ children, header, data, id }) => (
  <Card
    sx={{
      borderRadius: 2,
      border: "1px solid #ddd",
      minWidth: 300,
      position: "relative",
    }}
    elevation={2}
  >
    <IconButton
      // This now receives the 'data' prop correctly
      onClick={() => data.onDeleteNode(id)}
      size="small"
      sx={{ position: "absolute", top: 4, right: 4, zIndex: 10 }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
    <Typography
      sx={{
        bgcolor: "#f0f0f0",
        p: 1,
        borderBottom: "1px solid #ddd",
        pr: "32px",
      }}
    >
      {header}
    </Typography>
    <CardContent>{children}</CardContent>
  </Card>
);

export const UserInputNode = ({ data, id }) => {
  const handleChange = (e) =>
    data.updateNodeData(id, { query: e.target.value });
  return (
    // Pass `data` and `id` to the wrapper to enable deletion
    <NodeWrapper
      data={data}
      id={id}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <InputIcon fontSize="small" sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            User Input
          </Typography>
        </Box>
      }
    >
      <Handle type="source" position={Position.Right} id="query" />
      <Box sx={{ bgcolor: "#e8f0fe", borderRadius: 1, p: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Enter point for queries
        </Typography>
      </Box>
      <Box>
        <Typography
          variant="body2"
          sx={{ mb: 1, fontWeight: 500, color: "text.primary" }}
        >
          Query
        </Typography>
        <TextField
          placeholder="Write your query here"
          multiline
          rows={3}
          fullWidth
          value={data.query || ""}
          onChange={handleChange}
        />
      </Box>
    </NodeWrapper>
  );
};

export const KnowledgeBaseNode = ({ data, id }) => {
  // This function handles the file upload API call
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      data.updateNodeData(id, { filename: "Uploading..." });

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/documents/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      
      data.updateNodeData(id, {
        doc_id: response.data.doc_id,
        filename: file.name,
      });

    } catch (error) {
      console.error("File upload failed:", error);
      alert("File upload failed!");
      data.updateNodeData(id, { filename: "Upload failed" });
    }
  };

  return (
    <NodeWrapper data={data} id={id} header={
        <Box sx={{ p: 1.5, borderBottom: '1px solid #eee', display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Knowledge Base</Typography>
        </Box>
    }>
      <Handle type="source" position={Position.Right} id="context" />
      <Box sx={{ bgcolor: "#e8f0fe", borderRadius: 1, p: 1, mb: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#174ea6', fontWeight: 500 }}>Let LLM search info in your file</Typography>
      </Box>
      <Button variant="outlined" component="label" fullWidth>
        Upload PDF
        <input type="file" hidden onChange={handleFileChange} accept=".pdf" />
      </Button>
      {data.filename && (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>File: {data.filename}</Typography>
      )}
    </NodeWrapper>
  );
};

export const LLMGeminiNode = ({ data, id }) => {
  const handleChange = (e) =>
    data.updateNodeData(id, { [e.target.name]: e.target.value });
  const handleSwitch = (e) =>
    data.updateNodeData(id, { [e.target.name]: e.target.checked });

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    gap: "8px",
    marginBottom: "8px",
  };

  return (
    <NodeWrapper
      data={data} // Add this line
      id={id} // Add this line
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToyIcon fontSize="small" sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            LLM (Gemini)
          </Typography>
        </Box>
      }
    >
      {/* --- Two Distinct Handles Only --- */}
      <Handle
        type="target"
        position={Position.Left}
        id="query"
        style={{ top: 95 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="context"
        style={{ top: 155 }}
      />
      <Handle type="source" position={Position.Right} id="output" />

      <Box
        sx={{
          bgcolor: "#e8f0fe",
          borderRadius: 1,
          p: 1,
          mb: 2,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Run a query with OpenAl LLM
        </Typography>
      </Box>

      <Select
        name="model"
        value={data.model || "gemini-1.5-flash"}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 1 }}
      >
        <MenuItem value="gemini-1.5-flash">Gemini 1.5 Flash</MenuItem>
        <MenuItem value="gemini-1.5-pro">Gemini 1.5 Pro</MenuItem>
      </Select>

      <Box sx={rowStyle}>
        <Typography variant="body2">API Key</Typography>
        <TextField
          name="apiKey"
          type="password"
          defaultValue={data.apiKey}
          onChange={handleChange}
          size="small"
          sx={{ flexGrow: 1 }}
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      <TextField
        label="Prompt"
        name="prompt"
        multiline
        rows={4}
        fullWidth
        value={data.prompt || "Context: {context}\n\nQuery: {query}"}
        onChange={handleChange}
        helperText="Use {context} and {query} placeholders."
        sx={{ mb: 1 }}
        InputProps={{
          readOnly: true,
        }}
      />

      <Box sx={rowStyle}>
        <Typography variant="body2">Temperature</Typography>
        <TextField
          name="temperature"
          type="number"
          defaultValue={data.temperature || 0.7}
          onChange={handleChange}
          size="small"
          InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }}
          sx={{ width: "100px" }}
        />
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* --- CORRECTED WebSearch ROW (NO HANDLE) --- */}
      <Box sx={rowStyle}>
        {/* The extra handle for websearch has been removed from this row. */}
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          WebSearch Tool
        </Typography>
        <Switch
          name="websearchEnabled"
          checked={data.websearchEnabled || false}
          onChange={handleSwitch}
        />
      </Box>

      {data.websearchEnabled && (
        <Box sx={rowStyle}>
          <Typography variant="body2">SERP API Key</Typography>
          <TextField
            name="serpApiKey"
            type="password"
            defaultValue={data.serpApiKey}
            onChange={handleChange}
            size="small"
            sx={{ flexGrow: 1 }}
          />
        </Box>
      )}
    </NodeWrapper>
  );
};

export const OutputNode = ({ data, id }) => (
  // Pass `data` and `id` to the wrapper to enable deletion
  <NodeWrapper
    data={data}
    id={id}
    header={
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <DescriptionOutlinedIcon
          fontSize="small"
          sx={{ color: "primary.main" }}
        />
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Output
        </Typography>
      </Box>
    }
  >
    <Handle type="target" position={Position.Left} id="input" />
    <Box sx={{ bgcolor: "#e8f0fe", borderRadius: 1, p: 1, mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Output of the result nodes as text
      </Typography>
    </Box>
    <Box
      sx={{
        padding: "16px",
        marginTop: "8px",
        backgroundColor: "#f5f5f5",
        borderRadius: "4px",
        border: "1px solid #e0e0e0",
        minHeight: "80px",
        maxHeight: "400px",
        overflowY: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        color: data.output ? "text.primary" : "text.secondary",
        fontSize: "0.875rem",
      }}
    >
      {data.output || "Output will be generated here..."}
    </Box>
  </NodeWrapper>
);
