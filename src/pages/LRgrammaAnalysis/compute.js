// functions about computation of LR(0) automation and parse table

const computeAutomation = (grammar) => {
    // 'grammar': { productions: String[][], productionMap: Map<String, Number[]>, terminalSet: Set<String> }
    const { productions, productionMap } = grammar

    const compareItem = (item1, item2) => {
        // item: { productionIndex: Number, dotIndex: Number }
        if(item1.productionIndex < item2.productionIndex)
            return -1
        else if(item1.productionIndex > item2.productionIndex)
            return 1
        else
            return item1.dotIndex < item2.dotIndex ? -1 : 1
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

    const computeAutomationHelper = (nodeIndex) => {
        // assert that nodes['nodeIndex'] must be a closure
        const edgeMap = new Map() // Map<String, [{ productionIndex: Number, dotIndex: Number }]>
        
        // collect edges which start from 'nodeIndex'
        for(const { productionIndex, dotIndex } of nodes[nodeIndex]) {
            const token = productions[productionIndex][dotIndex]
            // check whether the dot could shift ahead
            if(token === undefined)
                continue
            if(!edgeMap.has(token))
                edgeMap.set(token, [])
            // insert item into corresponding item set
            edgeMap.get(token).push({ productionIndex, dotIndex: dotIndex + 1 })
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
            edges.push({ sourceIndex: nodeIndex, targetIndex: nodes.length - 1, label })
            computeAutomationHelper(nodes.length - 1)
        }
    }

    computeAutomationHelper(0)

    return { nodes, edges }
}

const computeParseTable = (grammar, automation) => {
    // 'grammar': { productions: String[][], productionMap: Map<String, Number[]>, terminalSet: Set<String> }
    // 'automation': { 
    //     nodes: { productionIndex: Number, dotIndex: Number }[][], 
    //     edges: { sourceIndex: Number, targetIndex: Number, label: String }[]
    // }

    const { productions, terminalSet } = grammar
    const { nodes, edges } = automation
    const parseTable = []

    // initialize 'parseTable'
    for(let i = 0; i < nodes.length; ++i) {
        // I would like to name the property with 'stateId' at first
        // howerve, I can not assert that user would not input above token in the grammar
        // therefore, I rename that property with 'S\''
        // since we never shift augmented start symbol
        parseTable.push({ 'S\'': `q${i}` })
    }

    // add shift/goto action into 'parseTable'
    for(const { sourceIndex, targetIndex, label } of edges) {
        if(terminalSet.has(label)) 
            parseTable[sourceIndex][label] = `s${targetIndex}`
        else
            parseTable[sourceIndex][label] = `g${targetIndex}`
    }

    // add reduce action into 'parseTable'
    for(const nodeIndex in nodes) {
        for(const { productionIndex, dotIndex } of nodes[nodeIndex]) {
            if(productions[productionIndex].length === dotIndex) {
                if(productionIndex === 0) {
                    // no need to reduce by S' ::= S
                    parseTable[nodeIndex]['$'] = 'acc'
                }
                else {
                    for(const terminal of terminalSet) {
                        // check whether the conflict occurs
                        if(typeof(parseTable[nodeIndex][terminal]) === 'string') 
                            parseTable[nodeIndex][terminal] += `/r${productionIndex}`
                        else 
                            parseTable[nodeIndex][terminal] = `r${productionIndex}`
                    }
                }
            }
        }
    }

    return parseTable
}

export { computeAutomation, computeParseTable }