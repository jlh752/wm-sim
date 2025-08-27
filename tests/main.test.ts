import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {RandomRange, Proc, RoundHalfOdd} from '../app/util/util';

describe('Simulation Functions', function(){
    beforeEach(() => vi.restoreAllMocks());
    afterEach(() => vi.restoreAllMocks());

    describe('initialisation', function(){
        it('should always return number within range', function(){
            for(let i = 0; i < 100; i++){
                const val = RandomRange(1,100);
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(100);
            }
        });
        it('should cap at upper limit', function(){
            vi.spyOn(Math, 'random').mockReturnValue(1);
            expect(RandomRange(1,10)).toEqual(10);
        });
        it('should cap at lower limit', function(){
            vi.spyOn(Math, 'random').mockReturnValue(0);
            expect(RandomRange(3,10)).toEqual(3);
        });
        it('should work when range is 1', function(){
            expect(RandomRange(3,3)).toEqual(3);
        });
        it('should work with negatives', function(){
            const g = RandomRange(-2,-1)
            expect(g).toBeGreaterThanOrEqual(-2);
            expect(g).toBeLessThanOrEqual(-1);
        });
        it('should work with paramters reverse', function(){
            for(let i = 0; i < 100; i++){
                const val = RandomRange(100,1);
                expect(val).toBeGreaterThanOrEqual(1);
                expect(val).toBeLessThanOrEqual(100);
            }
        });
    });
    
    describe('proc', function(){
        const cases: [number, number, boolean][] = [
            [0.5, 1, true],
            [0.5, 0, false],
            [0.5, 0.4, false],
            [0, 0.4, false],
            [0.5, 0.6, true],
            [1, 0.4, true],
            [1, 10000, true],
            [1, -1, false],
        ];

        it.each(cases)(
            'Math.random=%f with threshold %f -> %o',
            (rand, threshold, expected) => {
                vi.spyOn(Math, 'random').mockReturnValue(rand);
                expect(Proc(threshold)).toBe(expected);
            }
        );
    });
    
    describe('roundHalfOdd', function(){
        const cases: [number, number][] = [
            [0, 0.1],
            [1, 0.9],
            [1, 0.5],
            [1, 1.5],
            [2, 1.9],
        ];

        it.each(cases)(
            'should return %i from %f',
            (expected, num) => {
                expect(RoundHalfOdd(num)).toBe(expected);
            }
        );
    });
});