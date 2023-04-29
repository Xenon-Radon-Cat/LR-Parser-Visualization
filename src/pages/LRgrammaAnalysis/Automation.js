// component to render LR(0) automation

import { React, useEffect, useState } from "react"
import { Space, Button } from "antd"
import { Graphviz } from "./Graphviz"

export const Automation = (props) => {
    const { automationDots } = props
    const [ step, setStep ] = useState(0)

    const onNextClick = () => {
        if(step + 1 < automationDots.length) {
            setStep(step + 1)
        }
    }
    const onDoneClick = () => {
        setStep(automationDots.length - 1)
    }


    useEffect(() => { setStep(0) }, [automationDots])

    return (
        <div className='Automation'>
            <h2 className='header'>2. LR(0) Automation</h2>
            <Graphviz identifier='automationGraph' dot={automationDots[step]}></Graphviz>
            <Space>
                <Button type='primary' size='large' onClick={onNextClick}>Do Next</Button>
                <Button type='primary' size='large' onClick={onDoneClick}>Do Done</Button>
            </Space>
        </div>
    )
}