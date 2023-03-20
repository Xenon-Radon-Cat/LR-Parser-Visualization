// component to render LR(0) automation

import React from "react"
import Graphviz from "graphviz-react"

export const Automation = (props) => {
    const { grammar, automation } = props
    const { productions } = grammar
    const { nodes, edges } = automation

    // add the prologue
    let dot = 'digraph {\nrankdir=LR\n'

    // add node statement list
    for(const nodeIndex in nodes) {
        // add node identifier
        dot += nodeIndex
        // add the prologue of attribute list
        dot += ` [label="q${nodeIndex}\n`
        // add the productions
        for(const { productionIndex, dotIndex } of nodes[nodeIndex]) {
            const production = productions[productionIndex]
            // add the part behind the dot
            for(let i = 0; i < dotIndex; ++i)
                dot += production[i]
            // add the dot
            dot += '.'
            // add the part below the dot
            for(let i = dotIndex; i < production.length; ++i)
                dot += production[i]
            // add the newline
            dot += '\\n'
        }
        // add the epilog of attribute list
        dot += '"];\n';
    }

    // add edge statement list
    for(const { sourceIndex, targetIndex, label } of edges) {
        // add the edge
        dot += sourceIndex
        dot += ' -> '
        dot += targetIndex
        // add the label
        dot += ' [label="'
        dot += label
        dot += '"];\n';
    }

    // add the epilog
    dot += '}'

    return (
        <div>
            <h2 className='header'>2. LR(0) Automation</h2>
            <Graphviz dot={dot} options={{width: "100%", height: null}}></Graphviz>
        </div>
    )
}