import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import apiClient from "../../../services/apiClient";
import { toast } from "react-toastify";

let getSessionId = () => {
  let id = sessionStorage.getItem("session_id");
  if (!id) {
    id = Date.now().toString();
    sessionStorage.setItem("session_id", id);
  }
  return id;
};

// New function to get/set UserID
let getUserId = () => {
  let id = localStorage.getItem("user_id"); // Using localStorage for persistence across browser sessions
  if (!id) {
    // Generate a simple unique ID. In a real app, this might come from an auth service.
    id =
      "user_" +
      Date.now().toString() +
      Math.random().toString(36).substring(2, 8);
    localStorage.setItem("user_id", id);
  }
  return id;
};

// Function to clean the AI response text
const cleanAiResponse = (text) => {
  if (!text) return text;
  // Refined regex to match "JSON list of used source numbers:"
  // with optional leading/trailing whitespace and line breaks,
  // and optionally followed by "[]" at the very end of the string.
  // This version is more flexible with newlines and spaces before and after.
  return text
    .replace(/\s*JSON list of used source numbers:\s*(\[\])?\s*$/gm, "")
    .trim();
};


const mapLanguageForAPI = (uiLanguage) => {
  const languageMap = {
    'en': 'english',
    'fr': 'french_canadian'
  };
  return languageMap[uiLanguage] || 'english';
};

// Async thunk for sending user question to actual API
export const sendQuestionToAPI = createAsyncThunk(
  "chat/sendQuestionToAPI",
  async (question, { dispatch, getState }) => {
    const sessionId = getState().chat.sessionId;
    const userId = getState().chat.userId; // Get userId from state

    const userName = "Test User";
    // END - Change for userName here
    const loginSessionId = "123456789"; // Changed from int to string
    const selectedLanguage = getState().chat.selectedLanguage; // Get selected language

    console.log("Sending question to API:", question);
    console.log("Session ID:", sessionId);
    console.log("User ID:", userId); // Log the userId
    console.log("User Name:", userName); // Log for verification
    console.log("Login Session ID :", loginSessionId); // Log for verification

    // Clear follow-ups at the start of a new question
    dispatch(setFollowUps([]));

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    dispatch(addMessage(userMessage));

    const placeholderId = Date.now() + 1;
    const placeholderMessage = {
      id: placeholderId,
      role: "agent",
      content: "...",
      ai_response: "...", // Initialize ai_response for the placeholder
      citations: [], // Initialize citations for the placeholder
      timestamp: new Date().toISOString(),
    };
    dispatch(addMessage(placeholderMessage));
    dispatch(setPendingMessageId(placeholderId));

    try {
      // Set isResponding to true when the API call starts
      dispatch(setIsResponding(true));
      const response = await apiClient.post(
        "/ask",
        {
          query: question,
          user_id: userId, // Use dynamic userId
          session_id: sessionId,
          clanguage: mapLanguageForAPI(selectedLanguage),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = response.data;
      console.log("API response:", data);

      // Validate the new API response structure
      // Changed 'data.chunks' to 'data.citations' to match the new API structure
      if (data?.ai_response && Array.isArray(data.citations)) {
        // Clean the AI response text before storing
        const cleanedAiResponse = cleanAiResponse(data.ai_response);

        dispatch(
          updateMessageById({
            id: placeholderId,
            content: cleanedAiResponse, // Keep 'content' for compatibility
            ai_response: cleanedAiResponse, // Store the cleaned AI response
            // Map the new 'citations' array to your message structure
            citations: data.citations.map((citation) => ({
              id: citation.id, // The ID from the API response for inline linking
              title: citation.title,
              chunk: citation.chunk, // 'chunk' contains the actual content
              parent_id: citation.parent_id, // 'parent_id' is the PDF/source link
            })),
            query: data.query, // Store the query from the API response
          })
        );
        // Re-enable follow-ups logic
        if (data.follow_ups) {
          const followUpQuestions = data.follow_ups
            .split("\n")
            .map((q) => q.trim())
            .filter(Boolean);
          dispatch(setFollowUps(followUpQuestions));
        } else {
          dispatch(setFollowUps([]));
        }

        try {
          const queryLanguage = mapLanguageForAPI(selectedLanguage);
          const logData = {
            chat_session_id: sessionId,
            user_id: userId,
            user_name: userName, // Use the user_name from auth slice
            query: question, // The original question
            ai_response: cleanedAiResponse,
            citations:
              data.citations.map((c) => c.title).join(", ") || "No citations", // Format citations as string
            login_session_id: loginSessionId, // Use the login_session_id from auth slice
            query_language: queryLanguage // Added new parameter here
          };

          await apiClient.post("/log", logData); // <--- NEW API call for audit
          console.log("Chat interaction logged successfully:", logData);
        } catch (logError) {
          console.error(
            "Error logging chat interaction:",
            logError.response?.data || logError.message
          );
          // Log errors but don't prevent the UI from displaying the AI response
        }
      } else {
        // More specific error message for debugging
        throw new Error(
          "Invalid API response structure: missing ai_response or citations array."
        );
      }
    } catch (error) {
      console.error("API error:", error);
      dispatch(
        updateMessageById({
          id: placeholderId,
          content: `Something went wrong: ${error.message}`,
          ai_response: `Something went wrong: ${error.message}`, // Update ai_response with error
          citations: [],
          query: question, // Store the original question as query in case of error
        })
      );
      dispatch(setError(error.message));
    } finally {
      dispatch(clearInput());
      dispatch(setPendingMessageId(null));
      // Set isResponding to false when the API call finishes (success or failure)
      dispatch(setIsResponding(false));
    }
  }
);

// Async thunk for submitting feedback
export const submitFeedback = createAsyncThunk(
  "chat/submitFeedback",
  async ({ messageId, type, text, messages }, { dispatch, getState }) => {
    const sessionId = getState().chat.sessionId;
    const userId = getState().chat.userId; // Get userId from state

    //Updated
    const userName = "Test User";

    const loginSessionId = "123456789"; // Changed from int to string


    const message = messages.find((msg) => msg.id === messageId);
    if (!message) {
      throw new Error("Message not found for feedback");
    }

    // Use message.query if available, otherwise fallback to finding it from previous user messages
    // This is the new, more robust way to get the last user query
    const lastUserQuery =
      message.query ||
      messages.find((msg) => msg.id < messageId && msg.role === "user")
        ?.content ||
      "Unknown query";

    try {
      const queryLanguage = mapLanguageForAPI(getState().chat.selectedLanguage);
      const response = await axios.post(
        "https://app-azuresearch-qa-emo.azurewebsites.net/feedback",
        {
          chat_session_id: sessionId,
          user_name: userName, // user_name
          query: lastUserQuery,
          ai_response: message.ai_response || message.content, // Use ai_response if available
          citations:
            message.citations?.map((c) => c.title).join(", ") || "No citations",
          feedback_type: type,
          feedback: text,
          login_session_id: loginSessionId,
          user_id: userId,
          query_language: queryLanguage 
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      dispatch(
        setFeedbackStatus({ messageId, status: { submitted: true, type } })
      );
      toast.success("Feedback submitted successfully!"); // Toast Feedback
      return response.data;
    } catch (error) {
      console.error(
        "Feedback submission API error:",
        error.response?.data || error.message
      );
      toast.error("Failed to submit feedback."); // If toast feedback error
      throw error;
    }
  }
);

const initialState = {
  messages: [],
  input: "",
  isResponding: false, // Renamed 'loading' to 'isResponding' for clarity
  error: null,
  pendingMessageId: null,
  followUps: [], // This will now be populated again
  feedbackStatus: {},
  samplePrompts: [
    "What is bullhorn",
    "Got any creative ideas for a 10-year-old's birthday?",
    "How do I make an HTTP request in JavaScript?",
    "What's the difference between React and Vue?",
  ],
  sessionId: getSessionId(),
  userId: getUserId(), // Initialize userId here
  previewDocURL: null,
  selectedLanguage: "en", // default to English
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setInput: (state, action) => {
      state.input = action.payload;
    },
    setPreviewDocURL: (state, action) => {
      state.previewDocURL = action.payload.url;
    },
    removePreviewDocURL: (state) => {
      state.previewDocURL = null;
    },
    addMessage: (state, action) => {
      // Ensure that 'ai_response', 'citations', and 'query' are initialized for agent messages
      // This is crucial for consistency across messages, especially for placeholders
      if (action.payload.role === "agent" && !action.payload.ai_response) {
        action.payload.ai_response = action.payload.content;
      }
      if (action.payload.role === "agent" && !action.payload.citations) {
        action.payload.citations = [];
      }
      if (action.payload.role === "agent" && !action.payload.query) {
        action.payload.query = ""; // Initialize query for agent messages
      }
      state.messages.push(action.payload);
    },
    addPrompt: (state, action) => {
      state.messages = [
        {
          id: Date.now(),
          role: "user",
          content: action.payload.text,
          timestamp: new Date().toISOString(),
        },
      ];
    },
    setPendingMessageId: (state, action) => {
      state.pendingMessageId = action.payload;
    },
    updateMessageById: (state, action) => {
      // Destructure new fields: ai_response and query
      const { id, content, ai_response, citations, query } = action.payload;
      const index = state.messages.findIndex((msg) => msg.id === id);
      if (index !== -1) {
        state.messages[index] = {
          ...state.messages[index],
          content,
          ai_response:
            ai_response !== undefined
              ? ai_response
              : state.messages[index].ai_response, // Update ai_response
          citations, // Update citations directly (as new format)
          query: query !== undefined ? query : state.messages[index].query, // Update query
        };
      }
    },
    setFollowUps: (state, action) => {
      state.followUps = action.payload;
    },
    setFeedbackStatus: (state, action) => {
      const { messageId, status } = action.payload;
      state.feedbackStatus[messageId] = status;
    },
    setIsResponding: (state, action) => {
      state.isResponding = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearChat: (state) => {
      state.messages = [];
      state.followUps = [];
      state.feedbackStatus = {};
      state.input = "";
      state.error = null;
      state.pendingMessageId = null;
      state.isResponding = false;
    },
    clearInput: (state) => {
      state.input = "";
    },
    resetToWelcome: (state) => {
      state.messages = [];
      state.feedbackStatus = {};
      state.isResponding = false;
    },
    clearIfInputEmpty: (state) => {
      if (!state.input.trim()) {
        state.messages = [];
        state.followUps = [];
        state.feedbackStatus = {};
        state.isResponding = false;
      }
    },
    setSelectedLanguage: (state, action) => {
      state.selectedLanguage = action.payload;
    },
    resetSessionId: (state) => {
      const newId = Date.now().toString();
      sessionStorage.setItem("session_id", newId);
      state.sessionId = newId;
      console.log("Session ID reset to:", newId);
      state.isResponding = false;
    },
    // New reducer to reset UserID
    resetUserId: (state) => {
      const newId =
        "user_" +
        Date.now().toString() +
        Math.random().toString(36).substring(2, 8);
      localStorage.setItem("user_id", newId);
      state.userId = newId;
      console.log("User ID reset to:", newId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendQuestionToAPI.rejected, (state, action) => {
        // Corrected error message to be more robust
        state.error =
          action.payload ||
          action.error.message ||
          "An unexpected error occurred.";
        state.isResponding = false; // Ensure loading is false
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        console.log("Feedback submitted successfully:", action.payload);
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        console.error("Feedback submission failed:", action.error);
      });
  },
});

export const {
  setInput,
  setPreviewDocURL,
  removePreviewDocURL,
  addMessage,
  addPrompt,
  setPendingMessageId,
  updateMessageById,
  setFollowUps,
  setFeedbackStatus,
  setIsResponding,
  setError,
  clearChat,
  clearInput,
  resetToWelcome,
  clearIfInputEmpty,
  resetSessionId,
  resetUserId, // Export the new action
  setSelectedLanguage,
} = chatSlice.actions;

export default chatSlice.reducer;
