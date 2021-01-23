const chai = require('chai');
const fs = require('fs');
const {JSDOM} = require('jsdom');


let window;
beforeEach(function () {
    const mockCartHTML = fs.readFileSync('test/mock-rimi-cart.html', 'utf-8');
    const dom = new JSDOM(mockCartHTML, {
        'url': 'https://www.rimi.lv/e-veikals/lv/checkout/cart'
    });

    window = dom.window;
});

describe('Array', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function () {
            chai.assert.equal([1, 2, 3].indexOf(4), -1);
        });
    });
});
