// functions about computation of LR(0) automation and parse table

const computeAutomation = (grammar) => {
    // 'grammar': { productions: String[][], productionMap: Map<String, Number[]>, terminalSet: Set<String> }
    const { productions, productionMap } = grammar

    const encode = ({ productionIndex, dotIndex }) => {
        // encode the binary group about item to number
        return productionIndex * 65536 + dotIndex
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
                    dot += `${production[i]} `
                // add the dot
                 dot += '. '
                // add the part below the dot
                for(let i = dotIndex; i < production.length; ++i)
                    dot += `${production[i]} `
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
        nullable.set(terminal, false)
    }

    follow.set('S\'', new Set(['$']))

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


    const nodes = [] // [{ type: string, symbols: Set<string>, redirect: Number }]
    // Map<Number, Set<Number>> where key is the index of node and value is a set of indexes of outNodes
    const edges = new Map()
    // Map<string, Number> where key is a symbol and value is the index of corresponding node
    const firstNodeMap = new Map() 
    const followNodeMap = new Map()
    const firstFollowDots = []

    
    // create the relation graph
    const createRelationGraph = () => {
        for(const production of productions) {
            const nonTerminal = production[0]
            for(let i = 2; i < production.length; ++i) {
                const token = production[i]
                // check whether the corresponding nodes occur
                if(!firstNodeMap.has(token)) {
                    nodes.push({ type: 'First', symbols: new Set([token]), redirect: nodes.length })
                    firstNodeMap.set(token, nodes.length - 1)
                }
                if(!firstNodeMap.has(nonTerminal)) {
                    nodes.push({ type: 'First', symbols: new Set([nonTerminal]), redirect: nodes.length })
                    firstNodeMap.set(nonTerminal, nodes.length - 1)
                }

                // create the edge First('token') -> First('nonTerminal')
                const u = firstNodeMap.get(token)
                const v = firstNodeMap.get(nonTerminal)
                if(!edges.has(u))
                    edges.set(u, new Set([]))
                edges.get(u).add(v)

                if(!nullable.get(token))
                    break
            }
        }

        for(const production of productions) {
            const nonTerminal = production[0]
            // pass from parent to child
            for(let i = production.length - 1; i > 1; --i) {
                const token = production[i]
                // check whether the 'token' is a terminal 
                // since we do not need to compute the follow sets for terminals
                if(terminalSet.has(token)) 
                    break

                // check whether the corresponding nodes occur
                if(!followNodeMap.has(nonTerminal)) {
                    nodes.push({ type: 'Follow', symbols: new Set([nonTerminal]), redirect: nodes.length })
                    followNodeMap.set(nonTerminal, nodes.length - 1)
                }
                if(!followNodeMap.has(token)) {
                    nodes.push({ type: 'Follow', symbols: new Set([token]), redirect: nodes.length })
                    followNodeMap.set(token, nodes.length - 1)
                }

                // create the edge Follow('nonTerminal') -> Follow('token')
                const u = followNodeMap.get(nonTerminal)
                const v = followNodeMap.get(token)
                if(!edges.has(u))
                    edges.set(u, new Set([]))
                edges.get(u).add(v)

                if(!nullable.get(token))
                    break
            }
            // pass between siblings
            for(let i = 2; i < production.length - 1; ++i) {
                const elderToken = production[i]
                // check whether the 'elderToken' is a terminal 
                // since we do not need to compute the follow sets for terminals
                if(terminalSet.has(elderToken)) 
                    continue

                for(let j = i + 1; j < production.length; ++j) {
                    const youngerToken = production[j]
                    // check whether the corresponding nodes occur
                    if(!firstNodeMap.has(youngerToken)) {
                        nodes.push({ type: 'First', symbols: new Set([youngerToken]), redirect: nodes.length })
                        firstNodeMap.set(youngerToken, nodes.length - 1)
                    }   
                    if(!followNodeMap.has(elderToken)) {
                        nodes.push({ type: 'Follow', symbols: new Set([elderToken]), redirect: nodes.length })
                        followNodeMap.set(elderToken, nodes.length - 1)
                    }

                    // create the edge First('youngerToken') -> Follow('elderToken') 
                    const u = firstNodeMap.get(youngerToken)
                    const v = followNodeMap.get(elderToken)
                    if(!edges.has(u))
                        edges.set(u, new Set([]))
                    edges.get(u).add(v)

                    if(!nullable.get(youngerToken))
                        break;
                }
            }
        }
        generateDot()
    }

    const find = (nodeIndex) => {
        const { redirect } = nodes[nodeIndex]
        if(redirect === nodeIndex)
            return nodeIndex
        else
            return nodes[nodeIndex].redirect = find(redirect)
    }

    // eliminate all the circuits
    const eliminateCircuits = () => {
        // 'visited' traces whether the edge has been visited
        const visited = new Map() // Map<Number, Map<Number, Bool>>
        let hasCircuit = false // 'hasCircuit' traces whether the relation graph contains the circuit

        // initialize 'visited'
        for(const [source, targets] of edges.entries()) {
            if(!visited.has(source))
                visited.set(source, new Map())
            for(const target of targets) {
                visited.get(source).set(target, false)
            }
        }
        
        const dfs = (nodeIndex, path, pathMap) => {
            // path: [Number]
            // pathMap: Map<Number, Number>
            // 'path' stores the indexes of nodes in the current path
            // 'pathMap' traces the mappings from the index of node to the index of 'path'
            if(pathMap.has(nodeIndex)) {
                // detect a circuit
                const startNodePathIndex = pathMap.get(nodeIndex) // the path index of start node in the circuit
                const symbols = new Set() // 'symbols' is the union set of the symbols of nodes in the circuit 

                // union the symbols of nodes in the circuit
                for(let i = startNodePathIndex; i < path.length; ++i) {
                    unionSet(symbols, nodes[find(path[i])].symbols)
                }
                
                // create a new node to substitue all the nodes in the circuit
                // assert that the type of all the nodes in the circuit are the same
                nodes.push({ type: nodes[path[startNodePathIndex]].type, symbols, redirect: nodes.length })

                // change the redirect of all the nodes in the circuit
                for(let i = startNodePathIndex; i < path.length; ++i) {
                    nodes[find(path[i])].redirect = nodes.length - 1
                }

                // mark that the relation graph contains the circuit 
                hasCircuit = true
            }
            else if(edges.has(nodeIndex)){
                path.push(nodeIndex)
                pathMap.set(nodeIndex, path.length - 1)
                for(const outNodeIndex of edges.get(nodeIndex)) {
                    if(!visited.get(nodeIndex).get(outNodeIndex)) {
                        visited.get(nodeIndex).set(outNodeIndex, true)
                        dfs(outNodeIndex, path, pathMap)
                    }
                }
                path.pop()
                pathMap.delete(nodeIndex)
            }
        }

        // scan all the edges in the relation graph
        for(const nodeIndex of edges.keys()) {
            dfs(nodeIndex, [], new Map())
        }

        if(hasCircuit) {
            // copy and clear 'edges'
            const copyEdges = new Map()
            for(const [source, targets] of edges.entries()) {
                copyEdges.set(source, new Set(targets))
            }
            edges.clear()
            
            // redirect the edges
            for(const [source, targets] of copyEdges.entries()) {
                const u = find(source)
                for(const target of targets) {
                    const v = find(target)
                    if(u !== v) {
                        if(!edges.has(u))
                            edges.set(u, new Set())
                        edges.get(u).add(v)
                    }
                }
            }

            generateDot()
        }
    }

    const topSort = () => {
        const indegreeMap = new Map() // Map<Number, Number>
        const stack = []

        // initialize 'indegree'
        for(const nodeIndex in nodes) {
            if(nodes[nodeIndex].redirect === Number(nodeIndex)) {
                indegreeMap.set(Number(nodeIndex), 0)
            }
        }
        for(const [, targets] of edges.entries()) {
            for(const target of targets) {
                indegreeMap.set(target, indegreeMap.get(target) + 1)
            }
        }

        // prepare 'stack'
        for(const [nodeIndex, indegree] of indegreeMap.entries()) {
            if(indegree === 0)
                stack.push(nodeIndex)
        }

        while(stack.length > 0) {
            const nodeIndex = stack.pop()
            if(edges.has(nodeIndex)) {
                for(const outNodeIndex of edges.get(nodeIndex)) {
                    indegreeMap.set(outNodeIndex, indegreeMap.get(outNodeIndex) - 1)
                    if(indegreeMap.get(outNodeIndex) === 0)
                        stack.push(outNodeIndex)

                    const symbolU = nodes[nodeIndex].symbols.values().next().value
                    const symbolV = nodes[outNodeIndex].symbols.values().next().value
                    const firstOrFollowSetU = nodes[nodeIndex].type === 'First' ? first.get(symbolU) : follow.get(symbolU)
                    const firstOrFollowSetV = nodes[outNodeIndex].type === 'First' ? first.get(symbolV) : follow.get(symbolV)

                    // pass from 'symbolU' to 'symbolV'
                    const sizeBeforeUnion = firstOrFollowSetV.size
                    unionSet(firstOrFollowSetV, firstOrFollowSetU)
                    const sizeAfterUnion = firstOrFollowSetV.size

                    // assure that the first or follow sets of symbols are the same
                    if(nodes[outNodeIndex].type === 'First') {
                        for(const symbol of nodes[outNodeIndex].symbols) {
                            first.set(symbol, firstOrFollowSetV)
                        }
                    }
                    else {
                        for(const symbol of nodes[outNodeIndex].symbols) {
                            follow.set(symbol, firstOrFollowSetV)
                        }
                    }

                    // if the first or follow set has changed then generate a new graph
                    if(sizeAfterUnion > sizeBeforeUnion) {
                        generateDot({ source: nodeIndex, target: outNodeIndex })
                    }
                }
            }
        }
    }

    const generateDot = (highlightedEdge = null) => {
        // add the prologue
        let dot = 'digraph { rankdir=LR;'

        // add node statement list
        for(const nodeIndex in nodes) {
            // check whether 'nodes[nodeIndex]' has been redirected
            if(nodes[nodeIndex].redirect !== Number(nodeIndex))
                continue
            
            // prepare the symbols represented by 'nodes[nodeIndex]'
            const symbols = [...nodes[nodeIndex].symbols]

            // prepare the first set or follow set represented by 'nodes[nodeIndex]'
            let firstOrFollows = null
            if(nodes[nodeIndex].type === 'First') 
                firstOrFollows = [...first.get(symbols[0])]
            else 
                firstOrFollows = [...follow.get(symbols[0])]

            dot += `${nodeIndex} [label="${nodes[nodeIndex].type}[${symbols.join(' ')}]\n[${firstOrFollows.join(' ')}]"];`
        }

        // add edge statement list
        for(const [source, targets] of edges.entries()) {
            for(const target of targets) {
                dot += `${source} -> ${target};`
            }
        }

        // add the epilog
        dot += '}'

        // check whether there exists an edge which should be highlighted
        if(highlightedEdge !== null) {
            const { source, target } = highlightedEdge
            dot = dot.replace(`${source} -> ${target};`, `${source} -> ${target} [color=orange];`)
        }

        firstFollowDots.push(dot)
    }

    createRelationGraph()
    eliminateCircuits()
    topSort()
    
    return { 
        firstFollow: { nullable, first, follow }, 
        firstFollowDots 
    }
}

export { computeAutomation, computeParseTable, computeFirstFollow }