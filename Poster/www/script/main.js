
// 用户业务代码
Vue.component('native-input', {
  model: {
    prop: 'value',
    event: 'input',
  },
  props: {
  	value: String
  },
  data() {
	  const data = {};
	  data.updateTimestamp = 0;
	  data.updateTimer = null;
	  return data;
  },
  methods: {
  	foucs() {
  	},
    getStyle() {
        const el = this.$refs.el;
        const style = {};
        style.x = el.offsetLeft;
        style.y = el.offsetTop;
        style.width = el.offsetWidth;
        style.height = el.offsetHeight;
        return style;
    },
    updateNativeView() {
        rpc.call('update-view', {
            viewId: this.viewId,
            style: this.getStyle(),
        });
        this.updateTimestamp = +new Date;
    }
  },
  mounted: function () {
  	rpc.call('layout-input', this.getStyle(), (err, viewId) => {
  		if (err) {
  			rpc.call('log', 'error');
  		} else {
  			rpc.call('log', 'success: ' + viewId);
  			this.viewId = viewId;
  			nativeViewEventCenter.on(viewId, 'input', (value) => {
  				rpc.call('log', 'input: ' + value);
  				this.$emit('input', value);
  			});
  			setInterval(() => {
  				this.$refs.el.style.marginTop = (Math.random() * 200) + 'px';
  			}, 1000);
  		}	
	});
    nativeViewEventCenter.on(-9999, 'rerender', () => {
        var now = +new Date;
        var diffTime = now - this.updateTimestamp;
        if (diffTime < 100) {
            clearTimeout(this.updateTimer);
            this.updateTimer = setTimeout(() => {
                this.updateNativeView();                                       
            }, diffTime);
        } else {
        	this.updateNativeView();
        }
    })
  },
  template: '<div ref="el" style="border:1px solid #333; width: 200px; height: 30px; cursor: pointer; margin-top: 100px;" @foucs="foucs">{{value}}</div>'
})

const Home = { 
	template: '<div style="background: gray;"><h3>home</h3><a @click="toOther" href="javascript:;">去另一个页面</a></div>',
	methods: {
		toOther () {
			rpc.call('navigateTo', '/input-demo');
		}
	}
}
const InputDemo = { 
	data() {
		var data = {};
		data.inputValue = 'test';
		return data;
	},
	template: '<div><h3>input-demo page</h3><native-input v-model="inputValue" /><a @click="toOther" href="javascript:;">去另一个页面</a></div>', 
	methods: {
		toOther () {
			rpc.call('navigateTo', '/home');
		}
	}
}

const routes = [
  { path: '/home', component: Home },
  { path: '/input-demo', component: InputDemo }
]

const router = new VueRouter({
  routes // (缩写) 相当于 routes: routes
})

const app = new Vue({
  router
}).$mount('#app');
