// component to parse the expression and render the parse tree

import React, { useRef, useState } from "react"
import { Row, Col, Button, Input, Space } from 'antd'
import { Graphviz }  from "./Graphviz"

export const ParseExpression = (props) => {
    const { grammar, parseTable } = props
    const { productions } = grammar

    const [text, setText] = useState('( x ; x )')
    const [remainingInput, setRemainingInput] = useState([])
    const [start, setStart] = useState(false)
    const [lastAction, setLastAction] = useState('')
    const [dot, setDot] = useState('')
    const [stack, setStack] = useState('')

    const parseStackRef = useRef([{ label: '$', state: 0, nodeIndex: -1 }])

    const toSubscriptedNumber = (num) => {
        // assert that num >= 0
        const digits = '₀₁₂₃₄₅₆₇₈₉'
        
        if(num < 10)
            return digits[num]
        else
            return toSubscriptedNumber(Math.floor(num / 10)) + digits[num % 10]
    }

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
        
        // initialize 'parseStack' and all the states    
        parseStackRef.current.length = 1
        remainingInput.push('$') 
        setRemainingInput(remainingInput)
        setStart(true)
        setLastAction('')
        setDot('')
        setStack('$₀ ')
    }

    const onStepClick = () => {
        const parseStack = parseStackRef.current
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
            // const lineNumber = nodes[nodeIndex].nodeLineNumber
            parseStack.push({ label: token, state: number, nodeIndex })
            // dotLines[lineNumber] = dotLines[lineNumber].replace('[style="invis"]', '')
            setRemainingInput(remainingInput.slice(1))
            setLastAction(`shift ${token}`)
            setDot(dot + `${nodeIndex} [label="${token}"]\n`)
            setStack(stack + `${token}${toSubscriptedNumber(number)} `)
        }
        else {
            // reduce and make the node and edges visible
            const production = productions[number]
            const nonTerminal = production[0]
            const popCount = production.length - 2
            let nextDot = dot + `${nodeIndex} [label="${nonTerminal}"]\n`

            for(let i = 0; i < popCount; ++i) {
                const childNodeIndex = parseStack.pop().nodeIndex
                nextDot += `${nodeIndex} -- ${childNodeIndex}\n`
            }

            const stateAfterPop = parseStack[parseStack.length - 1].state
            const nextState = Number(parseTable[stateAfterPop][nonTerminal].slice(1))
            parseStack.push({ label: nonTerminal, state: nextState, nodeIndex })

            const nextStack = parseStack.reduce(
                (accumulator, stackTuple) => accumulator + `${stackTuple.label}${toSubscriptedNumber(stackTuple.state)} `,
                ''
              );

            setLastAction(`reduce by ${production.join(' ')}`)
            setDot(nextDot)
            setStack(nextStack)
        }
    }

    return (
        <div className="ParseExpression">
            <h2 className='header'>5. Parse</h2>
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
                    <div className='InputCard bottom'>
                        <span>Stack:</span>
                        <Input size='large' value={stack} disabled={true}/>
                    </div>
                </Col>
                <Col offset={1} span={16}>
                    <h3>Partial Parse Tree</h3>
                    <Graphviz identifier='parseTreeGraph' dot={`graph{${dot}}`} />
                </Col>
            </Row>
        </div>
    )
}