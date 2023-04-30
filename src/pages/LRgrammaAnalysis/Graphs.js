// a component to render a series of graphs

import { React, useEffect, useState } from "react"
import { Space, Button } from "antd"
import { Graphviz } from "./Graphviz"

export const Graphs = (props) => {
    const { identifier, dots } = props
    const [ step, setStep ] = useState(0)

    const onPrevClick = () => {
        if(step > 0)
            setStep(step - 1)
    }
    const onNextClick = () => {
        if(step + 1 < dots.length) {
            setStep(step + 1)
        }
    }
    const onDoneClick = () => {
        setStep(dots.length - 1)
    }


    useEffect(() => { setStep(0) }, [dots])

    // since the hook useEffect() is executed after render, which we use to reset 'step' when 'dots' changes
    // therefore, we may meet an erratic phenomenon that 'step' would be equal or greater than 'dots.length'
    // we could use a conditional expression to solve the above question
    return step >= dots.length ? null : (
        <div className='Graphs'>
            <Graphviz identifier={identifier} dot={dots[step]}></Graphviz>
            <Space>
                <Button type='primary' size='large' onClick={onPrevClick}>Do Prev</Button>
                <Button type='primary' size='large' onClick={onNextClick}>Do Next</Button>
                <Button type='primary' size='large' onClick={onDoneClick}>Do Done</Button>
            </Space>
        </div>
    )
}