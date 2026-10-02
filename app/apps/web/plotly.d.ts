// plotly.js-dist-min ships without types; the calculator uses only react() and purge().
declare module "plotly.js-dist-min" {
  const Plotly: {
    react(el: HTMLElement, data: object[], layout: object, config?: object): Promise<unknown>;
    purge(el: HTMLElement): void;
  };
  export default Plotly;
}
