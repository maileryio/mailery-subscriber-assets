import CsvImport from './components/CsvImport.vue';
import './styles/index.scss';

const plugin = {
  install,
  CsvImport
};

(function (plugin) {
  if (typeof window !== 'undefined' && window.Vue) {
    Vue.use(plugin);
  }
})(plugin);

export function install(Vue, options) {
  Vue.component(CsvImport.name, CsvImport);
}

export default plugin;
