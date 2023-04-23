import { Circle, Rect, Stage, Layer, Text, Star } from 'react-konva'
import Konva from "konva";
export class Prod {
    constructor(str) {
        this.prod = str;
        this.isValid = false;
        this.Vt = new Set();
        this.Vn = new Set();
        this.selection = new Set();
        this.splitProd();
    }
    splitProd() {
        if (this.prod.length < 4) return false;
        if (this.prod.substring(1, 3) === '->' && this.prod.substring(0, 1) === this.prod.substring(0, 1).toUpperCase())
            this.noTerminal = this.prod.substring(0, 1);
        else return false;
        let regex = /[A-Z]/;
        for (let i = 0; i < this.prod.length; ++i) {
            let c = this.prod[i];
            let isVn = regex.test(c)

            if (isVn) {

                this.Vn.add(c);
            }
            else if (c !== '|' && !(c === '-' && this.prod[i + 1] === '>' && ++i))
                this.Vt.add(c);
        }

        for (let i = 3; i < this.prod.length; ++i) {
            let j;
            for (j = i + 1; j < this.prod.length && this.prod[j] !== '|'; ++j);
            this.selection.add(this.prod.substring(i, j));
            i = j;

        }
        return this.isValid = true;

    }


}


export class LL1 {
    constructor() {
        this.FIRST = new Map();
        this.FOLLOW = new Map();
        this.G = [];
        this.VN = new Set(); //非终结符
        this.VT = new Set(); //终结符
        this.M = new Map();
        this.gra = [];
        this.production = '';
        this.root = new Node();
    }
    reset(){
        this.FIRST = new Map();
        this.FOLLOW = new Map();
        this.G = [];
        this.VN = new Set(); //非终结符
        this.VT = new Set(); //终结符
        this.M = new Map();
        this.gra = [];
        this.production = '';
        this.root = new Node();

    }
    addProd(prod) {
        if (prod.isValid) {
            const g = this.G.find((item) => item.noTerminal === prod.noTerminal)
            if (g) {
                let index = this.G.indexOf((item) => item.noTerminal === prod.noTerminal)
                this.G[index].selection.push(...prod.selection);

            } else {
                this.G.push(prod);
            }
            // console.log(prod, 'prod')
            prod.Vn.forEach((item) => this.VN.add(item));
            prod.Vt.forEach((item) => this.VT.add(item));
            //console.log(this.VN, this.VT)
            return true;
        }
        else return false;
    }

    isLeftRecursive() {
        let res = [];
        let temp = [];
        let isLeft = false;
        for(let rule of this.G){
            for(let sel of rule.selection){
                if(rule.noTerminal === sel[0]){
                    isLeft = true;
                   for(let m of rule.selection){
                    if(rule.noTerminal !== m[0]){
                        res.push(`${rule.noTerminal}->${m}${rule.noTerminal}'`); 
                    }else{
                        res.push(`${rule.noTerminal}'->${m.substring(1)}${rule.noTerminal}'|@` );
                    }
                   }
                  // res.push(`${rule.noTerminal}' -> @`);
                   console.log(res);
                   temp.push(rule.noTerminal);
                   // return res;
                }else {
                   if(!temp.includes(rule.noTerminal)){
                    let str = `${rule.noTerminal}->`;
                      for(let m of rule.selection){
                        if(str[str.length-1]==='>'){
                            str+=`${m}`;
                        }else{
                            str+=`|${m}`
                        } 
                      }
                      res.push(str);
                      temp.push(rule.noTerminal);
                   }
                }
              
            }
        }
        if(!isLeft) return;
        return res;
    }

    hasIndirectLeftRecursion(){
        const ruleMap = new Map();
        for(let rule of this.G){
            for(let sel of rule.selection){
                console.log(8989897,rule,sel,this.G)
                if(this.VN.has(sel[0])){
                    ruleMap.set(rule.noTerminal,sel[0]);
                }
            }
        };
        console.log(898989,ruleMap)
      for(let i = 0;i< this.VN;i++){
        const A = this.VN[i];
        for(let j = 0;j < i;j++){
            const B = this.VN[j];
            if(this.canExpandTo(B,A,ruleMap,new Set())){
                return true;
            }
        }
      }
    }

    canExpandTo(start, target, directMap, visited){
        if(start === target){
            return true;
        }
        if(visited.has(start)){
            return false;
        }
        visited.add(start);
        for(const nt of directMap[start]){
            if(this.canExpandTo(nt,target,directMap,visited)){
                return true;
            }
        }
        return false;
    }

    isCFG() {
        for (let prod of this.G) {
            if (!prod.terminal || !this.VN.has(prod.terminal)) {
                return false;
            }

        }
    }

    first(str) {
        let prod = new Prod(str);
        if (prod.isValid) {
            if (this.FIRST.has(prod.noTerminal)) return this.FIRST.get(prod.noTerminal);
            for (let sel of prod.selection) {
                let f = this.first(sel);
                if (this.FIRST.has(prod.noTerminal)) {
                    f.forEach((item) => this.FIRST.get(prod.noTerminal).add(item))
                } else {
                    this.FIRST.set(prod.noTerminal, f);
                }

            }
            return this.FIRST.get(prod.noTerminal);
        }
        else if (str.length === 0) {
            return new Set(['@']);
        }
        else if (str.length === 1) {

            if (this.VT.has(str)) {
                return new Set([str])
            }
            else {
                if (this.FIRST.has(str)) return this.FIRST.get(str);
                else {
                    if (this.G.find((item) => item.noTerminal === str)) {
                        let b = 0;
                        this.G.forEach((item, index) => {
                            if (item.noTerminal === str) {
                                b = index;
                            }
                        })

                        let f = this.first(this.G[b].prod);

                        if (this.FIRST.has(str)) {
                            f.forEach((item) => this.FIRST.get(str).add(item))
                        } else {
                            this.FIRST.set(str, f);
                        }
                    }
                    return this.FIRST.get(str);
                }
            }
        } else {
            let ret = new Set();
            for (let i = 0; i < str.length; ++i) {

                let f = this.first(str.substring(i, i + 1));

                if (f.has('@') && str.length - 1 !== i) {
                    f.delete('@');
                    f.forEach((item) => ret.add(item))

                } else {
                    f.forEach((item) => ret.add(item))
                    break;
                }
            }
            return ret;
        }
    }
    follow() {
        for (let pp of this.G) {
            this.FOLLOW.set(pp.noTerminal, new Set([]));
            if (pp.noTerminal === this.G[0].noTerminal) {
                this.FOLLOW.set(pp.noTerminal, new Set('#'))
            }
            let size = -1;
            while (size !== this.FOLLOW.get(pp.noTerminal).size) {
                size = this.FOLLOW.get(pp.noTerminal).size;
                for (let prod of this.G) {
                    let X = prod.noTerminal;
                    for (let p of this.G) {
                        for (let s of p.selection) {
                            let loc = s.split('').find((item) => item === X);

                            if (loc) {

                                let f;
                                if (s.indexOf(X) + 1 >= s.length) {
                                    f = this.first('');

                                } else {
                                    f = this.first(s[s.indexOf(X) + 1]);
                                }
                                if (this.FOLLOW.has(X)) {
                                    f.forEach((item) => this.FOLLOW.get(X).add(item));
                                } else {
                                    this.FOLLOW.set(X, f);
                                }
                                if (f.has('@')) {
                                    this.FOLLOW.get(X).delete('@');
                                    let fw = this.FOLLOW.get(p.noTerminal);
                                    fw.forEach((item) => this.FOLLOW.get(X).add(item));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    parseTable() {
        for (let prod of this.G) {
            for (let sel of prod.selection) {
                let f = this.first(sel);
                for (let terminal of f) {
                    if (terminal === '@') {
                        for (let term of this.FOLLOW.get(prod.noTerminal)) {
                            this.M.set(`${prod.noTerminal},${term}`, sel);
                        }
                    } else {
                        this.M.set(`${prod.noTerminal},${terminal}`, sel);
                    }
                }
            }
        }
    }
    match(str) {
        if (this.gra.length === 0) {
            this.gra.push([...this.VN][0]);
            this.root = new Node([...this.VN][0]);
        }

        let value;
        for (let item of this.gra) {
            if (this.VN.has(item)) {
                let key = `${item},${str[0]}`;
                value = this.M.get(key);
                this.production = `${item} => ${value}`;
                value = value.split('');
                let n = this.find(this.root);
                value.map((item) => {
                    n.children.push(new Node(item));
                })
                for (let k in this.gra) {
                    if (this.gra[k] === item) {
                        this.gra.splice(k, 1);
                    } else {
                        continue;
                    }

                    if (value[0] === '@') {
                        return str;
                    }
                    this.gra.splice(k, 0, ...value);
                    if (str[0] === value[0]) {
                        str.shift();
                        return str;
                    }
                    return str;
                };
                break;
            }
        }

    }
    find(n) {
        if (this.VN.has(n.value) && n.children.length === 0) return n;
        if (this.VT.has(n.value)) return;
        for (let i = 0; i < n.children.length; i++) {
            let res = this.find(n.children[i]);
            if (res) return res;
        }
    }


}

export class Node {
    constructor(value) {
        this.value = value;
        this.children = [];
    }
}
let arr = [];
let text = [];
let line = [];
let message = new Konva.Text({
    x: 200,
    y: 50,
    text: '',
    fontSize: 30,
    fontFamily: 'Calibri',
    fill: 'green'
})
let layerg;

export function RenderTree(props) {
    var stage = new Konva.Stage({
        container: 'container', // 容器 id
        width: 1000,// canvas 宽度
        height: 1000// canvas 高度
    });
    var layer = new Konva.Layer();
    layerg = layer;
    stage.add(layer);

    var Circle = new Konva.Circle({
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        fill: 'blue'
    })
    //   layer.add(Circle);
    console.log(Circle.x(), 55535)
    arr = [];
    text = [];
    line = [];
    rendernode(props, 1);
    console.log(arr, 9090)
    arr.forEach((cir) => {
        layer.add(cir);
    })
    text.forEach((t) => {
        layer.add(t)
    })
    line.forEach((l) => {
        layer.add(l);
    })
    layer.add(message);
}



function rendernode(node, index) {

    if (!node) return;
    if (node.children.length === 0) {
        let height = index * 150;
        let bro = arr.filter((item) => item.y() === height);

        let x = bro.length === 0 ? 100 : (bro.length + 1) * 100;//(arr.length + 1) * 100;
        const place = {
            x: x,
            y: height
        }
        const cir = new treenode(place, node.value)
        arr.push(cir);
        var simpleText = new Konva.Text({
            x: x - 10,
            y: height - 10,
            text: node.value,
            fontSize: 30,
            fontFamily: 'Calibri',
            fill: 'green'
        });
        text.push(simpleText);
        return cir;
    }
    let child = [];
    for (let i = 0; i < node.children.length; i++) {
        child.push(rendernode(node.children[i], index + 1));
    }
    let height = index * 150;
    //let child = arr.filter((item) => item.y() === (index + 1) * 150);
    let x;
    if (child.length % 2) {
        x = child[Math.floor(child.length / 2)].x();
    } else {
        x = (child[child.length / 2 - 1].x() + child[child.length / 2].x()) / 2;
    }
    const cir = new treenode({ x: x, y: height }, node.value);
    arr.push(cir);
    child.forEach((c) => {
        var redLine = new Konva.Line({
            points: [c.x(), c.y() - 20, cir.x(), cir.y() + 20],
            stroke: 'gray',
            strokeWidth: 5,
            lineCap: 'round',
            lineJoin: 'round'
        });
        line.push(redLine);
    })

    var simpleText = new Konva.Text({
        x: x - 10,
        y: height - 10,
        text: node.value,
        fontSize: 30,
        fontFamily: 'Calibri',
        fill: 'green'
    });
    text.push(simpleText);
    let right = node.children.map((child) => child.value);
    cir.on('mouseover', function () {
        message.text(`${node.value} -> ${[...right].join()}`)
        console.log(8888)
        layerg.draw();
    })
    return cir;
}

function treenode(place, value) {

    var Circle;
    let regex = /[A-Z]/;
    let isVN = regex.test(value);
    if (isVN) {
        Circle = new Konva.Circle({
            x: place.x,
            y: place.y,
            width: 50,
            height: 50,
            fill: 'blue'
        })

    } else {
        Circle = new Konva.Circle({
            x: place.x,
            y: place.y,
            width: 50,
            height: 50,
            fill: 'yellow'
        })
    }

    return Circle;
}




let n = new LL1();
let m = [
// 'E->E+T|T',
// 'T->T*F|F',
// 'F->（E）|I',

    // 'E->TG',
    // 'G->+TG|@',
    // 'T->FY',
    // 'Y->*FY|@',
    // 'F->(E)|i'    
]
let g = m.map((item) => new Prod(item));
g.forEach((item) => n.addProd(item));
const k = n.isLeftRecursive();
console.log(k);
//console.log(434, n.VN, n.VT)
let f = 'E->TG';
m.forEach((item) => n.first(item));
//n.first(f);
n.follow();
//console.log(n.FOLLOW, 'follow');
n.parseTable();
//console.log(n.M);
// E→E+T/ T

// T→T*F/ F

// F→（E）/ I