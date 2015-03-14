var cheerio = require('cheerio');

Object.defineProperty(cheerio.prototype, 'iterator', {
  get: function(){
    var nodes = [];
    for (var i = 0; i < this.length; i++) {
      nodes.push(this.eq(i));
    }
    return nodes;
  }
});
cheerio.prototype.iterator = 10;
var html = '<!DOCTYPE html><html><body><div>aaa</div><div>bbb</div></body></html>';
var $ = cheerio.load(html);
console.log($('div').iterator[0].find);
