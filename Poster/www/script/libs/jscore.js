(function (process) {
	
	// 创建页面相关
    const pageDescriptions = [];
	const pageControllers = {};
	const pageInstances = {};

    const pageUtil = {};
    process.pageUtil = pageUtil;

	pageUtil.createPage = function (path) {
		return function (pageController) {
			pageControllers[path] = pageController;
            const pageDescription = pageUtil.createPageDescription(path, pageController);
            pageDescriptions.push(pageDescription);
		};
	};

    pageUtil.getPageDescriptions = function () {
        return pageDescriptions;
    } 

	pageUtil.createPageDescription = function (path, pageController) {
		const pageDescription = {};
		const methods = [];

		for (let key in pageController) {
			if (typeof pageController[key] === 'function') {
				methods.push(key);
			}
		};

		pageDescription.path = path;
		pageDescription.template = pageController.template;
		pageDescription.methods = methods;
		pageDescription.data = pageController.data;
		return pageDescription;
	}

	pageUtil.createPageInstance = function (pageId, path) {
		const pageController = pageControllers[path];
		const pageInstance = Object.assign({}, pageController);
		pageInstance.data = JSON.parse(JSON.stringify(pageInstance.data || {}));
		pageInstance.setData = function (data, callback) {
			const newData = Object.assign({}, this.data, data);
			const options = {};
			options.pageId = this.pageId;
			options.data = newData;

			rpcWebViewClient.module('render')
				.call('setData', options)
				.then(() => {
					this.data = newData;
					if (typeof callback === 'function') {
						callback(newData);
					}
				});
		}
		return pageInstance;
	}	
})(this);

