"use strict";

/*

A. Mullick, A.K. Ray, “Dynamics of bimodality in vehicular traffic flows”, Journal of Applied Nonlinear Dynamics, volume 3, issue 1, 2014

*/


function equation2(A, mu, lambda, beta, t) {
  var x = lambda * t - beta;
  return A * (mu + t * t) * Math.exp(-x * x);
}

function scaledFigure1(t) {
  return equation2(44.0, 8.53, 0.19, -0.09, t);
}

function scaledFigure2(t) {
  return equation2(44.1, 10.5, 0.22, 0.24, t);
}

function unscale(fun) {
  return function (timeValue) {
    return fun((timeValue / 24) * 20 - 10) / 800;
  };
}


module.exports = {
  figure1: unscale(scaledFigure1),
  figure2: unscale(scaledFigure2)
};
