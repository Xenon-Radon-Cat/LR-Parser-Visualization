// component to parse the expression and render the parse tree

import React, { useRef, useState } from "react"
import { Row, Col, Button, Input, Space } from 'antd'
import Graphviz from "graphviz-react"

export const ParseExpression = (props) => {
    const { grammar, parseTable } = props
    const { productions } = grammar

    const [text, setText] = useState('( x ; x )')
    const [remainingInput, setRemainingInput] = useState([])
    const [start, setStart] = useState(false)
    const [lastAction, setLastAction] = useState('')
    const [dot, setDot] = useState('')

    const parseStackRef = useRef([{ label: '', state: 0, nodeIndex: -1 }])
    const dotLinesRef = useRef([]) // (nodeStmt | edgeStmt)[]
    const nodesRef = useRef([]) // { nodeLineNumber: Number, edgeLineNumbers: Number[] }

    const onTextChange = (e) => setText(e.target.value)
    const onStartClick = () => {
        // check whether the 'text' is empty
        if(text === '') {
            alert('please input your expression first')
            setStart(false)
            return
        }

        // check whether the 'text' contains reserve symbol
        const remainingInput = text.trim().split(/\s+/)
        for(const token of remainingInput) {
            if(token === 'S\'' || token === '$') {
                alert('please do not use reserve symbol like $ and S\'')
                setStart(false)
                return
            }
        }
        
        // initialize 'dotLines', 'nodes' and 'parseStack'
        remainingInput.push('$')
        computeParseTreeInAdvance(remainingInput)        
        parseStackRef.current.length = 1

        // initialize all the state
        setRemainingInput(remainingInput)
        setStart(true)
        setLastAction('')
        setDot(dotLinesRef.current.join(''))
    }

    const onStepClick = () => {
        const parseStack = parseStackRef.current
        const dotLines = dotLinesRef.current
        const nodes = nodesRef.current
        const token = remainingInput[0]
        const currentState  = parseStack[parseStack.length - 1].state
        const action = parseTable[currentState][token]
        
        // check whether the 'action' is valid
        if(typeof(action) !== 'string' || action[0] === 'g') {
            alert(`Error: no transition from state ${currentState} on token ${token}`)
            setStart(false)
            return
        }

        // check whether the parsing has completed
        if(action === 'acc') {
            alert('Parsing complete! Press reset to see it again')
            setStart(false)
            return
        }

        // check whether the conflict occurs
        const number = Number(action.slice(1))
        if(isNaN(number)) {
            alert(`Error: detect conflict from state ${currentState} on token ${token}`)
            setStart(false)
            return
        }

        // 'nodeIndex' is the index of tree node created later
        const nodeIndex = parseStack[parseStack.length - 1].nodeIndex  + 1

        if(action[0] === 's') {
            // shift and make the node visible
            const lineNumber = nodes[nodeIndex].nodeLineNumber
            parseStack.push({ label: token, state: number, nodeIndex })
            dotLines[lineNumber] = dotLines[lineNumber].replace('[style="invis"]', '')
            setRemainingInput(remainingInput.slice(1))
            setLastAction(`shift ${token}`)
            setDot(dotLines.join(''))
        }
        else {
            // reduce and make the node and edges visible
            const production = productions[number]
            const nonTerminal = production[0]
            const popCount = production.length - 2
            const { nodeLineNumber, edgeLineNumbers } = nodes[nodeIndex]

            parseStack.length -= popCount
            dotLines[nodeLineNumber] = dotLines[nodeLineNumber].replace('[style="invis"]', '')
            for(const edgeLineNumber of edgeLineNumbers)
                dotLines[edgeLineNumber] = dotLines[edgeLineNumber].replace('[style="invis"]', '')

            const stateAfterPop = parseStack[parseStack.length - 1].state
            const nextState = Number(parseTable[stateAfterPop][nonTerminal].slice(1))
            parseStack.push({ label: nonTerminal, state: nextState, nodeIndex })

            setLastAction(`reduce by ${production.join(' ')}`)
            setDot(dotLines.join(''))
        }
    }

    const computeParseTreeInAdvance = (tokens) => {
        // compute the dot language about parse tree but set all nodes and edges invisible 
        const parseStack = [{ label: '', state: 0, nodeIndex: -1 }]
        const dotLines = dotLinesRef.current
        const nodes = nodesRef.current
        dotLines.length = nodes.length = 0

        for(let tokenIndex = 0, nodeIndex = 0; ; ++nodeIndex) {
            const token = tokens[tokenIndex]
            const currentState = parseStack[parseStack.length - 1].state
            const action = parseTable[currentState][token]

            // check whether the action is valid or 'accept'
            if(typeof(action) !== 'string' || action[0] === 'g' || action === 'acc')
                break

            // check whether the conflict occurs
            const number = Number(action.slice(1))
            if(isNaN(number))
                break

            if(action[0] === 's') {
                // shift
                dotLines.push(`${nodeIndex} [label="${token}"] [style="invis"];`)
                nodes.push({ nodeLineNumber: dotLines.length - 1 , edgeLineNumbers: [] })
                parseStack.push({ label: token, state: number, nodeIndex })
                ++tokenIndex
            }
            else {
                // reduce
                const production = productions[number]
                const nonTerminal = production[0]
                const popCount = production.length - 2
                const nodeLineNumber = dotLines.length
                const edgeLineNumbers = []

                dotLines.push(`${nodeIndex} [label="${nonTerminal}"] [style="invis"];`)
                for(let i = 0; i < popCount; ++i) {
                    const childNodeIndex = parseStack.pop().nodeIndex
                    dotLines.push(`${nodeIndex} -- ${childNodeIndex} [style="invis"]`)
                    edgeLineNumbers.push(dotLines.length - 1)
                }
                nodes.push({ nodeLineNumber, edgeLineNumbers })

                const stateAfterPop = parseStack[parseStack.length - 1].state
                const nextState = Number(parseTable[stateAfterPop][nonTerminal].slice(1))
                parseStack.push({ label: nonTerminal, state: nextState, nodeIndex })
            }
        }
    }

    return (
        <div className="ParseExpression">
            <h2 className='header'>4. Parse</h2>
            <Row>
                <Col span={7}>
                    <div className='InputCard'>
                        <span>Token stream separated by spaces:</span>
                        <Input size='large' value={text} onChange={onTextChange}/>
                     </div>
                    <Space>
                        <Button type='primary' size='large' onClick={onStartClick}>Start/Reset</Button>
                        <Button type='primary' size='large' disabled={!start} onClick={onStepClick}>Step Forward</Button>
                    </Space>
                    <div className='InputCard bottom'>
                        <span>Remaining Input:</span>
                        <Input size='large' value={remainingInput.join(' ')} disabled={true}/>
                    </div>
                    <div className='InputCard bottom'>
                        <span>Last Action:</span>
                        <Input size='large' value={lastAction} disabled={true}/>
                    </div>
                </Col>
                <Col offset={1} span={16}>
                    <h3>Partial Parse Tree</h3>
                    <Graphviz dot={`graph{${dot}}`} options={{width: "100%", height: null}}/>
                </Col>
            </Row>
        </div>
    )
}