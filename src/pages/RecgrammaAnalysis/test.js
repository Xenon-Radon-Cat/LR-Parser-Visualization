import Konva from "konva";

function eliminateLeftRecursion(grammar) {
    const nonTerminals = Object.keys(grammar);
  
    for (let i = 0; i < nonTerminals.length; i++) {
      const A = nonTerminals[i];
      const productions = grammar[A];
  
      const directRecursion = [];
      const indirectRecursion = [];
  
      for (let j = 0; j < productions.length; j++) {
        const production = productions[j];
        if (production[0] === A) {
          directRecursion.push(production);
        } else if (nonTerminals.includes(production[0])) {
          indirectRecursion.push(production);
        }
      }
  
      if (directRecursion.length === 0) {
        continue;
      }
  
      const A1 = `${A}'`;
      let newProductions = [];
  
      for (let j = 0; j < productions.length; j++) {
        const production = productions[j];
        if (production[0] !== A) {
          newProductions.push(production.concat(A1));
        }
      }
  
      let A1Productions = [];
      for (let j = 0; j < indirectRecursion.length; j++) {
        const production = indirectRecursion[j];
        const B = production[0];
        const beta = production.slice(1);
        A1Productions.push(beta.concat(A1));
      }
  
      A1Productions.push(['ε']);
      newProductions = newProductions.concat(A1Productions);
  
      let A1ProductionsNew = [];
      for (let j = 0; j < directRecursion.length; j++) {
        const production = directRecursion[j];
        const alpha = production.slice(1);
        A1ProductionsNew.push(alpha.concat(A1));
      }
  
      A1ProductionsNew.push(['ε']);
      const A1ProductionsNewStr = A1ProductionsNew.map(production => production.join('')).join(` | `);
  
      grammar[A] = newProductions;
      grammar[A1] = A1ProductionsNew;
  
      for (let j = 0; j < nonTerminals.length; j++) {
        const B = nonTerminals[j];
        grammar[B] = grammar[B].map(production => {
          if (production[0] === A) {
            return production.slice(1).concat(A1);
          } else {
            return production;
          }
        });
      }
  
      nonTerminals.push(A1);
    }
  
    return grammar;
  }
  
  
  function isIndirectLeftRecursion(grammar, symbol, visited) {
    visited = visited || new Set();
    if (visited.has(symbol)) {
      // 如果 symbol 被访问过，说明存在间接左递归
      return true;
    }
    visited.add(symbol);
    const productions = grammar.get(symbol);
    for (const production of productions) {
      const firstChar = production.charAt(0);
      if (grammar.has(firstChar) && isIndirectLeftRecursion(grammar, firstChar, visited)) {
        return true;
      }
    }
    visited.delete(symbol);
    return false;
  }
  
  function eliminateIndirectLeftRecursion(grammar) {
    const nonTerminals = Object.keys(grammar);
  
    // 构建非终结符到其所在规则的映射
    const ruleMap = {};
    for (const nt of nonTerminals) {
      ruleMap[nt] = grammar[nt].map((rule) => rule.split(' '));
    }
  
    // 构建非终结符到其可以递归扩展的所有符号的映射
    const recursiveMap = {};
    for (const nt of nonTerminals) {
      recursiveMap[nt] = [];
      for (const rule of ruleMap[nt]) {
        const firstSymbol = rule[0];
        if (firstSymbol === nt) {
          // 如果第一个符号是该非终结符本身，则可以直接递归扩展
          recursiveMap[nt].push(rule.slice(1));
        } else if (nonTerminals.includes(firstSymbol)) {
          // 如果第一个符号是其他非终结符，则可以通过递归扩展该非终结符来间接扩展
          recursiveMap[nt].push(...recursiveMap[firstSymbol].map((expansion) => [...expansion, ...rule.slice(1)]));
        } else {
          // 如果第一个符号是终结符，则无法扩展，不需要处理
        }
      }
    }
  
    // 对于每个左递归的非终结符，消除其左递归
    for (const nt of nonTerminals) {
      const ruleList = ruleMap[nt];
      const directRecursionRules = [];
      const indirectRecursionRules = [];
  
      for (const rule of ruleList) {
        if (rule[0] === nt) {
          directRecursionRules.push(rule);
        } else if (recursiveMap[nt].some((expansion) => expansion[0] === rule[0])) {
          indirectRecursionRules.push(rule);
        }
      }
  
      if (directRecursionRules.length > 0 && indirectRecursionRules.length > 0) {
        // 构造新的非终结符 B'，替换掉原来的直接递归规则
        const newNT = nt + "'";
        const newRules = [];
  
        for (const rule of ruleList) {
          if (rule[0] !== nt) {
            // 非递归规则直接保留
            newRules.push(rule);
          } else {
            // 直接递归规则替换为 B' 开头的规则
            newRules.push([...rule.slice(1), newNT]);
          }
        }
  
        // 为新的 B' 添加规则
        grammar[newNT] = [];
        for (const rule of indirectRecursionRules) {
          grammar[newNT].push([...rule.slice(1), newNT]);
        }
        grammar[newNT].push(['']); // 添加一个 e 规则
  
        grammar[nt] = newRules.map((rule) => rule.join(' '));
        grammar[newNT] = grammar[newNT].map((rule) => rule.join(' '));
      }
    }
  }
  
  const g = {
    'P': [['P','a'],['b']]
  }

  const f = {
    S:[ 'Qc','c'],
    Q:[ 'Rb','b'],
    R: ['Sa','a']
  }
const k = {
    'S': [
      ['a', 'A'],
      ['b', 'B']
    ],
    'A': [
      ['c', 'S'],
      []
    ],
    'B': [
      ['d', 'S'],
      []
    ]
  }
  const grammar = new Map([
    ['S', ['Aa']],
    ['A', ['Bb', 'Sc']],
    ['B', ['Ad', 'e']],
  ]);

  const u  = {
    S: ['A a', 'B b', 'c'],
    A: ['S d'],
    B: ['B e', 'f']
  };

  console.log(isIndirectLeftRecursion(grammar, 'S')); // true
  console.log(isIndirectLeftRecursion(grammar, 'A')); // true
  console.log(isIndirectLeftRecursion(grammar, 'B')); // false

 // eliminateIndirectLeftRecursion(u);
  console.log(u);

  // 树节点类
export class DrawTree {
  constructor(tree, parent = null, depth = 0, number = 1) {
      // 节点名称
      this.name = tree.name;
      // 坐标
      this.x = 10;
      this.y = depth;
      // 子节点
      this.children = tree.children.map((child, index) => {
          return new DrawTree(child, this, depth + 1, index + 1);
      });
      // 父节点
      this.parent = parent;
      // 线程节点，也就是指向下一个轮廓节点
      this.thread = null;
      // 根据左兄弟定位的x与根据子节点中间定位的x之差
      this.mod = 0;
      // 要么指向自身，要么指向所属树的根
      this.ancestor = this;
      // 记录分摊偏移量
      this.change = this.shift = 0;
      // 最左侧的兄弟节点
      this._lmost_sibling = null;
      // 这是它在兄弟节点中的位置索引 1...n
      this.number = number;
  }

  // 关联了线程则返回线程节点，否则返回最右侧的子节点，也就是树的右轮廓的下一个节点
  right() {
      return (
          this.thread ||
          (this.children.length > 0
           ? this.children[this.children.length - 1]
           : null)
      );
  }

  // 关联了线程则返回线程节点，否则返回最左侧的子节点，也就是树的左轮廓的下一个节点
  left() {
      return (
          this.thread || (this.children.length > 0 ? this.children[0] : null)
      );
  }

  // 获取前一个兄弟节点
  left_brother() {
      let n = null;
      if (this.parent) {
          for (let i = 0; i < this.parent.children.length; i++) {
              let node = this.parent.children[i];
              if (node === this) {
                  return n;
              } else {
                  n = node;
              }
          }
      }
      return n;
  }

  // 获取同一层级第一个兄弟节点，如果第一个是自身，那么返回null
  get_lmost_sibling() {
      if (
          !this._lmost_sibling &&
          this.parent &&
          this !== this.parent.children[0]
      ) {
          this._lmost_sibling = this.parent.children[0];
      }
      return this._lmost_sibling;
  }

  // 同一层级第一个兄弟节点
  get leftmost_sibling() {
      return this.get_lmost_sibling();
  }
}

// 第一次递归
const firstwalk = (v, distance = 1) => {
  if (v.children.length === 0) {
      // 当前节点是叶子节点且存在左兄弟节点，则其x坐标等于其左兄弟的x坐标加上间距distance
      if (v.leftmost_sibling) {
          v.x = v.left_brother().x + distance;
      } else {
          // 当前节点是叶节点无左兄弟，那么x坐标为0
        //  debugger
          v.x = 0;
      }
  } else {
    let default_ancestor = v.children[0]
      // 后序遍历，先递归子节点
      v.children.forEach((child) => {
          firstwalk(child);
          default_ancestor = apportion(child, distance, default_ancestor);
      });
      execute_shifts(v)
      // 子节点的中点
      let midpoint =
          (v.children[0].x + v.children[v.children.length - 1].x) / 2;
      // 左兄弟
      let w = v.left_brother();
      if (w) {
          // 有左兄弟节点，x坐标设为其左兄弟的x坐标加上间距distance
          v.x = w.x + distance;
          // 同时记录下偏移量（x坐标与子节点的中点之差）
          v.mod = v.x - midpoint;
      } else {
          // 没有左兄弟节点，x坐标直接是子节点的中点
          v.x = midpoint;
      }
  }
  return v;
};
// 第二次遍历
const second_walk = (v, m = 0, depth = 0) => {
  // 初始x值加上所有祖宗节点的mod值（不包括自身的mod）
  v.x += m;
  v.y = depth;
  v.children.forEach((child) => {
      second_walk(child, m + v.mod, depth + 1);
  });
};

export const buchheim = (tree) => {
  let dt = firstwalk(tree);
  console.log(789798,dt)
  second_walk(dt);
  RenderTree(dt);
  return dt;
};

const apportion = (v, distance, default_ancestor) => {
  let leftBrother = v.left_brother();
  if (leftBrother) {
    // 四个节点指针
    let vInnerRight = v; // 右子树左轮廓
    let vOuterRight = v; // 右子树右轮廓
    let vInnerLeft = leftBrother; // 当前节点的左兄弟节点，左子树右轮廓
    let vOuterLeft = v.leftmost_sibling; // 当前节点的最左侧的兄弟节点，左子树左轮廓

    // 累加mod值，它们的父节点是同一个，所以往上它们要加的mod值也是一样的，那么在后面shift值计算时vInnerLeft.x + 父节点.mod - (vInnerRight.x + 父节点.mod)，父节点.mod可以直接消掉，所以不加上面的祖先节点的mod也没关系
    let sInnerRight = vInnerRight.mod;
    let sOuterRight = vOuterRight.mod;
    let sInnerLeft = vInnerLeft.mod;
    let sOuterLeft = vOuterLeft.mod;

    // 一直遍历到叶子节点
    while (vInnerLeft.right() && vInnerRight.left()) {
      // 更新指针
      vInnerLeft = vInnerLeft.right();
      vInnerRight = vInnerRight.left();
      vOuterLeft = vOuterLeft.left();
      vOuterRight = vOuterRight.right();

      // 节点v下面的每一层右轮廓节点都关联v
      vOuterRight.ancestor = v;

      // 左侧节点减右侧节点
      let shift = vInnerLeft.x + sInnerLeft + distance - (vInnerRight.x + sInnerRight);
      if (shift > 0) {
        let _ancestor = ancestor(vInnerLeft, v, default_ancestor)
        // 大于0说明存在交叉，那么右侧的树要向右移动
        move_subtree(_ancestor, v, shift);
        // v.mod，也就是右侧子树增加了shift，sInnerRight、sOuterRight当然也要同步增加
        sInnerRight += shift;
        sOuterRight += shift;
      }

      // 累加当前层节点mod
      sInnerRight += vInnerRight.mod;
      sOuterRight += vOuterRight.mod;
      sInnerLeft += vInnerLeft.mod;
      sOuterLeft += vOuterLeft.mod;
    }

    // 将线程从浅的树的外侧设置到深的树的内侧
    if (vInnerLeft.right() && !vOuterRight.right()) {
      vOuterRight.thread = vInnerLeft.right();
      // 修正因为线程影响导致mod累加出错的问题，深的树减浅树
      vOuterRight.mod += sInnerLeft - sOuterRight
    } else {
      if (vInnerRight.left() && !vOuterLeft.left()) {
        vOuterLeft.thread = vInnerRight.left();
        vOuterLeft.mod += sInnerRight - sOuterLeft
      }
      default_ancestor = v
    }
  }
  return default_ancestor;
};

 // 找出节点所属的根节点
 const ancestor = (vInnerLeft, v, default_ancestor) => {
  // 如果vInnerLeft节点的ancestor指向的节点是v节点的兄弟，那么符合要求
  if (v.parent.children.includes(vInnerLeft.ancestor)) {
    return vInnerLeft.ancestor;
  } else {
    // 否则使用default_ancestor指向的节点
    return default_ancestor
  }
}

  // 应用分摊
  const execute_shifts = (v) => {
    let change = 0
    let shift = 0
    // 从后往前遍历子节点
    for(let i = v.children.length - 1; i >= 0; i--) {
      let node = v.children[i]
      node.x += shift
      node.mod += shift

      change += node.change
      shift += node.shift + change
    }
  }


 // 移动子树
 const move_subtree = (leftV, v, shift) => {
  let subTrees = v.number - leftV.number// 索引相减，得到之间被分隔的数量
  let average = shift / subTrees// 平分偏移量
  v.shift += shift// 完整的shift值添加到v节点的shift属性上
  v.change -= average
  leftV.change += average 

  v.x += shift; // 自身移动
  v.mod += shift; // 后代节点移动
};


 var layer =  new Konva.Layer() ;
 var stage;
 let message = new Konva.Text({
  x: 500,
  y: 50,
  text: '',
  fontSize: 30,
  fontFamily: 'Calibri',
  fill: 'green'
})
function RenderTree(props) {
  layer.remove();
  layer = new Konva.Layer();
  
  if(props.parent === null){
   stage = new Konva.Stage({
    container: 'container2', // 容器 id
    width: 1000,// canvas 宽度
    height: 1000// canvas 高度
  });
 stage.add(layer);
}
 const node =  new Konva.Text({
    x: props.x*70,
    y: props.y*70,
    text: props.name,
    fontSize: 50,
    fontFamily: 'Calibri',
    fill: 'green'
});
let right = props.children.map((child) => child.name);
node.on('mouseover', function () {
  message.text(`${props.name} -> ${[...right].join()}`)
  layer.draw();
})
layer.add(node);
layer.add(message);


props.children.map((n) => {
  var redLine = new Konva.Line({
    points: [n.x*70+10, n.y*70, n.parent.x*70+10, n.parent.y*70+30],
    stroke: 'gray',
    strokeWidth: 5,
    lineCap: 'round',
    lineJoin: 'round'
   });
   layer.add(redLine);
  redernode(n);
})
}

function redernode (n) {
  const node =  new Konva.Text({
    x: n.x*70,
    y: n.y*70,
    text: n.name,
    fontSize:50,
    fontFamily: 'Calibri',
    fill: 'green'
});
let right = n.children.map((child) => child.name);
node.on('mouseover', function () {
  message.text(`${n.name} -> ${[...right].join()}`)
  layer.draw();
})
layer.add(node);
n.children.map((n) => {
  var redLine = new Konva.Line({
    points: [n.x*70+10, n.y*70, n.parent.x*70+10, n.parent.y*70+30],
    stroke: 'gray',
    strokeWidth: 5,
    lineCap: 'round',
    lineJoin: 'round'
   });
   layer.add(redLine);
  redernode(n);
})
}
