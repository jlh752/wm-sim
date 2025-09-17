
# War Metal Battle Simulator (wm-sim) 

![Tests](https://github.com/jlh752/wm-sim/actions/workflows/tests.yml/badge.svg)

A Typescript library that simulates battles for the now-discontinued browser game War Metal.

* [demo](http://jlh752.github.io/wm-sim) _Work in progress_

## Features

*  **Faithful to original game** - the demo contains defintions of all of the existing game units and all of them run as expected in this simulation
    *  **Full integration test suite** - ensures the original game rules are all implemented; quirks and all
*  **Extensible** - this simulator is not limited to the original game units. You can easily define new units in the game data file
    *  **Custom skills** - it's easy to implement new skills using your own code. An example of this can be seen in the tests file.
*  **Parameterized output** - separating the display layer from the simulation layer means you can portray the battle however you want such as a statistical dashboard, or even a graphical game interface. A basic text output utility is available which outputs the logs in the style of War Metal
*  **Typescript** - hard to complain about strong typing

## Background

War Metal was a browser based game from ~2010. It had RPG elements but the core of the game was pitting your force against both player forces and NPC raid bosses. War Metal battles allowed for deep strategy with a rich array of ways that players can manipulate the battle or counter enemy forces. At some point, I decided to build a simulator for the game for 2 main reasons:
*  **time-gated actions** - like most games at the time (and even now), it time-gated the amount of actions you could take (unless you paid $)
*  **high cost of failure** - joining in a group raid boss unprepared could cause the raid to fail for all collaborating players

A simulator solves both of these problems allowing the user to test and tweak their forces as much as they needed.

The simulator, along with a suite of other tools and resources I developed for War Metal, ended up becoming quite popular with over 10,000 hits per day which was a lot for such a niche game. But, eventually, the game shutdown and, being server-based, was lost to time.

### New version

I have been looking to hone my skills and learn some new technology and this library was a perfect candidate for such a project. It is a complete rewrite of the original simulator, rebuilt from the ground up with cleaner architecture, extensibility, and strong test coverage. Despite the old version utilising web workers for multi-threading, this new version runs around 100x faster due to smarter architectural decisions and performance-minded coding practices (unusual to consider in JavaScript but it makes a difference). I opted out of web workers due to their overhead being detrimental given the performance improvements.

## Installation

```
npm install wm-sim
```

## Sample Usage

```ts
import {BattleRunner, RenderSingleBattleResult} from 'wm-sim';

const config = {
  player1: {
    power: 1000000,
    force: {
      units: [101],
      reinforcements: [107,100]
    }
  },
  player2: {
    power: 500000,
    force: { units: [], reinforcements: [] },
  },
  epicMode: false,
  data: {
    units: {
      100: { name: "Test Unit", type: 2 },
      101: { name: "Test Unit 2", skills: [{skill_id: 200, chance: 1}]},
      107: { name: "Test Unit 3", skills: [{skill_id: 209, chance: 1}]}
    },
    skills: {
      200: {name: "Reinforce", reinforce: 1, unit_type: 1},
      209: {name: "Reinforce 2", reinforce: 1, unit_type: 2}
    },
    types: { 1: {name: "Basic Type"}, 2: {name: "Type 2"} },
    subtypes: { 1: {name: "Basic Subtype"} }
  }
};
const runner = new BattleRunner();
const result = runner.run(config);
const output = RenderSingleBattleResult(result, config.data);//or your own method
```

## Roadmap

* improve demo UI and add more interesting presets
* demo for multi-battle statistical analysis
* increased extensibility for battle state would be nice
