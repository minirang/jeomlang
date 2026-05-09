/**
 * jeom_engine.js  —  점(Jeom) 언어 통합 엔진 v1.1.0
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  렉서(tokenize) + 파서(parse) + VM(JeomVM) 통합 파일        │
 * │  UMD 포맷 — 브라우저 <script> 와 Node.js 양쪽에서 동작      │
 * └─────────────────────────────────────────────────────────────┘
 */

/* global module, globalThis */
(function (root, factory) {
  'use strict';
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.JeomEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VERSION = '1.1.0';

  // ══════════════════════════════════════════════════════════════
  // §1  상수
  // ══════════════════════════════════════════════════════════════

  var DOT_CHARS = new Set([
    '\u002E','\u00B7','\u02D9','\u2022','\u2024','\u2025',
    '\u2026','\u2027','\u2218','\u22C5','\u25CF','\u25E6',
    '\u2981','\u2E33','\u22EE','\u22EF','\u25D8',
  ]);

  var C = {
    COMMENT:   '\u25D8',
    NUM_DELIM: '\u2022',
    STR_DELIM: '\u25CF',
    ZERO:      '\u002E',
    ONE:       '\u00B7',
    BYTE_SEP:  '\u2027',
    FLOAT_SEP: '\u2025',
    MAIN_RAW:  '\u2022\u00B7',
    SPACE:     new Set([' ','\t','\n','\r','\f','\v']),
  };

  // ══════════════════════════════════════════════════════════════
  // §2  OP_TABLE
  // ══════════════════════════════════════════════════════════════

  var OP_TABLE = {
    '\u2218':'\u0056\u0041\u0052',
    '\u2218\u2218':'GET',
    '\u2218\u2218\u2218':'DEL',
    '\u2218\u22C5':'STORE',
    '\u2981':'PUSH_CMD',
    '\u2981\u2981':'POP_CMD',
    '\u2981\u2218':'PEEK',
    '\u2981\u2981\u2981':'SWAP',
    '\u2981\u2218\u2981':'DUP',
    '\u22C5':'ADD',
    '\u22C5\u22C5':'SUB',
    '\u22C5\u22C5\u22C5':'MUL',
    '\u22C5\u2218':'DIV',
    '\u22C5\u2218\u2218':'MOD',
    '\u22C5\u2218\u2218\u2218':'POW',
    '\u22C5\u2981':'AND',
    '\u22C5\u2981\u2981':'OR',
    '\u22C5\u2981\u2981\u2981':'NOT',
    '\u22C5\u2981\u2218':'XOR',
    '\u22C5\u2027':'EQ',
    '\u22C5\u2027\u2027':'NEQ',
    '\u22C5\u2027\u2027\u2027':'LT',
    '\u22C5\u2027\u2218':'GT',
    '\u22C5\u2027\u2218\u2218':'LTE',
    '\u22C5\u2027\u2218\u2218\u2218':'GTE',
    '\u2026':'IF',
    '\u2026\u00B7':'ELSE',
    '\u2026\u2025':'ELIF',
    '\u2025':'LOOP',
    '\u2025\u2025':'WHILE',
    '\u2025\u2218':'BREAK',
    '\u2025\u2218\u2218':'CONT',
    '\u22EE':'BLOCK',
    '\u22EE\u22EE':'END',
    '\u22EF':'GOTO',
    '\u22EF\u00B7':'LABEL',
    '\u02D9':'FUNC',
    '\u02D9\u02D9':'RET',
    '\u02D9\u02D9\u02D9':'CALL',
    '\u02D9\u2218':'ARG',
    '\u02D9\u2218\u2218':'ARGC',
    '\u02D9\u2981':'LAMBDA',
    '\u02D9\u22C5':'CURRY',
    '\u00B7':'PRINT',
    '\u00B7\u00B7':'PRINTLN',
    '\u00B7\u02D9':'INPUT',
    '\u00B7\u02D9\u02D9':'INPUTN',
    '\u00B7\u2218':'ERR',
    '\u00B7\u2981':'FMT',
    '\u2E33':'INT',
    '\u2E33\u2E33':'FLOAT',
    '\u2E33\u2E33\u2E33':'STR',
    '\u2E33\u2218':'BOOL',
    '\u2E33\u2981':'TYPE',
    '\u2E33\u22C5':'CAST',
    '\u2E33\u2027':'LEN',
    '\u25E6':'ARR',
    '\u25E6\u25E6':'IDX',
    '\u25E6\u25E6\u25E6':'IDXS',
    '\u25E6\u2218':'APP',
    '\u25E6\u2218\u2218':'SLICE',
    '\u25E6\u2981':'KEYS',
    '\u25E6\u2981\u2981':'VALS',
    '\u25E6\u22C5':'MAP',
    '\u25E6\u22C5\u22C5':'FILTER',
    '\u25E6\u22C5\u22C5\u22C5':'REDUCE',
    '\u25E6\u2027':'DICT',
    '\u25E6\u2027\u2027':'DGET',
    '\u25E6\u2027\u2027\u2027':'DSET',
    '\u2025\u00B7':'TRY',
    '\u2025\u00B7\u00B7':'CATCH',
    '\u2025\u00B7\u02D9':'FINALLY',
    '\u2025\u00B7\u2218':'THROW',
    '\u2025\u00B7\u2981':'ASSERT',
    '\u22EF\u22EF':'FOPEN',
    '\u22EF\u22EF\u22EF':'FREAD',
    '\u22EF\u2218':'FWRITE',
    '\u22EF\u2218\u2218':'FCLOSE',
    '\u22EF\u2981':'FEXIST',
    '\u22EF\u2981\u2981':'FDELETE',
    '\u22EF\u22C5':'FLIST',
    '\u22EF\u2027':'MKDIR',
    '\u22EF\u00B7\u2981':'IMPORT',
    '\u22EF\u00B7\u2981\u2981':'FROM',
    '\u22EF\u00B7\u02D9':'EXPORT',
    '\u22EE\u00B7':'EVAL',
    '\u22EE\u00B7\u00B7':'EXEC',
    '\u22EE\u00B7\u2218':'ENV',
    '\u22EE\u00B7\u2981':'SLEEP',
    '\u22EE\u2218':'EXIT',
    '\u22EE\u2218\u2218':'NOOP',
    '\u22EE\u2981':'DEBUG',
    '\u22EE\u22C5':'TIME',
    '\u22EE\u2027':'RAND',
    '\u22EE\u2027\u2027':'HASH',
    '\u22EE\u2027\u2027\u2027':'REGEX',
  };

  // VAR 값은 heredoc 안에서 깨지므로 직접 할당
  OP_TABLE['\u2218'] = 'VAR';

  // ══════════════════════════════════════════════════════════════
  // §3  에러 클래스
  // ══════════════════════════════════════════════════════════════

  function JeomError(msg)  { this.message = msg; this.name = 'JeomError'; }
  function JeomBreak()     { this.name = 'JeomBreak'; }
  function JeomContinue()  { this.name = 'JeomContinue'; }
  function JeomReturn(val) { this.name = 'JeomReturn'; this.value = val; }
  function JeomGoto(lbl)   { this.name = 'JeomGoto';   this.label = lbl; }
  function JeomExit(code)  { this.name = 'JeomExit';   this.exitCode = code; }
  JeomError.prototype = Object.create(Error.prototype);

  // ══════════════════════════════════════════════════════════════
  // §4  인코딩 유틸
  // ══════════════════════════════════════════════════════════════

  function encodeString(s) {
    var bytes = (typeof TextEncoder !== 'undefined')
      ? Array.from(new TextEncoder().encode(s))
      : Array.from(Buffer.from(s, 'utf8'));
    return C.STR_DELIM +
      bytes.map(function(b){ return b.toString(2).padStart(8,'0').replace(/0/g,C.ZERO).replace(/1/g,C.ONE); })
           .join(C.BYTE_SEP) +
      C.STR_DELIM;
  }

  function encodeNumber(n) {
    n = Math.trunc(n);
    if (n === 0) return C.NUM_DELIM + C.NUM_DELIM;
    return C.NUM_DELIM + Math.abs(n).toString(2).replace(/0/g,C.ZERO).replace(/1/g,C.ONE) + C.NUM_DELIM;
  }

  function decodeString(s) {
    s = (s||'').trim();
    if (!s.startsWith(C.STR_DELIM)||!s.endsWith(C.STR_DELIM)) return null;
    var inner = s.slice(1,-1).replace(/\s/g,'');
    if (!inner) return '';
    var bytes = inner.split(C.BYTE_SEP)
      .filter(function(b){ return b.length===8; })
      .map(function(b){ return parseInt(b.replace(/\./g,'0').replace(/·/g,'1'),2); });
    return (typeof TextDecoder!=='undefined')
      ? new TextDecoder().decode(new Uint8Array(bytes))
      : Buffer.from(bytes).toString('utf8');
  }

  function decodeNumber(s) {
    s = (s||'').trim();
    if (!s.startsWith(C.NUM_DELIM)||!s.endsWith(C.NUM_DELIM)) return null;
    var inner = s.slice(1,-1);
    if (!inner) return 0;
    return parseInt(inner.replace(/\./g,'0').replace(/·/g,'1'),2);
  }

  // ══════════════════════════════════════════════════════════════
  // §5  렉서
  // ══════════════════════════════════════════════════════════════

  function tokenize(source) {
    var tokens = [];
    var pos = 0, line = 1, col = 1;

    function peek(o){ return source[pos+(o||0)]; }
    function adv(){
      var ch=source[pos++];
      if(ch==='\n'){line++;col=1;}else{col++;}
      return ch;
    }
    function skipWS(){
      while(pos<source.length){
        var ch=source[pos];
        if(C.SPACE.has(ch)){adv();}
        else if(ch===C.COMMENT){while(pos<source.length&&source[pos]!=='\n')adv();}
        else break;
      }
    }

    function readNumber(sl,sc){
      var raw=C.NUM_DELIM, bits=[], fpIdx=null;
      while(pos<source.length){
        var ch=source[pos];
        if(ch===C.NUM_DELIM){raw+=adv();break;}
        else if(ch===C.ZERO){bits.push(0);raw+=adv();}
        else if(ch===C.ONE){bits.push(1);raw+=adv();}
        else if(ch===C.FLOAT_SEP){
          if(fpIdx!==null) throw new JeomError('L'+sl+': 소수점 중복');
          fpIdx=bits.length; raw+=adv();
        }
        else if(C.SPACE.has(ch)) throw new JeomError('L'+sl+': 숫자 내 공백 불가');
        else throw new JeomError('L'+sl+':C'+col+': 숫자 내 허용안되는 문자 \''+ch+'\'');
      }
      if(!bits.length) return {type:'NUMBER',value:0,raw:raw,line:sl,col:sc};
      if(fpIdx!==null){
        var iv=bits.slice(0,fpIdx).reduce(function(a,b){return a*2+b;},0);
        var fv=bits.slice(fpIdx).reduce(function(a,b,i){return a+b*Math.pow(2,-(i+1));},0);
        return {type:'NUMBER',value:iv+fv,raw:raw,line:sl,col:sc};
      }
      return {type:'NUMBER',value:parseInt(bits.join(''),2),raw:raw,line:sl,col:sc};
    }

    function readString(sl,sc){
      var raw=C.STR_DELIM, cur=[], bytes=[];
      while(pos<source.length){
        var ch=source[pos];
        if(ch===C.STR_DELIM){raw+=adv();break;}
        else if(ch===C.ZERO){cur.push(0);raw+=adv();}
        else if(ch===C.ONE){cur.push(1);raw+=adv();}
        else if(ch===C.BYTE_SEP){
          raw+=adv();
          if(cur.length){
            if(cur.length!==8) throw new JeomError('L'+sl+': 문자열 바이트가 8비트가 아님('+cur.length+')');
            bytes.push(parseInt(cur.join(''),2)); cur=[];
          }
        }
        else if(C.SPACE.has(ch)){adv();}
        else throw new JeomError('L'+sl+':C'+col+': 문자열 내 허용안되는 문자 \''+ch+'\'');
      }
      if(cur.length===8) bytes.push(parseInt(cur.join(''),2));
      else if(cur.length>0) throw new JeomError('L'+sl+': 마지막 바이트가 8비트 아님('+cur.length+')');
      var value=(typeof TextDecoder!=='undefined')
        ? new TextDecoder().decode(new Uint8Array(bytes))
        : Buffer.from(bytes).toString('utf8');
      return {type:'STRING',value:value,raw:raw,line:sl,col:sc};
    }

    while(pos<source.length){
      skipWS();
      if(pos>=source.length) break;
      var ch=source[pos], sl=line, sc=col;
      if(!DOT_CHARS.has(ch))
        throw new JeomError('L'+sl+':C'+sc+': 허용안되는 문자 \''+ch+'\' (U+'+ch.codePointAt(0).toString(16).toUpperCase().padStart(4,'0')+')');

      if(ch===C.NUM_DELIM){
        // MAIN marker: •· 다음이 공백/EOF/주석인 경우만
        var nx=peek(1), afx=peek(2);
        if(nx===C.ONE&&(!afx||C.SPACE.has(afx)||afx===C.COMMENT)){
          adv();adv();
          tokens.push({type:'NUMBER',value:1,raw:C.MAIN_RAW,line:sl,col:sc});
        } else {
          adv();
          tokens.push(readNumber(sl,sc));
        }
      } else if(ch===C.STR_DELIM){
        adv();
        tokens.push(readString(sl,sc));
      } else {
        var raw='';
        while(pos<source.length){
          var cc=source[pos];
          if(C.SPACE.has(cc)||cc===C.COMMENT) break;
          if(!DOT_CHARS.has(cc)) throw new JeomError('L'+line+':C'+col+': 허용안되는 문자 \''+cc+'\'');
          raw+=adv();
        }
        if(raw) tokens.push({type:'OP',value:raw,raw:raw,line:sl,col:sc});
      }
    }
    tokens.push({type:'EOF',value:null,raw:'',line:line,col:col});
    return tokens;
  }

  // ══════════════════════════════════════════════════════════════
  // §6  파서
  // ══════════════════════════════════════════════════════════════

  function parse(tokens){
    var pos=0;
    function peek(o){return tokens[pos+(o||0)]||{type:'EOF'};}
    function adv(){return tokens[pos++]||{type:'EOF'};}
    function opName(t){return t.type==='OP'?(OP_TABLE[t.raw]||null):null;}
    function isMain(){var t=peek();return t.type==='NUMBER'&&t.raw===C.MAIN_RAW;}
    function isEnd(){var o=opName(peek());return o==='END'||o==='ELSE'||o==='ELIF'||o==='CATCH'||o==='FINALLY';}
    function readName(){
      var t=adv();
      if(t.type!=='OP') throw new JeomError('L'+t.line+': 이름 기대, 받음: '+t.type+'(\''+t.raw+'\')');
      return t.raw;
    }
    function parseBody(){
      var s=[];
      while(peek().type!=='EOF'&&!isEnd()&&!isMain()){var st=parseStmt();if(st)s.push(st);}
      return s;
    }
    function parseBlock(){
      if(opName(peek())!=='BLOCK') throw new JeomError('L'+peek().line+': ⋮ 기대, 받음: \''+peek().raw+'\'');
      adv();
      var b=parseBody();
      if(opName(peek())==='END') adv();
      return b;
    }
    function parseVal(){
      var t=peek();
      if(t.type==='NUMBER'){adv();return {type:'NUM_LIT',value:t.value};}
      if(t.type==='STRING'){adv();return {type:'STR_LIT',value:t.value};}
      var o=opName(t);
      if(o==='GET'){adv();return {type:'GETVAR',name:readName()};}
      if(t.type==='OP'){return {type:'NAME',raw:adv().raw};}
      throw new JeomError('L'+t.line+': 값 표현식 기대');
    }
    function parseFuncDef(){
      var ln=peek().line; adv();
      var name=readName(), args=[];
      while(opName(peek())==='ARG'){adv();args.push(readName());}
      return {type:'FUNCDEF',name:name,args:args,body:parseBlock(),line:ln};
    }
    function parseLambda(){
      var ln=peek().line; adv();
      var args=[];
      while(opName(peek())==='ARG'){adv();args.push(readName());}
      return {type:'LAMBDA',args:args,body:parseBlock(),line:ln};
    }
    function parseIf(){
      var ln=peek().line; adv();
      var then=parseBlock(), elifs=[], els=null;
      while(opName(peek())==='ELIF'){adv();var c=parseBlock(),b=parseBlock();elifs.push({cond:c,body:b});}
      if(opName(peek())==='ELSE'){adv();els=parseBlock();}
      return {type:'IF',thenBody:then,elifBranches:elifs,elseBody:els,line:ln};
    }
    function parseWhile(){
      var ln=peek().line; adv();
      return {type:'WHILE',condBody:parseBlock(),body:parseBlock(),line:ln};
    }
    function parseTry(){
      var ln=peek().line; adv();
      var tb=parseBlock(),cb=null,fb=null;
      if(opName(peek())==='CATCH'){adv();cb=parseBlock();}
      if(opName(peek())==='FINALLY'){adv();fb=parseBlock();}
      return {type:'TRY',tryBody:tb,catchBody:cb,finallyBody:fb,line:ln};
    }
    function parseMain(){
      adv();
      var b=parseBody();
      if(opName(peek())==='END') adv();
      return {type:'MAIN',body:b};
    }
    function parseStmt(){
      var t=peek(), ln=t.line, op=opName(t);
      // MAIN marker를 NUMBER보다 먼저 체크 (★핵심 수정)
      if(isMain()) return parseMain();
      if(t.type==='NUMBER'){adv();return {type:'PUSH',expr:{type:'NUM_LIT',value:t.value},line:ln};}
      if(t.type==='STRING'){adv();return {type:'PUSH',expr:{type:'STR_LIT',value:t.value},line:ln};}
      if(t.type==='EOF') return null;
      if(!op) return {type:'GETVAR',name:adv().raw,line:ln};
      switch(op){
        case 'VAR':      {adv();var nm=readName();return {type:'VARSET',name:nm,expr:parseVal(),line:ln};}
        case 'GET':      {adv();return {type:'GETVAR',name:readName(),line:ln};}
        case 'DEL':      {adv();return {type:'DELVAR',name:readName(),line:ln};}
        case 'STORE':    {adv();return {type:'STORE', name:readName(),line:ln};}
        case 'PUSH_CMD': {adv();return {type:'PUSH',  expr:parseVal(), line:ln};}
        case 'FUNC':     return parseFuncDef();
        case 'LAMBDA':   return parseLambda();
        case 'CALL':     {adv();return {type:'CALL',name:readName(),line:ln};}
        case 'IF':       return parseIf();
        case 'LOOP':     {adv();return {type:'LOOP',body:parseBlock(),line:ln};}
        case 'WHILE':    return parseWhile();
        case 'TRY':      return parseTry();
        case 'THROW':    {adv();return {type:'THROW',line:ln};}
        case 'ASSERT':   {adv();return {type:'INSTR',op:'ASSERT',line:ln};}
        case 'LABEL':    {adv();return {type:'LABEL',name:readName(),line:ln};}
        case 'GOTO':     {adv();return {type:'GOTO', name:readName(),line:ln};}
        case 'IMPORT':   {adv();return {type:'IMPORT',line:ln};}
        case 'FROM':     {adv();return {type:'IMPORT',line:ln};}
        case 'EXPORT':   {adv();return {type:'EXPORT',name:readName(),line:ln};}
        case 'BLOCK':{
          adv();var bb=parseBody();
          if(opName(peek())==='END') adv();
          return {type:'BLOCK',body:bb,line:ln};
        }
        default: adv(); return {type:'INSTR',op:op,line:ln};
      }
    }
    var stmts=[];
    while(peek().type!=='EOF'){var s=parseStmt();if(s)stmts.push(s);}
    return stmts;
  }

  // ══════════════════════════════════════════════════════════════
  // §7  VM
  // ══════════════════════════════════════════════════════════════

  function JeomVM(opts){
    opts=opts||{};
    this.stdout     =opts.stdout     ||function(){};
    this.stderr     =opts.stderr     ||function(){};
    this.stdin      =opts.stdin      ||function(){return Promise.resolve('');};
    this.readFile   =opts.readFile   ||function(){return Promise.reject(new JeomError('파일읽기 미지원'));};
    this.writeFile  =opts.writeFile  ||function(){return Promise.reject(new JeomError('파일쓰기 미지원'));};
    this.fileExists =opts.fileExists ||function(){return Promise.resolve(false);};
    this.deleteFile =opts.deleteFile ||function(){return Promise.reject(new JeomError('삭제 미지원'));};
    this.listDir    =opts.listDir    ||function(){return Promise.resolve([]);};
    this.makeDir    =opts.makeDir    ||function(){return Promise.reject(new JeomError('mkdir 미지원'));};
    this.execCmd    =opts.execCmd    ||function(){return Promise.reject(new JeomError('exec 미지원'));};
    this.getEnv     =opts.getEnv     ||function(){return '';};
    this.maxSteps     =opts.maxSteps     ||2000000;
    this.maxCallDepth =opts.maxCallDepth ||500;
    this.maxLoop      =opts.maxLoop      ||100000;
    this.stack=[]; this.env={}; this.functions={}; this.modules={};
    this.callDepth=0; this.stepCount=0;
  }

  JeomVM.prototype.run = async function(source){
    this.stepCount=0;
    var toks=tokenize(source), stmts=parse(toks);
    for(var i=0;i<stmts.length;i++) if(stmts[i].type==='FUNCDEF') this._regFunc(stmts[i]);
    var main=null;
    for(var j=0;j<stmts.length;j++) if(stmts[j].type==='MAIN'){main=stmts[j];break;}
    if(!main) throw new JeomError('main 블록(•·...⋮⋮)이 없습니다');
    await this._execList(main.body);
  };

  JeomVM.prototype._push=function(v){this.stack.push(v);};
  JeomVM.prototype._pop=function(){
    if(!this.stack.length) throw new JeomError('스택 언더플로우');
    return this.stack.pop();
  };
  JeomVM.prototype._peek=function(){
    if(!this.stack.length) throw new JeomError('스택이 비어있음');
    return this.stack[this.stack.length-1];
  };
  JeomVM.prototype._setVar=function(n,v){this.env[n]=v;};
  JeomVM.prototype._getVar=function(n){
    if(Object.prototype.hasOwnProperty.call(this.env,n)) return this.env[n];
    throw new JeomError('정의되지 않은 변수: \''+n+'\'');
  };
  JeomVM.prototype._regFunc=function(node){
    var fn={args:node.args,body:node.body,closure:Object.assign({},this.env),_isFunc:true};
    this.functions[node.name]=fn; this.env[node.name]=fn;
  };

  JeomVM.prototype._execList=async function(stmts){
    var i=0;
    while(i<stmts.length){
      this.stepCount++;
      if(this.stepCount>this.maxSteps) throw new JeomError('최대 스텝 초과 — 무한루프?');
      try{ await this._exec(stmts[i]); }
      catch(e){
        if(e&&e.name==='JeomGoto'){
          var found=false;
          for(var j=0;j<stmts.length;j++){
            if(stmts[j].type==='LABEL'&&stmts[j].name===e.label){i=j+1;found=true;break;}
          }
          if(!found) throw e;
          continue;
        }
        throw e;
      }
      i++;
    }
  };

  JeomVM.prototype._exec=async function(node){
    if(!node) return;
    if(Array.isArray(node)){await this._execList(node);return;}
    switch(node.type){
      case 'PUSH':    this._push(await this._eval(node.expr)); break;
      case 'VARSET':  this._setVar(node.name,await this._eval(node.expr)); break;
      case 'STORE':   this._setVar(node.name,this._pop()); break;
      case 'GETVAR':  this._push(this._getVar(node.name)); break;
      case 'DELVAR':  delete this.env[node.name]; break;
      case 'FUNCDEF': this._regFunc(node); break;
      case 'LAMBDA':{
        var cl=Object.assign({},this.env);
        this._push({args:node.args,body:node.body,closure:cl,_isFunc:true});
        break;
      }
      case 'CALL':   await this._callByName(node.name); break;
      case 'IF':     await this._execIf(node); break;
      case 'LOOP':   await this._execLoop(node); break;
      case 'WHILE':  await this._execWhile(node); break;
      case 'TRY':    await this._execTry(node); break;
      case 'THROW':  throw new JeomError(String(this._pop()));
      case 'LABEL':  break;
      case 'GOTO':   throw new JeomGoto(node.name);
      case 'BLOCK':  await this._execList(node.body); break;
      case 'MAIN':   await this._execList(node.body); break;
      case 'IMPORT': await this._doImport(); break;
      case 'EXPORT': break;
      case 'INSTR':  await this._execInstr(node.op); break;
      default: throw new JeomError('알 수 없는 노드: \''+node.type+'\'');
    }
  };

  JeomVM.prototype._eval=async function(node){
    switch(node.type){
      case 'NUM_LIT': return node.value;
      case 'STR_LIT': return node.value;
      case 'GETVAR':  return this._getVar(node.name);
      case 'NAME':    return this._getVar(node.raw);
      default: await this._exec(node); return this._pop();
    }
  };

  JeomVM.prototype._execIf=async function(node){
    var cond=this._pop();
    if(this._truthy(cond)){await this._execList(node.thenBody);return;}
    for(var i=0;i<node.elifBranches.length;i++){
      await this._execList(node.elifBranches[i].cond);
      if(this._truthy(this._pop())){await this._execList(node.elifBranches[i].body);return;}
    }
    if(node.elseBody) await this._execList(node.elseBody);
  };

  JeomVM.prototype._execLoop=async function(node){
    var count=Math.max(0,Math.floor(this._num(this._pop())));
    for(var i=0;i<count;i++){
      try{await this._execList(node.body);}
      catch(e){
        if(e&&e.name==='JeomBreak') break;
        if(e&&e.name==='JeomContinue') continue;
        throw e;
      }
    }
  };

  JeomVM.prototype._execWhile=async function(node){
    var guard=0;
    while(true){
      if(++guard>this.maxLoop) throw new JeomError('WHILE 최대반복 초과');
      await this._execList(node.condBody);
      if(!this._truthy(this._pop())) break;
      try{await this._execList(node.body);}
      catch(e){
        if(e&&e.name==='JeomBreak') break;
        if(e&&e.name==='JeomContinue') continue;
        throw e;
      }
    }
  };

  JeomVM.prototype._execTry=async function(node){
    try{await this._execList(node.tryBody);}
    catch(e){
      if(e&&(e.name==='JeomBreak'||e.name==='JeomContinue'||e.name==='JeomReturn'||e.name==='JeomExit')) throw e;
      if(node.catchBody){this._push(e.message||String(e));await this._execList(node.catchBody);}
      else throw e;
    } finally {
      if(node.finallyBody) await this._execList(node.finallyBody);
    }
  };

  JeomVM.prototype._callByName=async function(name){
    var fn=this.functions[name]||(Object.prototype.hasOwnProperty.call(this.env,name)?this.env[name]:null);
    if(!fn||!fn.args) throw new JeomError('정의되지 않은 함수: \''+name+'\'');
    await this._callFn(fn);
  };

  JeomVM.prototype._callFn=async function(fn){
    if(!fn||!fn.args) throw new JeomError('함수 객체 아님');
    this.callDepth++;
    if(this.callDepth>this.maxCallDepth) throw new JeomError('최대 재귀깊이 초과');
    var args=[];
    for(var i=0;i<fn.args.length;i++) args.unshift(this._pop());
    var saved=Object.assign({},this.env);
    this.env=Object.assign({},fn.closure);
    for(var j=0;j<fn.args.length;j++) this.env[fn.args[j]]=args[j];
    try{await this._execList(fn.body);}
    catch(e){
      if(e&&e.name==='JeomReturn'){if(e.value!==undefined)this._push(e.value);}
      else throw e;
    } finally {
      this.env=saved; this.callDepth--;
    }
  };

  JeomVM.prototype._doImport=async function(){
    var path=String(this._pop());
    if(this.modules[path]){
      Object.assign(this.env,this.modules[path]);
      Object.assign(this.functions,this.modules[path+':fn']||{});
      return;
    }
    var src;
    try{src=await this.readFile(path);}
    catch(e){throw new JeomError('모듈 로드 실패: \''+path+'\' — '+e.message);}
    var sub=new JeomVM({stdout:this.stdout,stderr:this.stderr,stdin:this.stdin,
      readFile:this.readFile,writeFile:this.writeFile,fileExists:this.fileExists,getEnv:this.getEnv});
    var stmts=parse(tokenize(src));
    for(var i=0;i<stmts.length;i++) if(stmts[i].type==='FUNCDEF') sub._regFunc(stmts[i]);
    var main=null;
    for(var j=0;j<stmts.length;j++) if(stmts[j].type==='MAIN'){main=stmts[j];break;}
    if(main) await sub._execList(main.body);
    this.modules[path]=sub.env;
    this.modules[path+':fn']=sub.functions;
    Object.assign(this.env,sub.env);
    Object.assign(this.functions,sub.functions);
  };

  JeomVM.prototype._execInstr=async function(op){
    var a,b,v,n,fn,arr,d,k,i,res,parts,fh,r;
    switch(op){
      case 'POP_CMD': this._pop(); break;
      case 'PEEK':    this._push(this._peek()); break;
      case 'SWAP':    b=this._pop();a=this._pop();this._push(b);this._push(a); break;
      case 'DUP':     this._push(this._peek()); break;
      case 'ADD': b=this._pop();a=this._pop();this._push(this._add(a,b)); break;
      case 'SUB': b=this._pop();a=this._pop();this._push(this._num(a)-this._num(b)); break;
      case 'MUL': b=this._pop();a=this._pop();this._push(this._num(a)*this._num(b)); break;
      case 'DIV': {
        b=this._pop();a=this._pop();
        if(this._num(b)===0) throw new JeomError('0으로 나눌 수 없음');
        this._push(this._num(a)/this._num(b)); break;
      }
      case 'MOD': b=this._pop();a=this._pop();this._push(this._num(a)%this._num(b)); break;
      case 'POW': b=this._pop();a=this._pop();this._push(Math.pow(this._num(a),this._num(b))); break;
      case 'AND': b=this._pop();a=this._pop();this._push(this._truthy(a)&&this._truthy(b)?1:0); break;
      case 'OR':  b=this._pop();a=this._pop();this._push(this._truthy(a)||this._truthy(b)?1:0); break;
      case 'NOT': this._push(this._truthy(this._pop())?0:1); break;
      case 'XOR': b=this._pop();a=this._pop();this._push(!!this._truthy(a)!==!!this._truthy(b)?1:0); break;
      case 'EQ':  b=this._pop();a=this._pop();this._push(a==b?1:0); break;
      case 'NEQ': b=this._pop();a=this._pop();this._push(a!=b?1:0); break;
      case 'LT':  b=this._pop();a=this._pop();this._push(a<b?1:0); break;
      case 'GT':  b=this._pop();a=this._pop();this._push(a>b?1:0); break;
      case 'LTE': b=this._pop();a=this._pop();this._push(a<=b?1:0); break;
      case 'GTE': b=this._pop();a=this._pop();this._push(a>=b?1:0); break;
      case 'PRINT':   this.stdout(String(this._disp(this._pop()))); break;
      case 'PRINTLN': this.stdout(String(this._disp(this._pop()))+'\n'); break;
      case 'ERR':     this.stderr(String(this._disp(this._pop()))+'\n'); break;
      case 'FMT':{
        n=Math.floor(this._num(this._pop()));
        var fmt=String(this._pop()), fa=[];
        for(i=0;i<n;i++) fa.unshift(this._pop());
        this.stdout(fmt.replace(/%[sdf]/g,function(){return String(fa.shift()!=null?fa.shift():'');}));
        break;
      }
      case 'INPUT':  this._push(await this.stdin()); break;
      case 'INPUTN': {var sv=await this.stdin();this._push(isNaN(sv)?0:Number(sv));break;}
      case 'INT': {
        v=this._pop();var ni=Math.trunc(Number(v));
        if(isNaN(ni)) throw new JeomError('INT 변환 실패: '+v);
        this._push(ni); break;
      }
      case 'FLOAT': {v=this._pop();var nf=Number(v);if(isNaN(nf))throw new JeomError('FLOAT 변환 실패: '+v);this._push(nf);break;}
      case 'STR':  this._push(String(this._disp(this._pop()))); break;
      case 'BOOL': this._push(this._truthy(this._pop())?1:0); break;
      case 'TYPE': {v=this._pop();this._push(Array.isArray(v)?'array':typeof v);break;}
      case 'CAST': {
        var tgt=String(this._pop());v=this._pop();
        if(tgt==='int')this._push(Math.trunc(Number(v)));
        else if(tgt==='float')this._push(Number(v));
        else if(tgt==='str')this._push(String(v));
        else throw new JeomError('CAST: 알 수 없는 타입 \''+tgt+'\'');
        break;
      }
      case 'LEN': {
        v=this._pop();
        if(v==null) throw new JeomError('LEN: null');
        this._push(v.length!==undefined?v.length:Object.keys(v).length); break;
      }
      case 'ARR': {
        n=Math.max(0,Math.floor(this._num(this._pop())));
        var items=[];for(i=0;i<n;i++)items.unshift(this._pop());
        this._push(items); break;
      }
      case 'IDX': {
        var idx=this._pop();arr=this._pop();
        if(Array.isArray(arr)){
          var ii=Number(idx);
          if(ii<0||ii>=arr.length) throw new JeomError('IDX: 범위초과('+ii+', len='+arr.length+')');
          this._push(arr[ii]);
        } else if(arr&&typeof arr==='object'){
          this._push(arr[idx]!==undefined?arr[idx]:null);
        } else throw new JeomError('IDX: 배열/딕셔너리 아님');
        break;
      }
      case 'IDXS': {
        v=this._pop();var idx2=this._pop();arr=this._pop();
        if(!arr||typeof arr!=='object') throw new JeomError('IDXS: 배열/딕셔너리 아님');
        arr[Array.isArray(arr)?Number(idx2):idx2]=v; this._push(arr); break;
      }
      case 'APP': {
        v=this._pop();arr=this._pop();
        if(!Array.isArray(arr)) throw new JeomError('APP: 배열 아님');
        arr.push(v);this._push(arr); break;
      }
      case 'SLICE': {
        var se=this._pop(),ss=this._pop(),sa=this._pop();
        if(sa==null) throw new JeomError('SLICE: null');
        this._push(sa.slice(Number(ss),Number(se))); break;
      }
      case 'KEYS': {d=this._pop();if(!d||typeof d!=='object'||Array.isArray(d))throw new JeomError('KEYS: 딕셔너리 아님');this._push(Object.keys(d));break;}
      case 'VALS': {d=this._pop();if(!d||typeof d!=='object'||Array.isArray(d))throw new JeomError('VALS: 딕셔너리 아님');this._push(Object.values(d));break;}
      case 'MAP': {
        fn=this._pop();arr=this._pop();
        if(!Array.isArray(arr)) throw new JeomError('MAP: 배열 아님');
        res=[];
        for(i=0;i<arr.length;i++){this._push(arr[i]);await this._callFn(fn);res.push(this.stack.length?this._pop():null);}
        this._push(res); break;
      }
      case 'FILTER': {
        fn=this._pop();arr=this._pop();
        if(!Array.isArray(arr)) throw new JeomError('FILTER: 배열 아님');
        res=[];
        for(i=0;i<arr.length;i++){this._push(arr[i]);await this._callFn(fn);if(this._truthy(this._pop()))res.push(arr[i]);}
        this._push(res); break;
      }
      case 'REDUCE': {
        var init=this._pop();fn=this._pop();arr=this._pop();
        if(!Array.isArray(arr)) throw new JeomError('REDUCE: 배열 아님');
        var acc=init;
        for(i=0;i<arr.length;i++){this._push(acc);this._push(arr[i]);await this._callFn(fn);acc=this._pop();}
        this._push(acc); break;
      }
      case 'DICT': {
        n=Math.max(0,Math.floor(this._num(this._pop())));
        parts=[];for(i=0;i<n*2;i++)parts.unshift(this._pop());
        d={};for(i=0;i<parts.length;i+=2)d[parts[i]]=parts[i+1];
        this._push(d); break;
      }
      case 'DGET': {k=this._pop();d=this._pop();if(!d||typeof d!=='object')throw new JeomError('DGET: 딕셔너리 아님');this._push(d[k]!==undefined?d[k]:null);break;}
      case 'DSET': {v=this._pop();k=this._pop();d=this._pop();if(!d||typeof d!=='object')throw new JeomError('DSET: 딕셔너리 아님');d[k]=v;this._push(d);break;}
      case 'BREAK':  throw new JeomBreak();
      case 'CONT':   throw new JeomContinue();
      case 'RET':    throw new JeomReturn(this.stack.length?this._pop():undefined);
      case 'ASSERT': {if(!this._truthy(this._pop()))throw new JeomError('ASSERT 실패');break;}
      case 'NOOP':   break;
      case 'ARGC': {var fn2n=String(this._pop());fn=this.functions[fn2n]||this.env[fn2n];this._push(fn&&fn.args?fn.args.length:0);break;}
      case 'CURRY': {
        var part=this._pop();fn=this._pop();
        if(!fn||!fn.args||fn.args.length===0) throw new JeomError('CURRY: 함수 아님');
        var nc=Object.assign({},fn.closure);nc[fn.args[0]]=part;
        this._push({args:fn.args.slice(1),body:fn.body,closure:nc,_isFunc:true}); break;
      }
      case 'DEBUG':  this.stderr('[DEBUG] stack='+JSON.stringify(this.stack)+'\n'); break;
      case 'TIME':   this._push(Date.now()/1000); break;
      case 'RAND':   this._push(Math.random()); break;
      case 'HASH': {
        var hs=String(this._pop()),h=5381;
        for(i=0;i<hs.length;i++) h=((h<<5)+h+hs.charCodeAt(i))&0xffffffff;
        this._push((h>>>0).toString(16).padStart(8,'0')); break;
      }
      case 'REGEX': {
        var pat=String(this._pop()),txt=String(this._pop());
        try{var rm=txt.match(new RegExp(pat));this._push(rm?rm[0]:null);}
        catch(re){throw new JeomError('REGEX: '+re.message);}
        break;
      }
      case 'SLEEP': {
        var ms=Math.max(0,this._num(this._pop()));
        await new Promise(function(resolve){setTimeout(resolve,ms);}); break;
      }
      case 'EXIT':   {var ec=this.stack.length?this._pop():0;throw new JeomExit(Number(ec));}
      case 'ENV':    this._push(this.getEnv(String(this._pop()))); break;
      case 'EVAL': {
        var esrc=String(this._pop());
        var esub=new JeomVM({stdout:this.stdout,stderr:this.stderr,stdin:this.stdin,
          readFile:this.readFile,writeFile:this.writeFile,fileExists:this.fileExists,getEnv:this.getEnv});
        esub.functions=Object.assign({},this.functions);
        esub.env=Object.assign({},this.env);
        await esub.run(esrc);
        if(esub.stack.length) this._push(esub.stack[esub.stack.length-1]);
        break;
      }
      case 'EXEC': {var cmd=String(this._pop());this._push(await this.execCmd(cmd));break;}
      case 'FOPEN': {var fm=String(this._pop()),fp=String(this._pop());this._push({_jeomFile:true,path:fp,mode:fm});break;}
      case 'FREAD': {fh=this._pop();if(!fh||!fh._jeomFile)throw new JeomError('FREAD: 핸들 아님');this._push(await this.readFile(fh.path));break;}
      case 'FWRITE':{v=String(this._pop());fh=this._pop();if(!fh||!fh._jeomFile)throw new JeomError('FWRITE: 핸들 아님');await this.writeFile(fh.path,v);break;}
      case 'FCLOSE': this._pop(); break;
      case 'FEXIST': {this._push((await this.fileExists(String(this._pop())))?1:0);break;}
      case 'FDELETE':{await this.deleteFile(String(this._pop()));break;}
      case 'FLIST':  {this._push(await this.listDir(String(this._pop())));break;}
      case 'MKDIR':  {await this.makeDir(String(this._pop()));break;}
      default: throw new JeomError('알 수 없는 명령: \''+op+'\'');
    }
  };

  JeomVM.prototype._truthy=function(v){
    if(v===null||v===undefined) return false;
    if(typeof v==='number') return v!==0;
    if(typeof v==='string') return v.length>0;
    if(Array.isArray(v)) return v.length>0;
    if(typeof v==='object') return true;
    return Boolean(v);
  };
  JeomVM.prototype._num=function(v){
    var n=Number(v);
    if(isNaN(n)) throw new JeomError('숫자 변환 불가: '+JSON.stringify(v));
    return n;
  };
  JeomVM.prototype._add=function(a,b){
    if(typeof a==='string'||typeof b==='string') return this._disp(a)+this._disp(b);
    if(Array.isArray(a)&&Array.isArray(b)) return a.concat(b);
    return this._num(a)+this._num(b);
  };
  JeomVM.prototype._disp=function(v){
    var self=this;
    if(v===null||v===undefined) return 'null';
    if(typeof v==='boolean') return v?'true':'false';
    if(Array.isArray(v)) return '['+v.map(function(x){return self._disp(x);}).join(', ')+']';
    if(v&&v._jeomFile) return '<File:'+v.path+'>';
    if(typeof v==='object'&&!v._isFunc)
      return '{'+Object.entries(v).map(function(e){return e[0]+': '+self._disp(e[1]);}).join(', ')+'}';
    return String(v);
  };

  // ══════════════════════════════════════════════════════════════
  // §8  공개 API
  // ══════════════════════════════════════════════════════════════

  return {
    VERSION:VERSION,
    encodeString:encodeString, encodeNumber:encodeNumber,
    decodeString:decodeString, decodeNumber:decodeNumber,
    tokenize:tokenize, parse:parse,
    JeomVM:JeomVM,
    JeomError:JeomError, JeomBreak:JeomBreak, JeomContinue:JeomContinue,
    JeomReturn:JeomReturn, JeomGoto:JeomGoto, JeomExit:JeomExit,
    OP_TABLE:OP_TABLE, DOT_CHARS:DOT_CHARS, C:C,
  };
}));
