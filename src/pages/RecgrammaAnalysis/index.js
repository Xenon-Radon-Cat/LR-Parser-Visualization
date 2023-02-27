import { Input, Button } from 'antd';
import { useState } from 'react';

const { TextArea } = Input;

export function Recgramma() {
    const [G,setG ] = useState('');
    const [prod, setProd] = useState('');
    return (
        <div>
            <div>可视递归下降分析</div>
            <div>
                <div>
                    <p>输入文法</p>
                    <TextArea rows={4} onChange={(e) => setG(e.target.value)}/>
                    <p>输入产生式</p>
                    <TextArea rows={4} onChange={(e) => setProd(e.target.value)}/>
                    <Button>开始分析</Button>
                </div>
            </div>
            
        </div>
    )
}