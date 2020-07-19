// 全角文字を削除（記号も禁止）
function delZenkaku(self)
{
    let str = self.value;
    while(str.match(/[^A-Z^a-z\d\-]/))
    {
        str = str.replace(/[^A-Z^a-z\d\-]/, "");
    }
    self.value = str;
}
