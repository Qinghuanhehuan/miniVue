class Compile {
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el);
    if (this.$el) {
      // 提取宿主中模板内容到Fragment标签，dom操作会提⾼效率
      this.$fragment = this.node2Fragment(this.$el);
      // 编译模板内容，同时进⾏依赖收集
      this.compile(this.$fragment);
      this.$el.appendChild(this.$fragment);
    }
  }
  node2Fragment(el) {
    const fragment = document.createDocumentFragment();
    let child;
    while ((child = el.firstChild)) {
      fragment.appendChild(child);
    }
    return fragment;
  }
  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 判断节点类型
      if (node.nodeType === 1) {
        // element节点
        // console.log('编译元素节点'+node.nodeName);
        this.compileElement(node);
      } else if (this.isInterpolation(node)) {
        // 插值表达式
        // console.log('编译插值⽂本'+node.textContent);
        this.compileText(node);
      }
      // 递归⼦节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    });
  }
  isInterpolation(node) {
    // 是⽂本且符合{{}}
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }
  compileElement(node) {
    // <div k-model="foo" k-text="test" @click="onClick">
    let nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach(attr => {
      const attrName = attr.name;
      const exp = attr.value;
      if (this.isDirective(attrName)) {
        const dir = attrName.substring(2);
        this[dir] && this[dir](node, this.$vm, exp);
      }
      if (this.isEvent(attrName)) {
        const dir = attrName.substring(1);
        this.eventHandler(node, this.$vm, exp, dir);
      }
    });
  }
  isDirective(attr) {
    return attr.indexOf("k-") === 0;
  }
  isEvent(attr) {
    return attr.indexOf("@") === 0;
  }
  // 事件处理: 给node添加事件监听，dir-事件名称
  // 通过vm.$options.methods[exp]可获得回调函数
  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }
  compileText(node) {
    console.log(RegExp.$1);
    this.update(node, this.$vm, RegExp.$1, "text");
  }
  update(node, vm, exp, dir) {
    let updaterFn = this[dir + "Updater"];
    updaterFn && updaterFn(node, vm[exp]);
    // 依赖收集
    new Watcher(vm, exp, function (value) {
      updaterFn && updaterFn(node, value);
    });
  }
  // {{}}
  text(node, vm, exp) {
    this.update(node, vm, exp, "text");
  }
  textUpdater(node, val) {
    node.textContent = val;
  }
  // v-html指令
  html(node, vm, exp) {
    this.update(node, vm, exp, "html");
  }
  htmlUpdater(node, value) {
    node.innerHTML = value;
  }
  // v-model指令
  model(node, vm, exp) {
    this.update(node, vm, exp, "model");
    node.addEventListener("input", e => {
      vm[exp] = e.target.value;
    });
  }
  modelUpdater(node, value) {
    node.value = value;
  }
}
