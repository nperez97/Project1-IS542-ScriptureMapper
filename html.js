let htmlAnchor = function (volume) {
    return `<a name="v${volume.id}"><a/>`;
};


let htmlDiv = function (parameters) {
    let classString = "";
    let contentString = "";
    let idString = "";

    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    
    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }
    
    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }
    
    return `<div${idString}${classString}>${contentString}</div>`;
};

let htmlElement = function (tagName, content) {
    return `<${tagName}>${content}</${tagName}>`;
}



let htmlLink = function (parameters) {
    let classString = "";
    let contentString = "";
    let hrefString = "";
    let idString = "";

    if (parameters.classKey !== undefined) {
        classString = ` class="${parameters.classKey}"`;
    }
    
    if (parameters.content !== undefined) {
        contentString = parameters.content;
    }
    
    if (parameters.href !== undefined) {
        hrefString = ` href="${parameters.href}"`;
    }

    if (parameters.id !== undefined) {
        idString = ` id="${parameters.id}"`;
    }

    return `<a${idString}${classString}${hrefString}>${contentString}</a>`;
};

let htmlHashLink = function (hashArguments, content) {
    return `<a href="javascript:void(0)" onclick="changeHash(${hashArguments})">${content}</a>`;
};