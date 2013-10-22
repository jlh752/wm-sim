'use strict';

describe('Helper Functions', function(){
	var origRandom = Math.random;
	
	function rigRandom(a){
		Math.random = function(){return a;};
	}
	
	beforeEach(function(){
		Math.random = origRandom;
	});

	describe('rand', function(){
		beforeEach(function(){
			Math.random = origRandom;
		});
		it('should always return number within range', function(){
			var valid = true, val;
			for(var i = 0; i < 100; i++){
				val = gmsim.rand(1,100);
				if(!(val >= 1 &&  val <= 100))
					valid = false;
			}
			expect(valid).toBe(true);
		});
		it('should cap at upper limit', function(){
			Math.random = function(){
				return 1;
			};
			expect(gmsim.rand(1,10)).toEqual(10);
		});
		it('should cap at lower limit', function(){
			Math.random = function(){
				return 0;
			};
			expect(gmsim.rand(3,10)).toEqual(3);
		});
		it('should work when range is 1', function(){
			expect(gmsim.rand(3,3)).toEqual(3);
		});
		it('should work with negatives', function(){
			var g = gmsim.rand(-2,-1)
			expect(g).toBeGreaterThan(-2.01);
			expect(g).toBeLessThan(-0.99);
		});
		it('should work with paramters reverse', function(){
			var valid = true, val;
			for(var i = 0; i < 100; i++){
				val = gmsim.rand(100,1);
				if(!(val >= 1 &&  val <= 100))
					valid = false;
			}
			expect(valid).toBe(true);
		});
	});
	
	describe('proc', function(){
		beforeEach(function(){
			Math.random = origRandom;
		});
		it('should return false if the random value is above x, true if below', function(){
			rigRandom(0.5);
			expect(gmsim.proc(1)).toEqual(true);
			rigRandom(0.5);
			expect(gmsim.proc(0)).toEqual(false);
			rigRandom(0.5);
			expect(gmsim.proc(0.4)).toEqual(false);
			rigRandom(0);
			expect(gmsim.proc(0.4)).toEqual(false);
			rigRandom(0.5);
			expect(gmsim.proc(0.6)).toEqual(true);
			rigRandom(1);
			expect(gmsim.proc(0.4)).toEqual(true);
			rigRandom(1);
			expect(gmsim.proc(10000)).toEqual(true);
			rigRandom(1);
			expect(gmsim.proc(-1)).toEqual(false);
		});
	});
	
	describe('roundToX', function(){
		it('should return to value rounded to nearest x decimal places', function(){
			expect(gmsim.roundToX(0.12345,2)).toEqual(0.12);
			expect(gmsim.roundToX(1,2)).toEqual(1.00);
			expect(gmsim.roundToX(0.12345,0)).toEqual(0);
			expect(gmsim.roundToX(0.19,1)).toEqual(0.2);
			expect(gmsim.roundToX(0.15,1)).toEqual(0.2);
			expect(gmsim.roundToX(0.14,1)).toEqual(0.1);
			expect(gmsim.roundToX(0,0)).toEqual(0);
		});
	});
	
	describe('roundHalfOdd', function(){
		it('should return to value rounded to nearest x decimal places', function(){
			expect(gmsim.roundHalfOdd(0.1)).toEqual(0);
			expect(gmsim.roundHalfOdd(0.9)).toEqual(1);
			expect(gmsim.roundHalfOdd(0.5)).toEqual(1);
			expect(gmsim.roundHalfOdd(1.5)).toEqual(1);
			expect(gmsim.roundHalfOdd(1.9)).toEqual(2);
		});
	});
});