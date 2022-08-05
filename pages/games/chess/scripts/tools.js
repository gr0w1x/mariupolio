Array.prototype.sum = function (mapper = id => id) {
    return this.reduce((p, c) => p + mapper(c), 0);
}
Array.range = function (n) {
    return new Array(n).fill(0).map((_, i) => i);
}
