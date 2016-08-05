var expect = require('chai').expect,
  Checks = require('allex_checkslowlevellib'),
  DListBase = require('allex_doublelinkedlistbaselowlevellib'),
  Inherit = require('allex_inheritlowlevellib')(Checks.isFunction,Checks.isString).inherit,
  Avl = require('allex_avltreelowlevellib')(DListBase,Inherit),
  Map = require('..')(Avl,Inherit);

describe('Basic \'Map\' lib testing', function(){
  it('Basic tests', function(){
    var map = new Map();
    var first = map.add('first',1);
    var second = map.reverseAdd(2,'second');
    var third = map.add('third',3);
    var content = map.get('first');
    expect(content).to.be.equal(1);
    content = map.replace('first',5);
    expect(content).to.be.equal(1);
    content = map.get(first.content.name);
    expect(content).to.be.equal(5);
    map.remove('first');
    expect(map.get('first')).to.be.undefined;
    map.purge();
    expect(map.empty()).to.be.true;
    map.destroy();
  });
  it('Pager tests', function(){
    var map = new Map();
    var i;
    function expFn(item,name){
      item.value *= item.value;
    }
    for (i=0; i<100; i++){
      map.add(i,{value:i});
    }
    map.page(expFn.bind(null),50,21);
    expect(map.get(49).value).to.be.equal(49);
    expect(map.get(50).value).to.be.equal(2500);
    expect(map.get(70).value).to.be.equal(4900);
    expect(map.get(71).value).to.be.equal(71);
    map.destroy();
  });
  it('Keys tests', function(){
    var map = new Map();
    var first = map.add('first',1);
    var second = map.reverseAdd(2,'second');
    var third = map.add('third',3);
    var keys = map.keys();
    expect(keys[0]).to.be.equal('first');
    expect(keys[1]).to.be.equal('second');
    expect(keys[2]).to.be.equal('third');
    expect(keys[3]).to.be.undefined;
    map.destroy();
  });
  it('asACollectionSerializeToArray tests', function(){
    var map = new Map();
    var first = map.add('first',1);
    var second = map.reverseAdd(2,'second');
    var third = map.add('third',3);
    var arryOfObjs = map.asACollectionSerializeToArray('name','value');
    expect(arryOfObjs[0].name).to.be.equal('first');
    expect(arryOfObjs[0].value).to.be.equal(1);
    expect(arryOfObjs[1].name).to.be.equal('second');
    expect(arryOfObjs[1].value).to.be.equal(2);
    expect(arryOfObjs[2].name).to.be.equal('third');
    expect(arryOfObjs[2].value).to.be.equal(3);
    expect(arryOfObjs[3]).to.be.undefined;
    map.destroy();
  });
});

describe('Traverse tests', function(){
});

describe('Isomorphic name types tests', function(){
});
