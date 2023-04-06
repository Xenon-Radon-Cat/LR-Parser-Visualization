// component for users to writer their SLR grammar

import React, { useState } from 'react'
import { Input, Button, Row, Col} from 'antd'

const { TextArea } = Input

export const InputGrammar = (props) => {
    const [text, setText] = useState('S ::= ( L )\nS ::= x\nL ::= S\nL ::= L ; S')
    const { grammarUpdated } = props
    
    const onTextChange = (e) => setText(e.target.value)
    const onButtonClick = () => {
        const productions = [['S\'', '::=', '']]

        for(const line of text.trim().split(/\n+/)) {
            const production = line.trim().split(/\s+/)
            // validate 'prodution'
            if(production[0] === '') {
                // skip empty line
                continue
            }
            if(production.length < 2 || production[1] !== '::=') {
                alert('please use correct expand symbol ::=')
                return
            }
            for(const token of production) {
                if(token === '$' || token === 'S\'') {
                    alert('please do not use reserve symbol like $ and S\'')
                    return
                }
            }
            productions.push(production)
        }

        // check whether 'productions' is empty
        if(productions.length === 1) {
            alert('please input your grammar first')
            return
        }
            
        // write back start symbol into augmented production
        productions[0][2] = productions[1][0]

        // classify 'productions' by non-terminal
        const productionMap = new Map()
        for(const productionIndex in productions) {
            const nonTerminal = productions[productionIndex][0]
            if(!productionMap.has(nonTerminal))
                productionMap.set(nonTerminal, [])
            productionMap.get(nonTerminal).push(Number(productionIndex))
        }

        // collect terminals from 'productions'
        const terminalSet = new Set()
        for(const production of productions) {
            for(let i = 2; i < production.length; ++i) {
                const token = production[i]
                if(!productionMap.has(token))
                    terminalSet.add(token)
            }
        }
        terminalSet.add('$')
        
        // update grammar
        grammarUpdated({ productions, productionMap, terminalSet })
    }

    return (
        <div className='InputGrammar'>
            <h2 className='header'>1. Write your SLR grammar</h2>
            <Row>
                <Col span={4}>
                    <TextArea className="TextArea" value={text} autoSize={{minRows: 12, maxRows: 24}} onChange={onTextChange}/>
                </Col>
                <Col offset={4} span={15}>
                    <div>
                        <h3>Formatting Instructions</h3>
                        <ul>
                            <li>The non-terminal on the left-hand-side of the first rule is the start non-terminal</li>
                            <li>Write each production rule in a separate line (see example to the left)</li>
                            <li>Separate each token using whitespace</li>
                            <li>Write the empty production rule like E ::= </li>
                            <li>$ is reserved as the end-of-input symbol, and S' is reserved as an artificial start symbol. The grammar is automatically augmented with the rule S' ::= start </li>
                        </ul>
                    </div>
                </Col>
            </Row>
            <Button type='primary' className='Button' size='large' onClick={onButtonClick}>Generate LR(0) Automation</Button>
        </div>
    )
}