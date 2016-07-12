import Plugin from 'stc-plugin';
import {extend} from 'stc-helper';
//import {isMaster} from 'cluster';

let UglifyJS = null;


export default class UglifyJSPlugin extends Plugin {
  /**
   * run
   */
  async run(){
    if(!UglifyJS){
      UglifyJS = require('uglify-js');
    }
    
    let content = await this.getContent('utf8');
    let options = this.options;
    let ast;
    
    try{
      ast = UglifyJS.parse(content, {
        filename: this.file.path
      });
    }catch(e){
      return {err: {
        message: e.message,
        line: e.line,
        col: e.col
      }};
    }
    
    if(options.compress !== false) {
      ast.figure_out_scope();
      // eslint-disable-line new-cap
      let compress = UglifyJS.Compressor(options.compress || { warnings: false });
      ast = ast.transform(compress);
    }
    
    if(options.mangle !== false) {
      ast.figure_out_scope();
      ast.compute_char_frequency(options.mangle || {});
      ast.mangle_names(options.mangle || {});
      if(options.mangle && options.mangle.props) {
        UglifyJS.mangle_properties(ast, options.mangle.props);
      }
    }
    
    //output options
    let output = {
      comments: options.comments
    };
    if(!Object.prototype.hasOwnProperty.call(options, 'comments')){
      output.comments = /^\**!|@preserve|@license/;
    }
    output = extend(output, options.output);
    if(options.sourceMap){
      output.source_map = UglifyJS.SourceMap({
        file: this.file.path,
        root: ''
      });
    }
    
    // eslint-disable-line new-cap
    let stream = UglifyJS.OutputStream(output); 
    ast.print(stream);
    let code = stream.toString();
    let sourceMap = output.source_map && output.source_map.toString();
    return {content: code, sourceMap};
  }
  /**
   * update
   */
  update(data){
    let {err} = data;
    if(err){
      return this.fatal(err.message, err.line, err.col);
    }
    this.setContent(data.content);
  }
  /**
   * default include
   */
  static include(){
    return /\.js$/i;
  }
  /**
   * use cluster
   */
  static cluster(){
    return true;
  }
  /**
   * use cache
   */
  static cache(){
    return true;
  }
}