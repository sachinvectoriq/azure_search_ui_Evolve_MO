// src/app/features/chat/chatSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../../../services/apiClient';
import { toast } from 'react-toastify';

let getSessionId = () => {
  let id = sessionStorage.getItem('session_id');
  if (!id) {
    id = Date.now().toString();
    sessionStorage.setItem('session_id', id);
  }
  return id;
};

// New function to get/set UserID
let getUserId = () => {
  let id = localStorage.getItem('user_id'); // Using localStorage for persistence across browser sessions
  if (!id) {
    // Generate a simple unique ID. In a real app, this might come from an auth service.
    id =
      'user_' +
      Date.now().toString() +
      Math.random().toString(36).substring(2, 8);
    localStorage.setItem('user_id', id);
  }
  return id;
};

const cleanAiResponse = (text) => {
  // Remove the JSON list of used source numbers pattern from the end
  return text
    .replace(/\s*JSON list of used source numbers:\s*(\[\])?\s*$/gm, '')
    .trim();
};

// Async thunk for sending user question to actual API
export const sendQuestionToAPI = createAsyncThunk(
  'chat/sendQuestionToAPI',
  async (question, { dispatch, getState }) => {
    const sessionId = getState().chat.sessionId;
    const userId = getState().chat.userId; // Get userId from state

    const userName = 'Test User';
    // END - Change for userName here
    const loginSessionId = "123456789"; //  string

    console.log('Sending question to API:', question);
    console.log('Session ID:', sessionId);
    console.log('User ID:', userId); // Log the userId
    console.log('User Name:', userName); // Log for verification
    console.log('Login Session ID :', loginSessionId); // Log for verification

    // Clear follow-ups at the start of a new question
    dispatch(setFollowUps([]));

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    };

    const placeholderId = Date.now() + 1;
    const placeholderMessage = {
      id: placeholderId,
      role: 'agent',
      content: '...',
      ai_response: '...', // Initialize ai_response for the placeholder
      citations: [], // Initialize citations for the placeholder
      timestamp: new Date().toISOString(),
    };

    dispatch(addMessage(userMessage));
    dispatch(addMessage(placeholderMessage));

    try {
      // Set isResponding to true when the API call starts
      dispatch(setIsResponding(true));
      const response = await apiClient.post(
        '/ask',
        {
          query: question,
          user_id: userId, // Use dynamic userId
          session_id: sessionId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;
      console.log('API response:', data);

      // Validate the new API response structure
      if (data.ai_response && Array.isArray(data.citations)) {
        const cleanedAiResponse = cleanAiResponse(data.ai_response);

        dispatch(
          updateMessageById({
            id: placeholderId,
            changes: {
              content: cleanedAiResponse,
              ai_response: cleanedAiResponse,
              citations: data.citations,
            },
          })
        );

        // Re-enable follow-ups logic
        if (data.follow_ups) {
          const followUpQuestions = data.follow_ups
            .split('\n')
            .map((q) => q.trim())
            .filter(Boolean);
          dispatch(setFollowUps(followUpQuestions));
        }

        try {
          const logData = {
            chat_session_id: sessionId,
            user_id: userId,
            user_name: userName, // Use the user_name from auth slice
            query: question, // The original question
            ai_response: cleanedAiResponse,
            citations: data.citations.map((c) => c.title).join(', ') || 'No citations', // Format citations as string
            login_session_id: loginSessionId, // Use the login_session_id from auth slice
          };
          
          await apiClient.post('/log', logData); // <--- NEW API call for audit
          console.log('Chat interaction logged successfully:', logData);
        } catch (logError) {
          console.error('Error logging chat interaction:', logError.response?.data || logError.message);

          // Log errors but don't prevent the UI from displaying the AI response
        }
      } else {
        // More specific error message for debugging
        throw new Error(
          'Invalid API response structure: missing ai_response or citations array.'
        );
      }
    } catch (error) {
      console.error('API error:', error);
      dispatch(
        updateMessageById({
          id: placeholderId,
          changes: {
            content: 'Error fetching response. Please try again.',
            ai_response: 'Error fetching response. Please try again.',
            citations: [],
          },
        })
      );
    } finally {
      dispatch(setIsResponding(false));
    }
  }
);

// Async thunk for submitting feedback
export const submitFeedback = createAsyncThunk(
  'chat/submitFeedback',
  async ({ messageId, type, text, messages }, { dispatch, getState }) => {
    const sessionId = getState().chat.sessionId;
    const userId = getState().chat.userId; // Get userId from state
    
    // Updated 
    const userName = 'Test User';

    const loginSessionId = "123456789"; // string
    
    const message = messages.find((msg) => msg.id === messageId);
    if (!message) {
      throw new Error('Message not found for feedback');
    }

    // Use message.query if available, otherwise fallback to finding it from previous user messages
    const lastUserQuery =
      message.query ||
      messages.find((msg) => msg.id < messageId && msg.role === 'user')
        ?.content ||
      'Unknown query';

    try {
      const response = await axios.post(
        'https://app-azuresearch-qa-emo.azurewebsites.net/feedback',
        {
          chat_session_id: sessionId,
          user_name: userName, // user_name
          query: lastUserQuery,
          ai_response: message.ai_response || message.content, // Use ai_response if available
          citations:
            message.citations?.map((c) => c.title).join(', ') || 'No citations',
          feedback_type: type,
          feedback: text,
          login_session_id: loginSessionId,
          user_id: userId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      dispatch(
        setFeedbackStatus({ messageId, status: { submitted: true, type } })
      );
      toast.success('Feedback submitted successfully!'); // Toast Feedback
      return response.data;
    } catch (error) {
      console.error(
        'Feedback submission API error:',
        error.response?.data || error.message
      );
      toast.error('Failed to submit feedback.'); // If toast feedback error
      throw error;
    }
  }
);

const initialState = {
  messages: [],
  input: '',
  isResponding: false, // Renamed 'loading' to 'isResponding' for clarity
  error: null,
  pendingMessageId: null,
  followUps: [], // This will now be populated again
  feedbackStatus: {},
  samplePrompts: [
    'What is bullhorn',
    "Got any creative ideas for a 10-year-old's birthday?",
    'How do I make an HTTP request in JavaScript?',
    "What's the difference between React and Vue?",
  ],
  sessionId: getSessionId(),
  userId: getUserId(), // Initialize userId here
  previewDocURL: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setInput: (state, action) => {
      state.input = action.payload;
    },
    addMessage: (state, action) => {
      // Ensure that 'ai_response', 'citations', and 'query' are initialized for agent messages
      if (action.payload.role === 'agent' && !action.payload.ai_response) {
        action.payload.ai_response = action.payload.content;
      }
      if (action.payload.role === 'agent' && !action.payload.citations) {
        action.payload.citations = [];
      }
      if (action.payload.role === 'agent' && !action.payload.query) {
        action.payload.query = ''; // Initialize query for agent messages
      }
      state.messages.push(action.payload);
    },
    addPrompt: (state, action) => {
      state.messages = [
        {
          id: Date.now(),
          role: 'user',
          content: action.payload.text,
          timestamp: new Date().toISOString(),
        },
        ...state.messages,
      ];
    },
    updateMessageById: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.messages.findIndex((msg) => msg.id === id);
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...changes };
      }
    },
    setFollowUps: (state, action) => {
      state.followUps = action.payload;
    },
    setIsResponding: (state, action) => {
      state.isResponding = action.payload;
    },
    setFeedbackStatus: (state, action) => {
      const { messageId, status } = action.payload;
      state.feedbackStatus[messageId] = status;
    },
    clearIfInputEmpty: (state) => {
      if (state.input.trim() === '') {
        state.input = '';
      }
    },
    reset: (state) => {
      state.messages = [];
      state.followUps = [];
      state.feedbackStatus = {};
      state.input = '';
      state.error = null;
      state.pendingMessageId = null;
      state.isResponding = false;
    },
    clearInput: (state) => {
      state.input = '';
    },
    resetToWelcome: (state) => {
      state.messages = [];
    },
    resetSessionId: (state) => {
      const newId = Date.now().toString();
      sessionStorage.setItem('session_id', newId);
      state.sessionId = newId;
      console.log('Session ID reset to:', newId);
      state.isResponding = false;
    },
    // New reducer to reset UserID
    resetUserId: (state) => {
      const newId =
        'user_' +
        Date.now().toString() +
        Math.random().toString(36).substring(2, 8);
      localStorage.setItem('user_id', newId);
      state.userId = newId;
      console.log('User ID reset to:', newId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendQuestionToAPI.pending, (state) => {
        state.error = null;
      })
      .addCase(sendQuestionToAPI.rejected, (state, action) => {
        state.error =
          action.payload ||
          action.error.message ||
          'An unexpected error occurred.';
        state.isResponding = false; // Ensure loading is false
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        console.log('Feedback submitted successfully:', action.payload);
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        console.error('Feedback submission failed:', action.error);
      });
  },
});

export const {
  setInput,
  addMessage,
  addPrompt,
  updateMessageById,
  setFollowUps,
  setIsResponding,
  setFeedbackStatus,
  clearIfInputEmpty,
  reset,
  clearInput,
  resetToWelcome,
  resetSessionId,
  resetUserId, // Export the new action
} = chatSlice.actions;

export default chatSlice.reducer;
