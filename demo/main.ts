import '../app/index';
import './components/switch';
import './components/bossSelect';
import type { BossSelect } from './components/bossSelect';

window.addEventListener('DOMContentLoaded', async () => {
    const data = await LoadData('simdata.json');
    
    document.getElementById('boss-select')?.addEventListener('change', (event) => {
        console.log('Selected Boss:', (event.target as BossSelect).getBoss());
        console.log((document.getElementById('force2')! as HTMLTextAreaElement));
        const boss = (event.target as BossSelect).getBoss();
        if(boss){
            (document.getElementById('force2')! as HTMLTextAreaElement).value = boss.force || '';
            (document.getElementById('power2')! as HTMLInputElement).value = (boss.stat*500).toString() || '';
            (document.getElementById('level')! as HTMLInputElement).value = boss.level.toString() || '';
            (document.getElementById('reinforcementConstraints')! as HTMLTextAreaElement).value = boss?.reinforcementRestrictions || '';
        }
    });
    document.getElementById("battle-config")?.addEventListener("submit", function (e) {
        e.preventDefault();

        var formData = new FormData(document.getElementById("battle-config")! as HTMLFormElement);
        // output as an object
        console.log(Object.fromEntries(formData));

        // ...or iterate through the name-value pairs
        for (var pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
        }

        Battle();
    });
});

function LoadData(file: string): Promise<any> {
    return fetch(file)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load data file: ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading data file:', error);
            return {};
        });
}

function Battle(){
    /*
    if single create battlerunner function
    if multi - use multi utility to run multiple battles using same battlerunner that has parsed data
    if single - generate output using battle data using helper
    if multi = output charts once done
    var runner = new gmsim.battleRunner({
			'epicMode': 1,
			'force1': form.force1.value,
			'force2': bforce[bossID],
			'power1': parseFloat(form.power1.value.replace(/,/g,"")),
			'power2': bstats[bossID]*500,
			'defenderLevel': blevel[bossID],
			'doOutput': 1,
			'reinforcementConstraints': breinf[bossID],//limits the amound of unit that can be reinforced
			
			//not necessary, but we should do it anyway
			"unitData": unitData,
			"skillData": skillData,
			"typeData": skillData,
			"subtypeData": subtypeData,
		});
		
		//battle and get results
		var res = runner.battle();
		var outputText = runner.getText();
		
		//print out the results
		outputText += ''
			+ "<br />\nYour Force dealt "+gmsim.roundToX(res.forcedmg1,2)
				+ " Damage. ["+gmsim.roundToX(res.atkp,2)+"]<br />\n"
			+ "Enemy Force dealt "+gmsim.roundToX(res.forcedmg2,2)
				+ " Damage. ["+gmsim.roundToX(res.defp,2)+"]<br />\n"
			+ "<br />Total Damage Dealt:<br />"
			+ "You: "+Math.abs(res.dmg1)
			+ ((res.dmg1 <= 0)?" heal.":" damage.")
			+ "<br />\n"
			+ "Enemy: "+Math.abs(res.dmg2)
			+ ((res.dmg2 <= 0)?" heal.":" damage.")
			+ "<br />\n"
			+ "You "+(res.dmg1 >= res.dmg2?"Won":"Lost")+"!<br />\n";
		document.getElementById("logarea").innerHTML = outputText; */
}