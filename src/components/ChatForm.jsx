import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Eraser, AlertTriangle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { franc } from 'franc-min';
import {
  sendQuestionToAPI,
  setInput,
  clearIfInputEmpty,
  resetSessionId,
  resetUserId,
} from '../app/features/chat/chatSlice';
import { setSelectedLanguage } from '../app/features/chat/chatSlice'; // ✅ Import here

// Enhanced language detection using franc library
const detectLanguage = (text) => {
  if (text.length < 8) return null; // Reduced threshold for faster detection
  
  const detected = franc(text);
  
  // Map franc codes to our language codes
  if (detected === 'eng') return 'en';
  if (detected === 'fra') return 'fr';
  
  // Fallback: Simple pattern-based detection for edge cases
  const frenchIndicators = /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|du|de|à|avec|pour|dans|sur|par|sans|sous|entre|est|sont|était|étaient|avoir|être|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir)\b|[àâäéèêëïîôöùûüÿç]/gi;
  const englishIndicators = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|about|into|through|during|before|after|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|can|must|shall|this|that|these|those|what|which|who|when|where|why|how)\b/gi;
  
  const frenchMatches = (text.match(frenchIndicators) || []).length;
  const englishMatches = (text.match(englishIndicators) || []).length;
  
  if (frenchMatches > englishMatches && frenchMatches > 0) return 'fr';
  if (englishMatches > frenchMatches && englishMatches > 0) return 'en';
  
  return null; // Uncertain
};

const ChatForm = () => {
  const dispatch = useDispatch();
  const { input, isResponding } = useSelector((state) => state.chat);
  const [text, setText] = useState(input);
  const selectedLanguage = useSelector((state) => state.chat.selectedLanguage);
  const [showLanguageMismatch, setShowLanguageMismatch] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [submitError, setSubmitError] = useState(false);
  const textareaRef = useRef(null);

  // Language detection with debouncing for typing
  useEffect(() => {
    if (!text.trim()) {
      setShowLanguageMismatch(false);
      setDetectedLanguage(null);
      setSubmitError(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      const detected = detectLanguage(text);
      setDetectedLanguage(detected);
      
      // Only show mismatch during typing if we're confident about detection
      if (detected && detected !== selectedLanguage && text.length > 15) {
        setShowLanguageMismatch(true);
        setSubmitError(false);
      } else {
        setShowLanguageMismatch(false);
      }
    }, 500); // Reduced debounce time

    return () => clearTimeout(timeoutId);
  }, [text, selectedLanguage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!text.trim() || isResponding) {
      return;
    }

    // Validate language on submit - this is immediate validation
    const currentDetected = detectLanguage(text.trim());
    
    if (currentDetected && currentDetected !== selectedLanguage) {
      // Show error state
      setSubmitError(true);
      setDetectedLanguage(currentDetected);
      setShowLanguageMismatch(true);
      return;
    }
    
    // If validation passes, send the message
    dispatch(sendQuestionToAPI(text.trim()));
    setText('');
    dispatch(setInput(''));
    setShowLanguageMismatch(false);
    setDetectedLanguage(null);
    setSubmitError(false);
    
    // Reset textarea height after sending message
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleClearChat = () => {
    if (!input.trim()) {
      dispatch(clearIfInputEmpty());
    }
    dispatch(resetSessionId());
    dispatch(resetUserId());
    setText('');
    setShowLanguageMismatch(false);
    setDetectedLanguage(null);
    setSubmitError(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleLanguageChange = (language) => {
  dispatch(setSelectedLanguage(language));  // ✅ Dispatch the action here
  setShowLanguageMismatch(false);
  setSubmitError(false);

  if (text.trim()) {
    const detected = detectLanguage(text);
    if (detected && detected !== language) {
      setDetectedLanguage(detected);
    }
  }
};



  // Adjust textarea height
  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    adjustHeight();
  }, [text]);

  const getPlaceholderText = () => {
    if (isResponding) return 'Please wait for the response...';
    return selectedLanguage === 'fr' 
      ? 'Tapez votre question en français...' 
      : 'Type a new question...';
  };

  const getLanguageName = (code) => {
    return code === 'en' ? 'English' : 'French';
  };

  return (
    <div className="relative w-[95%] max-w-[968px] mb-4">
      {/* Small Language Mismatch Disclaimer */}
      {showLanguageMismatch && detectedLanguage && (
        <div className="mb-2 px-3 py-2 bg-red-50 border-l-3 border-red-400 rounded text-sm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              You're typing in <strong>{getLanguageName(detectedLanguage)}</strong> but have selected <strong>{getLanguageName(selectedLanguage)}</strong>. 
              Switch to {getLanguageName(detectedLanguage)} or retype in {getLanguageName(selectedLanguage)}.
            </span>
          </div>
        </div>
      )}

      <form
        id='chat_form'
        onSubmit={handleSubmit}
        className='border-b-4 border-b-[#174a7e] p-4 h-auto min-h-20 flex items-end border border-gray-300 shadow-md rounded-md bg-white z-10'
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
            ${submitError ? 'bg-red-50' : ''}
            pt-2 pb-2 transition-all duration-200`}
          placeholder={getPlaceholderText()}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            dispatch(setInput(e.target.value));
            setSubmitError(false); // Clear error state when user starts typing
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isResponding) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          disabled={isResponding}
        />

        {/* Enhanced Language Toggle */}
        <div className="mr-3">
          <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 text-sm font-bold transition-all duration-200 ${
                selectedLanguage === 'en'
                  ? 'bg-[#174a7e] text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('fr')}
              className={`px-4 py-2 text-sm font-bold transition-all duration-200 ${
                selectedLanguage === 'fr'
                  ? 'bg-[#174a7e] text-white shadow-lg transform scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Passer au français"
            >
              FR
            </button>
          </div>
        </div>

        <button
          type='submit'
          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 ${
            isResponding
              ? 'bg-gray-400 cursor-not-allowed'
              : text.trim()
              ? 'bg-[#174a7e] text-white hover:bg-blue-800 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={isResponding || !text.trim()}
          title={
            text.trim() 
              ? `Send message in ${selectedLanguage === 'en' ? 'English' : 'French'}`
              : 'Type a message first'
          }
        >
          {isResponding ? (
            <Loader2 className='animate-spin w-5 h-5' />
          ) : (
            <Send className='w-5 h-5' />
          )}
        </button>
      </form>
    </div>
  );
};

export default ChatForm;
