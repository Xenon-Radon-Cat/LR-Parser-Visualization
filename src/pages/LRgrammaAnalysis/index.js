// top-level component of SLR Parser Visualization

import React from 'react'
import { Provider } from 'react-redux'
import store from './store'
import './index.css'
import { InputGrammar } from './InputGrammar'
import { Automation } from './Automation'

export const LRgramma = () => (
    <div className='LRGrammar'>
        <Provider store={store}>
        <h1 className='header'> SLR Parser Visualization</h1>
        <InputGrammar/>  
        <Automation/>
        </Provider>
    </div>
)