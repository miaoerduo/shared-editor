/**
 * 用来维护编辑的文档的内容
 */

/*
 * 文档中的位置
 */
function Position(row, column) {
    this.row = row;
    this.column = column;
}

function position(row, column) {
    return new Position(row, column);
}

/*
 * 对文档进行的行为
 */
function Action(action, startPos, endPos, lines, time) {
    this.action = action;
    this.start = startPos;
    this.end = endPos;
    this.lines = lines;
    this.time = time;
}

Action.prototype.do = function (doc) {
    if (Math.abs(doc.time - this.time) > 10000) return -1;
    doc.time = Date.now();
    var action = this;
    var error = false;
    try {        
        if ("remove" === action.action) {
            if (action.start.row === action.end.row) {
                doc.lines[action.start.row] =
                    doc.lines[action.start.row].substr(0, action.start.column)
                    + doc.lines[action.start.row].substr(action.end.column);
            } else {
                doc.lines[action.start.row] = doc.lines[action.start.row].slice(0, action.start.column) + doc.lines[action.end.row].slice(action.end.column);
                doc.lines.splice(action.start.row + 1, action.end.row - action.start.row);            
            }
        } else if ("insert" === action.action) {
            if (action.start.row === action.end.row) {
                doc.lines[action.start.row] =
                    doc.lines[action.start.row].substr(0, action.start.column)
                    + action.lines[0]
                    + doc.lines[action.start.row].substr(action.start.column);
            } else {
                var tmp = doc.lines[action.start.row].substr(action.start.column);
                doc.lines[action.start.row] = doc.lines[action.start.row].substr(0, action.start.column) + action.lines[0];
                doc.lines.splice(action.start.row + 1, 0, action.lines[action.lines.length - 1] + tmp);

                for (var i = action.lines.length - 2; i >= 1; -- i) {
                    doc.lines.splice(action.start.row + 1, 0, action.lines[i]);
                }            
            }
        }
    } catch (err) {
        console.log(err);
        error = true;
    }
    return error ? -1: doc.time;
};

function action(action_, startPos, endPos, lines, time) {
    return new Action(action_, startPos, endPos, lines, time);
}

/*
 * 文档对象
 */
function Document(docId, time) {
    this.lines = [""];
    this.docId = docId;
    this.time = time || -1;
}

Document.prototype.getValue = function () {
    return this.lines.join("\n");
};

Document.prototype.setValue = function (value) {
    this.lines = value.split("\n");
};

Document.prototype.getTime = function () {
    return this.time;
};

Document.prototype.do = function (action) {
    return action.do(this);
};

function document(docId, time) {
    return new Document(docId, time);
}

exports.Document = Document;
exports.Action = Action;
exports.Position = Position;
exports.action = action;
exports.position = position;
exports.document = document;