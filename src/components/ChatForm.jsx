import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Eraser } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendQuestionToAPI,
  setInput,
  clearIfInputEmpty,
  resetSessionId,
  resetUserId,
} from '../app/features/chat/chatSlice';

const ChatForm = () => {
  const dispatch = useDispatch();
  const { input, isResponding } = useSelector((state) => state.chat);
  const [text, setText] = useState(input);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !isResponding) {
      dispatch(sendQuestionToAPI(text.trim()));
      setText('');
      dispatch(setInput(''));
      // Reset textarea height after sending message
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleClearChat = () => {
    if (!input.trim()) {
      dispatch(clearIfInputEmpty());
    }
    dispatch(resetSessionId());
    dispatch(resetUserId());
    setText(''); // Also clear the current input field in ChatForm
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset textarea height
    }
  };

  // Adjust textarea height and scroll to bottom of chat messages
  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef.current) {
        // Temporarily set height to 'auto' to get the correct scrollHeight
        textareaRef.current.style.height = 'auto';
        // Set new height, capped at 200px
        const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    adjustHeight();
  }, [text]);

  return (
    <form
      id='chat_form'
      onSubmit={handleSubmit}
      className='border-b-4 border-b-[#174a7e] w-[95%] max-w-[968px] mb-4 p-4 h-auto min-h-20 flex items-end border border-gray-300 shadow-md rounded-md bg-white z-10'
    >
      {/* Clear Chat Button */}
      <button
        type='button'
        onClick={handleClearChat}
        title='Clear Chat'
        className='flex items-center justify-center w-10 h-10 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors mr-3 cursor-pointer'
      >
        <Eraser className='w-5 h-5' />
      </button>

      <textarea
        ref={textareaRef}
        name='text'
        id='text'
        className={`border-none outline-none grow mr-4 rounded-md resize-none overflow-y-auto scroll-smooth
          ${isResponding ? 'bg-gray-100' : 'bg-white'}
          pt-2 pb-2`}
        placeholder={
          isResponding
            ? 'Please wait for the response...'
            : 'Type a new question'
        }
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          dispatch(setInput(e.target.value));
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !isResponding) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        rows={1} // Start with 1 row, height adjustment will handle more
        disabled={isResponding}
      />
      <button
        type='submit'
        className={`flex items-center justify-center w-10 h-10 rounded-md ${
          isResponding
            ? 'bg-gray-400 cursor-not-allowed'
            : text.trim()
            ? 'bg-[#174a7e] text-white hover:bg-blue-800 cursor-pointer'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        disabled={isResponding || !text.trim()}
      >
        {isResponding ? (
          <Loader2 className='animate-spin w-5 h-5' />
        ) : (
          <Send className='w-5 h-5' />
        )}
      </button>
    </form>
  );
};

export default ChatForm;
