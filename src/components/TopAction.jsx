import { Trash2 } from 'lucide-react';

const TopActions = ({ onClear }) => {
  return (
    <div className='bg-white flex justify-center items-center py-3 border-b border-gray-200'>
      <button
        onClick={onClear}
        className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors duration-200'
      >
        <Trash2 className='w-4 h-4' />
        <span>Clear Chat</span>
      </button>
    </div>
  );
};

export default TopActions;
