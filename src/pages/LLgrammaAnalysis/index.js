import React from 'react';
import { Table, Input, Button, Col, Row } from 'antd';
const { TextArea } = Input;

//产生式
class Prod{
    prod;            //产生式
    notTerminal;     //左部非终结符
    selection;       //候选式集合
    notTerminalSet;  //非终结符集合
    terminalSet;     //终结符集合
    isValid;         //产生式是否合法

    //构造函数
    constructor(prod) {
        this.prod = String(prod);
        this.notTerminal = '';
        this.selection = new Set();
        this.notTerminalSet = new Set();
        this.terminalSet = new Set();
        this.isValid = false;
    }

    //建立产生式
    build() {
        if (this.prod.length < 4) {
            return false; //非产生式形式
        }
        if (this.prod.substring(1, 3) === "->" && this.prod.charAt(0) >= 'A' && this.prod.charAt(0) <= 'Z') {
            this.notTerminal = this.prod.charAt(0); //确定左部非终结符
        } else {
            return false;
        }
        var i = 0;
        for (; i < this.prod.length; i++) {
            var c = this.prod.charAt(i);
            if (c >= 'A' && c <= 'Z') {
                this.notTerminalSet.add(c); //确定非终结符
            } else if (c !== '|' && !(c === '-' && this.prod.charAt(i + 1) === '>' && ++i)) {
                this.terminalSet.add(c); //确定终结符
            }
        }
        for (i = 3; i < this.prod.length; i++) {
            for (var j = i + 1; j < this.prod.length && this.prod[j] !== '|'; j++);
            this.selection.add(this.prod.substring(i, j)); //划分出候选式
            i = j;
        }
        return this.isValid = true;
    }
}

//LL1文法
class LL1 {
    text;            //输入文本
    prods;           //文法
    notTerminalSet;  //非终结符
    terminalSet;     //终结符
    firstMap;        //first集
    followMap;       //follow集
    analysisTable;   //预测分析表
    parse;           //分析栈
    indata;          //输入表达式栈
    process;         //分析过程

    //构造函数
    constructor() {
        this.text = "";
        this.prods = [];
        this.notTerminalSet = new Set();
        this.terminalSet = new Set();
        this.firstMap = new Map();
        this.followMap = new Map();
        this.analysisTable = new Map();
        this.parse = [];
        this.indata = [];
        this.process = "";
    }

    //完善实例对象
    build(text) {
        this.text = text;
        this.addProd();
        for (let prod of this.prods) {
            this.getFirst(prod);
        }
        this.getFollow();
        this.getAnalysisTable();
    }

    //添加产生式
    addProd() {
        let i = 0, j = 0;
        while (j < this.text.length) {
            while (j < this.text.length && this.text.charAt(j) !== '\n') {
                ++j;
            }
            this.prods.push(this.text.substring(i, j));
            j++;
            i = j;
        }
        //初始化终结符和非终结符
        for (let item of this.prods) {
            let prod = new Prod(item);
            prod.build();
            if (prod.isValid) {
                for (let item of prod.notTerminalSet) {
                    this.notTerminalSet.add(item);
                }
                for (let item of prod.terminalSet) {
                    this.terminalSet.add(item);
                }
            }
        }
        //初始化first集和follow集
        for (let notTerminal of this.notTerminalSet) {
            this.firstMap.set(notTerminal, new Set());
            this.followMap.set(notTerminal, new Set());
        }
    }

    //添加表达式
    addExpression(expression) {
        this.loadIndata(expression);
        this.getProcess();
    }

    //求字符串的first集合
    getFirst(str) {
        var prod = new Prod(str);
        prod.build();
        //产生式
        if (prod.isValid) {
            if (this.firstMap.get(prod.notTerminal).size !== 0) {
                return this.firstMap.get(prod.notTerminal);
            }
            //候选式
            let temp = this.firstMap.get(prod.notTerminal);
            for (let sel of prod.selection) {
                //候选式的first集合
                let selectionFirst = this.getFirst(sel);
                for (let item of selectionFirst) {     
                    temp.add(item);
                }
            }
            return temp;
        } else if (str.length === 0) {
            //空串
            return new Set(['@']);
        } else if (str.length === 1) { //单个字符
            //终结符
            if (this.terminalSet.has(str)) {
                return new Set([str]);
            } else { //非终结符
                if (this.firstMap.get(str).size !== 0) {
                    return this.firstMap.get(str);
                } else {
                    let temp = this.firstMap.get(str);
                    for (let item of this.prods) {
                        if (item.charAt(0) === str) {
                            let f = this.getFirst(item);
                            for (let element of f) {
                                temp.add(element);
                            }
                        }
                    }
                    return temp;
                }
            }
        } else { //形如ABCD形式的候选式
            let ret = new Set();
            for (let i = 0; i < str.length; i++) {
                let f = this.getFirst(str.charAt(i)); //逐个符号求first集
                if (f.has('@') && i !== str.length - 1) {    //发现空串 
                    f.delete('@');  //去除空串
                    for (let item of f) {
                        ret.add(item);  //放入first集合
                    }
                } else {    //无空串
                    for (let item of f) {
                        ret.add(item);
                    }
                    break;
                }
            }
            return ret;
        }
    }

    //求follow集合
    getFollow() {
        this.followMap.get(this.prods[0].charAt(0)).add('$'); //开始的非终结符放入结束符
        for (let prod of this.prods) {
            let size = 0; //follow不再增大
            while (size !== this.followMap.get(prod.charAt(0)).size) {
                size = this.followMap.get(prod.charAt(0)).size;
                for (let ppp of this.prods) {
                    let E = ppp.charAt(0);
                    for (let pp of this.prods) {
                        let p = new Prod(pp);
                        p.build();
                        for (let sel of p.selection) {
                            if (sel.includes(E)) {
                                let first = this.getFirst(sel.substring(sel.indexOf(E) + 1, sel.length));
                                let follow = this.followMap.get(E);
                                for (let item of first) {
                                    follow.add(item);
                                }
                                if (follow.has('@')) {
                                    follow.delete('@');
                                    for (let item of this.followMap.get(p.notTerminal)) {
                                        follow.add(item);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    //求预测分析表
    getAnalysisTable() {
        for (let prod of this.prods) {  //遍历产生式
            let pp = new Prod(prod);
            pp.build();
            for (let sel of pp.selection) { //遍历候选式
                let first = this.getFirst(sel); //求first集合
                for (let terminal of first) {
                    if (terminal === '@') { //first集合中有空字符
                        for (let follow of this.followMap.get(pp.notTerminal)) {
                            this.analysisTable.set([pp.notTerminal, follow].toString(), sel);
                        }
                    } else {
                        this.analysisTable.set([pp.notTerminal, terminal].toString(), sel);
                    }
                }
            }
        }
    }

    //获得表达式栈
    getIndata() {
        var indataStack = "";
        for (let i = this.indata.length - 1; i >= 0; --i) {
            indataStack += this.indata[i];
        }
        return indataStack;
    }

    //获得分析栈
    getParse() {
        var parseStack = "";
        for (let i = this.parse.length - 1; i >= 0; --i) {
            parseStack += this.parse[i];
        }
        return parseStack;
    }

    //加载表达式
    loadIndata(str) {
        this.indata.push('$');
        for (let i = str.length - 1; i >= 0; --i) {
            this.indata.push(str.charAt(i));
        }
    }

    //求分析过程
    getProcess() {
        this.parse.push('$'); //结束符
        this.parse.push(this.prods[0].charAt(0)); //文法开始符号
        let parseTop = 0, indataTop = 0; //分析栈栈顶和表达式栈栈顶
        let sel = ""; //匹配的候选式
        parseTop = 1;
        while (parseTop >= 0) {
            indataTop = this.indata.length - 1;
            this.process += this.getParse();
            this.process += ',';
            this.process += this.getIndata();
            this.process += ',';
            //开始匹配
            sel = "";
            let curParse = this.parse[parseTop];    //分析栈要匹配的字符
            let curIndata = this.indata[indataTop];  //表达式栈要匹配的字符
            this.parse.pop();
            if (this.terminalSet.has(curParse) || curParse === '$') { //终结符
                this.indata.pop();
                sel += "match ";
                sel += curParse;
            } else { //非终结符
                let prod = this.analysisTable.get([curParse, curIndata].toString()); //查找预测分析表
                if (prod) { //找得到
                    if (prod !== '@') { //非空串
                        for (let i = prod.length - 1; i >= 0; --i) {
                            this.parse.push(prod.charAt(i));
                        }
                    }
                }
                sel += curParse;
                sel += "->";
                sel += prod;
            }
            this.process += sel;
            this.process += '\n';
            parseTop = this.parse.length - 1;
        }
    }
}

//LL1对象
var ll1;
//文法表表头
const grammarColumns = [
    {
        title: '非终结符',
        dataIndex: 'notTerminal',
        key: 'notTerminal'
    },
    {
        title: 'first集',
        dataIndex: 'first',
        key: 'first'
    },
    {
        title: 'follow集',
        dataIndex: 'follow',
        key: 'follow'
    }
];
//first和follow集表数据
const grammarSource = [];
//预测分析表表头
const analysisColumns = [
    {
        title: '预测分析表',
        dataIndex: 'notTerminal',
        key: 'notTerminal'
    }
];
//预测分析表数据
const analysisSource = [];
//分析过程表头
const processColumns = [
    {
        title: '分析栈',
        dataIndex: 'analysis',
        key: 'analysis'
    },
    {
        title: '表达式栈',
        dataIndex: 'expression',
        key: 'expression'
    },
    {
        title: '产生式或匹配',
        dataIndex: 'production',
        key: 'production'
    }
]
//分析过程数据
const processSource = []

//父类组件
class Parent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            grammar: '',
            expression: ''
        };
        this.getGrammarInput = this.getGrammarInput.bind(this);
        this.getExpressionInput = this.getExpressionInput.bind(this);
    }


    //获得输入的文法并打印出两个表
    getGrammarInput = (g) => {
        this.setState({
            grammar: g
        });
        ll1 = new LL1();
        ll1.build(g);
        for (let nt of ll1.notTerminalSet) {
            grammarSource.push({
                key: nt,
                notTerminal : nt,
                first: Array.from(ll1.firstMap.get(nt)).toString(),
                follow: Array.from(ll1.followMap.get(nt)).toString()
            })
        };
        for (let t of ll1.terminalSet) {
            if (t !== '@') {
                analysisColumns.push({
                    title: t,
                    dataIndex: t,
                    key: t
                })  
            }
        };
        analysisColumns.push({
            title: '$',
            dataIndex: '$',
            key: '$'
        })
        for(let nt of ll1.notTerminalSet) {
            analysisSource.push({key: nt, notTerminal: nt});
        };
        let index = 0;
        for (let nt of ll1.notTerminalSet) {
            for (let t of ll1.terminalSet) {
                let prod = (ll1.analysisTable.has([nt, t].toString()) 
                ? nt + '->' + ll1.analysisTable.get([nt, t].toString()) : '');
                analysisSource[index][t] = prod;
            }
            let prod = (ll1.analysisTable.has([nt, '$'].toString()) 
            ? nt + '->' + ll1.analysisTable.get([nt, '$'].toString()) : '');
            analysisSource[index]['$'] = prod;
            ++index;
        }
    }

    //获得输入的表达式并打印出分析过程
    getExpressionInput = (e) => {
        this.setState({
            expression: e
        });
        ll1.addExpression(e);
        //得到分析过程表
        let left = 0, right = 0;
        while (right < ll1.process.length) {
            let a, e, p;
            while (ll1.process.charAt(right) !== ',') ++right;
            a = ll1.process.substring(left, right);
            ++right;
            left = right;
            while (ll1.process.charAt(right) !== ',') ++right;
            e = ll1.process.substring(left, right);
            ++right;
            left = right;
            while (ll1.process.charAt(right) !== '\n') ++right;
            p = ll1.process.substring(left, right);
            ++right;
            left = right;
            processSource.push({
                analysis: a,
                expression: e,
                production: p
            })
        }
    }

    render() {
        return (
            <div>
                <GrammarInput getGrammarInput={this.getGrammarInput} />
                <ExpressionInput getExpressionInput={this.getExpressionInput} />
            </div>
        )
    }
}

//文法输入
class GrammarInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            grammar: '', //文法
            isValid: false //文法是否合法
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({grammar: event.target.value});
    }

    //文法提交
    handleSubmit(event) {
        event.preventDefault();
        this.props.getGrammarInput(this.state.grammar);
        this.setState({isValid: true});
    }

    render() {
        let grammarTable, analysisTable;
        if (this.state.isValid) {
            grammarTable = (<Table 
                dataSource={grammarSource} 
                columns={grammarColumns} 
                pagination={false} 
            />);
            analysisTable = (<Table 
                dataSource={analysisSource} 
                columns={analysisColumns} 
                pagination={false}
            />);
        }
        return (            
            <div>
                <Row gutter={16}>
                    <Col span={8}>
                        <TextArea value={this.state.grammar} onChange={this.handleChange} autoSize />
                        <Button type='primary' onClick={this.handleSubmit}>文法分析</Button>
                    </Col>
                    <Col span={8}>
                      {grammarTable}  
                    </Col>
                    <Col span={8}>
                        {analysisTable}
                    </Col>
                </Row> 
            </div>
        );
    }
}

//表达式输入
class ExpressionInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            expression: '', //表达式
            isValid: false
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({expression: event.target.value});
    }

    //表达式提交
    handleSubmit(event) {
        event.preventDefault();
        this.props.getExpressionInput(this.state.expression);
        this.setState({isValid: true});
    }

    render() {
        let processTable;
        if (this.state.isValid) {
            processTable = (<Table 
                dataSource={processSource}
                columns={processColumns}
                pagination={false} 
            />)
        }
        return (
            <div>
                <Row>
                    <Col span={12}>
                        <TextArea value={this.state.expression} onChange={this.handleChange} autoSize />
                        <Button type='primary' onClick={this.handleSubmit}>表达式分析</Button>
                    </Col>
                    <Col span={12}>
                        {processTable}
                    </Col>
                </Row>
            </div>
        );
    }
}

export function LLgramma() {
    return (<div>
        <Parent />
    </div>);
}
