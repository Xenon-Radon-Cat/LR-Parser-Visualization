// component for users to writer their SLR grammar

import React, { useState } from 'react'
import { Input, Button, Row, Col} from 'antd';
import { useDispatch } from 'react-redux';
import { grammarUpdated } from './grammarSlice';

const { TextArea } = Input;

export const InputGrammar = () => {
    const initialText = 'S ::= ( L )\nS ::= x\nL ::= S\nL ::= L ; S'
    const [text, setText] = useState(initialText)
    const onTextChange = (e) => setText(e.target.value)
    const dispatch = useDispatch()

    return (
        <div className='InputGrammar'>
            <h2 className='header'>Write your SLR grammar</h2>
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
                            <li>$ is reserved as the end-of-input symbol, and S' is reserved as an artificial start symbol. The grammar is automatically augmented with the rule S' ::= start $</li>
                        </ul>
                    </div>
                </Col>
            </Row>
            <Button type='primary' className='Button' size='large' onClick={() => dispatch(grammarUpdated(text))}>Generate LR(0) Automation</Button>
        </div>
    )
}