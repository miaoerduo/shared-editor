/**
 * 共享编辑器的主程序
 */

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var documentManager = require('./utils/documentManager.js').getManager();
var documentTool = require('./utils/document.js');

// 把static文件夹变成静态资源文件夹
// 如果使用nginx等工具，可以直接把这个static文件夹指定为静态资源
// 用以减小nodejs的负担
app.use(express.static(__dirname + '/static'));

// 监听，ip和port可以自行修改
server.listen(8080, 'localhost');

// 记录每个socket和对应的doc
var socket_docId = {};

// 验证文档的命名
var doc_regex = /^[a-zA-Z\d_]+$/;


/**
 * 开始复杂的socket.io的逻辑部分
 */

io.on("connection", function (socket) {

    /*
     * 加入房间，如果房间不存在，则创建一个新的房间
     * input:
     * {
     *   docId: 房间号
     * }
     * return:
     * {
     *   docId: 房间号
     *   time: doc的最新更新时间
     *   status: "join"|"create", 如果房间之前已经存在，则是加入房间，返回"join"，
     *           如果房间之前不存在，则是创建房间，返回"create"
     *   error: 错误信息，如果没有则为null
     * }
     */
    socket.on("join", function (data) {
        if (!data || !data.docId || typeof data.docId !== 'string' || !doc_regex.test(data.docId)) {
            socket.emit("join", {error: "error doc id"});
            return;
        }
        var docId = data.docId;
        if (docId in socket_docId) {
            socket.emit("join", {error: "already choose a doc"});
            return;
        }
        socket.join(docId, function () {
            var doc = documentManager.getDoc(docId);
            var status = "join";
            if (null === doc) {
                status = "create";
                doc = documentTool.document(docId, Date.now());
                documentManager.add(doc);
            } else {
                doc = doc.doc;
            }
            socket_docId[socket.id] = docId;
            documentManager.join(docId);
            socket.emit("join", {
                docId: doc.docId,
                time: doc.time,
                status: status
            });
        });
    });


    /*
     * 拉取最新的文档信息
     * return:
     * {
     *   docId: 房间号,
     *   doc: 文内的内容,
     *   time: 文档的最新更新时间,
     *   error: 错误信息
     * }
     */
    socket.on("pull", function (data) {
        if (!(socket.id in socket_docId)) {
            socket.emit("pull", {error: "please choose a doc"});
            return;
        }
        var docId = socket_docId[socket.id];
        var doc = documentManager.getDoc(docId).doc;
        if (null === doc) {
            socket.emit("pull", {error: "cannot find doc with id = " + docId});
            return;
        }
        socket.emit("pull", {
            docId: doc.docId,
            doc: doc.getValue(),
            time: doc.time
        });
    });


    /*
     * 执行修改文档的操作
     * input:
     * {
     *    action: "insert" | "remove",
     *    start: {
     *      row: 行,
     *      column: 列
     *    },
     *    end: {
     *      row: 行,
     *      column: 列
     *    },
     *    lines: [变换的内容的数组，只在insert的时候有用],
     *    time: 文档的最新时间，这个时间是前面返回的，用来表示修改的是否是最新版
     * }
     * output:
     * {
     socketId: 操作的socket的id
     time: 文档更新后的的时间
     *   error: "如果有错误，则返回错误信息信息"
     * }
     */
    socket.on("do", function (data) {
        if (!(socket.id in socket_docId)) {
            socket.emit("pull", {error: "please choose a doc"});
            return;
        }
        var action = documentTool.action(
            data.action,
            documentTool.position(data.start.row, data.start.column),
            documentTool.position(data.end.row, data.end.column),
            data.lines,
            data.time
        );
        var doc = documentManager.getDoc(socket_docId[socket.id]).doc;
        var time = doc.do(action);
        data['error'] = time < 0? "error": null;
        data['time'] = time;
        data['socketId'] = socket.id;
        io.to(socket_docId[socket.id]).emit("do", data);
    });

    /*
     * 离开文档
     */
    socket.on("leave", function () {
        if (socket.id in socket_docId) {
            var docId = socket_docId[socket.id];
            documentManager.leave(docId);
            delete socket_docId[socket.id];
        }
    });

    /*
     * 断开连接
     */
    socket.on("disconnect", function () {
        if (socket.id in socket_docId) {
            var docId = socket_docId[socket.id];
            documentManager.leave(docId);
            delete socket_docId[socket.id];
        }
    });
});



