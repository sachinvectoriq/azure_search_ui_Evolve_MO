import { useDispatch, useSelector } from 'react-redux';
import {
  addMessage,
  clearChat,
  clearInput,
  setInput,
} from '../app/features/chat/chatSlice';

const useChats = () => {
  const messages = useSelector((state) => state.chat.messages);
  const input = useSelector((state) => state.chat.input);
  const dispatch = useDispatch();

  const handleInputChange = (text) => {
    console.log(text);
    dispatch(setInput(text));
  };

  const handleAddMessage = (message) => {
    dispatch(addMessage(message));
  };

  const handleClearChat = () => {
    dispatch(clearChat());
  };

  const handleClearInput = () => {
    dispatch(clearInput());
  };

  return {
    messages,
    input,
    handleInputChange,
    handleAddMessage,
    handleClearChat,
    handleClearInput,
  };
};

export default useChats;
