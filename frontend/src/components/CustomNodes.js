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

// =============================================================================
// NODE WRAPPER COMPONENT
// =============================================================================
/**
 * Shared wrapper component for all node types
 * Provides consistent styling, layout, and delete functionality
 * @param {Object} props - Component properties
 * @param {ReactNode} props.children - Content to render inside the node
 * @param {ReactNode} props.header - Header content for the node
 * @param {Object} props.data - Node data containing callback functions
 * @param {string} props.id - Unique identifier for the node
 */
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
    {/* Delete button positioned in top-right corner */}
    <IconButton
      onClick={() => data.onDeleteNode(id)}
      size="small"
      sx={{ position: "absolute", top: 4, right: 4, zIndex: 10 }}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
    
    {/* Node header section with consistent styling */}
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
    
    {/* Main content area of the node */}
    <CardContent>{children}</CardContent>
  </Card>
);

// =============================================================================
// USER INPUT NODE COMPONENT
// =============================================================================
/**
 * Node for capturing user input/queries
 * Features a text area for entering queries and connects to downstream nodes
 * @param {Object} props - Component properties
 * @param {Object} props.data - Node data containing query value and update function
 * @param {string} props.id - Unique identifier for the node
 */
export const UserInputNode = ({ data, id }) => {
  const handleChange = (e) =>
    data.updateNodeData(id, { query: e.target.value });
  
  return (
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
      {/* Output handle for connecting to other nodes */}
      <Handle type="source" position={Position.Right} id="query" />
      
      {/* Informational banner */}
      <Box sx={{ bgcolor: "#e8f0fe", borderRadius: 1, p: 1, mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Enter point for queries
        </Typography>
      </Box>
      
      {/* Query input field */}
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

// =============================================================================
// KNOWLEDGE BASE NODE COMPONENT
// =============================================================================
/**
 * Node for uploading and managing knowledge base documents
 * Handles PDF file uploads and connects to LLM nodes
 * @param {Object} props - Component properties
 * @param {Object} props.data - Node data containing file information and update function
 * @param {string} props.id - Unique identifier for the node
 */
export const KnowledgeBaseNode = ({ data, id }) => {
  /**
   * Handles file upload to the backend API
   * @param {Event} event - File input change event
   */
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
      {/* Output handle for providing context to LLM nodes */}
      <Handle type="source" position={Position.Right} id="context" />
      
      {/* Informational banner */}
      <Box sx={{ bgcolor: "#e8f0fe", borderRadius: 1, p: 1, mb: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: '#174ea6', fontWeight: 500 }}>Let LLM search info in your file</Typography>
      </Box>
      
      {/* File upload button */}
      <Button variant="outlined" component="label" fullWidth>
        Upload PDF
        <input type="file" hidden onChange={handleFileChange} accept=".pdf" />
      </Button>
      
      {/* Display uploaded filename */}
      {data.filename && (
        <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>File: {data.filename}</Typography>
      )}
    </NodeWrapper>
  );
};

// =============================================================================
// LLM GEMINI NODE COMPONENT
// =============================================================================
/**
 * Complex node for configuring and running Gemini LLM models
 * Supports multiple inputs, model selection, and advanced settings
 * @param {Object} props - Component properties
 * @param {Object} props.data - Node data containing model configuration and update function
 * @param {string} props.id - Unique identifier for the node
 */
export const LLMGeminiNode = ({ data, id }) => {
  const handleChange = (e) =>
    data.updateNodeData(id, { [e.target.name]: e.target.value });
  const handleSwitch = (e) =>
    data.updateNodeData(id, { [e.target.name]: e.target.checked });

  // Consistent styling for configuration rows
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
      data={data}
      id={id}
      header={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToyIcon fontSize="small" sx={{ color: "primary.main" }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            LLM (Gemini)
          </Typography>
        </Box>
      }
    >
      {/* Input handles for receiving data from other nodes */}
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
      
      {/* Output handle for sending processed data to other nodes */}
      <Handle type="source" position={Position.Right} id="output" />

      {/* Informational banner */}
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

      {/* Model selection dropdown */}
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

      {/* API key input field */}
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

      {/* Prompt template with placeholders */}
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

      {/* Temperature control for model creativity */}
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

      {/* Web search toggle and configuration */}
      <Box sx={rowStyle}>
        <Typography variant="body2" sx={{ flexGrow: 1 }}>
          WebSearch Tool
        </Typography>
        <Switch
          name="websearchEnabled"
          checked={data.websearchEnabled || false}
          onChange={handleSwitch}
        />
      </Box>

      {/* SERP API key input (only shown when web search is enabled) */}
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

// =============================================================================
// OUTPUT NODE COMPONENT
// =============================================================================
/**
 * Final output node for displaying processed results
 * Receives data from LLM nodes and presents it in a readable format
 * @param {Object} props - Component properties
 * @param {Object} props.data - Node data containing output content
 * @param {string} props.id - Unique identifier for the node
 */
export const OutputNode = ({ data, id }) => (
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
    {/* Input handle for receiving data from processing nodes */}
    <Handle type="target" position={Position.Left} id="input" />
    
    {/* Informational banner */}
    <Box sx={{ bgcolor: "#e8f0fe", borderRadius: 1, p: 1, mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Output of the result nodes as text
      </Typography>
    </Box>
    
    {/* Output display area with formatted text */}
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