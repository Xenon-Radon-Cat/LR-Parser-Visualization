// component to render First/Follow set and SLR parse table

import React from "react"
import { Row, Col, Table } from "antd"

export const ParseTable = (props) => {
    const { grammar, firstFollow, parseTable } = props
    const { productionMap, terminalSet } = grammar
    const { nullable, first, follow } = firstFollow

    const parseTableColumns = [{ title: '', dataIndex: 'S\'', fixed: true }] // see computeParsetable() in compute.js
    const firstFollowColumns = [
        { title: 'Nonterminal', dataIndex: 'nonTerminal', fixed: true },
        { title: 'Nullable?', dataIndex: 'nullable' },
        { title: 'first', dataIndex: 'first' },
        { title: 'follow', dataIndex: 'follow' }
    ]
    const firstFollowDatasource = []

    // add terminals into 'columns'
    for(const terminal of terminalSet)
        parseTableColumns.push({ title: terminal, dataIndex: terminal })

    // add non-terminals into 'columns' and load 'firstFollowDatasource'
    for(const nonTerminal of productionMap.keys()) {
        if(nonTerminal !== 'S\'') {
            let firstString = ''
            let followString = ''

            for(const firstElement of first.get(nonTerminal))
                firstString += `${firstElement} `
            for(const followElement of follow.get(nonTerminal))
                followString += `${followElement} `

            parseTableColumns.push({ title: nonTerminal, dataIndex: nonTerminal })
            firstFollowDatasource.push({
                nonTerminal,
                nullable: nullable.get(nonTerminal) ? 'true' : 'false',
                first: firstString,
                follow: followString
            })
        }
    }

    return (
        <div>
        <h2 className='header'>3. Table</h2>
        <Row>
            <Col span={7}>
                <Table dataSource={firstFollowDatasource} columns={firstFollowColumns} bordered={true} 
                scroll={{scrollToFirstRowOnChange: true, x: true}}/>
            </Col>
            <Col offset={1} span={16}>
                <Table dataSource={parseTable} columns={parseTableColumns} bordered={true}
                scroll={{scrollToFirstRowOnChange: true, x: true}}/>
            </Col>
        </Row>
        </div>
    )
}