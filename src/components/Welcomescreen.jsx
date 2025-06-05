import { motion } from 'framer-motion';

const WelcomeScreen = () => {
  return (
    <motion.div
      id='welcome'
      className='flex flex-col items-center justify-center h-[70vh] p-8 text-center'
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <h1 className='text-4xl font-semibold mb-4 text-gray-800'>
        Start chatting
      </h1>
      <p className='text-gray-600'>
        This chatbot is configured to answer your questions
      </p>
    </motion.div>
  );
};

export default WelcomeScreen;
