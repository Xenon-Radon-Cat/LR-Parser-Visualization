// top-level component of SLR Parser Visualization

import React, { useState } from 'react'
import './index.css'
import { computeAutomation } from './compute'
import { InputGrammar } from './InputGrammar'
import { Automation } from './Automation'


export const LRgramma = () => {
    const [grammar, setGrammar] = useState({
        productions: [
            ['S\'', '::=', 'S'],
            ['S', '::=', '(', 'L', ')'],
            ['S', '::=', 'x'],
            ['L', '::=', 'S'],
            ['L', '::=', 'L', ';', 'S']
        ],
        productionMap: new Map([
            ['S\'', [0]],
            ['S', [1, 2]],
            ['L', [3, 4]],
        ]),
        terminalSet: new Set(['$', '(', ')', 'x', ';'])
    })
    const [automation, setAutomation] = useState(null)


    const grammarUpdated = (grammar) => {
        const automation = computeAutomation(grammar)
        setGrammar(grammar)
        setAutomation(automation)
    }

    if(automation === null)
        setAutomation(computeAutomation(grammar))

    return (
        <div className='LRGrammar'>
            <h1 className='header'> SLR Parser Visualization</h1>
            <InputGrammar  grammarUpdated={grammarUpdated}/>  
            <Automation grammar={grammar} automation={automation}/>
        </div>
    )
}