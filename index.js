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

function createMap (avltreelib, inherit) {
  'use strict';
  var Node = avltreelib.Node, Tree;
  function MapNode(name,content){
    Node.call(this,{name:name,content:content});
  }
  //TODO inherit?
  MapNode.prototype = Object.create(Node.prototype,{constructor:{
    value: MapNode,
    enumerable: false,
    configurable: false,
    writable: false
  }});
  MapNode.prototype.destroy = function(){
    if (!this.content) return;
    this.content.name = null;
    this.content.content = null;
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
    return func(this.content.content,this.content.name,this,depth);
  };
  MapNode.prototype.contentToString = function(){
    return this.content.name+' => '+'something';//require('util').inspect(this.content.content,{depth:null});
  };

  Tree = avltreelib.treeFactory(mapNodeCompare,function(name,content){
    return new MapNode(name,content);
  });

  function Map(){
    Tree.call(this);
    this.keyType = null;
  }
  inherit(Map,Tree);
  Map.prototype.destroy = function () {
    this.keyType = null;
    Tree.prototype.destroy.call(this);
  };
  function nameGetter(content,name){
    return name;
  }
  Map.prototype.purge = function () {
    var name;
    while(name = this.traverseConditionally(nameGetter)){
      this.remove(name);
    }
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
    var keytype = typeof(name);
    checkType.call(this, name);
    return Tree.prototype.add.call(this, name, content);
  }
  Map.prototype.reverseAdd = function(content,name){
    return this.add(name,content);
  };
  Map.prototype.replace = function(name,content){
    var item = this.find({name:name}),ret;
    if(item){
      ret = item.content.content;
      item.content.content = content;
    }else{
      this.add(name,content);
    }
    return ret;
  };
  Map.prototype.remove = function(name){
    var ret = Tree.prototype.remove.call(this,{name:name});
    if (this.count < 1) {
      this.keyType = null;
    }
    return ret;
  };
  Map.prototype.get = function(name){
    var item = this.find({name:name});
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
  function keyPusher(arry,item,itemname){
    arry.push(itemname);
  }
  Map.prototype.keys = function(){
    var ret = [], _ret=ret;;
    Tree.prototype.traverse.call(this, keyPusher.bind(null,_ret));
    _ret = null;
    return ret;
  };

  //static
  function applier (func, item, name) {
    func(item, name, this);
  }

  Map.prototype.traverse = function (func) {
    var ret = Tree.prototype.traverse.call(this, applier.bind(this, func));
    func = null;
    return ret;
  };
  Map.prototype.traverseSafe = function (func, errorcaption) {
    var ret = Tree.prototype.traverse.call(this, applier.bind(this, func), errorcaption||'Error in Map.traverseSafe');
    func = null;
    return ret;
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
