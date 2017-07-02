# shared-editor
基于Nodejs的在线共享编辑器。

项目演示：http://editor.miaoerduo.com/?doc=demo

项目博客：http://www.miaoerduo.com/nodejs/小喵的在线共享编辑器.html

功能：打开多个相同doc的网址，所有的操作均会共享。参数doc决定文档的id。

使用：

```
# clone代码
git clone git@github.com:miaoerduo/shared-editor.git ./shared-editor

cd shared-editor

# 安装依赖
npm install

# 运行
node app.js

# 访问 http://localhost:8080/?doc=doc_id 就可以预览效果了。
```
