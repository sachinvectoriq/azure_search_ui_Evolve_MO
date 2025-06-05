import { useDispatch, useSelector } from 'react-redux';
import WelcomeScreen from './Welcomescreen';
import React from 'react';
import { setPreviewDocURL } from '../app/features/chat/chatSlice';

const ChatLayout = ({ children }) => {
  const hasMessages = useSelector((state) => state.chat.messages.length > 0);
  const { previewDocURL } = useSelector((state) => state.chat);
  const dispatch = useDispatch();

  const handleViewPdf = (url) => {
    dispatch(setPreviewDocURL({ url }));
  };

  return (
    <div
      id='chat_layout'
      className={`container h-[70vh] mx-auto flex transition-all duration-300 ${
        previewDocURL ? 'max-w-[95%]' : 'max-w-[1000px]'
      }`}
    >
      <div
        className={`flex-1 ${
          previewDocURL ? 'overflow-y-auto max-h-[100vh]' : ''
        }`}
      >
        {hasMessages ? (
          <div className='flex flex-col items-center h-full'>
            <div className='w-full mx-auto pb-4'>
              {React.Children.map(children, (child) =>
                React.cloneElement(child, { onViewPdf: handleViewPdf })
              )}
            </div>
          </div>
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
