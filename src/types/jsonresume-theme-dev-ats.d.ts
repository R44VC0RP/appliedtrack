declare module 'jsonresume-theme-dev-ats' {
    function render(resume: any, theme?: any): Promise<string>;
    export default render;
  }