War Metal Battle Simulator
==========================

The War Metal Battle Simulator runs simulations of [War Metal] (http://synapse-games.com/games/warmetal/) battles and outputs relevant statistics. Use it to check your average damage, test your reinforcement flow, fine-tune your unit ordering, etc.

* [demo epic boss simulator] (http://greymarch.x10.mx/e_sim.php)
* [demo pvp simulator] (http://greymarch.x10.mx/b_sim.php)

##Usage

###Non-Web Worker

Include the script files on your webpage (you will probably want to concatenate the files to speed up loading).

```
<script type='text/javascript' src='gmsim.main.js'></script>
<script type='text/javascript' src='gmsim.player.js'></script>
<script type='text/javascript' src='gmsim.unit.js'></script>
<script type='text/javascript' src='gmsim.ability.js'></script>
<script type='text/javascript' src='data/simdata.js'></script>
```

>Even if you are intending to use the Web Worker version you should include the files in this way so the browser has them cached. Without doing this, it may take a few seconds to redownload these files every time the script runs.

From there, you can run it by instantiating an instance of gmsim.battleRunner

```
var runner = new gmsim.battleRunner({
	'epicMode': 0,
	'force1': attackingForce,
	'force2': defendingForce,
	'power1': attackPower,
	'power2': defencePower,
	'defenderLevel': lvl,
	'doOutput': 1,
});
```

After creating the runner, you can execute a battle. It will return an object containing the battle results. The battle log can be retrieved with the runner's getText function.

```
	var result = runner.battle();
	var outputText = runner.getText();
```

Possible contents of the results structure are:
* `dmg1` - total damage of attacker
* `dmg2` - total damage of defender
* `atkp` - attack power of attacker
* `defp` - defence power of defender
* `h1` - total healing of attacker (this is already factored into the total damage)
* `h2` - total healing of defender (this is already factored into the total damage)
* `forcedmg1` - force damage of attacker
* `forcedmg2` - force damage of defender
* `currCount1` - collection of reinforcement rates for specific units for attacking player. e.g. currCount1['2001'] will tell you how often the Infantry unit was reinforced
* `currCount2` - collection of reinforcement rates for specific units for defending player
* `jamCount1` - collection of jammed rates for specific units for attacking player e.g. currCount1['2001'] will tell you how often your Infantry units were jammed
* `jamCount2` - collection of jammed rates for specific units for defending player
* `dmgs1` - collection of average damages for specific units for attacking player
* `dmgs2` - collection of average damages for specific units for defending player
* `heals1` - collection of average healing for specific units for attacking player
* `heals2` - collection of average healing for specific units for defending player

###Web Worker

A web worker is some JavaScript that is run in a seperate processing thread than the main page. By taking advantage of web workers, we can run multiple instances of the simulator in parallel to reduce the overall execution time. First initialise the web worker like you ususally would.

```
new Worker('gmsim.main.js');
```

Initialising the simulator this way is similar to the non-web worker version except it need special arguments to know where to load the rest of the scripts from

```
workers[i].postMessage({
	'cmd': 'setup',
	'epicMode': 1,
	'force1': '1,81,0,0',
	'force2': '1,81,0,0',
	'power1': 1000000,
	'power2': 1000000,
	'defenderLevel': 89.77,//89.77 is a special level that will cause the max base damage to be 0
	'doOutput': 1,
	'url': url,//e.g. www.yourweb.com
	'simdata': 'data/simdata.js' //where the data files are
});
```

Starting a battle
```
workers[i].postMessage({
	'cmd': 'battle'
});
```

Because of how web workers work, the result is not returned straight to us. Instead, we must wait to recieve a message from the worker.

```
workers[i].addEventListener('message', (function(a){ return function(e) {
	var d = e.data;
	switch(d.msg){
		case "setup"://wait for worker to setup
			//now we can battle
			break;
		case "battle"://a battle is finished
			outputText = d.str;
			battleAfter(d.result, a);//do stuff with the results
			break;
		case "error":
			//d.content contains an error message
			break;
	}
};})(i), false);
```

##Inputs

The format for a force code is
`<int version number>,<int formation id>,<int unit id>...,<int boost id>,...<int unit id>`
where all the units after the boosts are reinforcements. a number less than 10 in a unit slot is ignored.

Rather than creating this by hand, you can use a [drag-and-drop tool] (https://github.com/jlh752/wm-force-editor).
