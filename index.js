function plainCompare(a,b){
  if(a===b){
    return 0;
  }
  if(a>b){
    return -1;
  }
  return 1;
}

function mapNodeCompare(a,b){
  return plainCompare(a.name,b.name);
}

function createMap (avltreelib, inherit, List) {
  'use strict';
  var Node = avltreelib.Node, Tree;
  function MapNode(name,content){
    Node.call(this,{name:name,content:content});
  }
  //TODO inherit?
  inherit(MapNode, Node);
  MapNode.prototype.destroy = function(){
    if (this.content) {
      this.content.name = null;
      this.content.content = null;
    }
    Node.prototype.destroy.call(this);
  };
  MapNode.prototype.returnOnRemove = function(){
    return this.content.content;
  };
  MapNode.prototype.apply = function(func,depth){
    //return this.content ? func(this.content.content,this,depth,this.content.name) : false;
    //return func(this.content.content,this,depth,this.content.name);
    if (!this.content) {
      return;
    }
    return func(this,depth);
  };
  MapNode.prototype.contentToString = function(){
    return this.content.name+' => '+'something';//require('util').inspect(this.content.content,{depth:null});
  };

  Tree = avltreelib.treeFactory(mapNodeCompare,function(name,content){
    return new MapNode(name,content);
  });

  function Map(){
    this.tree = new Tree();
    this.count = 0;
    this.keyType = null;
  }
  Map.prototype.destroy = function () {
    this.keyType = null;
    this.count = null;
    if (this.tree) {
      this.tree.destroy();
    }
    this.tree = null;
  };
  function nameGetter(content,name){
    return name;
  }
  Map.prototype.purge = function () {
    if (!this.tree) {
      return;
    }
    this.tree.purge();
    this.keytype = null;
    this.count = 0;
  };
  //static
  function checkType (name) {
    var estl;
    if (!this.keyType) {
      this.keyType = typeof(name);
      return;
    }
    if (this.keyType != typeof(name)) {
      console.log('Fatal error in adding to map');
      console.log('Map already has keyType', this.keyType);
      console.log('These are the keys', this.keys());
      console.log('BUT, the key to be added', name, 'has type', typeof(name));
      estl = Error.stackTraceLimit;
      Error.stackTraceLimit = Infinity;
      console.trace();
      Error.stackTraceLimit = estl;
      process.exit(1);
    }
  }
  Map.prototype.add = function (name, content) {
    var keytype = typeof(name), ret;
    checkType.call(this, name);
    ret = this.tree.add(name, content);
    this.count = this.tree.count;
    return ret;
  };
  Map.prototype.reverseAdd = function(content,name){
    return this.add(name,content);
  };
  Map.prototype.replace = function(name,content){
    var item = this.tree.find({name:name}),ret;
    if(item){
      ret = item.content.content;
      item.content.content = content;
      return ret;
    }
    this.add(name,content); //no return
  };
  Map.prototype.remove = function(name){
    var ret = this.tree.remove({name:name});
    this.count = this.tree.count;
    if (this.count < 1) {
      this.keyType = null;
    }
    return ret;
  };
  Map.prototype.get = function(name){
    var item = this.tree.find({name:name});
    if(item){
      return item.content.content;
    }
  };
  function pager(pageobj,cb,item,itemname){
    if(pageobj.count<pageobj.start){
      pageobj.count++;
      return;
    }
    cb(item,itemname);
    pageobj.count++;
    if(pageobj.count===(pageobj.start+pageobj.length)){
      return true;
    }
  };
  Map.prototype.page = function(cb,start,length){
    var pageobj;
    if ('function' !== typeof cb){
      throw new Error('First parameter \'cb\' is not a function');
    }
    if(length<1){
      return;
    }
    pageobj = {start:start,length:length,count:0};
    this.traverseConditionally(pager.bind(null,pageobj,cb));
    pageobj = null;
    cb = null;
  };
  function keyPusher(arry,node){
    if (!(node && node.content)) {
      return;
    }
    arry.push(node.content.name);
  }
  Map.prototype.keys = function(){
    var ret = [], _ret=ret;;
    this.tree.traverseInOrder(keyPusher.bind(null,_ret));
    _ret = null;
    return ret;
  };

  //static
  function applier (func, errorcaption, node) {
    if (!(node && node.content)) {
      return;
    }
    if (!errorcaption) {
      func(node.content.content, node.content.name, this);
      return;
    }
    try {
      func(node.content.content, node.content.name, this);
    } catch (e) {
      console.log(errorcaption+' :', e);
    }
  }

  function listAppender (list, node) {
    list.add(node);
  }

  //static
  function toList () {
    var list = new List(), _l = list;
    this.tree.traverseInOrder(listAppender.bind(null, _l));
    _l;
    return list;
  }
  //static
  function applyToCurrentNodes (func) {
    var list = toList.call(this);
    list.traverse(func);
    list.destroy();
  }

  function applierForConditional (func, node) {
    if (!(node && node.content)) {
      return;
    }
    try {
      return func(node.content.content, node.content.name, this);
    } catch (e) {
      console.error('Error in Map.traverseConditionally :', e);
    }
  }
  //static
  function conditionalApplyToCurrentNodes (func) {
    var list = toList.call(this), ret;
    ret = list.traverseConditionally(applierForConditional.bind(this, func));
    func = null;
    list.destroy();
    return ret;
  }

  Map.prototype.traverse = function (func) {
    if (!this.tree) {
      return;
    }
    return applyToCurrentNodes.call(this, applier.bind(this, func, null));
  };
  Map.prototype.traverseSafe = function (func, errorcaption) {
    if (!this.tree) {
      return;
    }
    return applyToCurrentNodes.call(this, applier.bind(this, func, errorcaption || 'Error in Map.traverseSafe'));
  };
  Map.prototype.traverseConditionally = function (func) {
    return conditionalApplyToCurrentNodes.call(this, func);
  };

  function arrayizer(array,keyname,valname,item,itemname){
    var obj = {}, valismap = item instanceof Map;
    obj[keyname] = itemname;
    if(valismap){
      if(valname){
        obj[valname] = item.get(valname);
      }else{
        throw new Error("Don't know what to do with Map in arrayizer");
      }
    }else if(valname){
      obj[valname] = item;
    }else{
      throw new Error("Don't know what to do with non-Map in arrayizer");
    }
    array.push(obj);
  }

  Map.prototype.asACollectionSerializeToArray = function(keyname,valname){
    var ret = [], _ret = ret;
    this.traverse(arrayizer.bind(null,_ret,keyname,valname));
    _ret = null;
    keyname = null;
    valname = null;
    return ret;
  };

  function consoleMap(name,content,item,level){
    var s = '';
    for(var i=0; i<level; i++){
      s += '\t';
    }
    console.log(s+item.contentToString()+' ('+level+')');
  }

  Map.prototype.dumpToConsole = function(){
    Tree.prototype.dumpToConsole.call(this,consoleMap);
  };

  return Map;
}

module.exports = createMap;
