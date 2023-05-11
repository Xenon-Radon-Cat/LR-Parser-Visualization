// top-level component of SLR Parser Visualization

import React, { useState } from 'react'
import './index.css'
import { computeAutomation, computeParseTable, computeFirstFollow } from './compute'
import { InputGrammar } from './InputGrammar'
import { Graphs } from './Graphs'
import { ParseExpression } from './ParseExpression'
import { Row, Col, Input } from "antd"

const { TextArea } = Input

const ChildComponent = (props) => {
    const { header, text, identifier, dots } = props
    
    return (
        <div>
            <h2 className='header'>{header}</h2>
            <Row>
                <Col span={4}>
                    <TextArea className="TextArea" value={text} autoSize={{minRows: 12, maxRows: 24}} disabled/>
                </Col>
                <Col offset={4} span={16}>
                    <Graphs identifier={identifier} dots={dots}/>
                </Col>
            </Row>
        </div>
    )
}


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
        terminalSet: new Set(['(', ')', 'x', ';', '$'])
    })
    const [automation, setAutomation] = useState(null)
    const [firstFollow, setFirstFollow] = useState(null)
    const [parseTable, setParseTable] = useState(null)
    const [automationDots, setAutomationDots] = useState(null)
    const [firstFollowDots, setFirstFollowDots] = useState(null)


    const grammarUpdated = (grammar) => {
        const { automation, automationDots } = computeAutomation(grammar)
        const { firstFollow, firstFollowDots } = computeFirstFollow(grammar)
        const parseTable = computeParseTable(grammar, automation, firstFollow)
        setGrammar(grammar)
        setAutomation(automation)
        setFirstFollow(firstFollow)
        setParseTable(parseTable)
        setAutomationDots(automationDots)
        setFirstFollowDots(firstFollowDots)
    }

    if(automation === null) 
        grammarUpdated(grammar)

    const text = grammar.productions.map(production => production.join(' ')).join('\n')

    return (
        <div className='LRGrammar'>
            <h1 className='header'>SLR Parser Visualization</h1>
            <InputGrammar  grammarUpdated={grammarUpdated}/>  
            <ChildComponent header='2. LR(0) Automation' text={text} identifier='automationGraphs' dots={automationDots}></ChildComponent>
            <ChildComponent header='3. First & Follow' text={text} identifier='firstFollowGraphs' dots={firstFollowDots}></ChildComponent>
            <ParseExpression grammar={grammar} automation={automation} firstFollow={firstFollow} parseTable={parseTable}/>
        </div>
    )
}