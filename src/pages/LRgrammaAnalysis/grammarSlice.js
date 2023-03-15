// slice about grammar

import { createSlice } from "@reduxjs/toolkit"

const expandSymbol = '::='

const initialState = {
    productions: [
        ['S', expandSymbol, '(', 'L', ')'],
        ['S', expandSymbol, 'x'],
        ['L', expandSymbol, 'S'],
        ['L', expandSymbol, 'L', ';', 'S'],
        ['S\'', expandSymbol, 'S']
    ]
}


const grammarSlice = createSlice({
    name: 'grammar',
    initialState,
    reducers: {
        grammarUpdated(state, action) {
            const text = action.payload
            const productions = []

            for(const line of text.trim().split(/\n+/)) {
                const production = line.trim().split(/\s+/)
                // validate 'prodution'
                if(production[0] === '') {
                    // skip empty line
                    continue
                }
                if(production.length < 2 || production[1] != expandSymbol) {
                    alert(`please use correct expand symbol ${expandSymbol}`)
                    return state
                }
                for(const token of production) {
                    if(token === '$' || token === 'S\'') {
                        alert('please do not use reserve symbol like $ and S\'')
                        return state
                    }
                }
                productions.push(production)
            }

            // check whether 'productions' is empty
            if(productions.length === 0) {
                alert('please input your grammar first')
                return state
            }
            
            //augment grammar
            productions.push(['S\'', expandSymbol, productions[0][0]])
            
            state.productions = productions
        }
    }
})

export const {grammarUpdated} = grammarSlice.actions

export default grammarSlice.reducer