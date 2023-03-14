// top-level component of SLR Parser Visualization

import React from 'react';
import { Col, Row} from 'antd';
import { InputGrammar } from './InputGrammar';
import './index.css'

export const LRgramma = () => (
    <div className='LRGrammar'>
        <h1 className='header'> SLR Parser Visualization</h1>
        <InputGrammar/>
        {/*
        <Row>
            <Col span={12}>
                Parse Table
            </Col>
            <Col span={12}>
                Automation
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                Parse Expression
            </Col>
            <Col span={12}>
                Parse Tree
            </Col>
        </Row>
        */}
    </div>
)