// functions about computation of LR(0) automation and parse table

const computeAutomation = (grammar) => {
    // 'grammar': { productions: String[][], productionMap: Map<String, Number[]>, terminalSet: Set<String> }
    const { productions, productionMap } = grammar

    const encode = ({ productionIndex, dotIndex }) => {
        // encode the binary group about item to number
        return productionIndex * 65536 + dotIndex
    }

    const decode = (itemCode) => {
        // decode the 'itemCode' to the binary group about item
        return { productionIndex: Math.floor(itemCode / 65536), dotIndex: itemCode % 65536 }
    }

    const closure = (itemSet, callback = () => {}) => {
        // itemSet: [ productionIndex: Number, dotIndex: Number ]
        // compute closure of 'itemSet' and generate the dot language description about automation 
        // when 'itemSet' has changed and 'callback' is generateDot()

        // assert that each item in the 'itemSet' is unique
        // 'seen' traces the items searched in the 'itemSet'
        const seen = new Set()
        for(const item of itemSet) {
            seen.add(encode(item))
        }
        
        for(let i = 0; i < itemSet.length; ++i) {
            const { productionIndex, dotIndex } = itemSet[i]
            const token = productions[productionIndex][dotIndex]
            let hasChanged = false // record whether the 'itemSet' has changed in the current iteration

            // check whether the 'token' following dot is a non-terminal
            if(productionMap.has(token)) {
                // iterate all productions of 'token'
                for(let productionIndex of productionMap.get(token)) {
                    // check whether 'itemSet' contains the item { productionIndex, dotIndex: 2 }
                    if(!seen.has(encode({ productionIndex, dotIndex: 2 }))) {
                        // push new item { productionIndex, dotIndex: 2 } into 'itemSet'
                        itemSet.push({ productionIndex, dotIndex: 2 })
                        seen.add(encode({ productionIndex, dotIndex: 2 }))
                        hasChanged = true
                    }
                }
            }

            // check whether the 'itemSet' has changed in the current iteration
            if(hasChanged) {
                // generate the dot language description about automation if 'callback' is generateDot()
                callback()
            }
        }
    }    

    const nodes = [[{ productionIndex: 0, dotIndex: 2 }]]
    const edges = [] // [{ sourceIndex: Number, targetIndex: Number, label: String }]
    const automationDots = [] // Array<String>

    const generateDot = () => {
        // scan the automation to generate corresponding dot language description
        // the function would only be called when automation has changed

        // add the prologue
        let dot = 'digraph { rankdir=LR;'

        // add node statement list
        for(const nodeIndex in nodes) {
            // add node identifier and the prologue of attribute list
            dot += `${nodeIndex} [label="q${nodeIndex}\n`
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
                dot += '\n'
            }
            // add the epilog of attribute list
            dot += '"];';
        }

        // add edge statement list
        for(const { sourceIndex, targetIndex, label } of edges) {
            // add the edge and the label
            dot += `${sourceIndex} -> ${targetIndex} [label="${label}"];`
        }

        // add the epilog
        dot += '}'

        // push 'dot' into 'automationDots'
        automationDots.push(dot)
    }

    const computeAutomationHelper = (nodeIndex) => {     
        const edgeMap = new Map() // Map<String, [{ productionIndex: Number, dotIndex: Number }]>

        // assert that all the itemSets in the 'nodes'[0, 'nodeIndex') are clousres
        // assert that 'nodeIndex' is equal to 'nodes'.length - 1
        closure(nodes[nodeIndex], generateDot) 
        // assert that all the itemSets in the 'nodes' are closures
        
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
        for(const [label, kernel] of edgeMap.entries()) {
            // copy the 'kernel' and compute the closure of 'itemSet'
            // we do not need to generate the dot language description about automation during closure('itemSet')
            // since we only use the closure to judge whether we need to add a new node into automation
            // if we have to add a new node into automation
            // then we push 'kernel' into 'nodes' and compute the clousre of 'kernel' in the next recursion
            // we would generate the dot language description about automation during closure('kernel')

            const itemSet = kernel.map((item => ({ ...item })))
            closure(itemSet)

            // assert that all the elements in the 'nodes' are closures
            // check whether 'nodes' contains 'itemSet'
            Loop2:
            for(const searchIndex in nodes) {
                const searchItemSet = nodes[searchIndex]
                // check whether the length of 'searchItemSet' is equal to 'itemSet'
                if(searchItemSet.length !== itemSet.length)
                    continue

                // check whether 'searchItemSet' is equal to 'itemSet'
                const seen = new Set() // 'seen' traces all the item in the 'searchItemSet'
                for(const item of searchItemSet) {
                    seen.add(encode(item))
                }
                for(const item of itemSet) {
                    if(!seen.has(encode(item)))
                        continue Loop2
                }

                // success to search
                edges.push({ sourceIndex: nodeIndex, targetIndex: Number(searchIndex), label})
                generateDot()
                continue Loop1
            }

            // fail to search
            // assert that all the itemSets in the 'nodes' are closures
            nodes.push(kernel)
            edges.push({ sourceIndex: nodeIndex, targetIndex: nodes.length - 1, label })
            generateDot()
            // assert that all the itemSets in the 'nodes'[0, 'nodes'.length - 1) are clousres
            computeAutomationHelper(nodes.length - 1)
            // assert that all the itemSets in the 'nodes' are closures
        }

        // assert that all the itemSets in the 'nodes' are closures 
    }

    generateDot()
    computeAutomationHelper(0)

    return { 
        automation: { nodes, edges },
        automationDots
    }
}

const computeParseTable = (grammar, automation, firstFollow) => {
    // 'grammar': { productions: String[][], productionMap: Map<String, Number[]>, terminalSet: Set<String> }
    // 'automation': { 
    //     nodes: { productionIndex: Number, dotIndex: Number }[][], 
    //     edges: { sourceIndex: Number, targetIndex: Number, label: String }[]
    // }
    // 'firstFollow': {
    //     nullable: Map<String, Bool>,
    //     first: Map<String, Set<String>>,
    //     follow: Map<String, Set<String>>
    // }

    const { productions, terminalSet } = grammar
    const { nodes, edges } = automation
    const { follow } = firstFollow
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
                    const nonTerminal = productions[productionIndex][0]
                    for(const terminal of follow.get(nonTerminal)) {
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