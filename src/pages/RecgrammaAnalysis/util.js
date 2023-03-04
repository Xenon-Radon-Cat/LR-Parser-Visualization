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
            if(pp.noTerminal === this.G[0].noTerminal) {
                this.FOLLOW.set(pp.noTerminal,new Set('#'))
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
        for(let prod of this.G) {
            for(let sel of prod.selection) {
                let f = this.first(sel);
                for(let terminal of f) {
                    if(terminal === '@'){
                        for(let term of this.FOLLOW.get(prod.noTerminal)){
                           this.M.set(`${prod.noTerminal},${term}`,sel);
                        }
                    }else {
                        this.M.set(`${prod.noTerminal},${terminal}`,sel);
                    }
                }
            }
        }
    }
    match(str) {
        if(str.length === 1&& str === this.gra[this.gra.length -1]) {
              return '';
        }
        if(this.gra.length === 0) {
            this.gra.push([...this.VN][0]);
        }
        
        let value;
        for(let item of this.gra){
            if(this.VN.has(item)){
                let key = `${item},${str[0]}`;
                value = this.M.get(key);
                this.production = `${item} => ${value}`;
                value = value.split('');
                
                for(let k in this.gra){
                    if(this.gra[k] === item){
                        this.gra.splice(k,1);
                    }else{
                        continue;
                    }
                   
                    if(value[0] === '@'){ 
                        return str;
                    }
                    this.gra.splice(k,0,...value);
                    if(str[0] === value[0]) {
                        str.shift();
                        return str;
                    }
                    return str;
                };
                break;
            }
        }
    }
}



let n = new LL1();
let m = [
    'E->TG',
    'G->+TG|@',
    'T->FY',
    'Y->*FY|@',
    'F->(E)|i'
]
let g = m.map((item) => new Prod(item));
g.forEach((item) => n.addProd(item));
//console.log(434, n.VN, n.VT)
let f = 'E->TG';
m.forEach((item) => n.first(item));
//n.first(f);
n.follow();
//console.log(n.FOLLOW, 'follow');
n.parseTable();
//console.log(n.M);
