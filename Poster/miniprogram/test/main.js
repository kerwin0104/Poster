const test = { 
    data: {},
	template: '<div style="background: red; color: #fff;" @click="clickHandler"><h3>Test</h3></div>',
	clickHandler () {
	},
};

(function pageControllerWrapper (Page) {
	Page(test);
})(pageUtil.createPage('/home'));

m.watchNotification(notification => {
    if (notification.data === 'webview-ready') {
        const webviewId = notification.from;
        m.postNotification(webviewId, {
            type: 'init-pages',
            data: pageUtil.getPageDescriptions(),
        });
    }
});
