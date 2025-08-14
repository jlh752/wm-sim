export type Boss = {
    name: string;
    level: number;
    stat: number;
    force: string;
    reinforcementRestrictions: string; //format: "id|count;id|count;"
}

export type BossesFile = {
    bosses: Boss[];
}