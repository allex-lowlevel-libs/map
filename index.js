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
  }
  inherit(Map,Tree);
  function nameGetter(content,name){
    return name;
  }
  Map.prototype.purge = function () {
    var name;
    while(name = this.traverseConditionally(nameGetter)){
      this.remove(name);
    }
  };
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
    return Tree.prototype.remove.call(this,{name:name});
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

  function applier(func, map, name) {
    var item;
    if (!map.controller) {
      return;
    }
    item = map.get(name);
    if ('undefined' !== typeof item) { // && null !== item) {
      func(item, name, map);
    }
  };

  //is this kind of traverse really neccessery?
  //traversing tree 2 times
  Map.prototype.traverse = function(func) {
    this.keys().forEach(applier.bind(null, func, this));
    func = null;
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
