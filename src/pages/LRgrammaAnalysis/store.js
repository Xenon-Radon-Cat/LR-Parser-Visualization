import { configureStore } from '@reduxjs/toolkit'
import grammarReducer from './grammarSlice'

export default configureStore({
  reducer: {
    grammar: grammarReducer
  }
})
