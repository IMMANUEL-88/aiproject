# GenAI Stack Builder

Welcome to the GenAI Stack Builder! This is a powerful no-code/low-code web application that enables you to visually create, save, and interact with intelligent workflows. You can build custom "stacks" that handle user input, extract knowledge from your own PDF documents, connect to powerful language models like Google Gemini, and even perform real-time web searches.



## Key Features

-   **Visual Workflow Builder**: Drag-and-drop components onto a canvas to create a logical flow.
-   **Knowledge Base Integration**: Upload your own PDF documents to create a knowledge base that the AI can use to answer questions.
-   **LLM Integration**: Connect to the powerful Google Gemini family of models.
-   **Web Search**: Enable a real-time web search tool for questions that require up-to-the-minute information.
-   **Multiple "Stacks"**: Create, save, and manage multiple different workflows for different tasks.
-   **Interactive Chat**: Test your completed workflows using an intuitive chat interface.
-   **Self-Contained & Easy to Run**: The entire application (frontend, backend, and database) is packaged with Docker for a simple one-command setup.

## Tech Stack

-   **Frontend**: React.js with Material-UI & React Flow
-   **Backend**: FastAPI (Python)
-   **Database**: PostgreSQL
-   **Vector Store**: ChromaDB
-   **AI Services**: Google Gemini
-   **Web Search**: SerpApi

---

## Local Setup & Installation

Follow these steps to get the entire application running on your local machine.

### Prerequisites

Before you begin, you will need to have two free applications installed on your computer:

1.  **Git**: [Download Git here](https://git-scm.com/downloads)
2.  **Docker Desktop**: [Download Docker Desktop here](https://www.docker.com/products/docker-desktop/)

### Step 1: Clone the Project

First, download the project code from the GitHub repository.

-   Open your computer's terminal (e.g., Terminal on Mac, PowerShell or Git Bash on Windows).
-   Run the following command:
    ```bash
    git clone [https://github.com/IMMANUEL-88/aiproject](https://github.com/IMMANUEL-88/aiproject)
    ```
-   Navigate into the newly created project folder:
    ```bash
    cd aiproject
    ```

### Step 2: Add Your API Keys

The application needs your personal API keys to connect to the AI and search services.

1.  Navigate into the `backend` folder inside the project.
2.  You will find a file named `env.example`. Make a copy of this file and rename the copy to just `.env`.
3.  Open the new `.env` file with any text editor.
4.  Paste your API keys into the appropriate fields. The file should look like this when you're done:
    ```ini
    # Do not change the DATABASE_URL
    DATABASE_URL=postgresql://workflow_user:password@db:5432/workflow_db

    # Paste your keys below
    GEMINI_API_KEY="AIzaSy...your...key...here..."
    ```
5.  Save and close the file.

### Step 3: Run the Application

This is the final step. With Docker Desktop open and running, go back to your terminal (which should be in the project's root folder) and run this single command:

```bash
docker-compose up
```
The first build will take a lot of time based on your internet connection. Be Patient :)
