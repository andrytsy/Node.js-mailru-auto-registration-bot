const API_KEY = ''
const axios = require('axios')
const image2base64 = require('image-to-base64')

function sendCaptcha () {
    let url = 'http://2captcha.com/in.php' 

    return image2base64('screen.png')
        .then(data => {
            return axios.post(url, {
                key: API_KEY,
                method: 'base64',
                phrase: 0,
                numeric: 4,
                calc: 0,
                min_len: 5,
                max_len: 10,
                language: 2,
                body: data
            })
            .then(response => {
                let id = response.data.split('|')
                console.log('ID', id)
                if (id && id.length)
                    return getSolve(id[1])
            })
            .catch((err) => {
                console.error("2captcha sendCaptcha Error!", err)
            })
        })
        .catch((error) => {
            console.log(error)
        })
}

function getSolve (id) {
    let url = 'http://2captcha.com/res.php?key=' + API_KEY + '&action=get&id=' + id

    return axios.get(url)
        .then(response => {
            console.log('Response', response.data)

            if (response && response.data !== 'CAPCHA_NOT_READY') {
                let solution = response.data.split('|')
                return {id: id, solution: solution[1]}
            } else if (response && response.data === 'ERROR_CAPTCHA_UNSOLVABLE') {
                return {id: false, solution: 'wrong'}
            } else if (response && response.data === 'CAPCHA_NOT_READY') {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        return resolve(getSolve(id))
                    }, 5000)
                })
            } else {
                return null
            }
        })
        .catch((err) => {
            console.error("2captcha getSolve Error!", err)
        })
}

function sendReport(id) {
    let url = 'http://2captcha.com/res.php?key=' + API_KEY + '&action=reportbad&id=' + id

    return axios.get(url)
        .then(response => {
            console.log('Response', response.data)
        })
        .catch((err) => {
            console.error("2captcha getSolve Error!", err)
        })
}

module.exports.sendCaptcha = sendCaptcha
module.exports.sendReport = sendReport
