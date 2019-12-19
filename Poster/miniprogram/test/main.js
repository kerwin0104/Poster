// var globalPageId = 0;
// function createPage (route) {
// 	let pageData = {};
// 	return function (pagePrototype) {
// 		const method = 'createPage';
// 		const pageData = {};
// 		const pageProperties = {};
// 		const methodNames = [];

// 		for (let key in pagePrototype) {
// 			if (typeof pagePrototype[key] === 'function') {
// 				methodNames.push(key);
// 			} else {
// 				pageProperties[key] = pagePrototype[key];
// 			}
// 		}

// 		pageData.route = route;
// 		pageData.template = '<div></div>';
// 		pageData.pageProperties = pageProperties;
// 		pageData.methodNames = methodNames;

// 		rpc.call('webview', {
// 			method,
// 			data: {
// 				route,
// 				pageData,
// 			},
// 		})
// 	};
// };

// (function (Page) {
// 	Page({
// 		data: {},
// 		myMethods() {
// 			console.log('myMethods');
// 		},
// 	});
// })(createPage('/home'));
// this.postMessage('aaaaa', typeof this.tunnel.message);



