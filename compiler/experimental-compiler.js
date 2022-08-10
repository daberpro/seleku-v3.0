const { parse, serialize } = require('parse5');
const beautify = require('js-beautify').js;
const fs = require("fs");
const crypto = require("crypto");
const { highlight } = require('cardinal');
const CLIHiglight = require('cli-highlight').highlight
const beautify_html = require('js-beautify').html;
const { parse: ASTParse, walk, binaryExpressionReduction, replace, generate, find, each, traverse } = require('abstract-syntax-tree');

const HTMLElementTag = { "a": "a", "abbr": "abbr", "acronym": "acronym", "address": "address", "applet": "applet", "area": "area", "article": "article", "aside": "aside", "audio": "audio", "b": "b", "base": "base", "basefont": "basefont", "bdi": "bdi", "bdo": "bdo", "bgsound": "bgsound", "big": "big", "blink": "blink", "blockquote": "blockquote", "body": "body", "br": "br", "button": "button", "canvas": "canvas", "caption": "caption", "center": "center", "cite": "cite", "code": "code", "col": "col", "colgroup": "colgroup", "content": "content", "data": "data", "datalist": "datalist", "dd": "dd", "decorator": "decorator", "del": "del", "details": "details", "dfn": "dfn", "dir": "dir", "div": "div", "dl": "dl", "dt": "dt", "element": "element", "em": "em", "embed": "embed", "fieldset": "fieldset", "figcaption": "figcaption", "figure": "figure", "font": "font", "footer": "footer", "form": "form", "frame": "frame", "frameset": "frameset", "h1": "h1", "h2": "h2", "h3": "h3", "h4": "h4", "h5": "h5", "h6": "h6", "head": "head", "header": "header", "hgroup": "hgroup", "hr": "hr", "html": "html", "i": "i", "iframe": "iframe", "img": "img", "input": "input", "ins": "ins", "isindex": "isindex", "kbd": "kbd", "keygen": "keygen", "label": "label", "legend": "legend", "li": "li", "link": "link", "listing": "listing", "main": "main", "map": "map", "mark": "mark", "marquee": "marquee", "menu": "menu", "menuitem": "menuitem", "meta": "meta", "meter": "meter", "nav": "nav", "nobr": "nobr", "noframes": "noframes", "noscript": "noscript", "object": "object", "ol": "ol", "optgroup": "optgroup", "option": "option", "output": "output", "p": "p", "param": "param", "plaintext": "plaintext", "pre": "pre", "progress": "progress", "q": "q", "rp": "rp", "rt": "rt", "ruby": "ruby", "s": "s", "samp": "samp", "script": "script", "section": "section", "select": "select", "shadow": "shadow", "small": "small", "source": "source", "spacer": "spacer", "span": "span", "strike": "strike", "strong": "strong", "style": "style", "sub": "sub", "summary": "summary", "sup": "sup", "table": "table", "tbody": "tbody", "td": "td", "template": "template", "textarea": "textarea", "tfoot": "tfoot", "th": "th", "thead": "thead", "time": "time", "title": "title", "tr": "tr", "track": "track", "tt": "tt", "u": "u", "ul": "ul", "var": "var", "video": "video", "wbr": "wbr", "xmp": "xmp" }

let countIndex = 0;
const componentFunctionName = {};
let stateVariabel = {};
let stateIdentifier = {};

function toString(b) {

    let c = Object.keys(b).map(e => {

        if (/\<.*?>.*?<\/.*?>/igm.test(b[e])) {

            return `"${e}": ${b[e]}`

        }

        if (b[e] instanceof Array) {
            return `"${e}":[${b[e]}]`
        }

        if (b[e] instanceof Object && typeof b[e] !== "function") {

            return `"${e}":${toString(b[e])}`

        }

        // if (typeof b[e] === "string") return `""${e}"":"${b[e]}"`;

        return `"${e}":${b[e]}`

    });

    let g = "{";

    for (let x in c) {

        if (parseInt(x) === c.length - 1) {

            g += c[x] + "}"

        } else {

            g += c[x] + ","
        }
    }

    if (g === "{") return "{}"

    return g;

}


String.prototype.replaceBetween = function (start, end, what) {
    return this.substring(0, start - 1) + what + this.substring(end - 1);
};

function uuidv4() {
    return ([1e7] + 1e3).replace(/[018]/g, c =>
        (c ^ crypto.randomUUID(new Uint8Array(1))[0] & 15 >> c / 4).toString("36")
    );
}

function callComponent(Component, arrayResult, src, isFirstChild = false, address, parentAttr, rootAttr) {

    const rawAttrs = src.substring(Component.sourceCodeLocation.startCol - 1, Component.sourceCodeLocation.endCol - 1).match(/<[a-zA-Z]+(>|.*?[^?]>)/)?.[0].replace(/(?<=\<(\w.*))(\}(\s+|\t|\r|\n)\})/igm, "}}").match(/(?<=\<(\w.*))((\$.(\w*))|(\w*((\=(\".*?\"))|(\=(\{.*?(\}{1,}))))))/igm)?.map(e => ({
        [e.split("=")[0]]: (e.split("=")[1]) ? e.split("=")[1].replace(/(^\{|\}$)/igm, "") : null
    })) || [];

    let attr = {};

    for (let x of rawAttrs) {

        Object.assign(attr, x);

    }

    let cAttr = {};

    for (let x of rawAttrs) {

        if (!x.hasOwnProperty("condition") &&
            !x.hasOwnProperty("async") &&
            !x.hasOwnProperty("loop") &&
            !x.hasOwnProperty("")) Object.assign(cAttr, x);

    }

    const tagName = src.substring(Component.sourceCodeLocation.startCol, Component.sourceCodeLocation.startCol + Component.tagName.length);

    arrayResult.push({
        component: `
            const ${'$$' + tagName + '_component'} = Node.Render(${attr.hasOwnProperty("async") ? "await " : ""}${tagName}(${toString(cAttr)},${address ? address : '$$_parent'}),${address ? address : '$$_parent'});
            ${Object.keys(cAttr).filter(e => !(/(\"|\'|\`)/igm.test(cAttr[e]))).map(e => `_Observer.subscribe("${cAttr[e]}",(data)=> ${'$$' + tagName + '_component'}.update(void 0, data,"${e}",data["${cAttr[e]}"]));`).join(' ')}
        `,
        location: Component.sourceCodeLocation,
        parent: address,
        parentAttr,
        rootAttr,
        componentName: '$$' + tagName + '_component',
        props: cAttr,
    });

    return arrayResult;

}

function createHTML(Component, arrayResult, src, isFirstChild = false, address, parentAttr, rootAttr) {

    countIndex++;

    const rawAttrs = src.substring(Component.sourceCodeLocation.startCol - 1, Component.sourceCodeLocation.endCol - 1).match(/<[a-zA-Z]+(>|.*?[^?]>)/)?.[0].replace(/(?<=\<(\w.*))(\}(\s+|\t|\r|\n)\})/igm, "}}").match(/(?<=\<(\w.*))((\$.(\w*))|(\w*((\=(\".*?\"))|(\=(\{.*?(\}{1,}))))))/igm)?.map(e => ({
        [e.split("=")[0]]: (e.split("=")[1]) ? e.split("=")[1].replace(/(^\{|\}$)/igm, "") : null
    })) || [];

    let attr = {};

    for (let x of rawAttrs) {

        attr = Object.assign(attr, x);

    }

    let cAttr = {};

    for (let x of rawAttrs) {

        if (!x.hasOwnProperty("condition") &&
            !x.hasOwnProperty("async") &&
            !x.hasOwnProperty("loop") &&
            !x.hasOwnProperty(""))
        {

            Object.assign(cAttr,...Object.keys(x).map( e => ({
                [e]: {
                    raw: `\`${x[e]}\``,
                    real: x[e]
                }
            })));

        }

    }

    const tagName = src.substring(Component.sourceCodeLocation.startCol, Component.sourceCodeLocation.startCol + Component.tagName.length);

    if (!(tagName in HTMLElementTag)) {

        componentFunctionName[tagName] = null;
        return callComponent(Component, arrayResult, src, false, address, parentAttr, rootAttr);

    }

    const TagName = tagName + countIndex;

    Component.childNodes.map(e => {
        if (e.nodeName === "#text") {
            return e.value
        }
    }).join(" ").match(/\$\{.*?\}/igm)?.forEach((e) => {

        stateVariabel = {
            ...stateVariabel,
            [e.split('.')[0].replace(/(\{|\}|\$)/igm, "")]: null,
        };

        stateIdentifier = {
            ...stateIdentifier,
            [e.split('.')[0].replace(/(\{|\}|\$)/igm, "")]: null,
        }

    })

    arrayResult.push({
        component: `
            const ${TagName} = Seleku.createElement("${tagName}");
            const ${TagName}_attribute = Seleku.createAttribute(${TagName},${toString(cAttr)});
            ${Object.keys(cAttr).map( e =>{
                const attr = cAttr[e];

                try{
                    let type = ASTParse(attr['raw'].replace(/(\"|\'|\`|\..*)/igm,'')).body[0].expression.type;

                    if((type === 'Identifier' || type === 'MemberExpression') && e !== 'ref' && e !== 'bind'){
                        return `_Observer.subscribe('${attr['raw'].replace(/(\"|\'|\`|\..*)/igm,'')}',(data)=> ${TagName}_attribute.update({
                            '${attr['raw'].replace(/(\"|\'|\`|\..*)/igm,'')}': data['${attr['raw'].replace(/(\"|\'|\`|\..*)/igm,'')}']
                        }))`;
                    }
                }catch(er){}
            }).join(';')}
            const ${TagName}_content = Seleku.createContent(
                ${TagName},
                "${Component.childNodes.map(e => {
            if (e.nodeName === "#text") {
                return e.value
            }
             }).join(" ").replace(/\s+/igm, ' ')}",
                {
                    ${Component.childNodes.map(e => {
            if (e.nodeName === "#text") {
                return e.value
            }
            }).join(" ").match(/\$\{.*?\}/igm)?.map((e) => {

            if (/\./igm.test(e)) {

                return e.split('.')[0];

            } else {

                let isThereLiteral = false;
                let isThereIdentifier = false;
                let allIdentifier = [];

                find(ASTParse(e.replace(/(\{|\}|\$)/igm, "")), { type: 'Literal' }).forEach(e => {
                    isThereLiteral = true;
                });

                find(ASTParse(e.replace(/(\{|\}|\$)/igm, "")), { type: 'Identifier' }).forEach(e => {
                    allIdentifier.push(e.name);
                    isThereIdentifier = true;
                });

                if (isThereLiteral && isThereIdentifier) {
                    return `${TagName}_${uuidv4()}: ${e},${allIdentifier}`;
                } else if (isThereLiteral) {
                    return `${TagName}_${uuidv4()}: ${e}`;
                } else {
                    return e;
                }

            }

        })?.join(",\n").replace(/(\{|\}|\$)/igm, "") || ''}
                }
            );
            ${attr.hasOwnProperty("condition") ? `
            ${find(ASTParse(attr.condition), {
            type: 'Identifier'
        }).map((e, i) => {

            let addContext = '';

            if (!stateVariabel.hasOwnProperty(e.name)) {

                stateVariabel = {
                    ...stateVariabel,
                    [e.name]: null,
                };

                stateIdentifier = {
                    ...stateIdentifier,
                    [e.name]: null,
                }

            }

            return `
                    ${addContext}
                    _Observer.subscribe("${e.name}",()=>{

                        if(${attr.condition.replace(/\b(?!(false|true)\b)\w+/igm, '$&')}){
                            
                            Node.Render(${TagName},${address ? address : '$$_parent'});
                
                        }else{
                    
                            ${TagName}.remove();
                
                        }
                
                    });
                    `

        }).join(' ')
                }
            `: ""}
            ${attr.hasOwnProperty("parent") ? `Node.Render(${TagName},${address});` : ""}
            Node.registerContext( ${TagName}_content,_Observer);${isFirstChild ? "" : `Node.Render(${TagName},${address});`}
            `,
        location: Component,
        attr,
        parentAttr,
        rootAttr,
        componentName: TagName,
        parent: address,
        content: Component.childNodes.map(e => {
            if (e.nodeName === "#text") {
                return e.value
            }
        }).join(" "),
        componentFunctionName,
        cAttr,
        parseAttr: Component.attrs,
        rawSyntax: src.substring(Component.sourceCodeLocation.startCol - 1, Component.sourceCodeLocation.endCol - 1),
    });

    if (Component.childNodes.length > 0) for (let x of Component.childNodes) {

        if (x.nodeName !== "#text") createHTML(x, arrayResult, src, false, TagName, attr, parentAttr ? { ...parentAttr, ...attr } : attr);

    }
    return arrayResult;

}

module.exports.updateRegisterHTMLElement = (element) => { HTMLElementTag[element] = element }
module.exports.transform = function (_source, callbackComponentArrowFunction, isFirst, API) {

    const StyleSheet = [];
    let source = _source.replace(/(\r|\t|\n|\s+)/igm, " ");
    let raw = {
        source,
        mappingSource: _source
    }

    // raw data
    let data = parse(source, {
        sourceCodeLocationInfo: true
    }).childNodes[0].childNodes[1].childNodes.filter(e => e.nodeName !== "#text");
    let result = [];

    // mapping data
    const mappingIndexData = [];
    let mappingData = parse(_source, {
        sourceCodeLocationInfo: true
    }).childNodes[0].childNodes[1].childNodes.filter(e => e.nodeName !== "#text");
    let mappingIndex = 0;
    for (let map of mappingData) {
        try {
            mappingIndexData[mappingIndex] = {
                source: serialize(map),
                location: {
                    start: {
                        startline: map.sourceCodeLocation.startTag.startLine,
                        startcol: map.sourceCodeLocation.startTag.startCol,
                        endline: map.sourceCodeLocation.startTag.endLine,
                        endcol: map.sourceCodeLocation.startTag.endCol,
                    },
                    end: {
                        startline: map.sourceCodeLocation.endTag.startLine,
                        startcol: map.sourceCodeLocation.endTag.startCol,
                        endline: map.sourceCodeLocation.endTag.endLine,
                        endcol: map.sourceCodeLocation.endTag.endCol,
                    }
                }
            }
        } catch (err) {
            console.log(`\n\nFatal \nError at : \n${beautify_html(CLIHiglight(serialize(map), {
                language: 'jsx'
            }))
                }\n\n`);
        }
        mappingIndex++;
    }

    for (let x of data) {

        let a = {};
        try {
            a = createHTML(x, [], source, true, "");
        } catch (err) {
            // #Error

        }
        //Seleku Access API to Compiler
        if (API.getComponent) API.getComponent(a, stateIdentifier, StyleSheet);

        let loopChild = "";
        let loopArgs = "";
        let loopTarget = [];
        let currentComponentParent = "";
        let loopComponent = [];
        let nameOfChildContent = [];
        let calledComponent = {};
        const unuseComponentIndex = [];
        const rawComponentString = a.map((e, i) => {

            if (e.rootAttr?.hasOwnProperty("loop")) {

                calledComponent[e.componentName] = e.props;

                if (currentComponentParent !== e.parent) {

                    currentComponentParent = e.parent;
                    loopComponent[i] = e.componentName;

                } else {

                    unuseComponentIndex.push(Number(i) - 1);
                    loopComponent[i - 1] = e.componentName;

                }

                if (loopTarget[loopTarget.length - 1] !== e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")) {

                    loopTarget.push(e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, ""));
                    stateVariabel[e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")] = null;

                }

                if (loopArgs !== e.rootAttr['loop']) {

                    loopArgs = e.rootAttr['loop'];
                    loopChild = "";
                    loopChild += e.component;
                    nameOfChildContent = [];
                    nameOfChildContent.push(e.componentName);

                } else {

                    loopChild += e.component;
                    nameOfChildContent.push(e.componentName);

                }


                return `
                
                const ArrayOfComponent_${e.componentName} = [];
                const $$Template_Function_${e.componentName} = ({target,data,index}, Node)=> { 
                    
                    let $$_SELEKU_COMPONENT_LOOP_DATA_$$_${e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")} = data[index];
                    ${loopChild}

                    return {
                        update(props){
                            ${nameOfChildContent.filter(_e => _e).map(__e => {
                    if (/\_component$/igm.test(__e)) {
                        return `${__e}.update(undefined,{${(calledComponent[__e]) ? Object.keys(calledComponent[__e]).map(d => {
                            return `${d}: props['${e.rootAttr.loop.split(" ")[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}']`
                        }).join(', ') + ',...props'
                            :
                            '...props'
                            }});`;
                    } else {
                        return `${__e}_content.update(undefined,{${(calledComponent[__e]) ? Object.keys(calledComponent[__e]).map(d => {
                            return `${d}: props['${e.rootAttr.loop.split(" ")[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}']`
                        }).join(', ') + ',...props'
                            :
                            '...props,'
                            }});`;
                    }
                }).join(" ")}
                        },
                        destroy(){
                            ${nameOfChildContent.filter(e => e).map(e => {

                    if (/\_component$/igm.test(e)) {
                        return `Node.destroy(${e}.element);`;
                    } else {
                        return `Node.destroy(${e});`;
                    }

                }).join(" ")}
                        }
                    }
                
                }

                const loopHandler_${e.componentName} = {
                    push(props){
                        ArrayOfComponent_${e.componentName}.push($$Template_Function_${e.componentName}(props,Node));
                    },
                    unshift(props){
                        ArrayOfComponent_${e.componentName}.unshift($$Template_Function_${e.componentName}({...props,index: 0},{Render: Node.RenderBefore, destroy: Node.destroy}));
                    },
                    shift(props){
                        if(ArrayOfComponent_${e.componentName}.length > 0){
                            ArrayOfComponent_${e.componentName}[0].destroy(props);
                            ArrayOfComponent_${e.componentName}.shift();
                        }
                    },
                    pop(props){
                        const {index,data} = props;
                        if(ArrayOfComponent_${e.componentName}.length > 0){
                            ArrayOfComponent_${e.componentName}[data.length].destroy(props);
                            ArrayOfComponent_${e.componentName}.pop();
                        }
                    },
                    update(props){
                        const {data, index} = props;
                        if(ArrayOfComponent_${e.componentName}.length > 0) ArrayOfComponent_${e.componentName}[index].update({${e.rootAttr.loop.split(' ')[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}: data[index]});
                    },
                    remove(props){
                        const {index,data} = props;
                        if(ArrayOfComponent_${e.componentName}.length > 0){
                            ArrayOfComponent_${e.componentName}[index].destroy(props);
                            delete ArrayOfComponent_${e.componentName}[index];
                            delete ${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}[index];
                        }
                    }
                }

                _Observer.subscribe('${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}',()=>{

                    if(ArrayOfComponent_${e.componentName}.length > 0){
                        for(let $$_SELEKU_COMPONENT_LOOP_$$ in ArrayOfComponent_${e.componentName}){
                            if('destroy' in ArrayOfComponent_${e.componentName}[$$_SELEKU_COMPONENT_LOOP_$$]) ArrayOfComponent_${e.componentName}[$$_SELEKU_COMPONENT_LOOP_$$].destroy();
                            delete ArrayOfComponent_${e.componentName}[$$_SELEKU_COMPONENT_LOOP_$$];
                        }
                    }

                    for(let $$LoopData in $$State.state.${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}){
                        if(Number.isInteger(parseInt($$LoopData))){
                            ${loopComponent.map((de) => `ArrayOfComponent_${de}.push($$Template_Function_${de}({
                                target: null,
                                data: $$State.state.${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")},
                                index: parseInt($$LoopData),
                            },Node));`).join(" ")}
                        }
                    }

                });



                $$State.state.${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")} = ArrayWatcher($$State.state.${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")},{
                    watch(target,from,object,property){

                            if(from === "set"){

                                ${loopTarget.map((e, i) => {
                    return `
                                        _Observer.emit("${e}_"+target,{data: object, index: property, target});
                                    `
                }).join('\n')}

                            }

                            return 1;
                        }
                    });
                
                for(let $$_SELEKU_COMPONENT_LOOP_$$ in loopHandler_${e.componentName}){
                
                    _Observer.subscribe("${e.rootAttr.loop.split(" ")[2].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}_"+x,loopHandler_${e.componentName}[$$_SELEKU_COMPONENT_LOOP_$$]);
                    
                }

                ${loopTarget.map((_e, i) => {
                    return `
                        registerLoopTarget($$State.state,'${_e}','${e.rootAttr.loop.split(' ')[0].replace(/(\n|\r|\t|\"|\'|\`)/igm, "")}',loopSpace_,_Observer);
                    `
                }).join('\n')}
                `
            }
            return e.component

        });

        for (let x of unuseComponentIndex) {
            rawComponentString[x] = '';
        }

        result.push({
            component: rawComponentString.join(" "),
            start: a[0].location?.sourceCodeLocation?.startCol,
            end: a[0].location?.sourceCodeLocation?.endCol,
            uid: uuidv4()
        });

    }

    const JSX = [];
    const NON_JSX = [];

    result.forEach((e, i) => {

        JSX.push({
            component: e.component,
            raw: source.substring(e.start - 1, e.end - 1),
            position: i
        });

        if (i !== 0) NON_JSX.push({
            raw: source.substring(result[i - 1].end - 1, result[i].start - 1),
            position: i
        })
        else if (i === 0 && NON_JSX.length === 0) NON_JSX.push({
            raw: source.substring(0, result[i].start - 1),
            position: i
        })

    });

    NON_JSX.push({
        raw: source.substring(result[result.length - 1].end - 1, source.length),
        position: NON_JSX.length
    })

    let lastResult = "";

    for (let x in NON_JSX) {

        if (parseInt(x) < NON_JSX.length - 1) lastResult += NON_JSX[x].raw + JSX[x].component
        else lastResult += NON_JSX[x].raw

    }

    const SelekuResult = beautify(lastResult.replace(/(\n\n)/igm, "\n"), { indent_size: 2, space_in_empty_paren: true });

    let tree = ASTParse(SelekuResult);

    /**
     * define a variable which will has some 
     * name of seleku component
    */

    const SELEKU_COMPONENT_NAME = {};

    walk(tree,(e)=>{
        if(e.type === 'VariableDeclaration'){
            if(e.type === 'ExportNamedDeclaration'){
                if (e.declaration.type === 'VariableDeclaration') {
                    const variable = e.declaration.declarations[0];
        
                    if (variable.init.type === 'ArrowFunctionExpression') {
                        SELEKU_COMPONENT_NAME[variable.id.name] = {
                            body: variable,
                            declarations: {},
                            mainElement: [],
                            verify: find(e, { type: 'MemberExpression' }).find(e => e.object.name === 'Seleku'),
                        }
                    }
        
                    if (variable.init.type === 'FunctionExpression') {
                        SELEKU_COMPONENT_NAME[variable.id.name] = {
                            body: variable,
                            declarations: {},
                            mainElement: [],
                            verify: find(e, { type: 'MemberExpression' }).find(e => e.object.name === 'Seleku')
                        }
                    }
                }
            }
            /**
             * create and verify the function component has seleku
             * component inside there
             * 
             */
            if (e.type === 'VariableDeclaration') {
                const variable = e.declarations[0];

                if (variable.init?.type === 'ArrowFunctionExpression') {
                    SELEKU_COMPONENT_NAME[variable.id.name] = {
                        body: variable,
                        declarations: {},
                        mainElement: [],
                        verify: find(e, { type: 'MemberExpression' }).find(e => e.object.name === 'Seleku'),
                    }
                }

                if (variable.init?.type === 'FunctionExpression') {
                    SELEKU_COMPONENT_NAME[variable.id.name] = {
                        body: variable,
                        declarations: {},
                        mainElement: [],
                        verify: find(e, { type: 'MemberExpression' }).find(e => e.object.name === 'Seleku')
                    }
                }
            }

            if (e.type === 'FunctionDeclaration') {
                SELEKU_COMPONENT_NAME[e.id.name] = {
                    body: e,
                    declarations: {},
                    mainElement: [],
                    verify: find(e, { type: 'MemberExpression' }).find(e => e.object.name === 'Seleku')
                }
            }
        }
    })

    Object.keys(SELEKU_COMPONENT_NAME).forEach(e => {
        if (!(SELEKU_COMPONENT_NAME[e].verify instanceof Object)) {
            delete SELEKU_COMPONENT_NAME[e];
        }
    });

    /**
     * get all declarations inside the function body
     * and check for update statement and assign statement
     */
    for (const componentName in SELEKU_COMPONENT_NAME) {

        let varLevel = 0;
        find(SELEKU_COMPONENT_NAME[componentName].body, {
            type: 'VariableDeclaration'
        })
            .filter(e => {
                const varName = e.declarations[0].id.name;
                const data = e.declarations[0].init;

                if (data &&
                    data.type === 'CallExpression' &&
                    (data.callee?.object?.name === 'Seleku' || data.callee?.object?.name === 'Node')) {

                    SELEKU_COMPONENT_NAME[componentName].mainElement.push(varName);

                }

                if (!(
                    data &&
                    data.type === 'CallExpression' &&
                    (data.callee?.object?.name === 'Seleku' || data.callee?.object?.name === 'Node')

                    ||

                    (data && data.type === 'ArrowFunctionExpression') ||
                    (data && data.type === 'FunctionExpression')

                ) &&
                    !(varName === '$$_SELEKU_COMPONENT_LOOP_$$') &&
                    !(/loopHandler\_/igm.test(varName)) &&
                    !(/ArrayOfComponent\_/igm.test(varName)) &&
                    !(varName === '$$LoopData') &&
                    !(/\$\$\_SELEKU\_COMPONENT\_LOOP\_DATA\_\$\$/igm.test(varName))
                    && varName
                ) {

                    if (!(varName in SELEKU_COMPONENT_NAME[componentName].declarations)) {
                        SELEKU_COMPONENT_NAME[componentName]
                            .declarations[varName] = generate(e.declarations[0]?.init || ASTParse('void 0'));
                    } else {
                        e.declarations[0].id.name = varName + '_SELEKU_DYNAMIC_' + varLevel;
                        SELEKU_COMPONENT_NAME[componentName]
                            .declarations[e.declarations[0].id.name] = generate(e.declarations[0]?.init || ASTParse('void 0'));
                        varLevel++;
                    }
                }

            });

    }


    replace(tree, (node) => {

        if (node.type === 'ImportDeclaration') {
            const SelekuCore = [
                "ArrayWatcher",
                "Observer",
                "CreateCustomState",
                "registerLoopTarget",
                "Seleku",
                "reactiveObject",
                "CreateState"];
            if (node.source.value === './seleku-core') {
                for (let x of SelekuCore) {
                    node.specifiers.push(
                        {
                            type: 'ImportSpecifier',
                            local: { type: 'Identifier', name: x },
                            imported: { type: 'Identifier', name: x }
                        }
                    )
                }
            }
        }
    });

    const body = find(tree, {
        type: 'VariableDeclaration'
    }).filter(e => e.declarations[0].id.name in SELEKU_COMPONENT_NAME);

    body.forEach((e, ei) => {
        const name = e.declarations[0].id.name;
        if (name in SELEKU_COMPONENT_NAME) {

            /**
             * add the variabel to State
             */

            const stateHasChange = [];

            walk(e,(d)=>{
                if (d.type === 'VariableDeclaration') {
                    if (d.declarations[0].id.name in SELEKU_COMPONENT_NAME[name].declarations) {
                        if(!stateHasChange.find(g => g === d)){
                            
                            if(d.declarations[0].init.type === 'ObjectExpression'){
                                d['customState'] = ASTParse(`
                                    ${d.kind} ${d.declarations[0].id.name} = reactiveObject(${generate(d.declarations[0].init)},{
                                        set(object,target,value){
                                            object[target] = value;
                                            _Observer.emit('${d.declarations[0].id.name}',{'${d.declarations[0].id.name}': object});
                                        }
                                    });
                                    $$State.state.${d.declarations[0].id.name} = ${d.declarations[0].id.name};
                                `);
                            }else{
                                d['customState'] = ASTParse(`
                                    ${d.kind} ${d.declarations[0].id.name} = ${generate(d.declarations[0].init)};
                                    $$State.state.${d.declarations[0].id.name} = ${d.declarations[0].id.name};
                                `);
                            }
                        }
                    }
                }
            });

            replace(e,d =>{
                if(d.hasOwnProperty('customState')){
                    return d['customState'];
                }
            })

            /**
             * adding State and Observer to the function
             * component
             */

            e.declarations[0].init.body?.body.unshift(
                ASTParse(`
                let _Observer = new Observer();
                const _State = class extends CreateState {
                    constructor(args) {
                      super(args);
                    }
                    update(prop) {
                      _Observer.emit(prop, this.object);
                    }
                  };
                  let $$State = new _State({});
                `)
            );

            e.declarations[0].init.body?.body.unshift(
                ASTParse(`const loopSpace_ = {}`)
            );

            /**
             * add return statement to return the main element
             */

            e.declarations[0].init.body?.body.push({
                type: 'ReturnStatement',
                argument: ASTParse(`({element: ${SELEKU_COMPONENT_NAME[name].mainElement[0]},update($$SELEKU_content,$$SELEKU_data,$$SELEKU_state,$$SELEKU_value){
                                ${SELEKU_COMPONENT_NAME[name].mainElement.map(d => {
                    if (/\_attribute/igm.test(d)) return `${d}.update($$SELEKU_data);`
                    if (/\_content/igm.test(d)) return `${d}.update($$SELEKU_content,$$SELEKU_data);`
                }).join(' ') + '$$State.state[$$SELEKU_state]=$$SELEKU_value;'}}})`)
            });

            /**
             * add parents parameter for rendering child
             * in condition component
             */
            if(!e.declarations[0]?.init?.params?.length){
                e.declarations[0]?.init?.params.push(
                    { type: 'Identifier', name: 'props' }
                );
            }
            e.declarations[0]?.init?.params.push(
                { type: 'Identifier', name: '$$_parent' }
            );

        }
    });

    /**
     * 
     * getting all declaration variable
     * and chnage it to state variable
     * 
     * @param {ast parse result} tree 
     * @param {String} parent 
     */
    const setState = (tree, parent) => {

        const localDeclarations = {};
        const valueOfLocalDeclaration = {};
        let level = 0;

        /**
         * get all variable declarations
         */
        traverse(tree, {
            enter(node) {

                level++;

                if (node.type === 'VariableDeclaration') {
                    const name = node.declarations[0].id.name;
                    if (name in SELEKU_COMPONENT_NAME[parent].declarations) {
                        localDeclarations[name] = level;
                        valueOfLocalDeclaration[name] = SELEKU_COMPONENT_NAME[parent].declarations[name];
                    }
                }
            },
            leave(node) {
                level--;
            }
        });

        /**
         * update the variable expression 
         * and adding or update the assigment expression
         * and update expression
         */
        level = 0;
        traverse(tree, {
            enter(node) {

                /**
                 * update for Update Expression
                 */
                if (node.type === 'UpdateExpression') {

                    const getState = Object.keys(localDeclarations).filter(d =>{
                        if(/\_SELEKU\_DYNAMIC\_\d*/igm.test(d) &&
                        localDeclarations[d] === level &&
                        d.match(node.argument.name)){
                            return true;
                        }
                    });

                    if(getState.length > 0){
                        // do something
                    }else if(localDeclarations[node.argument.name] < level){
                        node.argument.name = `$$State.state.${node.argument.name}`
                    }
                   
                }

                /**
                 * update for Assign expression
                 */
                if(node.type === 'AssignmentExpression'){
                    const getState = Object.keys(localDeclarations).filter(d =>{
                        if(/\_SELEKU\_DYNAMIC\_\d*/igm.test(d) &&
                        localDeclarations[d] === level &&
                        d.match(node.left.name)){
                            return true;
                        }
                    });
                    if(getState.length > 0){
                        // do something
                    }else if(localDeclarations[node.left.name] < level){
                        node.left.name = `$$State.state.${node.left.name}`
                        try{
                            const value = ASTParse(valueOfLocalDeclaration[node.left.name.replace(/\$\$State\.state\./igm,'')]);
                            if(value.body[0].expression.type === 'ArrayExpression'){
                                node.customLoop = ASTParse(`loopSpace_['${node.left.name.replace(/\$\$State\.state\./igm,'')}'](${generate(node.right)})`);
                            }
                        }catch(err){}
                        
                    }
                }

                /**
                 * update for Object expression
                 * and get all identifier value
                 */
                if(node.type === 'ObjectExpression'){

                    const object = {};
                    node.properties.forEach((e,i) =>{
                        if(e.key?.type === 'Identifier'){
                            object[i] =
                            {
                                type: 'Property',
                                key: { 
                                    type: 'Literal', 
                                    name: e.key.name,
                                    raw: `"${e.key.name}"`
                                },
                                value: e.value,
                                kind: 'init',
                                computed: false,
                                method: false,
                                shorthand: false
                            }
                        }
                    })

                    for(let x in object){
                        node.properties[x] = object[x];
                    }

                    node.properties.forEach((e,i) =>{
                        if(e.value?.type === 'Identifier'){
                            const getState = Object.keys(localDeclarations).filter(d =>{
                                if(/\_SELEKU\_DYNAMIC\_\d*/igm.test(d) &&
                                localDeclarations[d] === level &&
                                d.match(e.value.name)){
                                    return true;
                                }
                            });
        
                            if(getState.length > 0){
                                // do something
                            }else if(localDeclarations[e.value.name] < level){
                                e.value.name = `$$State.state.${e.value.name}`
                            }
                        }
                    });

                }

                level++;

            },
            leave(node) {
                level--;
            }
        });
    
        /**
         * update identifier for state variable
         * and make is stately
         * 
         * */
        level = -1;
        walk(tree,(d)=>{
            if(d.type === 'ObjectPattern'){
                find(d,{type: 'Identifier'}).forEach((g)=>{
                    g.name = `$_SELEKU_IGNORE_STATE_$_${g.name}`;
                });
            }
            if(d.type === 'VariableDeclaration'){
                
                if(d.declarations[0].init?.type === 'ArrowFunctionExpression'){
                    const params = d.declarations[0].init.params;
                    params.forEach(f =>{
                        find(f,{type: 'Identifier'}).forEach((g)=>{
                           
                            g.name = `$_SELEKU_IGNORE_STATE_$_${g.name}`;
                        });
                        
                    });
                }

                if(d.declarations[0].init?.type === 'FunctionExpression'){
                    const params = d.declarations[0].init.params;   
                    params.forEach(f =>{
                        find(f,{type: 'Identifier'}).forEach((g)=>{
                            g.name = `$_SELEKU_IGNORE_STATE_$_${g.name}`;
                        });
                        
                    });
                }
            }
            if(d.type === 'ArrowFunctionExpression'){
                const params = d.params;
                params.forEach(f =>{
                    find(f,{type: 'Identifier'}).forEach((g)=>{
                        g.name = `$_SELEKU_IGNORE_STATE_$_${g.name}`;
                    });
                    
                });
            }
            if(d.type === 'FunctionExpression'){
                const params = d.params;
                params.forEach(f =>{
                    find(f,{type: 'Identifier'}).forEach((g)=>{
                        g.name = `$_SELEKU_IGNORE_STATE_$_${g.name}`;
                    });
                    
                });
            }
        });
        traverse(tree, {
            enter(node) {

               if(node.type === 'Identifier'  && !/\$\_SELEKU\_IGNORE\_STATE\_\$/igm.test(node.name)){

                    const getState = Object.keys(localDeclarations).filter(d =>{
                        if(/\_SELEKU\_DYNAMIC\_\d*/igm.test(d) &&
                        localDeclarations[d] === level &&
                        d.match(node.name)){
                            return true;
                        }
                    });

                    if(getState.length > 0){
                        // do something
                    }else if(localDeclarations[node.name] < level){
                        node.name = `$$State.state.${node.name}`
                    }

               }

                level++;

            },
            leave(node) {
                level--;
            }
        });

    }

    tree.body.forEach((e, i) => {

        if(e.type === 'ExportNamedDeclaration' && e.declaration.declarations[0].id.name in SELEKU_COMPONENT_NAME){
            setState(e.declaration, e.declaration.declarations[0].id.name);
        }
        if (e.type === 'VariableDeclaration' && e.declarations[0].id.name in SELEKU_COMPONENT_NAME) {
            setState(e, e.declarations[0].id.name);
        }

    });

    replace(tree,d =>{
        if(d.hasOwnProperty('customLoop')){
            return d['customLoop'];
        }
    })

    /**
     * get watcher function and update for value
     * is has to watch to be string
     * and add Observer variable if doesn't exits
     */
    find(tree,{type: 'CallExpression'}).forEach(e =>{
        if(e.callee.type === 'Identifier' && e.callee.name === 'Watcher'){
            e.arguments.forEach(e =>{
                if(e.type === 'ArrayExpression'){
                    e.elements = e.elements.map( d =>{
                        if(d.type === 'Identifier'){
                            return {
                                type: 'Literal',
                                name: d.name,
                                raw: `"${d.name}"`
                            }
                        }else{
                            return d;
                        }
                    })
                }
            });

            if(!e.arguments.find(d =>
                d.type === 'Identifier' && d.name === '_Observer'
            )) e.arguments.push({ type: 'Identifier', name: '_Observer' });
        }
    });

    // Seleku API access AST
    if (API.AST) API.AST(tree);

    return {
        JS: generate(binaryExpressionReduction(tree))
            .replace(/\$\$\_SELEKU\_COMPONENT\_LOOP\_\$\$/igm, 'x')
            .replace(/\$\$\_SELEKU\_COMPONENT\_LOOP\_DATA\_\$\$\_/igm, '')
            .replace(/\_SELEKU\_DYNAMIC\_\d*/igm, '')
            .replace(/\$\_SELEKU\_LOOP\_OBJECT\_\$\_/igm, '')
            .replace(/\$\_SELEKU\_IGNORE\_STATE\_\$\_/igm, '')
            .replace(/\$\$State\.state\.\$\_SELEKU\_IGNORE\_STATE\_\$\_/igm, '')
            .replace(/\$\$State\.state\.\$\$State\.state\./igm, '$$$State.state.'),
        CSS: StyleSheet.join(' ')
    }
}

