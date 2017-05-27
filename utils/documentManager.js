/*
 * 维护文档对象，具体有添加，监听，取消监听和自动释放的功能。
 */

function DocumentManager() {
    this.docs = {};
}

DocumentManager.prototype.add = function(doc) {
    this.docs[doc.docId] = {
        ref: 0,
        doc: doc
    };
};

DocumentManager.prototype.delete = function(docId) {
    if (docId in this.docs)
        delete this.docs[docId];
};

DocumentManager.prototype.join = function(docId) {
    if (docId in this.docs) {
        this.docs[docId].ref ++;
        return true;
    }
    return false;
};

DocumentManager.prototype.leave = function (docId) {
    if (docId in this.docs) {
        this.docs[docId].ref --;
        if (0 === this.docs[docId].ref) {
            this.delete(docId);
        }
    }
};

DocumentManager.prototype.getDoc = function (docId) {
    if (!(docId in this.docs)) {
        return null;
    }
    return this.docs[docId];
};

var documentManager = new DocumentManager();

exports.getManager = function () {
    return documentManager;
};

