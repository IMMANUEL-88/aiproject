// ============================================================================
// frontend/src/pages/BuilderPage.js
// Main page for the visual workflow builder with drag-and-drop nodes, 
// workflow execution, stack chat (RAG), and Gemini chat.
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  useReactFlow,
  useViewport,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  Button,
  Fab,
  CircularProgress,
  Typography,
  Paper,
  IconButton,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ChatIcon from "@mui/icons-material/Chat";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";

// --- Custom Component Imports ---
import Sidebar from "../components/Sidebar";
import BuilderHeader from "../components/Header";
import StackChatModal from "../components/StackChatModal";
import GeminiChatModal from "../components/GeminiChatModal";
import {
  UserInputNode,
  KnowledgeBaseNode,
  LLMGeminiNode,
  OutputNode,
} from "../components/CustomNodes";

// ============================================================================
// Node Configuration
// ============================================================================
const nodeTypes = {
  userInput: UserInputNode,
  knowledgeBase: KnowledgeBaseNode,
  llmGemini: LLMGeminiNode,
  output: OutputNode,
};


// ============================================================================
// Custom Controls (Zoom + Fullscreen Toggle)
// ============================================================================
const CustomControls = ({ onToggleFullscreen, isFullscreen }) => {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <Paper
      sx={{
        position: "absolute",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        display: "flex",
        alignItems: "center",
        padding: "4px",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <IconButton onClick={() => zoomIn()} aria-label="zoom in">
        <AddIcon />
      </IconButton>
      <IconButton onClick={() => zoomOut()} aria-label="zoom out">
        <RemoveIcon />
      </IconButton>
      <IconButton onClick={onToggleFullscreen} aria-label="toggle fullscreen">
        {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
      <Typography
        sx={{ width: "50px", textAlign: "center", color: "text.secondary" }}
      >
        {`${Math.round(zoom * 100)}%`}
      </Typography>
    </Paper>
  );
};

// ============================================================================
// Flow Logic Component (handles auto-fit on fullscreen toggle)
// ============================================================================
const FlowLogic = ({ isFullscreen }) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    setTimeout(() => fitView({ duration: 300 }), 100);
  }, [isFullscreen, fitView]);

  return null;
};

// ============================================================================
// Main Builder Page Component
// ============================================================================
const BuilderPage = () => {
  const { stackId } = useParams();
  const navigate = useNavigate();
  const [stack, setStack] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  // --- ReactFlow State ---
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // --- Modals State ---
  const [isStackChatOpen, setIsStackChatOpen] = useState(false);
  const [stackMessages, setStackMessages] = useState([]);
  const [isStackLoading, setIsStackLoading] = useState(false);

  const [isGeminiChatOpen, setIsGeminiChatOpen] = useState(false);
  const [geminiMessages, setGeminiMessages] = useState([]);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  // --- Workflow State ---
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false);
  const [isFlowValid, setIsFlowValid] = useState(false);
  const [isStackChatValid, setIsStackChatValid] = useState(false);

  // --- Fullscreen State ---
  const [isFullscreen, setIsFullscreen] = useState(false);
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prevState) => !prevState);
  }, []);

  // ============================================================================
  // Flow Validation Logic
  // ============================================================================
  useEffect(() => {
    const validateFlow = (nodes, edges) => {
      const userInputNode = nodes.find((node) => node.type === "userInput");
      const knowledgeBaseNode = nodes.find((node) => node.type === "knowledgeBase");
      const llmNode = nodes.find((node) => node.type === "llmGemini");
      const outputNode = nodes.find((node) => node.type === "output");

      if (!userInputNode || !knowledgeBaseNode || !llmNode || !outputNode) {
        return false;
      }

      const isInputToLlmConnected = edges.some(
        (edge) => edge.source === userInputNode.id && edge.target === llmNode.id
      );
      const isKbToLlmConnected = edges.some(
        (edge) => edge.source === knowledgeBaseNode.id && edge.target === llmNode.id
      );
      const isLlmToOutputConnected = edges.some(
        (edge) => edge.source === llmNode.id && edge.target === outputNode.id
      );

      return isInputToLlmConnected && isKbToLlmConnected && isLlmToOutputConnected;
    };

    setIsFlowValid(validateFlow(nodes, edges));
  }, [nodes, edges]);

  // ============================================================================
  // Stack Chat Validation Logic
  // ============================================================================
  useEffect(() => {
    const validateStackChat = (nodes) => {
      const kbNode = nodes.find((node) => node.type === "knowledgeBase");
      return kbNode && !!kbNode.data.doc_id;
    };
    setIsStackChatValid(validateStackChat(nodes));
  }, [nodes]);

  // ============================================================================
  // Node Helpers (Update + Delete)
  // ============================================================================
  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    },
    [setNodes]
  );

  const handleDeleteNode = useCallback(
    (nodeId) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  // ============================================================================
  // Fetch Stack Data
  // ============================================================================
  useEffect(() => {
    const fetchStack = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/stacks/${stackId}`
        );
        setStack(response.data);
        if (response.data.graph && response.data.graph.nodes) {
          const nodesWithUpdater = response.data.graph.nodes.map((node) => ({
            ...node,
            data: {
              ...node.data,
              updateNodeData,
              onDeleteNode: handleDeleteNode,
            },
            selectable: node.type !== "output",
          }));
          setNodes(nodesWithUpdater);
          setEdges(response.data.graph.edges);
        }
      } catch (error) {
        console.error("Failed to fetch stack:", error);
        navigate("/");
      }
    };
    fetchStack();
  }, [stackId, setNodes, setEdges, navigate, updateNodeData, handleDeleteNode]);

  // ============================================================================
  // ReactFlow Handlers (Connect, Drag, Drop)
  // ============================================================================
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      const newNode = {
        id: uuidv4(),
        type,
        position,
        data: {
          label: `${type} node`,
          updateNodeData,
          onDeleteNode: handleDeleteNode,
        },
        selectable: type !== "output",
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, updateNodeData, setNodes, handleDeleteNode]
  );

  // ============================================================================
  // Workflow Execution Handler
  // ============================================================================
  const handleRunWorkflow = async () => {
    setIsWorkflowRunning(true);
    setNodes((nds) =>
      nds.map((node) =>
        node.type === "output"
          ? { ...node, data: { ...node.data, output: "Running workflow..." } }
          : node
      )
    );

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/workflow/run`,
        { graph: { nodes, edges } }
      );
      const finalAnswer = response.data.answer;

      setNodes((nds) => {
        const updatedNodes = nds.map((node) =>
          node.type === "output"
            ? { ...node, data: { ...node.data, output: finalAnswer } }
            : node
        );
        setTimeout(() => setNodes(updatedNodes), 0);
        return [];
      });
    } catch (error) {
      console.error("Error running workflow:", error);
      setNodes((nds) =>
        nds.map((node) =>
          node.type === "output"
            ? {
                ...node,
                data: { ...node.data, output: "Error: Could not run workflow." },
              }
            : node
        )
      );
    } finally {
      setIsWorkflowRunning(false);
    }
  };

  // ============================================================================
  // Save Stack Handler
  // ============================================================================
  const handleSave = async () => {
    try {
      const graphToSave = {
        nodes: nodes.map(({ data, ...rest }) => {
          const { updateNodeData, onDeleteNode, ...dataToSave } = data;
          return { ...rest, data: dataToSave };
        }),
        edges,
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/stacks/${stackId}`, {
        graph: graphToSave,
      });
      enqueueSnackbar("Stack saved successfully!", { variant: "success" });
    } catch (error) {
      console.error("Failed to save stack:", error);
      enqueueSnackbar("Failed to save stack.", { variant: "error" });
    }
  };

  // ============================================================================
  // Stack Chat (RAG) Handler
  // ============================================================================
  const handleSendStackMessage = async (query) => {
    const userMessage = { sender: "user", text: query };
    setStackMessages((prev) => [...prev, userMessage]);

    const kbNode = nodes.find((node) => node.type === "knowledgeBase");
    if (!kbNode || !kbNode.data.doc_id) {
      const errorMessage = {
        sender: "ai",
        text: "Error: Please add a Knowledge Base node and upload a PDF to use this chat.",
      };
      setStackMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const doc_id = kbNode.data.doc_id;
    setIsStackLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/chat/rag`, {
        query,
        doc_id,
      });
      const aiMessage = { sender: "ai", text: response.data.answer };
      setStackMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error in RAG chat:", error);
      const errorMessage = { sender: "ai", text: "Sorry, something went wrong." };
      setStackMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStackLoading(false);
    }
  };

  // ============================================================================
  // Gemini Chat Handler
  // ============================================================================
  const handleSendGeminiMessage = async (query) => {
    const userMessage = { sender: "user", text: query };
    setGeminiMessages((prev) => [...prev, userMessage]);
    setIsGeminiLoading(true);
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/chat/gemini`,
        { query }
      );
      const aiMessage = { sender: "ai", text: response.data.answer };
      setGeminiMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const errorMessage = {
        sender: "ai",
        text: "Sorry, something went wrong with the Gemini chat.",
      };
      setGeminiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // ============================================================================
  // Render Component
  // ============================================================================
  if (!stack) return <div>Loading...</div>;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {!isFullscreen && (
        <BuilderHeader stackName={stack.name} onSave={handleSave} />
      )}
      <Box sx={{ display: "flex", flexGrow: 1 }}>
        <ReactFlowProvider>
          {!isFullscreen && (
            <Sidebar onChatWithAiClick={() => setIsGeminiChatOpen(true)} />
          )}

          <Box
            sx={{
              flex: 1,
              height: "100%",
              position: "relative",
              ...(isFullscreen && {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 1000,
                backgroundColor: "background.default",
              }),
            }}
            ref={reactFlowWrapper}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <CustomControls
                onToggleFullscreen={handleToggleFullscreen}
                isFullscreen={isFullscreen}
              />
              <FlowLogic isFullscreen={isFullscreen} />
            </ReactFlow>

            {/* Empty State Overlay */}
            {nodes.length === 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                  color: "grey.500",
                  pointerEvents: "none",
                }}
              >
                <AdsClickIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                <Typography
                  sx={{ fontWeight: 500, color: "#000000", fontSize: 20 }}
                >
                  Drag & drop to get started
                </Typography>
              </Box>
            )}

            {/* Floating Action Buttons */}
            <Box
              sx={{
                position: "absolute",
                bottom: 20,
                right: 20,
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 2,
              }}
            >
              <Fab
                color="primary"
                aria-label="run"
                onClick={handleRunWorkflow}
                disabled={isWorkflowRunning || !isFlowValid}
              >
                {isWorkflowRunning ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <PlayArrowIcon />
                )}
              </Fab>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setIsStackChatOpen(true)}
                  disabled={!isStackChatValid}
                  sx={{
                    backgroundColor: "white",
                    color: "#000000",
                    borderRadius: "12px",
                    padding: "8px 20px",
                    textTransform: "none",
                    fontSize: "16px",
                    fontWeight: 500,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e0e0e0",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  Chat With Stack
                </Button>
                <Fab
                  aria-label="chat"
                  onClick={() => setIsStackChatOpen(true)}
                  disabled={!isStackChatValid}
                  sx={{
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    backgroundColor: "#2563eb",
                    "&:hover": {
                      backgroundColor: "#1e40af",
                    },
                  }}
                >
                  <ChatIcon sx={{ color: "white" }} />
                </Fab>
              </Box>
            </Box>
          </Box>
        </ReactFlowProvider>
      </Box>

      {/* Chat Modals */}
      <StackChatModal
        open={isStackChatOpen}
        onClose={() => setIsStackChatOpen(false)}
        messages={stackMessages}
        onSendMessage={handleSendStackMessage}
        isLoading={isStackLoading}
      />
      <GeminiChatModal
        open={isGeminiChatOpen}
        onClose={() => setIsGeminiChatOpen(false)}
        messages={geminiMessages}
        onSendMessage={handleSendGeminiMessage}
        isLoading={isGeminiLoading}
      />
    </Box>
  );
};

export default BuilderPage;
