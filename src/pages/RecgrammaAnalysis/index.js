import { Input, Button, List, Table, notification, Select, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { Prod, LL1 } from './util.js';
import { RenderTree } from './util.js';
import { useTranslation } from 'react-i18next';
import './index.css';


const { TextArea } = Input;


export function Recgramma() {
 //   const { t, i18n } = useTranslation();
 function t (str){
    return str;
 }
    const [G, setG] = useState('');
    const [str, setStr] = useState('');
    const [firstfollow, setFirstFollow] = useState();
    const [columns, setColumns] = useState([]);
    const [select, setSelect] = useState([]);
    const [stack, setStack] = useState([]);
    const [buttonMes, setButtonMes] = useState(t("next step"));
    const [api, contextHolder] = notification.useNotification();


    let LL = useRef(new LL1());
    useEffect(() => {
        if (t("Welcome to React") === "Welcome to React and react-i18next") {
        }
    }, [t])
    const stepColumns = [
        {
            title: 'stack',
            dataIndex: 'gra',
            key: 'stack'
        },
        {
            title: 'input',
            dataIndex: 'str',
            key: 'input',
        },
        {
            title: 'production',
            dataIndex: 'production',
            key: 'production'
        }
    ]
    function startAnalysis() {
        LL.current.reset();
        if (G === '') return;
        let arr = G.split('\n');
        let g = arr.map((item) => new Prod(item));
        g.forEach((item) => {
            LL.current.addProd(item);
        });
        const h = LL.current.isLeftRecursive();
        console.log(232,h)
        if(h){
            api.info({
                message: `文法左递归可修改成${h}`,
                placement: 'topRight',
            });
        }
        const isIndirect = LL.current.hasIndirectLeftRecursion();
        console.log(isIndirect,43434);
        
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
        let isend = true;
        stack.length && stack[stack.length - 1].gra.forEach((s) => {
            if (LL.current.VN.has(s)) {
                isend = false;
            }
        })
        if (str[0] === '#' && isend) {
            api.info({
                message: `Notification 已分析结束`,
                placement: 'topRight',
            });
            setButtonMes('重来');
            return;
        }
      //  console.log(LL.current.VN, 78797)
        let n = str.length === 1 ? [str] : str.split("");
        if (n[n.length - 1] !== '#') n.push('#')
        let h = LL.current.match(n);
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
        console.log(LL.current.root, 'root')
        RenderTree(LL.current.root);
    }

    function reset() {
        setFirstFollow('');
        setColumns('');
        setSelect('');
        setStack('');
        setStr('');
        LL = new LL1();
        setButtonMes('下一步');
    }

    // function handleChange(value) {
    //     i18n.changeLanguage(value);
    // }

    function addAutoGra() {
        setG(`E->TG\nG->+TG|@\nT->FY\nY->*FY|@\nF->(E)|i`);
    }

    return (
        <div>
            {contextHolder}
            <div className='title'>{t("Visual Recursive Descent Analysis")}
                <div className='language'>
                    <Select
                        style={{
                            width: 120,
                        }}
                    //    onChange={handleChange}
                        options={[
                            {
                                value: 'zh',
                                label: t("zh"),
                            },
                            {
                                value: 'en',
                                label: t("en"),
                            },
                        ]}
                    />
                </div>
            </div>
            <div className='body'>

                <div className='input'>
                    <p>{t('input grammar')}</p>
                    <TextArea value={G} rows={4} onChange={(e) => setG(e.target.value)} />
                    <Button onClick={addAutoGra}>{`
                        E->TG\n
                        G->+TG|@\n
                        T->FY\n
                        Y->*FY|@\n
                        F->(E)|i`}
                    </Button>
                    <p>{t("input production")}</p>
                    <TextArea rows={4} value={str} onChange={(e) => setStr(e.target.value)} />
                    <div className='button'><Button type="primary" onClick={startAnalysis}>{t("start analysis")}</Button></div>
                </div>
                <div className='firstfollow'>
                    <List
                        header={<div>{t("first&follow")}</div>}
                        bordered
                        dataSource={firstfollow}
                        renderItem={(item) => <List.Item>{item}</List.Item>}
                    />
                </div>

            </div>
            <div className='table'>
                <div className='predictTable'>
                    <p>{t("Predictive analysis table")}</p>
                    <Table columns={columns} dataSource={select} />;
                </div>
                <div className='recursionTable'>
                    {t("recursive analysis step")}
                    <div>
                        <Button type='primary' onClick={buttonMes === '重来' ? reset : nextStep}>{buttonMes}</Button>
                        <Table columns={stepColumns} dataSource={stack} />;
                    </div>
                </div>
            </div>
            <div id="container">

            </div>
        </div>
    )
}

// E->TG
// G->+TG|@
// T->FY
// Y->*FY|@
// F->(E)
// F->i