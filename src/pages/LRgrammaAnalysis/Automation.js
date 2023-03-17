import React from "react"
import { useSelector } from "react-redux"
import Graphviz from "graphviz-react"

const compareItem = (item1, item2) => {
    // item: { productionIndex: Number, dotIndex: Number }
    if(item1.productionIndex < item2.productionIndex)
        return -1
    else if(item1.productionIndex > item2.productionIndex)
        return 1
    else
        return item1.dotIndex < item2.dotIndex ? -1 : 1
}

export const Automation = () => {
    const { productions } = useSelector(state => state.grammar)
    // string -> Number[] where string is non-terminal and number is index of 'productions'
    const productionMap = new Map()

    // classify 'productions' by non-terminal
    for(let productionIndex in productions) {
        const nonTerminal = productions[productionIndex][0]
        if(!productionMap.has(nonTerminal))
            productionMap.set(nonTerminal, [])
        productionMap.get(nonTerminal).push(Number(productionIndex))
    }

    const closure = (itemSet) => {
        // itemSet: [ productionIndex: Number, dotIndex: Number ]
        // return sorted closure of 'itemSet'

        for(let i = 0; i < itemSet.length; ++i) {
            const { productionIndex, dotIndex } = itemSet[i]
            const token = productions[productionIndex][dotIndex]

            // check whether the 'token' following dot is a non-terminal
            if(productionMap.has(token)) {
                // iterate all productions of 'token'
                Loop:
                for(let productionIndex of productionMap.get(token)) {
                    // check whether 'itemSet' contains the item { productionIndex, dotIndex: 2 }
                    for(let i = 0; i < itemSet.length; ++i) {
                        if(itemSet[i].productionIndex === productionIndex && itemSet[i].dotIndex === 2)
                            continue Loop
                    }
                    // push new item { productionIndex, dotIndex: 2 } into 'itemSet'
                    itemSet.push({ productionIndex, dotIndex: 2 })
                }
            }
        }

        // sort and return
        return itemSet.sort(compareItem)
    }    

    const nodes = [closure([{ productionIndex: 0, dotIndex: 2}])]
    const edges = [] // [{ sourceIndex: Number, targetIndex: Number, label: String }]

    const computeAutomation = (nodeIndex) => {
        // assert that nodes['nodeIndex'] must be a closure
        const edgeMap = new Map() // Map<String, [{ productionIndex: Number, dotIndex: Number}]>
        
        // collect edges which start from 'nodeIndex'
        for(const {productionIndex, dotIndex} of nodes[nodeIndex]) {
            const token = productions[productionIndex][dotIndex]
            // check whether the dot could shift ahead
            if(token === undefined)
                continue
            if(!edgeMap.has(token))
                edgeMap.set(token, [])
            // insert item into corresponding item set
            edgeMap.get(token).push({productionIndex, dotIndex: dotIndex + 1})
        }

        // dfs
        Loop1:
        for(const [label, itemSet] of edgeMap.entries()) {
            // compute closure of 'itemSet'
            closure(itemSet)

            // check whether 'nodes' contains 'itemSet'
            Loop2:
            for(const searchIndex in nodes) {
                const searchItemSet = nodes[searchIndex]
                // check whether the length of 'searchItemSet' is equal to 'itemSet's
                if(searchItemSet.length !== itemSet.length)
                    continue
                // iterate 'searchItemSet' to check the equality further
                for(const itemIndex in searchItemSet) {
                    const item = itemSet[itemIndex]
                    const searchItem = searchItemSet[itemIndex]
                    if(item.productionIndex !== searchItem.productionIndex || item.dotIndex !== searchItem.dotIndex)
                        continue Loop2
                }
                // success to search
                edges.push({ sourceIndex: nodeIndex, targetIndex: Number(searchIndex), label})
                continue Loop1
            }

            // fail to search
            nodes.push(itemSet)
            edges.push( {sourceIndex: nodeIndex, targetIndex: nodes.length - 1, label})
            computeAutomation(nodes.length - 1)
        }
    }

    computeAutomation(0)

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
            <h2 className='header'>2.LR(0) Automation</h2>
            <Graphviz dot={dot} options={{width: "100%", height: null}}></Graphviz>
        </div>
    )
}