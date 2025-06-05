// example inside sendQuestionToAPI thunk
async (question, { dispatch, getState }) => {
  const sessionId = getState().chat.sessionId;
  // use sessionId here for your API calls
};
