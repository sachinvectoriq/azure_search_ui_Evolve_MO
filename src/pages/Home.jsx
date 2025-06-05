import { useDispatch, useSelector } from 'react-redux';
import {
  removePreviewDocURL,
  setPreviewDocURL,
} from '../app/features/chat/chatSlice';
import WelcomeScreen from '../components/Welcomescreen';
import ChatForm from '../components/ChatForm';
import ChatLayout from '../components/ChatLayout';
import ChatContent from '../components/ChatContent';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import PdfViewer from '../components/PdfViewer';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Home = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messages = useSelector((state) => state.chat.messages);
  const showWelcome = messages.length === 0;
  const { previewDocURL } = useSelector((state) => state.chat);

  const handleViewPdf = (url) => {
    dispatch(setPreviewDocURL({ url }));
  };

  // useEffect(() => {
  //   if (!user || !user?.name || !user?.group) {
  //     navigate('/');
  //   }
  // }, [user]);

  return (
    <div id='main_app'>
      <Header />

      <div className={`flex gap-4 w-full max-w-[1400px] mx-auto px-4`}>
        <motion.div
          id='chat_layout_wrapper'
          className={`${
            previewDocURL ? 'basis-1/2' : 'grow'
          } flex flex-col overflow-x-hidden w-full max-w-[1400px] mx-auto relative`}
        >
          {showWelcome ? (
            <div className='flex h-[85vh] flex-col bg-[#f3f5f8] rounded-md border border-gray-200 items-center justify-center'>
              <WelcomeScreen />
              <ChatForm />
            </div>
          ) : (
            <div className='flex h-[85vh] flex-col bg-[#f3f5f8] rounded-md border border-gray-200'>
              <div
                className={`flex h-full flex-col pt-4 transition-all duration-300`}
              >
                <ChatLayout>
                  <ChatContent onViewPdf={handleViewPdf} />
                </ChatLayout>
                <div className='flex w-full mt-4 justify-center items-center absolute bottom-2'>
                  <ChatForm />
                </div>
              </div>
            </div>
          )}
        </motion.div>
        {/* Right Sticky PDF Viewer */}
        {previewDocURL && (
          <motion.div
            id='doc_previewer'
            className='basis-1/2 bg-[#f3f5f8] rounded-md border border-gray-200 p-4 sticky top-0 max-h-screen overflow-y-auto'
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <PdfViewer
              url={previewDocURL}
              onClose={() => dispatch(removePreviewDocURL())}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;
