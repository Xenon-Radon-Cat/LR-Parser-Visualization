import { Input, Button, List, Table } from 'antd';
import { Item } from 'rc-menu';
import { useEffect, useRef, useState } from 'react';
import { Prod, LL1 } from './util.js';

const { TextArea } = Input;

export function Recgramma() {
    const [G, setG] = useState('');
    const [str, setStr] = useState('');
    const [firstfollow, setFirstFollow] = useState();
    const [columns, setColumns] = useState([]);
    const [select, setSelect] = useState([]);
    const [stack, setStack] = useState([]);
   

    let LL = useRef(new LL1());
    const stepColumns = [
        {
            title:'stack',
            dataIndex:'gra',
            key:'stack'
        },
        {
            title:'input',
            dataIndex: 'str',
            key:'input',
        },
        {
            title:'production',
            dataIndex:'production',
            key:'production'
        }
    ]
    function startAnalysis() {
        if (G === '') return;
        let arr = G.split('\n');
        let g = arr.map((item) => new Prod(item));
        g.forEach((item) => {
            LL.current.addProd(item);
        });
        arr.forEach((item) => {
            LL.current.first(item);
        })
        LL.current.follow();
        LL.current.parseTable();
        console.log(LL.current.FIRST, LL.current.FOLLOW, LL.current.M, LL.current.VN, '0000');
        let first = [];
        let follow = [];
        LL.current.FIRST.forEach((item, key) => {
            first.push(`FIRST(${key}) = {${[...item]}}`);
        })
        LL.current.FOLLOW.forEach((value, key) => {
            follow.push(`FOLLOW(${key}) = {${[...value]}}`);
        });
        setFirstFollow([...first, ...follow]);

        const title = [{
            title: 'key',
            dataIndex: 'key',
            key: 'key',
        }, {
            title: '#',
            dataIndex: '#',
            key: '#',
        }];
        LL.current.VT.forEach((value) => {
            title.push({
                title: value,
                dataIndex: value,
                key: value,
            })
        })
        setColumns(title);
        const data = [];
        LL.current.VN.forEach((value) => {
            data.push({
                key: value
            })
        })
        LL.current.M.forEach((value, key) => {
            let keys = key.split(',');
            data.map((item) => {
                if (keys[0] === item.key) {
                    item[keys[1]] = value;
                }
            })
        })
        setSelect(data)

    }
    function nextStep() {
        //if(str.length === 0) return;
        console.log(LL.current.VN, 78797)
        let h = str.length === 1? LL.current.match(str) : LL.current.match(str.split(""));
        if (h.length <= 1) {
            setStr(h)
        } else {
            setStr(h.join(''));
        }

        const temp = {
            gra: [...LL.current.gra],
            str: h,
            production: LL.current.production,
        }
        setStack([...stack, temp]);
     //   console.log(LL.current.gra, h, 89898)
    }
    return (
        <div>
            <div>可视递归下降分析</div>
            <div>
                <div>
                    <p>输入文法</p>
                    <TextArea rows={4} onChange={(e) => setG(e.target.value)} />
                    <p>输入产生式</p>
                    <TextArea rows={4} onChange={(e) => setStr(e.target.value)} />
                    <Button onClick={startAnalysis}>开始分析</Button>
                </div>
                <div>
                    <List
                        header={<div>first&follow</div>}
                        bordered
                        dataSource={firstfollow}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                    />
                </div>
                <div>
                    <p>预测分析表</p>
                    <Table columns={columns} dataSource={select} />;
                </div>
                <div>
                    递归分析步骤
                    <div>
                        <Button onClick={nextStep}>下一步</Button>
                        <Table columns={stepColumns} dataSource={stack} />;
                    </div>
                </div>
            </div>

        </div>
    )
}

// E->TG
// G->+TG|@
// T->FY
// Y->*FY|@
// F->(E)|i