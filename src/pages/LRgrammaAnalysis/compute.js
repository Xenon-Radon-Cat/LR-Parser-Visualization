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


const unionSet = (setA, setB) => {
    // union 'setA' and 'setB' and store the result in 'setA'
    for(const element of setB)
        setA.add(element)
}

const computeFirstFollow = (grammar) => {
    // 'grammar': { productions: String[][], productionMap: Map<String, Number[]>, terminalSet: Set<String> }
    const { productions, productionMap, terminalSet } = grammar

    const first = new Map() // Map<String, Set<String>>
    const follow = new Map() // Map<String, Set<String>>
    const nullable = new Map() // Map<String, Bool>

    // initialize above maps
    for(const nonTerminal of productionMap.keys()) {
        first.set(nonTerminal, new Set())
        follow.set(nonTerminal, new Set())
        nullable.set(nonTerminal, false)
    }
    
    for(const terminal of terminalSet) {
        first.set(terminal, new Set([terminal]))
        follow.set(terminal, new Set())
        nullable.set(terminal, false)
    }

    // compute 'nullable'
    let needIteration = true
    while(needIteration) {
        needIteration = false
        LOOP:
        for(const production of productions) {
            const nonTerminal = production[0]
            for(let i = 2; i < production.length; ++i) {
                const token = production[i]
                if(!nullable.get(token))
                    continue LOOP
            }
            if(!nullable.get(nonTerminal)) {
                // need to set with true
                nullable.set(nonTerminal, true)
                needIteration = true
            }
        }
    }

    // compute 'first'
    needIteration = true
    while(needIteration) {
        needIteration = false
        for(const production of productions) {
            const nonTerminal = production[0]
            for(let i = 2; i < production.length; ++i) {
                const token = production[i]
                const sizeBeforeUnion = first.get(nonTerminal).size
                unionSet(first.get(nonTerminal), first.get(token))
                const sizeAfterUnion = first.get(nonTerminal).size
                if(sizeBeforeUnion !== sizeAfterUnion)
                    needIteration = true
                if(!nullable.get(token))
                    break
            }
        }
    }

    // compute 'follow'
    follow.set('S\'', new Set(['$']))
    needIteration = true
    while(needIteration) {
        needIteration = false
        for(const production of productions) {
            const nonTerminal = production[0]
            // compute from parent to child
            for(let i = production.length - 1; i > 1; --i) {
                const token = production[i]
                const sizeBeforeUnion = follow.get(token).size
                unionSet(follow.get(token), follow.get(nonTerminal))
                const sizeAfterUnion = follow.get(token).size
                if(sizeBeforeUnion !== sizeAfterUnion)
                    needIteration = true
                if(!nullable.get(token))
                    break
            }
            // compute between siblings
            for(let i = 2; i < production.length - 1; ++i) {
                const elderToken = production[i]
                for(let j = i + 1; j < production.length; ++j) {
                    const youngerToken = production[j]
                    const sizeBeforeUnion = follow.get(elderToken).size
                    unionSet(follow.get(elderToken), first.get(youngerToken))
                    const sizeAfterUnion = follow.get(elderToken).size
                    if(sizeBeforeUnion !== sizeAfterUnion)
                        needIteration = true
                    if(!nullable.get(youngerToken))
                        break;
                }
            }
        }
    }

    return { nullable, first, follow }
}

export { computeAutomation, computeParseTable, computeFirstFollow }