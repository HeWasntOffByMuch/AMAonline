module.exports = {
  skillType : {
    INSTANT: 0,
    PASSIVE: 1,
  },

  skillEffect : {
    HEAL: 0,
    DAMAGE: 1,
    BLEEDING: 2,
    FIRE: 3,
    POISON: 4,
    MAGICSHIELD: 5,
    /*PERCENTAGE EFFECT*/
    LIFESTEAL: 106,
    DMGBOOST: 107,
    ATKSPEEDBOOST: 108,
    EVASIONBOOST: 109,
    CRITDMG: 110,
    DMGREFLECT: 111,
    WEAKNESS: 112, //not sure what it should do
    BREAKSHIELD: 113, //decrease chance to block
    SPEEDBST: 114,
    SLOW: 116,
    CRITCHANCE: 117,
    MAGICIMMUNITY: 115,
    PHYSICALIMMUNITY: 118,
    BLOCKCHANCE: 119,
    /*FULL EFFECT NEED DURATION*/
    SILENCE: 217,
    STUN: 218,
    DISARM: 219,
    STEALTH: 220
  },

  skillTarget : {
    SELF: 0,
    TARGET: 1,
    AREA: 2
  },

  objType : {
    PLAYER: 0,
    MOB: 1
  },
  valueType : {
    STATIC: 0,
    PERCENT: 1,
  },

  itemType : {
    WEAPON_1H: 0,
    WEAPON_2H: 1,
    ARMOR: 2,
    LEGS: 3,
    BOOTS: 4,
    HELMET: 5,
    BELT: 6,
    NECKLACE: 7,
    RING1: 8,
    RING2: 9,
    BACKPACK: 10,
    GOLD: 11,
    SKILL: 12
  }
}
  // if(Object.freeze){
  //   Object.freeze(skillType);
  //   Object.freeze(skillEffect);
  //   Object.freeze(skillTarget);
  //   Object.freeze(objType);
  //   Object.freeze(itemType);
  // }else console.log('Object.freeze is not supported')


