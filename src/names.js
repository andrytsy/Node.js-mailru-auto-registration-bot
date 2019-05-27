const MaleNames = require('../data/names/russian_male_names.json')
const FemaleNames = require('../data/names/russian_female_names.json')
const Surnames = require('../data/names/russian_surnames.json')

function getRandomNum () {
    return Math.floor(Math.random() * 23000)
}

function getName (male) {
    let names = male ? MaleNames : FemaleNames
    let num = getRandomNum()
    let name = names[num].Name
    return name
}

function getSurname () {
    let num = getRandomNum()
    let surname = Surnames[num].Surname
    return surname
}

module.exports.getName = getName
module.exports.getSurname = getSurname