'use strict';

//random between 2 numbers
gmsim.rand = function(a,b){
	return a + (b-a)*Math.random();
};

//return true p% of the time
gmsim.proc = function(p){
	return (1-p <= Math.random());
};

//shortcut for log base 10
gmsim.log10 = function(x){
	return Math.log(x)/Math.LN10;
};

//round to x decimal places
gmsim.roundToX = function(num, dec){
	var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
	return result;
};

//the rounding function used by WM
//use regular round
//in the event of a x.5 number, round to the nearest odd
gmsim.roundHalfOdd = function(num){
	var floored = Math.floor(num);
	
	//do nothing if already rounded
	if(floored === num)
		return num;
	
	//use regular round unless at x.5
	if(num-floored !== 0.5)
		return Math.round(num);
	
	//if the floor is even, then we should've rounded to the next number
	if(floored % 2 == 0)
		return floored+1;
	else
		return floored;
};