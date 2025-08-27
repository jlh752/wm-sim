export type Boss = {
    name: string;
    level: number;
    stat: number;
    force: string;
    reinforcementRestrictions: string; //using string format as this needs to be sent over form: "id|count;id|count;"
}

export type BossesFile = {
    bosses: Boss[];
}