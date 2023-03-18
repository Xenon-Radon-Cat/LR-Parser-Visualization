// component to render First/Follow set and SLR parse table

import React from "react"
import { Table } from "antd"

export const ParseTable = (props) => {
    console.log("FUCK PARSE TABLE")
    const { grammar, parseTable } = props
    const { productionMap, terminalSet } = grammar

    const columns = [{ title: '', dataIndex: 'S\'' }] // see computeParsetable() in compute.js

    // add terminals into 'columns'
    for(const terminal of terminalSet)
        columns.push({ title: terminal, dataIndex: terminal })

    // add non-terminals into 'columns'
    for(const nonTerminal of productionMap.keys()) {
        if(nonTerminal !== 'S\'')
            columns.push({ title: nonTerminal, dataIndex: nonTerminal })
    }

    return (
        <div>
        <h2 className='header'>3.Table</h2>
        <Table dataSource={parseTable} columns={columns} bordered={true}/>
        </div>
    )
}