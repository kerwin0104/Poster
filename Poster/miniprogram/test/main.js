const test = { 
    data: {
        text: 'test text',
        textareaValue: 'test',
    },
    // https://www.npmjs.com/package/hash-sum
    style: '.test[data-m-a8996f0c]{background: red; color: #fff;}.textarea[data-m-a8996f0c]{background:green; height: 200px;}',
	template: '<div class="test" data-m-a8996f0c><h3 @click="clickHandler">{{text}}</h3><native-textarea data-m-a8996f0c class="textarea" v-model="textareaValue"></div>',
	clickHandler () {
        this.setData({
            text: `timestamp: ${+new Date}`,
        });
	},
};

const test2 = { 
    data: {
        text: 'test text2',
    },
	template: '<div style="background: red; color: #fff;"><h3>{{text}}</h3></div>',
};

(function(Page) {
	Page(test);
})(util.createPage('/home'));

(function(Page) {
	Page(test2);
})(util.createPage('/input-demo'));

