// a component which wraps 'd3' and 'd3-graphviz' to render graphs and animated transitions

import { React, useEffect } from "react"
import { graphviz } from "d3-graphviz"
import * as d3 from "d3"

export const Graphviz = (props) => {
    // props: { identifier: string, dot: string }

    const { identifier, dot } = props

    const transitionFactory = () => {
        return d3.transition()
            .ease(d3.easeLinear)
            .duration(500);
    }

    useEffect(() => 
    { 
        graphviz(`#${identifier}`, 
        {
            height: 500, 
            width: '100%', 
            fit: true, 
            zoomScaleExtent: [0.25, 4],
        }).transition(transitionFactory).renderDot(dot)
    }, [identifier, dot])   

    return (
        <div id={identifier} className="Graphviz">
        </div>
    )
}