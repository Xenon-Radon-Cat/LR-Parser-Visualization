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

    const parseStackRef = useRef([{label: '', state: 0, nodeIndex: -1}])

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
        
        // initialize
        remainingInput.push('$')
        setRemainingInput(remainingInput)
        setStart(true)
        setLastAction('')
        setDot('')
        parseStackRef.current.length = 1
    }
    const onStepClick = () => {
        const token = remainingInput[0]
        const parseStack = parseStackRef.current
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

        const nodeIndex = parseStack[parseStack.length - 1].nodeIndex  + 1 // 'nodeIndex' is the index of tree node created later
        let nextDot = dot

        if(action[0] === 's') {
            parseStack.push({ label: token, state: number, nodeIndex })
            nextDot += `${nodeIndex} [label="${token}"];`
            setRemainingInput(remainingInput.slice(1))
            setLastAction(`shift ${token}`)
            setDot(nextDot)
        }
        else {
            const production = productions[number]
            const popCount = production.length - 2
            const nonTerminal = production[0]
            
            nextDot += `${nodeIndex} [label="${nonTerminal}"];`
            for(let i = 0; i < popCount; ++i) {
                const childNodeIndex = parseStack.pop().nodeIndex
                nextDot += `${nodeIndex} -- ${childNodeIndex};`
            }

            const stateAfterPop = parseStack[parseStack.length - 1].state
            const nextState = Number(parseTable[stateAfterPop][nonTerminal].slice(1))
            parseStack.push({ label: nonTerminal, state: nextState, nodeIndex })

            setLastAction(`reduce by ${production.join(' ')}`)
            setDot(nextDot)
        }
    }

    return (
        <div className="ParseExpression">
            <h2 className='header'>4.&nbsp;Parse</h2>
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