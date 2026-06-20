const MATHJAX = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    packages: {
      '[+]': ['base', 'ams', 'noerrors', 'noundefined', 'color']
    }
  }
};

export { MATHJAX };
