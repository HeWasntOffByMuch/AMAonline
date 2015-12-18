// // Shallow copy
// var newObject = jQuery.extend({}, oldObject);

// // Deep copy
// var newObject = jQuery.extend(true, {}, oldObject);

//var newObject = JSON.parse(JSON.stringify(oldObject)); //only for objects with no functions. also destroys all Dates.

//guideline as to how a weapon template should be constructed:
  
  // t[name],
  // t[stackable],
  // t[quantity],
  // t[type],
  // t[level],
  // t[damageMin],
  // t[damageMax],
  // t[damageMod],
  // t[speedMod],
  // t[range],
  // t[hitrateMod],
  // t[armorPenetration]));


module.exports = {
  1: {
    name: 'Lightsaber',
    stackable: false,
    quantity: 1,
    type: 'sword',
    level: '30',
    desc: 'Standard issue Jedi lightsaber.',
    damageMin: 45,
    damageMax: 51,
    damageMod: 0,
    speedMod: 0.2,
    range: 1.45,
    hitrateMod: 0,
    armorPenetration: 40
  },
  2: {
    name: 'Shortbow',
    stackable: false,
    quantity: 1,
    type: 'bow',
    level: '30',
    desc: 'Mediocre quality bow made of a stick.',
    damageMin: 1,
    damageMax: 3,
    damageMod: 0,
    speedMod: 0,
    range: 6,
    hitrateMod: 0,
    armorPenetration: 0
  }
}
